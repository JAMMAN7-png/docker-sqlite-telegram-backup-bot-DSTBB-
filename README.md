# Docker SQLite Telegram Backup Bot (DSTBB)

A Docker service that automatically backs up Vaultwarden's SQLite database to Telegram on an hourly schedule using cron.

## Features

- 🔄 Automated hourly backups via cron
- 📱 Sends backups directly to Telegram
- 🔒 SHA256 hash verification
- 📊 Detailed backup information (timestamp, size, hostname, sequence number)
- 🐳 Fully containerized with Docker Compose
- 📝 Built with TypeScript, Bun, and Grammy.js

## Prerequisites

- Docker and Docker Compose
- Telegram bot token (from [@BotFather](https://t.me/botfather))
- Telegram chat ID (your user ID or group chat ID)

## Quick Start

### 1. Get Telegram Credentials

1. Create a bot with [@BotFather](https://t.me/botfather) and get the bot token
2. Get your chat ID by messaging [@userinfobot](https://t.me/userinfobot)

### 2. Configure Environment

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789
DB_PATH=/data/db.sqlite3
BACKUP_CRON=0 * * * *
```

### 3. Start Services

```bash
docker-compose up -d
```

This will start:
- Vaultwarden server on port 80
- Backup service that sends database to Telegram hourly

### 4. Verify Backup

Check the logs to ensure backups are running:

```bash
docker-compose logs -f backup
```

You should see backup confirmations and receive the database file in your Telegram chat.

## Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather | - | ✅ |
| `TELEGRAM_CHAT_ID` | Telegram chat ID to send backups to | - | ✅ |
| `DB_PATH` | Path to SQLite database file | `/data/db.sqlite3` | ❌ |
| `BACKUP_CRON` | Cron schedule for backups | `0 * * * *` (hourly) | ❌ |

### Cron Schedule Examples

- `0 * * * *` - Every hour at minute 0
- `*/30 * * * *` - Every 30 minutes
- `0 */6 * * *` - Every 6 hours
- `0 2 * * *` - Daily at 2:00 AM
- `0 0 * * 0` - Weekly on Sunday at midnight

## Backup Information

Each backup includes:

- 📦 Database file (`db.sqlite3`)
- 🕐 Timestamp (ISO 8601 format)
- 📊 File size (human-readable)
- 🔒 SHA256 hash (for integrity verification)
- 💻 Hostname (container hostname)
- #️⃣ Sequence number (incremental counter)

## Docker Compose Structure

```yaml
services:
  vaultwarden:
    - Main Vaultwarden password manager service
    - Port 80 exposed for web access
  
  backup:
    - Automated backup service
    - Read-only access to vaultwarden volume
    - Sends backups to Telegram on schedule
```

## Development

### Local Testing

1. Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

2. Install dependencies:
```bash
bun install
```

3. Create `.env` file with your credentials

4. Run locally:
```bash
bun run dev
```

### Build Docker Image

```bash
docker build -t vaultwarden-backup .
```

## Troubleshooting

### Backup not sending

1. Check logs: `docker-compose logs backup`
2. Verify bot token and chat ID are correct
3. Ensure the bot can send messages to the chat
4. Check database file exists at the specified path

### Permission issues

The backup service uses read-only access to the vaultwarden volume. Ensure the volume is properly mounted.

### Cron not triggering

- Verify cron expression is valid
- Check container timezone (UTC by default)
- Look for errors in logs

## Security Notes

- The backup service has **read-only** access to the database
- Store `.env` file securely and never commit it to version control
- Telegram messages are encrypted in transit
- Consider enabling 2FA on your Telegram account
- Regularly verify backup integrity using the SHA256 hash

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh/) - Fast JavaScript runtime
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Bot Framework**: [Grammy.js](https://grammy.dev/) - Telegram bot framework
- **Scheduling**: [node-cron](https://www.npmjs.com/package/cron)
- **Container**: Docker & Docker Compose