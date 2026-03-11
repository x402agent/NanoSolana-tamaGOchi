# MawdBot Web — Makefile
# Adapted from PicoClaw web/Makefile

.PHONY: all frontend backend clean dev

all: frontend backend

# Build frontend (Vite + React)
frontend:
	cd frontend && npm install && npm run build

# Build Go backend
backend:
	go build -o ../build/mawdbot-web ./backend/

# Dev mode — run both frontend and backend
dev:
	@echo "Starting MawdBot Web Console..."
	@echo "Frontend: http://localhost:5173"
	@echo "Backend:  http://localhost:18800"
	cd frontend && npm run dev &
	go run ./backend/

# Cross-compile backend for ARM64 (Orin Nano)
orin:
	GOOS=linux GOARCH=arm64 go build -o ../build/mawdbot-web-orin ./backend/

clean:
	rm -rf frontend/dist frontend/node_modules
	rm -f ../build/mawdbot-web ../build/mawdbot-web-orin
