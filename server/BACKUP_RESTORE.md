# Database Backup & Restore Protocol

## MukonoTalks — Enterprise Data Recovery Guide

---

## Backup Strategy

| Property | Value |
|---|---|
| **Frequency** | Daily at 2:00 AM SAST |
| **Retention** | 14 days (configurable via `--retention` flag) |
| **Method** | `mongodump` full database export |
| **Format** | BSON binary files (native MongoDB format) |
| **Storage** | `server/backups/` directory |
| **Monitoring** | Health check via `GET /api/admin/backup-health` |

---

## Running Backups

### Manual Backup
```bash
cd server
node scripts/backup.js
```

### Backup Specific Collections
```bash
node scripts/backup.js --collections orders,users,products
```

### Custom Retention Period
```bash
node scripts/backup.js --retention 30
```

### Verify Last Backup
```bash
node scripts/backup.js --verify
```

### Start Scheduled Daemon
```bash
# Requires: npm install node-cron
node scripts/backup.js --schedule
```

### PM2 Scheduled Backup (Recommended for Production)
Add to `ecosystem.config.js`:
```javascript
{
  name: 'backup-scheduler',
  script: 'scripts/backup.js',
  args: '--schedule',
  instances: 1,
  autorestart: true,
}
```

---

## Restore Procedure

### Prerequisites
- `mongorestore` CLI tool installed (MongoDB Database Tools)
- Target MongoDB instance running and accessible
- Sufficient disk space for restore operation

### Step 1: Identify Backup to Restore
```bash
# List available backups
ls server/backups/
# Output: backup-2024-01-15T02-00-00  backup-2024-01-14T02-00-00  ...
```

### Step 2: Stop Application Servers
```bash
pm2 stop all
# Or: docker-compose stop server
```

### Step 3: Restore Database

**Full Restore (replaces all data):**
```bash
mongorestore --uri="mongodb://localhost:27017/mukonotalks" \
  --drop \
  server/backups/backup-2024-01-15T02-00-00/mukonotalks/
```

**Restore Specific Collection:**
```bash
mongorestore --uri="mongodb://localhost:27017/mukonotalks" \
  --drop \
  --collection=orders \
  server/backups/backup-2024-01-15T02-00-00/mukonotalks/orders.bson
```

**Restore to Different Database (for testing):**
```bash
mongorestore --uri="mongodb://localhost:27017/mukonotalks_restore" \
  server/backups/backup-2024-01-15T02-00-00/mukonotalks/
```

### Step 4: Verify Restored Data
```bash
# Connect to MongoDB and check counts
mongosh "mongodb://localhost:27017/mukonotalks" --eval "
  db.getCollectionNames().forEach(c => {
    print(c + ': ' + db[c].countDocuments());
  });
"
```

### Step 5: Restart Application
```bash
pm2 restart all
# Or: docker-compose up -d server
```

### Step 6: Verify Application
1. Open the application in browser
2. Check admin dashboard for data integrity
3. Verify recent orders and inquiries
4. Check audit logs for any anomalies

---

## Monitoring & Alerts

### Backup Health API
```bash
curl http://localhost:5000/api/admin/backup-health \
  -H "Cookie: token=YOUR_ADMIN_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "lastBackup": "2024-01-15T00:00:00.000Z",
    "totalBackups": 14,
    "oldestBackup": "2024-01-01T00:00:00.000Z",
    "diskUsageMB": 256,
    "healthy": true
  }
}
```

### Health Criteria
- **Healthy**: Last backup is less than 48 hours old
- **Warning**: Last backup is 2-7 days old
- **Critical**: No backup in 7+ days

### Integration with External Monitoring
The `/api/admin/backup-health` endpoint can be polled by:
- Uptime monitoring services (UptimeRobot, Pingdom)
- Custom alerting scripts
- Grafana / Prometheus dashboards

---

## Disaster Recovery Scenarios

### Scenario 1: Corrupted Database
1. Stop application
2. Drop corrupted database: `mongosh --eval "use mukonotalks; db.dropDatabase()"`
3. Restore from latest backup
4. Restart application

### Scenario 2: Accidental Data Deletion
1. Identify the backup before deletion occurred
2. Restore specific collection(s) to a temporary database
3. Export needed documents from temporary database
4. Import into production database
5. Drop temporary database

### Scenario 3: Server Migration
1. Take fresh backup on old server
2. Transfer backup files to new server
3. Restore on new server
4. Update DNS / load balancer
5. Verify application functionality

---

## Security Notes

- Backup files contain sensitive data — restrict directory permissions
- Never store backups in publicly accessible locations
- Consider encrypting backups at rest in production
- Rotate backup access credentials regularly
- Test restore procedure quarterly

---

*MukonoTalks*

