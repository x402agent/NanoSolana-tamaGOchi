# ── MawdBot Go :: Makefile ─────────────────────────────────────────────
# Build targets for x86_64, ARM64 (NVIDIA Orin Nano), and Arduino bridge
#
# Usage:
#   make build          Build for current platform
#   make slim           Build extra-slim daemon binary profile
#   make size-report    Compare standard vs slim binary sizes
#   make orin           Cross-compile for NVIDIA Orin Nano (linux/arm64)
#   make tui            Build TUI launcher
#   make all            Build all targets
#   make docker         Build Docker image
#   make clean          Remove build artifacts
#   make install        Install to /usr/local/bin
#   make test           Run tests
#   make scan-i2c       Scan I2C bus for Modulino® sensors
# ──────────────────────────────────────────────────────────────────────

VERSION   := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT    := $(shell git rev-parse --short HEAD 2>/dev/null || echo "none")
BUILDTIME := $(shell date -u +%Y-%m-%dT%H:%M:%SZ)
GOVERSION := $(shell go version | cut -d' ' -f3)

MODULE    := github.com/8bitlabs/mawdbot
PKG_VER   := $(MODULE)/pkg/config

LDFLAGS   := -s -w \
  -X $(PKG_VER).Version=$(VERSION) \
  -X $(PKG_VER).GitCommit=$(COMMIT) \
  -X $(PKG_VER).BuildTime=$(BUILDTIME) \
  -X $(PKG_VER).GoVersion=$(GOVERSION)

SLIM_LDFLAGS := -s -w -buildid= \
  -X $(PKG_VER).Version=$(VERSION) \
  -X $(PKG_VER).GitCommit=$(COMMIT) \
  -X $(PKG_VER).BuildTime=$(BUILDTIME) \
  -X $(PKG_VER).GoVersion=$(GOVERSION)

# Shared build settings
GO        := go
GOBUILD   := $(GO) build -trimpath -ldflags "$(LDFLAGS)"
GOBUILD_SLIM := $(GO) build -trimpath -tags "netgo osusergo" -ldflags "$(SLIM_LDFLAGS)"
GOTEST    := $(GO) test -v -race

# Output directories
BUILD_DIR := ./build
BIN_CLI   := $(BUILD_DIR)/mawdbot
BIN_TUI   := $(BUILD_DIR)/mawdbot-tui
BIN_SLIM  := $(BUILD_DIR)/mawdbot-slim

.PHONY: all build slim size-report orin tui docker clean install test lint deps scan-i2c

# ── Default ───────────────────────────────────────────────────────────

all: build tui

# ── Build for current platform ────────────────────────────────────────

build:
	@echo "🦞 Building MawdBot CLI..."
	@mkdir -p $(BUILD_DIR)
	$(GOBUILD) -o $(BIN_CLI) ./cmd/mawdbot
	@echo "✓ $(BIN_CLI) built ($(shell file $(BIN_CLI) | cut -d: -f2))"
	@ls -lh $(BIN_CLI)

slim:
	@echo "🪶 Building slim MawdBot CLI profile..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 $(GOBUILD_SLIM) -o $(BIN_SLIM) ./cmd/mawdbot
	@echo "✓ $(BIN_SLIM) built"
	@ls -lh $(BIN_SLIM)
	@echo "ℹ️ Optional extra compression: upx --best --lzma $(BIN_SLIM)"

size-report: build slim
	@echo "📏 Binary size report"
	@ls -lh $(BIN_CLI) $(BIN_SLIM)
	@echo ""
	@echo "Raw byte counts:"
	@wc -c $(BIN_CLI) $(BIN_SLIM)
	@std=$$(wc -c < $(BIN_CLI)); \
		slim=$$(wc -c < $(BIN_SLIM)); \
		delta=$$((std-slim)); \
		pct=$$(awk "BEGIN { if ($$std == 0) print 0; else printf \"%.2f\", ($$delta*100)/$$std }"); \
		echo "Reduction: $$delta bytes ($$pct%)"

tui:
	@echo "🦞 Building MawdBot TUI Launcher..."
	@mkdir -p $(BUILD_DIR)
	$(GOBUILD) -o $(BIN_TUI) ./cmd/mawdbot-tui
	@echo "✓ $(BIN_TUI) built"
	@ls -lh $(BIN_TUI)

# ── NVIDIA Orin Nano (Linux ARM64) ────────────────────────────────────
# The Orin Nano runs Ubuntu 22.04 aarch64 (Jetson Linux / JetPack 6.x)
# CGO enabled for I2C syscalls (hardware/modulino.go)

orin:
	@echo "🦞 Cross-compiling for NVIDIA Orin Nano (linux/arm64)..."
	@mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 \
		$(GOBUILD) -o $(BUILD_DIR)/mawdbot-orin ./cmd/mawdbot
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 \
		$(GOBUILD) -o $(BUILD_DIR)/mawdbot-tui-orin ./cmd/mawdbot-tui
	@echo "✓ Orin Nano binaries:"
	@ls -lh $(BUILD_DIR)/mawdbot-orin $(BUILD_DIR)/mawdbot-tui-orin
	@echo ""
	@echo "📦 Deploy to Orin Nano:"
	@echo "  scp $(BUILD_DIR)/mawdbot-orin user@orin-nano:~/mawdbot"
	@echo "  scp $(BUILD_DIR)/mawdbot-tui-orin user@orin-nano:~/mawdbot-tui"

# ── Raspberry Pi / Generic ARM ────────────────────────────────────────

rpi:
	@echo "🦞 Cross-compiling for Raspberry Pi (linux/arm64)..."
	@mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=arm64 CGO_ENABLED=0 \
		$(GOBUILD) -o $(BUILD_DIR)/mawdbot-rpi ./cmd/mawdbot
	@echo "✓ $(BUILD_DIR)/mawdbot-rpi built"

# ── RISC-V ────────────────────────────────────────────────────────────

riscv:
	@echo "🦞 Cross-compiling for RISC-V (linux/riscv64)..."
	@mkdir -p $(BUILD_DIR)
	GOOS=linux GOARCH=riscv64 CGO_ENABLED=0 \
		$(GOBUILD) -o $(BUILD_DIR)/mawdbot-riscv ./cmd/mawdbot
	@echo "✓ $(BUILD_DIR)/mawdbot-riscv built"

# ── macOS (Apple Silicon) ─────────────────────────────────────────────

macos:
	@echo "🦞 Building for macOS (darwin/arm64)..."
	@mkdir -p $(BUILD_DIR)
	GOOS=darwin GOARCH=arm64 \
		$(GOBUILD) -o $(BUILD_DIR)/mawdbot-macos ./cmd/mawdbot
	@echo "✓ $(BUILD_DIR)/mawdbot-macos built"

# ── All platforms ─────────────────────────────────────────────────────

cross: build orin rpi riscv macos
	@echo ""
	@echo "🦞 All cross-compilation complete:"
	@ls -lh $(BUILD_DIR)/

# ── Docker ────────────────────────────────────────────────────────────

docker:
	@echo "🐳 Building Docker image..."
	docker build -t mawdbot:$(VERSION) -t mawdbot:latest .
	@echo "✓ Docker image built: mawdbot:$(VERSION)"

docker-orin:
	@echo "🐳 Building Docker image for Orin Nano (linux/arm64)..."
	docker buildx build --platform linux/arm64 \
		-t mawdbot:$(VERSION)-orin \
		-t mawdbot:latest-orin .
	@echo "✓ Docker image built: mawdbot:$(VERSION)-orin"

# ── Install ───────────────────────────────────────────────────────────

install: build tui
	@echo "📦 Installing to /usr/local/bin..."
	install -m 755 $(BIN_CLI) /usr/local/bin/mawdbot
	install -m 755 $(BIN_TUI) /usr/local/bin/mawdbot-tui
	@echo "✓ Installed mawdbot and mawdbot-tui"

# ── Test ──────────────────────────────────────────────────────────────

test:
	@echo "🧪 Running tests..."
	$(GOTEST) ./...

lint:
	@echo "🔍 Running linter..."
	golangci-lint run ./...

# ── Dependencies ──────────────────────────────────────────────────────

deps:
	@echo "📦 Installing dependencies..."
	$(GO) mod download
	$(GO) mod tidy

# ── Hardware ──────────────────────────────────────────────────────────

scan-i2c:
	@echo "🔍 Scanning I2C bus for Modulino® sensors..."
	@i2cdetect -y 1 2>/dev/null || echo "i2cdetect not available — install i2c-tools"
	@echo ""
	@echo "Expected Modulino® addresses:"
	@echo "  0x29 — Distance (VL53L4CD)"
	@echo "  0x3C — Buzzer (PKLCS1212E)"
	@echo "  0x44 — Thermo (HS3003)"
	@echo "  0x6A — Movement (LSM6DSOX)"
	@echo "  0x6C — Pixels (LC8822)"
	@echo "  0x76 — Knob (PEC11J)"
	@echo "  0x7C — Buttons (3x push)"

# ── Clean ─────────────────────────────────────────────────────────────

clean:
	@echo "🧹 Cleaning..."
	@rm -rf $(BUILD_DIR)
	@echo "✓ Clean"

# ── Help ──────────────────────────────────────────────────────────────

help:
	@echo "MawdBot Go — Makefile targets:"
	@echo ""
	@echo "  build       Build for current platform"
	@echo "  slim        Build slim profile (CGO off, netgo/osusergo tags)"
	@echo "  size-report Build standard + slim and print size deltas"
	@echo "  tui         Build TUI launcher"
	@echo "  all         Build CLI + TUI"
	@echo "  orin        Cross-compile for NVIDIA Orin Nano (linux/arm64)"
	@echo "  rpi         Cross-compile for Raspberry Pi (linux/arm64)"
	@echo "  riscv       Cross-compile for RISC-V (linux/riscv64)"
	@echo "  macos       Build for macOS Apple Silicon"
	@echo "  cross       All cross-compilation targets"
	@echo "  docker      Build Docker image"
	@echo "  docker-orin Build Docker for Orin Nano"
	@echo "  install     Install to /usr/local/bin"
	@echo "  test        Run tests"
	@echo "  lint        Run linter"
	@echo "  deps        Download dependencies"
	@echo "  scan-i2c    Scan for Modulino sensors"
	@echo "  clean       Remove build artifacts"
	@echo ""
	@echo "  Version: $(VERSION) | Commit: $(COMMIT)"
