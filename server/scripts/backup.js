#!/usr/bin/env node
/**
 * MukonoTalks - MongoDB Backup Script
 * Creates timestamped mongodump backups with retention policy
 * Supports automated scheduling via node-cron
 * 
 * Usage:
 *   node scripts/backup.js                   # Full backup
 *   node scripts/backup.js --collections orders,users  # Specific collections
 *   node scripts/backup.js --retention 30    # Keep last 30 days
 *   node scripts/backup.js --schedule        # Run as cron daemon (daily 2AM)
 *   node scripts/backup.js --verify          # Verify last backup integrity
 * 
 * Requires: mongodump CLI tool installed (MongoDB Database Tools)
 * 
 * @module scripts/backup
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mukonotalks';
const BACKUP_DIR = path.resolve(__dirname, '../backups');
const DEFAULT_RETENTION_DAYS = 14;
const BACKUP_LOG_FILE = path.join(BACKUP_DIR, 'backup.log');

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

function logMessage(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  console.log(line);
  try {
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.appendFileSync(BACKUP_LOG_FILE, line + '\n');
  } catch { /* Log file write failure is non-critical */ }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    collections: null,
    retention: DEFAULT_RETENTION_DAYS,
    schedule: false,
    verify: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--collections' && args[i + 1]) {
      options.collections = args[i + 1].split(',').map((c) => c.trim());
      i++;
    }
    if (args[i] === '--retention' && args[i + 1]) {
      options.retention = parseInt(args[i + 1], 10);
      i++;
    }
    if (args[i] === '--schedule') {
      options.schedule = true;
    }
    if (args[i] === '--verify') {
      options.verify = true;
    }
  }

  return options;
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    logMessage(`Created backup directory: ${BACKUP_DIR}`);
  }
}

function runBackup(options) {
  const timestamp = getTimestamp();
  const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

  let cmd = `mongodump --uri="${MONGO_URI}" --out="${backupPath}"`;

  if (options.collections) {
    // Extract DB name from URI
    const dbName = MONGO_URI.split('/').pop().split('?')[0];
    options.collections.forEach((col) => {
      const colCmd = `mongodump --uri="${MONGO_URI}" --db="${dbName}" --collection="${col}" --out="${backupPath}"`;
      logMessage(`Backing up collection: ${col}`);
      execSync(colCmd, { stdio: 'inherit' });
    });
    return backupPath;
  }

  logMessage(`Starting full backup to: ${backupPath}`);
  execSync(cmd, { stdio: 'inherit' });
  return backupPath;
}

function cleanOldBackups(retentionDays) {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

  if (!fs.existsSync(BACKUP_DIR)) return;

  const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });
  let removed = 0;

  entries.forEach((entry) => {
    if (entry.isDirectory() && entry.name.startsWith('backup-')) {
      const fullPath = path.join(BACKUP_DIR, entry.name);
      const stat = fs.statSync(fullPath);
      if (stat.mtimeMs < cutoff) {
        fs.rmSync(fullPath, { recursive: true, force: true });
        logMessage(`Removed old backup: ${entry.name}`);
        removed++;
      }
    }
  });

  if (removed > 0) {
    logMessage(`Cleaned ${removed} backup(s) older than ${retentionDays} days`);
  }
}

/**
 * Verify the most recent backup exists and has content
 */
function verifyLastBackup() {
  if (!fs.existsSync(BACKUP_DIR)) {
    logMessage('❌ No backup directory found');
    return false;
  }

  const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('backup-'))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (entries.length === 0) {
    logMessage('❌ No backups found');
    return false;
  }

  const latest = entries[0];
  const fullPath = path.join(BACKUP_DIR, latest.name);

  // Check that the backup directory contains BSON files
  const bsonFiles = [];
  const scanDir = (dir) => {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    items.forEach((item) => {
      if (item.isDirectory()) scanDir(path.join(dir, item.name));
      if (item.isFile() && item.name.endsWith('.bson')) bsonFiles.push(item.name);
    });
  };
  scanDir(fullPath);

  if (bsonFiles.length === 0) {
    logMessage(`❌ Latest backup (${latest.name}) contains no BSON files`);
    return false;
  }

  const stat = fs.statSync(fullPath);
  const ageDays = Math.round((Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24));

  logMessage(`✅ Latest backup: ${latest.name}`);
  logMessage(`   Collections: ${bsonFiles.length} BSON files`);
  logMessage(`   Age: ${ageDays} day(s)`);

  if (ageDays > 2) {
    logMessage('⚠️  WARNING: Latest backup is more than 2 days old');
  }

  return true;
}

/**
 * Get backup health summary for admin dashboard
 */
function getBackupHealth() {
  const health = {
    lastBackup: null,
    totalBackups: 0,
    oldestBackup: null,
    diskUsageMB: 0,
    healthy: false,
  };

  if (!fs.existsSync(BACKUP_DIR)) return health;

  const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('backup-'))
    .sort((a, b) => b.name.localeCompare(a.name));

  health.totalBackups = entries.length;

  if (entries.length > 0) {
    const latestStat = fs.statSync(path.join(BACKUP_DIR, entries[0].name));
    health.lastBackup = latestStat.mtime.toISOString();

    const oldestStat = fs.statSync(path.join(BACKUP_DIR, entries[entries.length - 1].name));
    health.oldestBackup = oldestStat.mtime.toISOString();

    // Check if latest backup is less than 48 hours old
    health.healthy = (Date.now() - latestStat.mtimeMs) < 48 * 60 * 60 * 1000;
  }

  // Calculate disk usage
  let totalSize = 0;
  const calcSize = (dir) => {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      items.forEach((item) => {
        const full = path.join(dir, item.name);
        if (item.isDirectory()) calcSize(full);
        else totalSize += fs.statSync(full).size;
      });
    } catch { /* skip errors */ }
  };
  calcSize(BACKUP_DIR);
  health.diskUsageMB = Math.round(totalSize / (1024 * 1024));

  return health;
}

/**
 * Run backup as a scheduled cron daemon
 */
async function runScheduled() {
  let cron;
  try {
    cron = require('node-cron');
  } catch {
    logMessage('❌ node-cron not installed. Run: npm install node-cron');
    logMessage('   Falling back to single backup run');
    return false;
  }

  logMessage('Starting backup scheduler (daily at 2:00 AM)');

  cron.schedule('0 2 * * *', () => {
    logMessage('Scheduled backup triggered');
    try {
      const backupPath = runBackup({ collections: null });
      cleanOldBackups(DEFAULT_RETENTION_DAYS);
      logMessage(`Scheduled backup completed: ${backupPath}`);
    } catch (error) {
      logMessage(`❌ Scheduled backup failed: ${error.message}`);
    }
  });

  // Keep the process running
  logMessage('Backup scheduler running. Press Ctrl+C to stop.');
  return true;
}

// ─── Main ──────────────────────────────────────────────────────
(async () => {
  try {
    const options = parseArgs();
    ensureBackupDir();

    console.log('╔══════════════════════════════════════════╗');
    console.log('║  MukonoTalks - Database Backup     ║');
    console.log('╚══════════════════════════════════════════╝');
    logMessage(`Timestamp: ${new Date().toISOString()}`);
    logMessage(`Retention: ${options.retention} days`);

    if (options.verify) {
      verifyLastBackup();
      const health = getBackupHealth();
      logMessage(`Backup Health: ${JSON.stringify(health, null, 2)}`);
      return;
    }

    if (options.schedule) {
      const started = await runScheduled();
      if (!started) {
        // Fallback: run single backup
        const backupPath = runBackup(options);
        cleanOldBackups(options.retention);
        logMessage(`\n✅ Backup completed: ${backupPath}`);
      }
      return;
    }

    const backupPath = runBackup(options);
    cleanOldBackups(options.retention);

    logMessage('\n✅ Backup completed successfully');
    logMessage(`📁 Saved to: ${backupPath}`);
  } catch (error) {
    logMessage(`\n❌ Backup failed: ${error.message}`);
    process.exit(1);
  }
})();

module.exports = { getBackupHealth, verifyLastBackup };

// MukonoTalks

