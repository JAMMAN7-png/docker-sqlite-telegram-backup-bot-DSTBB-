import { Bot, InputFile } from "grammy";
import { CronJob } from "cron";
import { createHash } from "crypto";
import { readFileSync, statSync } from "fs";
import { hostname } from "os";

// Environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const DB_PATH = process.env.DB_PATH || "/data/db.sqlite3";
const BACKUP_CRON = process.env.BACKUP_CRON || "0 * * * *";

// Validate required environment variables
if (!TELEGRAM_BOT_TOKEN) {
  console.error("Error: TELEGRAM_BOT_TOKEN is not set");
  process.exit(1);
}

if (!TELEGRAM_CHAT_ID) {
  console.error("Error: TELEGRAM_CHAT_ID is not set");
  process.exit(1);
}

// Type-safe constants after validation
const BOT_TOKEN: string = TELEGRAM_BOT_TOKEN;
const CHAT_ID: string = TELEGRAM_CHAT_ID;

// Initialize bot
const bot = new Bot(BOT_TOKEN);

// Sequence number for backups
let sequenceNumber = 0;

/**
 * Calculate SHA256 hash of a file
 */
function calculateSHA256(filePath: string): string {
  const fileBuffer = readFileSync(filePath);
  const hashSum = createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Backup type for caption differentiation
 */
type BackupType = "health_check" | "scheduled";

/**
 * Perform backup and send to Telegram
 */
async function performBackup(type: BackupType = "scheduled") {
  try {
    const isHealthCheck = type === "health_check";
    const logPrefix = isHealthCheck ? "Health check" : "Scheduled backup";

    console.log(`[${new Date().toISOString()}] Starting ${logPrefix.toLowerCase()}...`);

    // Check if file exists
    try {
      statSync(DB_PATH);
    } catch (error) {
      console.error(`Error: Database file not found at ${DB_PATH}`);
      return;
    }

    // Get file stats
    const stats = statSync(DB_PATH);
    const fileSize = stats.size;
    const formattedSize = formatFileSize(fileSize);

    // Calculate SHA256 hash
    const sha256Hash = calculateSHA256(DB_PATH);

    // Get hostname
    const hostName = hostname();

    // Increment sequence number
    sequenceNumber++;

    // Create timestamp
    const timestamp = new Date().toISOString();

    // Create caption based on backup type
    const title = isHealthCheck
      ? `✅ Health Check Backup`
      : `📦 Scheduled Backup`;

    const statusLine = isHealthCheck
      ? `🟢 Status: Bot started successfully`
      : `🔄 Status: Scheduled backup completed`;

    const caption = [
      title,
      ``,
      statusLine,
      `🕐 Timestamp: ${timestamp}`,
      `📊 Size: ${formattedSize}`,
      `🔒 SHA256: ${sha256Hash.substring(0, 16)}...`,
      `💻 Hostname: ${hostName}`,
      `#️⃣ Sequence: ${sequenceNumber}`,
      `⏰ Schedule: ${BACKUP_CRON}`,
    ].join("\n");

    // Send file to Telegram
    console.log(`Sending ${logPrefix.toLowerCase()} to Telegram (chat: ${CHAT_ID})...`);

    await bot.api.sendDocument(CHAT_ID, new InputFile(DB_PATH), {
      caption: caption,
    });

    console.log(`[${new Date().toISOString()}] ${logPrefix} completed successfully (sequence: ${sequenceNumber})`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Backup failed:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  console.log("=".repeat(60));
  console.log("Docker SQLite Telegram Backup Bot");
  console.log("=".repeat(60));
  console.log(`Database path: ${DB_PATH}`);
  console.log(`Backup schedule: ${BACKUP_CRON}`);
  console.log(`Hostname: ${hostname()}`);
  console.log("=".repeat(60));

  // Set up cron job for scheduled backups
  const job = new CronJob(
    BACKUP_CRON,
    () => performBackup("scheduled"),
    null,
    true,
    "UTC"
  );

  console.log(`Cron job scheduled: ${BACKUP_CRON}`);
  console.log(`Next backup at: ${job.nextDate().toISO()}`);
  console.log("Bot is running. Press Ctrl+C to stop.");

  // Perform health check backup immediately on startup
  console.log("\nPerforming health check backup...");
  await performBackup("health_check");

  // Keep the process alive
  process.on("SIGINT", () => {
    console.log("\nShutting down gracefully...");
    job.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\nShutting down gracefully...");
    job.stop();
    process.exit(0);
  });
}

// Start the bot
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
