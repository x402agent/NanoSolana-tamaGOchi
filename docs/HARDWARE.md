# Hardware Deployment Guide

## Architecture: Hardware Abstraction Layer (HAL)

MawdBot Go uses a build-tag HAL to run identically on real hardware or in simulation:

```
┌────────────────────────────────────────────────┐
│              MawdBot Agent (OODA Loop)          │
├────────────────────────────────────────────────┤
│           DeviceManager (pkg/hardware)          │
│   Modulino drivers · Event routing · Mapping    │
├────────────────────────────────────────────────┤
│              HAL Interface (internal/hal)        │
│   Bus · Device · GPIO · PWM · Platform          │
├──────────────────┬─────────────────────────────┤
│  hal_linux.go    │     hal_stub.go             │
│  (periph.io)     │     (synthetic data)        │
│  Real I2C/GPIO   │     Logs + mock sensors     │
│  Orin/RPi/RISCV  │     macOS/Windows/CI        │
└──────────────────┴─────────────────────────────┘
```

**Build tags are automatic** — `go build` on Linux links `hal_linux.go`, everywhere else gets `hal_stub.go`.

## Supported Hardware

| Board | Arch | Build Target | I2C | GPIO | Notes |
|-------|------|-------------|-----|------|-------|
| NVIDIA Orin Nano | arm64 | `make orin` | ✓ | ✓ | Primary target, /dev/i2c-1 |
| NVIDIA Orin NX | arm64 | `make orin` | ✓ | ✓ | Same as Nano |
| Raspberry Pi 5 | arm64 | `make rpi` | ✓ | ✓ | /dev/i2c-1 |
| Raspberry Pi 4B | arm64 | `make rpi` | ✓ | ✓ | /dev/i2c-1 |
| Raspberry Pi Zero 2W | arm64 | `make rpi` | ✓ | ✓ | Low RAM, works fine |
| Raspberry Pi Zero W | armv6 | `make rpi-armv6` | ✓ | ✓ | Limited CPU |
| StarFive VisionFive 2 | riscv64 | `make riscv` | ✓ | ✓ | Experimental |
| BeagleBone AI-64 | arm64 | `make orin` | ✓ | ✓ | TI TDA4VM |
| x86 Server | amd64 | `make linux-amd64` | ✗ | ✗ | Software-only |
| Mac (dev) | arm64/amd64 | `make build` | ✗ | ✗ | Stub mode |

## NVIDIA Orin Nano Setup

### 1. Flash & Boot

```bash
# Flash JetPack 6.x via SDK Manager or from SD card image
# Boot into Ubuntu desktop, connect via SSH
```

### 2. Enable I2C

```bash
# Check I2C buses
ls /dev/i2c-*

# If not present, enable in device tree
sudo /opt/nvidia/jetson-io/jetson-io.py
# Select "Configure Jetson 40pin Header" → Enable I2C

# Install tools
sudo apt install -y i2c-tools

# Test
sudo i2cdetect -y 1
```

### 3. Deploy MawdBot

```bash
# On your dev machine:
make orin
scp build/mawdbot-orin build/mawdbot-tui-orin user@orin-nano:~/

# On the Orin Nano:
chmod +x ~/mawdbot-orin ~/mawdbot-tui-orin
sudo mv mawdbot-orin /usr/local/bin/mawdbot
sudo mv mawdbot-tui-orin /usr/local/bin/mawdbot-tui

# Add user to i2c group
sudo usermod -aG i2c $USER
# Logout/login for group change

# Initialize
mawdbot onboard

# Configure keys
cp ~/.mawdbot/.env.example ~/.mawdbot/.env
nano ~/.mawdbot/.env

# Scan hardware
mawdbot hardware scan

# Run self-test
mawdbot hardware test
```

### 4. Systemd Service

```bash
sudo tee /etc/systemd/system/mawdbot.service << 'EOF'
[Unit]
Description=MawdBot Solana Trading Agent
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=mawdbot
Group=i2c
EnvironmentFile=/home/mawdbot/.mawdbot/.env
ExecStart=/usr/local/bin/mawdbot ooda --interval 60
Restart=always
RestartSec=10

# Security
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/home/mawdbot/.mawdbot
PrivateTmp=true

# Device access
SupplementaryGroups=i2c
DeviceAllow=/dev/i2c-1 rw

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable mawdbot
sudo systemctl start mawdbot
sudo journalctl -u mawdbot -f
```

## Raspberry Pi Setup

### 1. Enable I2C

```bash
sudo raspi-config
# Interface Options → I2C → Enable

sudo apt install -y i2c-tools
sudo i2cdetect -y 1
```

### 2. Deploy

```bash
make rpi
scp build/mawdbot-rpi pi@raspberrypi:~/mawdbot
```

### 3. Wiring (Qwiic)

Connect Modulino nodes to the RPi's I2C pins:
- **SDA**: GPIO 2 (Pin 3)
- **SCL**: GPIO 3 (Pin 5)
- **3.3V**: Pin 1
- **GND**: Pin 6

Or use a Qwiic HAT / breakout for plug-and-play daisy-chaining.

## Arduino Modulino® Wiring

All Modulino nodes connect via **Qwiic** (I2C daisy-chain). No soldering required.

```
[Orin Nano / RPi]
     │
     │ Qwiic Cable
     ▼
┌──────────┐   Qwiic   ┌──────────┐   Qwiic   ┌──────────┐
│ Distance │ ─────────► │ Movement │ ─────────► │  Thermo  │
│  0x29    │            │  0x6A    │            │  0x44    │
└──────────┘            └──────────┘            └──────────┘
                                                      │
     ┌────────────────────────────────────────────────┘
     │ Qwiic
     ▼
┌──────────┐   Qwiic   ┌──────────┐   Qwiic   ┌──────────┐
│  Pixels  │ ─────────► │  Buzzer  │ ─────────► │ Buttons  │
│  0x6C    │            │  0x3C    │            │  0x7C    │
└──────────┘            └──────────┘            └──────────┘
     │ Qwiic
     ▼
┌──────────┐
│   Knob   │
│  0x76    │
└──────────┘
```

## Hardware ↔ Agent Mapping

| Sensor | Agent Integration |
|--------|-------------------|
| **Distance** | Proximity alert — pause trades if someone is near the hardware |
| **Movement** | Vibration/tilt detection — emergency stop on physical disturbance |
| **Thermo** | Thermal throttle — reduce activity if board overheating |
| **Knob** | Live strategy tuning — maps to position_size, stop_loss, or RSI threshold |
| **Buttons** | A=force cycle, B=toggle simulate, C=checkpoint vault |
| **Pixels** | OODA phase display (teal→purple→amber→green) + signal strength bar |
| **Buzzer** | Trade alerts (rising tone), error alerts (low tone) |

## Docker with Hardware Access

```bash
# Build
docker build -t mawdbot .

# Run with I2C device access
docker run --rm \
  --device /dev/i2c-1 \
  --env-file .env \
  mawdbot ooda --interval 60

# Or with full hardware access (GPIO, etc)
docker run --rm \
  --privileged \
  --env-file .env \
  mawdbot ooda --interval 60
```

## Monitoring

```bash
# Live sensor stream
mawdbot hardware monitor

# System status
mawdbot status

# Logs (systemd)
journalctl -u mawdbot -f --no-pager

# Resource usage (should be <10MB RSS)
ps aux | grep mawdbot
```
