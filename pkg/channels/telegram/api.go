// Package telegram — minimal zero-dependency Telegram Bot API HTTP client.
// Avoids pulling in telego or other libs to keep the binary under 10MB.
package telegram

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// ── API Types ────────────────────────────────────────────────────────

type APIResponse struct {
	OK     bool            `json:"ok"`
	Result json.RawMessage `json:"result"`
	Desc   string          `json:"description"`
}

type Update struct {
	UpdateID int64    `json:"update_id"`
	Message  *Message `json:"message"`
}

type Message struct {
	MessageID int64  `json:"message_id"`
	From      *User  `json:"from"`
	Chat      Chat   `json:"chat"`
	Text      string `json:"text"`
	Caption   string `json:"caption"`
}

type User struct {
	ID        int64  `json:"id"`
	IsBot     bool   `json:"is_bot"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

type Chat struct {
	ID    int64  `json:"id"`
	Type  string `json:"type"` // private, group, supergroup, channel
	Title string `json:"title"`
}

// ── API Methods ──────────────────────────────────────────────────────

func (c *TelegramChannel) apiURL(method string) string {
	return telegramAPIBase + c.token + "/" + method
}

func (c *TelegramChannel) apiCall(ctx interface{}, method string, payload interface{}) (json.RawMessage, error) {
	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", c.apiURL(method), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("telegram API %s: %w", method, err)
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var apiResp APIResponse
	if err := json.Unmarshal(data, &apiResp); err != nil {
		return nil, fmt.Errorf("telegram API %s: unmarshal: %w", method, err)
	}

	if !apiResp.OK {
		return nil, fmt.Errorf("telegram API %s: %s", method, apiResp.Desc)
	}

	return apiResp.Result, nil
}

// getMe returns the bot's identity.
func (c *TelegramChannel) getMe(ctx interface{}) (*BotUser, error) {
	result, err := c.apiCall(ctx, "getMe", nil)
	if err != nil {
		return nil, err
	}
	var bot BotUser
	if err := json.Unmarshal(result, &bot); err != nil {
		return nil, err
	}
	return &bot, nil
}

// getUpdates fetches updates via long polling.
func (c *TelegramChannel) getUpdates(ctx interface{}, offset int64, timeout int) ([]Update, error) {
	params := map[string]interface{}{
		"offset":  offset,
		"timeout": timeout,
	}
	result, err := c.apiCall(ctx, "getUpdates", params)
	if err != nil {
		return nil, err
	}
	var updates []Update
	if err := json.Unmarshal(result, &updates); err != nil {
		return nil, err
	}
	return updates, nil
}

// sendMessage sends a text message to a chat.
func (c *TelegramChannel) sendMessage(ctx interface{}, chatID int64, text, parseMode string) error {
	params := map[string]interface{}{
		"chat_id": chatID,
		"text":    text,
	}
	if parseMode != "" {
		params["parse_mode"] = parseMode
	}
	_, err := c.apiCall(ctx, "sendMessage", params)
	return err
}

// sendChatAction sends a "typing" or other action indicator.
func (c *TelegramChannel) sendChatAction(ctx interface{}, chatID int64, action string) error {
	params := map[string]interface{}{
		"chat_id": chatID,
		"action":  action,
	}
	_, err := c.apiCall(ctx, "sendChatAction", params)
	return err
}

// setMyCommands registers bot commands for the menu.
func (c *TelegramChannel) setMyCommands(ctx interface{}, commands []BotCommand) error {
	params := map[string]interface{}{
		"commands": commands,
	}
	_, err := c.apiCall(ctx, "setMyCommands", params)
	return err
}
