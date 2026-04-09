const { env } = require('./env');

let redis;

// 🟢 LOCAL DEV → UPSTASH
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  console.log("Using Upstash Redis (REST)");

  const { Redis } = require('@upstash/redis');

  redis = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });


// 🔵 VPS → LOCAL REDIS
} else {
  console.log("Using Local Redis (TCP)");

  const { createClient } = require('redis');

  redis = createClient({
    url: env.REDIS_URL || 'redis://127.0.0.1:6379'
  });

  redis.on('error', (err) => {
    console.error('Redis Error:', err.message);
  });

  (async () => {
    try {
      await redis.connect();
      console.log("Redis connected");
    } catch (err) {
      console.warn("Redis not available, fallback mode");
    }
  })();
}

// Unified cache helpers
const setCache = async (key, value, ttl = 60) => {
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttl });
  } catch {}
};

const getCache = async (key) => {
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

module.exports = { redis, setCache, getCache };