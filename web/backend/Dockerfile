# MawdBot Web Console — Railway Dockerfile
# Multi-stage build: Go binary in Alpine

FROM golang:1.25-alpine AS builder

WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o mawdbot-web ./web/backend/

FROM alpine:3.21
RUN apk add --no-cache ca-certificates

WORKDIR /app
COPY --from=builder /build/mawdbot-web .

# Create default config directory
RUN mkdir -p /root/.mawdbot && \
    echo '{"agent": "NanoSolana TamaGObot", "version": "2.0.0"}' > /root/.mawdbot/config.json

# Railway sets PORT dynamically
ENV PORT=18800
EXPOSE ${PORT}

CMD ["./mawdbot-web", "--public", "--no-browser"]
