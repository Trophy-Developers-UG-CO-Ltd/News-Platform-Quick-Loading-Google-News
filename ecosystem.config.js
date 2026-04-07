/**
 * PM2 Ecosystem Configuration
 * Production process manager for MukonoTalks
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js  (zero-downtime restart)
 *
 * @see SCALABILITY.md for full deployment guide
 */

module.exports = {
  apps: [
    {
      name: 'mukonotalks-api',
      script: './server/src/server.js',
      cwd: __dirname,

      // Cluster mode — utilize all CPU cores
      instances: process.env.CLUSTER_WORKERS || 'max',
      exec_mode: 'cluster',

      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,

      // Memory threshold — restart if exceeds 512MB
      max_memory_restart: '512M',

      // Watch (development only; disable in production)
      watch: false,

      // Logging
      log_file: './logs/combined.log',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 30000,
      listen_timeout: 10000,
      shutdown_with_message: true,

      // Environment variables
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
    },
  ],
};

// MukonoTalks

