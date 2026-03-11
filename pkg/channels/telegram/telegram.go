// Package telegram provides the Telegram channel for MawdBot.
// Adapted from PicoClaw's Telegram channel with MawdBot's bus/channel interface.
// Supports long polling, markdown→HTML conversion, typing indicators,
// allowlist filtering, and automatic bot command registration.
package telegram

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/8bitlabs/mawdbot/pkg/bus"
	"github.com/8bitlabs/mawdbot/pkg/channels"
	"github.com/8bitlabs/mawdbot/pkg/commands"
	"github.com/8bitlabs/mawdbot/pkg/config"
)

// ── Telegram Bot API (minimal, zero-dep) ────────────────────────────
// We implement a minimal Telegram Bot API client to avoid pulling in
// external dependencies — keeps the binary lean (<10MB target).

const telegramAPIBase = "https://api.telegram.org/bot"

// ── MawdBot Telegram Channel ────────────────────────────────────────

type TelegramChannel struct {
	*channels.BaseChannel
	token            string
	apiBase          string
	httpClient       *http.Client
	allowFrom        []string
	botInfo          *BotUser
	stopCh           chan struct{}
	wg               sync.WaitGroup
	cfg              *config.Config
	commandRegCancel context.CancelFunc
}

// BotUser holds the bot's identity from getMe.
type BotUser struct {
	ID        int64  `json:"id"`
	IsBot     bool   `json:"is_bot"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

// NewTelegramChannel creates and configures a Telegram channel.
func NewTelegramChannel(cfg *config.Config, msgBus *bus.MessageBus) (*TelegramChannel, error) {
	token := cfg.Channels.Telegram.Token
	if token == "" {
		token = os.Getenv("TELEGRAM_BOT_TOKEN")
	}
	if token == "" {
		return nil, fmt.Errorf("telegram: token not configured (set channels.telegram.token or TELEGRAM_BOT_TOKEN)")
	}

	allowFrom := cfg.Channels.Telegram.AllowFrom
	if envAllow := os.Getenv("TELEGRAM_ALLOW_FROM"); envAllow != "" {
		allowFrom = strings.Split(envAllow, ",")
	}
	allowFrom = normalizeAllowList(allowFrom)

	proxyAddr := strings.TrimSpace(os.Getenv("TELEGRAM_PROXY"))

	transport := &http.Transport{}
	if proxyAddr != "" {
		proxyURL, err := url.Parse(proxyAddr)
		if err != nil {
			return nil, fmt.Errorf("telegram: invalid proxy URL %q: %w", proxyAddr, err)
		}
		transport.Proxy = http.ProxyURL(proxyURL)
	} else if os.Getenv("HTTP_PROXY") != "" || os.Getenv("HTTPS_PROXY") != "" {
		transport.Proxy = http.ProxyFromEnvironment
	}

	httpClient := &http.Client{Timeout: 60 * time.Second}
	if transport.Proxy != nil {
		httpClient.Transport = transport
	}

	apiBase := os.Getenv("TELEGRAM_API_BASE")
	apiBase = normalizeTelegramAPIBase(apiBase)

	base := channels.NewBaseChannel("telegram", msgBus, allowFrom)

	return &TelegramChannel{
		BaseChannel: base,
		token:       token,
		apiBase:     apiBase,
		httpClient:  httpClient,
		allowFrom:   allowFrom,
		stopCh:      make(chan struct{}),
		cfg:         cfg,
	}, nil
}

// ── Lifecycle ────────────────────────────────────────────────────────

func (c *TelegramChannel) Start(ctx context.Context) error {
	// Verify token with getMe
	botInfo, err := c.getMe(ctx)
	if err != nil {
		return fmt.Errorf("telegram: getMe failed: %w", err)
	}
	c.botInfo = botInfo
	c.SetRunning(true)

	log.Printf("[TELEGRAM] 🤖 Bot connected: @%s (ID: %d)", botInfo.Username, botInfo.ID)

	// Register bot commands
	regCtx, regCancel := context.WithCancel(ctx)
	c.commandRegCancel = regCancel
	go c.registerCommands(regCtx)

	// Start long polling
	c.wg.Add(1)
	go c.pollUpdates(ctx)

	return nil
}

func (c *TelegramChannel) Stop(ctx context.Context) error {
	username := "<unknown>"
	if c.botInfo != nil {
		username = c.botInfo.Username
	}
	log.Printf("[TELEGRAM] Stopping bot @%s...", username)
	c.SetRunning(false)
	close(c.stopCh)
	if c.commandRegCancel != nil {
		c.commandRegCancel()
	}
	c.wg.Wait()
	return nil
}

// ── Update Polling ───────────────────────────────────────────────────

func (c *TelegramChannel) pollUpdates(ctx context.Context) {
	defer c.wg.Done()

	offset := int64(0)
	for {
		select {
		case <-c.stopCh:
			return
		case <-ctx.Done():
			return
		default:
		}

		updates, err := c.getUpdates(ctx, offset, 30)
		if err != nil {
			log.Printf("[TELEGRAM] Poll error: %v", err)
			time.Sleep(2 * time.Second)
			continue
		}

		for _, upd := range updates {
			offset = upd.UpdateID + 1
			if upd.Message != nil {
				c.handleMessage(ctx, upd.Message)
			}
		}
	}
}

func (c *TelegramChannel) handleMessage(ctx context.Context, msg *Message) {
	if msg == nil || msg.From == nil {
		return
	}

	senderID := fmt.Sprintf("%d", msg.From.ID)
	chatID := fmt.Sprintf("%d", msg.Chat.ID)

	// Check allowlist
	if !c.IsAllowed(senderID) && !c.IsAllowed(msg.From.Username) {
		return
	}

	content := msg.Text
	if content == "" {
		content = msg.Caption
	}
	if content == "" {
		return
	}

	// Strip bot mention in groups
	if msg.Chat.Type != "private" && c.botInfo != nil {
		mention := "@" + c.botInfo.Username
		if !strings.Contains(content, mention) {
			// In groups, only respond when mentioned
			return
		}
		content = strings.ReplaceAll(content, mention, "")
		content = strings.TrimSpace(content)
	}

	log.Printf("[TELEGRAM] 📩 %s (@%s): %s",
		msg.From.FirstName, msg.From.Username, truncate(content, 60))

	c.HandleMessage(ctx, senderID, chatID, content, nil)
}

// ── Send Messages ────────────────────────────────────────────────────

func (c *TelegramChannel) Send(ctx context.Context, msg bus.OutboundMessage) error {
	if !c.IsRunning() {
		return fmt.Errorf("telegram: not running")
	}

	chatID, err := strconv.ParseInt(msg.ChatID, 10, 64)
	if err != nil {
		return fmt.Errorf("telegram: invalid chatID %s: %w", msg.ChatID, err)
	}

	if msg.Content == "" {
		return nil
	}

	// Split long messages (Telegram limit: 4096 chars)
	chunks := splitMessage(msg.Content, 4000)
	for _, chunk := range chunks {
		html := markdownToTelegramHTML(chunk)
		if err := c.sendMessage(ctx, chatID, html, "HTML"); err != nil {
			// Fallback to plain text
			if err2 := c.sendMessage(ctx, chatID, chunk, ""); err2 != nil {
				return err2
			}
		}
	}
	return nil
}

// SendTyping sends a "typing" action to the chat.
func (c *TelegramChannel) SendTyping(ctx context.Context, chatID string) error {
	cid, err := strconv.ParseInt(chatID, 10, 64)
	if err != nil {
		return err
	}
	return c.sendChatAction(ctx, cid, "typing")
}

// ── Markdown → Telegram HTML ────────────────────────────────────────

var (
	reHeading    = regexp.MustCompile(`^#{1,6}\s+(.+)$`)
	reBoldStar   = regexp.MustCompile(`\*\*(.+?)\*\*`)
	reBoldUnder  = regexp.MustCompile(`__(.+?)__`)
	reItalic     = regexp.MustCompile(`_([^_]+)_`)
	reStrike     = regexp.MustCompile(`~~(.+?)~~`)
	reLink       = regexp.MustCompile(`\[([^\]]+)\]\(([^)]+)\)`)
	reListItem   = regexp.MustCompile(`^[-*]\s+`)
	reInlineCode = regexp.MustCompile("`([^`]+)`")
	reCodeBlock  = regexp.MustCompile("```[\\w]*\\n?([\\s\\S]*?)```")
)

func markdownToTelegramHTML(text string) string {
	if text == "" {
		return ""
	}

	// Protect code blocks and inline code
	codeBlocks := extractBlocks(text, reCodeBlock)
	text = codeBlocks.replaced

	inlineCodes := extractBlocks(text, reInlineCode)
	text = inlineCodes.replaced

	// Headings → bold
	text = reHeading.ReplaceAllString(text, "<b>$1</b>")

	// Escape HTML
	text = escapeHTML(text)

	// Links
	text = reLink.ReplaceAllString(text, `<a href="$2">$1</a>`)

	// Bold
	text = reBoldStar.ReplaceAllString(text, "<b>$1</b>")
	text = reBoldUnder.ReplaceAllString(text, "<b>$1</b>")

	// Italic
	text = reItalic.ReplaceAllString(text, "<i>$1</i>")

	// Strikethrough
	text = reStrike.ReplaceAllString(text, "<s>$1</s>")

	// Lists
	text = reListItem.ReplaceAllString(text, "• ")

	// Restore inline codes
	for i, code := range inlineCodes.originals {
		escaped := escapeHTML(code)
		text = strings.ReplaceAll(text,
			fmt.Sprintf("\x00IC%d\x00", i),
			fmt.Sprintf("<code>%s</code>", escaped))
	}

	// Restore code blocks
	for i, code := range codeBlocks.originals {
		escaped := escapeHTML(code)
		text = strings.ReplaceAll(text,
			fmt.Sprintf("\x00CB%d\x00", i),
			fmt.Sprintf("<pre><code>%s</code></pre>", escaped))
	}

	return text
}

type blockExtraction struct {
	replaced  string
	originals []string
}

func extractBlocks(text string, re *regexp.Regexp) blockExtraction {
	matches := re.FindAllStringSubmatch(text, -1)
	originals := make([]string, 0, len(matches))
	for _, m := range matches {
		originals = append(originals, m[1])
	}

	i := 0
	prefix := "CB"
	if re == reInlineCode {
		prefix = "IC"
	}
	replaced := re.ReplaceAllStringFunc(text, func(m string) string {
		placeholder := fmt.Sprintf("\x00%s%d\x00", prefix, i)
		i++
		return placeholder
	})

	return blockExtraction{replaced: replaced, originals: originals}
}

func escapeHTML(text string) string {
	text = strings.ReplaceAll(text, "&", "&amp;")
	text = strings.ReplaceAll(text, "<", "&lt;")
	text = strings.ReplaceAll(text, ">", "&gt;")
	return text
}

// ── Bot Command Registration ────────────────────────────────────────

type BotCommand struct {
	Command     string `json:"command"`
	Description string `json:"description"`
}

var commandRegistrationBackoff = []time.Duration{
	5 * time.Second,
	15 * time.Second,
	60 * time.Second,
	5 * time.Minute,
	10 * time.Minute,
}

func commandRegistrationDelay(attempt int) time.Duration {
	if len(commandRegistrationBackoff) == 0 {
		return 0
	}
	idx := attempt
	if idx >= len(commandRegistrationBackoff) {
		idx = len(commandRegistrationBackoff) - 1
	}
	base := commandRegistrationBackoff[idx]
	return time.Duration(float64(base) * (0.5 + rand.Float64()*0.5))
}

func builtinBotCommands() []BotCommand {
	defs := commands.BuiltinDefinitions()
	registered := make([]BotCommand, 0, len(defs)+1)
	seen := make(map[string]struct{}, len(defs)+1)

	add := func(name, description string) {
		name = strings.TrimSpace(strings.ToLower(name))
		description = strings.TrimSpace(description)
		if name == "" || description == "" {
			return
		}
		if _, ok := seen[name]; ok {
			return
		}
		seen[name] = struct{}{}
		registered = append(registered, BotCommand{Command: name, Description: description})
	}

	add("start", "Start MawdBot")
	for _, def := range defs {
		add(def.Name, def.Description)
	}

	return registered
}

func (c *TelegramChannel) registerCommands(ctx context.Context) {
	cmds := builtinBotCommands()
	if len(cmds) == 0 {
		return
	}

	for attempt := 0; ; attempt++ {
		if err := c.setMyCommands(ctx, cmds); err == nil {
			log.Printf("[TELEGRAM] ✅ %d bot commands registered", len(cmds))
			return
		} else {
			delay := commandRegistrationDelay(attempt)
			log.Printf("[TELEGRAM] ⚠️ Command registration failed (attempt %d): %v (retry in %s)", attempt+1, err, delay)
			select {
			case <-ctx.Done():
				return
			case <-time.After(delay):
			}
		}
	}
}

// ── Helpers ──────────────────────────────────────────────────────────

func splitMessage(text string, maxLen int) []string {
	if len(text) <= maxLen {
		return []string{text}
	}

	var chunks []string
	for len(text) > maxLen {
		// Find a good split point
		splitAt := maxLen
		if idx := strings.LastIndex(text[:maxLen], "\n"); idx > maxLen/2 {
			splitAt = idx
		} else if idx := strings.LastIndex(text[:maxLen], ". "); idx > maxLen/2 {
			splitAt = idx + 1
		}
		chunks = append(chunks, text[:splitAt])
		text = text[splitAt:]
	}
	if text != "" {
		chunks = append(chunks, text)
	}
	return chunks
}

func truncate(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}

func normalizeAllowList(values []string) []string {
	clean := make([]string, 0, len(values))
	for _, value := range values {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		clean = append(clean, value)
	}
	return clean
}

func normalizeTelegramAPIBase(raw string) string {
	raw = strings.TrimRight(strings.TrimSpace(raw), "/")
	if raw == "" {
		return telegramAPIBase
	}
	if strings.HasSuffix(strings.ToLower(raw), "/bot") {
		return raw
	}
	return raw + "/bot"
}
