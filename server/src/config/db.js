/**
 * MongoDB connection configuration
 * Handles database connection with retry logic
 * @module config/db
 */

const mongoose = require('mongoose');
const { env } = require('./env');
const logger = require('../utils/logger');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(env.MONGO_URI, {
        autoIndex: env.NODE_ENV !== 'production',
        maxPoolSize: env.MONGO_POOL_SIZE || 100,
        minPoolSize: env.MONGO_MIN_POOL || 5,
        serverSelectionTimeoutMS: env.MONGO_SERVER_SELECTION_TIMEOUT || 10000,
        socketTimeoutMS: 45000,
        maxIdleTimeMS: 30000,
      });

      logger.info(`MongoDB connected: ${conn.connection.host} (pool: ${env.MONGO_POOL_SIZE || 100})`);
      return;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
      if (attempt === MAX_RETRIES) {
        logger.error('All MongoDB connection attempts exhausted. Exiting.');
        process.exit(1);
      }
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      logger.info(`Retrying in ${delay / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

module.exports = connectDB;

// MukonoTalks

