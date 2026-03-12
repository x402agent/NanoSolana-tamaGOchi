// MawdBot Web Console — web-based dashboard and agent control.
// Adapted from PicoClaw's web launcher — serves embedded frontend,
// provides API for config management and gateway control.
//
// Usage:
//   go build -o mawdbot-web ./web/backend/
//   ./mawdbot-web [config.json]
//   ./mawdbot-web -public config.json

package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"time"
)

const banner = `
  ╔══════════════════════════════════════════════╗
  ║       🦞 MawdBot OS — Web Console           ║
  ║   Sentient Solana Trading Intelligence       ║
  ╚══════════════════════════════════════════════╝`

func main() {
	port := flag.String("port", "", "Port to listen on")
	public := flag.Bool("public", false, "Listen on all interfaces (0.0.0.0) instead of localhost only")
	noBrowser := flag.Bool("no-browser", false, "Do not auto-open browser on startup")

	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "MawdBot Web Console — Dashboard and agent control\n\n")
		fmt.Fprintf(os.Stderr, "Usage: %s [options] [config.json]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "Options:\n")
		flag.PrintDefaults()
	}
	flag.Parse()

	// Railway sets PORT env var
	if *port == "" {
		if envPort := os.Getenv("PORT"); envPort != "" {
			*port = envPort
			*public = true // Railway needs 0.0.0.0
			*noBrowser = true
		} else {
			*port = "18800"
		}
	}

	configPath := defaultConfigPath()
	if flag.NArg() > 0 {
		configPath = flag.Arg(0)
	}

	absPath, err := filepath.Abs(configPath)
	if err != nil {
		log.Fatalf("Config path error: %v", err)
	}

	portNum, err := strconv.Atoi(*port)
	if err != nil || portNum < 1 || portNum > 65535 {
		log.Fatalf("Invalid port: %s", *port)
	}

	var addr string
	if *public {
		addr = "0.0.0.0:" + *port
	} else {
		addr = "127.0.0.1:" + *port
	}

	// API routes
	mux := http.NewServeMux()

	// API: Status
	mux.HandleFunc("/api/status", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":     "running",
			"version":    "1.0.0",
			"agent":      "MawdBot Go",
			"config":     absPath,
			"uptime":     time.Since(startTime).String(),
			"mode":       os.Getenv("AGENT_MODE"),
		})
	})

	// API: Config read
	mux.HandleFunc("/api/config", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		data, err := os.ReadFile(absPath)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Write(data)
	})

	// API: Health
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "ok",
			"agent":  "mawdbot-go",
		})
	})

	// API: Connectors status
	mux.HandleFunc("/api/connectors", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		connectors := []map[string]any{
			{"name": "Helius", "status": envStatus("HELIUS_API_KEY"), "type": "rpc"},
			{"name": "Birdeye", "status": envStatus("BIRDEYE_API_KEY"), "type": "analytics"},
			{"name": "Jupiter", "status": envStatus("JUPITER_API_KEY"), "type": "swap"},
			{"name": "Aster", "status": envStatus("ASTER_API_KEY"), "type": "perps"},
			{"name": "OpenRouter", "status": envStatus("OPENROUTER_API_KEY"), "type": "llm"},
			{"name": "Supabase", "status": envStatus("SUPABASE_URL"), "type": "database"},
		}
		json.NewEncoder(w).Encode(connectors)
	})

	// Serve embedded frontend (or static files)
	frontendDir := filepath.Join(filepath.Dir(absPath), "web", "frontend", "dist")
	if _, err := os.Stat(frontendDir); err == nil {
		mux.Handle("/", http.FileServer(http.Dir(frontendDir)))
	} else {
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/html")
			w.Write([]byte(fallbackHTML))
		})
	}

	// CORS middleware
	handler := corsMiddleware(loggerMiddleware(mux))

	// Startup
	fmt.Print(banner)
	fmt.Println()
	fmt.Printf("  Config: %s\n", absPath)
	fmt.Printf("  Open: http://localhost:%s\n", *port)
	if *public {
		if ip := getLocalIP(); ip != "" {
			fmt.Printf("  Public: http://%s:%s\n", ip, *port)
		}
	}
	fmt.Println()

	if !*noBrowser {
		go func() {
			time.Sleep(500 * time.Millisecond)
			openBrowser("http://localhost:" + *port)
		}()
	}

	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}

var startTime = time.Now()

func defaultConfigPath() string {
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".mawdbot", "config.json")
}

func envStatus(key string) string {
	if os.Getenv(key) != "" {
		return "connected"
	}
	return "not_configured"
}

func getLocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return ""
	}
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() && ipnet.IP.To4() != nil {
			return ipnet.IP.String()
		}
	}
	return ""
}

func openBrowser(url string) error {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		return fmt.Errorf("unsupported OS: %s", runtime.GOOS)
	}
	return cmd.Start()
}

func corsMiddleware(next http.Handler) http.Handler {
	// Allow specific Vercel origins in production, * in dev
	allowedOrigins := map[string]bool{
		"http://localhost:5173":  true,
		"http://localhost:3000":  true,
		"http://127.0.0.1:5173": true,
	}
	// Add custom frontend URL from env
	if frontendURL := os.Getenv("FRONTEND_URL"); frontendURL != "" {
		allowedOrigins[frontendURL] = true
	}
	// Add Vercel preview/production URLs
	if vercelURL := os.Getenv("VERCEL_URL"); vercelURL != "" {
		allowedOrigins["https://"+vercelURL] = true
	}

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if allowedOrigins[origin] || os.Getenv("CORS_ALLOW_ALL") == "true" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		} else if origin == "" {
			// No origin = same-site or server-to-server
			w.Header().Set("Access-Control-Allow-Origin", "*")
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == "OPTIONS" {
			w.WriteHeader(204)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func loggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("[%s] %s %s %s", r.Method, r.URL.Path, r.RemoteAddr, time.Since(start))
	})
}

const fallbackHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MawdBot OS — Console</title>
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#020208;color:#c8d8e8;font-family:'Share Tech Mono',monospace;min-height:100vh;display:flex;align-items:center;justify-content:center}
.container{text-align:center;padding:2rem}
h1{color:#14F195;font-size:2rem;margin-bottom:1rem}
.status{color:#9945FF;margin:1rem 0}
.info{color:#556680;font-size:0.9em}
a{color:#00d4ff;text-decoration:none}
a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="container">
  <h1>🦞 MawdBot OS</h1>
  <p class="status">Web Console Running</p>
  <p>API: <a href="/api/status">/api/status</a> | <a href="/api/connectors">/api/connectors</a> | <a href="/api/health">/api/health</a></p>
  <p class="info">Build the frontend with: cd web/frontend && npm run build</p>
</div>
</body>
</html>`
