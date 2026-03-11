# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────────────
# MawdBot Go :: Multi-Stage Docker Build
# Final image: ~15MB (Alpine + 8.3MB binary)
# ──────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────
FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git make

WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download

COPY . .
RUN make build

# ── Stage 2: Runtime ──────────────────────────────────────────────────
FROM alpine:3.22

RUN apk add --no-cache ca-certificates tzdata i2c-tools

WORKDIR /app

COPY --from=builder /src/build/mawdbot /app/mawdbot

# Create workspace directories
RUN mkdir -p /root/.mawdbot/workspace/vault/decisions \
             /root/.mawdbot/workspace/vault/lessons \
             /root/.mawdbot/workspace/vault/trades \
             /root/.mawdbot/workspace/vault/research \
             /root/.mawdbot/workspace/vault/inbox \
             /root/.mawdbot/wallet

# Copy .env.example as reference
COPY .env.example /app/.env.example

EXPOSE 18790

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD /app/mawdbot version || exit 1

ENTRYPOINT ["/app/mawdbot"]
CMD ["daemon"]
