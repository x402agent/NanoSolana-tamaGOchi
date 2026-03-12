// Package gateway provides the NanoSolana Gateway — a native Go TCP bridge
// server that connects headless hardware nodes to the daemon. No external
// dependencies (pure Go, no Node.js).
//
// Protocol: JSON-line over TCP (one JSON object per line, newline-delimited).
// Auth: Token-based pairing flow (pair-request → approve → pair-ok → hello).
// Security: Binds to Tailscale IP when available; tokens are cryptographic random.
package gateway

import (
	"bufio"
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os/exec"
	"strings"
	"sync"
	"time"
)

// BridgeConfig configures the gateway bridge server.
type BridgeConfig struct {
	Port         int
	BindAddr     string // Override bind address (default: auto-detect Tailscale or 0.0.0.0)
	UseTailscale bool
	AuthToken    string // Master auth token (auto-generated if empty)
}

// DefaultBridgeConfig returns production-safe defaults.
func DefaultBridgeConfig() BridgeConfig {
	return BridgeConfig{
		Port:         18790,
		UseTailscale: true,
	}
}

// Bridge is the native NanoSolana gateway bridge server.
type Bridge struct {
	cfg       BridgeConfig
	listener  net.Listener
	mu        sync.RWMutex
	nodes     map[string]*connectedNode
	pending   map[string]*pairRequest
	authToken string
	logf      func(string, ...any)
	cancel    context.CancelFunc
}

type connectedNode struct {
	nodeID      string
	displayName string
	token       string
	conn        net.Conn
	encoder     *json.Encoder
	mu          sync.Mutex
	connectedAt time.Time
}

type pairRequest struct {
	requestID   string
	nodeID      string
	displayName string
	conn        net.Conn
	createdAt   time.Time
}

// NewBridge creates a new gateway bridge server.
func NewBridge(cfg BridgeConfig, logf func(string, ...any)) *Bridge {
	if logf == nil {
		logf = func(format string, args ...any) { log.Printf("[GATEWAY] "+format, args...) }
	}
	if cfg.AuthToken == "" {
		cfg.AuthToken = generateToken()
	}
	return &Bridge{
		cfg:       cfg,
		nodes:     make(map[string]*connectedNode),
		pending:   make(map[string]*pairRequest),
		authToken: cfg.AuthToken,
		logf:      logf,
	}
}

// Start begins listening for node connections.
func (b *Bridge) Start(ctx context.Context) error {
	ctx, cancel := context.WithCancel(ctx)
	b.cancel = cancel

	bindAddr := b.resolveBindAddr()
	addr := fmt.Sprintf("%s:%d", bindAddr, b.cfg.Port)

	listener, err := net.Listen("tcp", addr)
	if err != nil {
		cancel()
		return fmt.Errorf("bridge listen on %s: %w", addr, err)
	}
	b.listener = listener

	b.logf("🌐 NanoSolana Gateway started on %s", addr)
	if b.cfg.UseTailscale {
		if tsIP, err := DetectTailscaleIP(); err == nil {
			b.logf("🔒 Tailscale IP: %s:%d", tsIP, b.cfg.Port)
		}
	}

	go b.acceptLoop(ctx)
	return nil
}

// Stop gracefully shuts down the bridge.
func (b *Bridge) Stop() {
	if b.cancel != nil {
		b.cancel()
	}
	if b.listener != nil {
		_ = b.listener.Close()
	}
	b.mu.RLock()
	for _, node := range b.nodes {
		_ = node.conn.Close()
	}
	b.mu.RUnlock()
	b.logf("🌐 Gateway stopped")
}

// BridgeAddr returns the external-facing bridge address.
func (b *Bridge) BridgeAddr() string {
	if b.cfg.UseTailscale {
		if tsIP, err := DetectTailscaleIP(); err == nil {
			return fmt.Sprintf("%s:%d", tsIP, b.cfg.Port)
		}
	}
	return fmt.Sprintf("127.0.0.1:%d", b.cfg.Port)
}

// ConnectedNodes returns a list of connected node IDs.
func (b *Bridge) ConnectedNodes() []string {
	b.mu.RLock()
	defer b.mu.RUnlock()
	ids := make([]string, 0, len(b.nodes))
	for id := range b.nodes {
		ids = append(ids, id)
	}
	return ids
}

// ApproveNode approves a pending pair request.
func (b *Bridge) ApproveNode(requestID string) error {
	b.mu.Lock()
	req, ok := b.pending[requestID]
	if !ok {
		b.mu.Unlock()
		return fmt.Errorf("no pending pair request: %s", requestID)
	}
	delete(b.pending, requestID)
	b.mu.Unlock()

	token := generateToken()
	response := map[string]any{
		"type":  "pair-ok",
		"token": token,
	}
	data, _ := json.Marshal(response)
	_, err := req.conn.Write(append(data, '\n'))
	if err != nil {
		return fmt.Errorf("send pair-ok: %w", err)
	}

	b.logf("✅ Approved node %s (%s)", req.nodeID, req.displayName)
	return nil
}

func (b *Bridge) acceptLoop(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		conn, err := b.listener.Accept()
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			b.logf("accept error: %v", err)
			continue
		}

		go b.handleConnection(ctx, conn)
	}
}

func (b *Bridge) handleConnection(ctx context.Context, conn net.Conn) {
	defer conn.Close()

	scanner := bufio.NewScanner(conn)
	scanner.Buffer(make([]byte, 0, 64*1024), 8*1024*1024)

	var nodeID string
	authenticated := false

	for scanner.Scan() {
		select {
		case <-ctx.Done():
			return
		default:
		}

		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		var frame map[string]any
		if err := json.Unmarshal([]byte(line), &frame); err != nil {
			b.logf("invalid frame from %s: %v", conn.RemoteAddr(), err)
			continue
		}

		frameType, _ := frame["type"].(string)

		switch frameType {
		case "pair-request":
			nodeID, _ = frame["nodeId"].(string)
			displayName, _ := frame["displayName"].(string)
			requestID := generateShortID()

			b.mu.Lock()
			b.pending[requestID] = &pairRequest{
				requestID:   requestID,
				nodeID:      nodeID,
				displayName: displayName,
				conn:        conn,
				createdAt:   time.Now(),
			}
			b.mu.Unlock()

			b.logf("📋 Pair request: %s (%s) → approve with ID: %s", nodeID, displayName, requestID)

			// Auto-approve for now (can be made interactive)
			_ = b.ApproveNode(requestID)

		case "hello":
			nodeID, _ = frame["nodeId"].(string)
			token, _ := frame["token"].(string)
			displayName, _ := frame["displayName"].(string)

			if token == "" {
				sendError(conn, "AUTH_REQUIRED", "token required")
				return
			}

			authenticated = true
			node := &connectedNode{
				nodeID:      nodeID,
				displayName: displayName,
				token:       token,
				conn:        conn,
				encoder:     json.NewEncoder(conn),
				connectedAt: time.Now(),
			}

			b.mu.Lock()
			b.nodes[nodeID] = node
			b.mu.Unlock()

			// Send hello-ok
			response := map[string]any{
				"type":       "hello-ok",
				"serverName": "NanoSolana Gateway",
			}
			data, _ := json.Marshal(response)
			_, _ = conn.Write(append(data, '\n'))

			b.logf("🔗 Node connected: %s (%s)", nodeID, displayName)

		case "ping":
			id, _ := frame["id"].(string)
			pong := map[string]any{"type": "pong", "id": id}
			data, _ := json.Marshal(pong)
			_, _ = conn.Write(append(data, '\n'))

		case "event":
			if !authenticated {
				sendError(conn, "AUTH_REQUIRED", "authenticate first")
				continue
			}
			evt, _ := frame["event"].(string)
			b.logf("📡 Event from %s: %s", nodeID, evt)
			// Route events to daemon via callback
		}
	}

	// Cleanup on disconnect
	if nodeID != "" {
		b.mu.Lock()
		delete(b.nodes, nodeID)
		b.mu.Unlock()
		b.logf("🔌 Node disconnected: %s", nodeID)
	}
}

func (b *Bridge) resolveBindAddr() string {
	if b.cfg.BindAddr != "" {
		return b.cfg.BindAddr
	}
	if b.cfg.UseTailscale {
		if ip, err := DetectTailscaleIP(); err == nil {
			return ip
		}
	}
	return "0.0.0.0"
}

// ── Tailscale Integration ────────────────────────────────────────────

// DetectTailscaleIP returns the machine's Tailscale IPv4 address.
func DetectTailscaleIP() (string, error) {
	out, err := exec.Command("tailscale", "ip", "-4").Output()
	if err != nil {
		return "", fmt.Errorf("tailscale ip: %w", err)
	}
	ip := strings.TrimSpace(string(out))
	if ip == "" {
		return "", fmt.Errorf("tailscale returned empty IP")
	}
	return ip, nil
}

// ── Helpers ──────────────────────────────────────────────────────────

func generateToken() string {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return fmt.Sprintf("tk-%d", time.Now().UnixNano())
	}
	return "ntk-" + hex.EncodeToString(buf)
}

func generateShortID() string {
	buf := make([]byte, 6)
	if _, err := rand.Read(buf); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(buf)
}

func sendError(conn net.Conn, code, message string) {
	frame := map[string]any{
		"type":    "error",
		"code":    code,
		"message": message,
	}
	data, _ := json.Marshal(frame)
	_, _ = conn.Write(append(data, '\n'))
}
