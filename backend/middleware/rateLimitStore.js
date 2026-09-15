let redisClient = null;
let redisUnavailable = false;

// Fallback en mémoire au cas où Redis dépasse son quota ou est indisponible
const memoryFallback = new Map();

// Nettoyage périodique pour éviter toute accumulation mémoire
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryFallback.entries()) {
    if (entry.resetTime <= now) {
      memoryFallback.delete(key);
    }
  }
}, 60 * 1000).unref();

function memoryIncrement(key, windowMs) {
  const now = Date.now();
  const entry = memoryFallback.get(key);
  if (!entry || entry.resetTime <= now) {
    const resetTime = now + windowMs;
    const newEntry = { totalHits: 1, resetTime };
    memoryFallback.set(key, newEntry);
    return {
      totalHits: 1,
      resetTime: new Date(resetTime),
    };
  }
  entry.totalHits += 1;
  return {
    totalHits: entry.totalHits,
    resetTime: new Date(entry.resetTime),
  };
}

function getRedisClient() {
  if (!process.env.REDIS_URL || redisUnavailable) return null;

  if (!redisClient) {
    try {
      const IORedis = require('ioredis');
      redisClient = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
      });
      redisClient.on('error', (err) => {
        console.warn('⚠️ Rate limit Redis erreur:', err.message);
        if (
          err.message &&
          (err.message.includes('limit exceeded') ||
            err.message.includes('quota') ||
            err.message.includes('free tier limit'))
        ) {
          redisUnavailable = true;
        }
      });
    } catch (err) {
      console.warn('⚠️ Rate limit Redis indisponible — fallback mémoire:', err.message);
      redisUnavailable = true;
      return null;
    }
  }

  return redisClient;
}

class RedisRateLimitStore {
  constructor(prefix) {
    this.prefix = prefix;
    this.windowMs = 60 * 1000;
  }

  init(options) {
    this.windowMs = options.windowMs;
  }

  async increment(key) {
    const redisKey = `${this.prefix}:${key}`;
    const client = getRedisClient();

    if (client) {
      try {
        const totalHits = await client.incr(redisKey);
        let ttlMs = await client.pttl(redisKey);

        if (ttlMs < 0) {
          await client.pexpire(redisKey, this.windowMs);
          ttlMs = this.windowMs;
        }

        return {
          totalHits,
          resetTime: new Date(Date.now() + ttlMs),
        };
      } catch (err) {
        console.warn(
          '⚠️ Erreur Redis RateLimit (quota dépassé ou indisponible), repli immédiat en mémoire:',
          err.message
        );
        redisUnavailable = true;
      }
    }

    return memoryIncrement(redisKey, this.windowMs);
  }

  async decrement(key) {
    const redisKey = `${this.prefix}:${key}`;
    const client = getRedisClient();
    if (client) {
      try {
        await client.decr(redisKey);
        return;
      } catch (err) {
        // Ignorer l'erreur Redis
      }
    }
    const entry = memoryFallback.get(redisKey);
    if (entry && entry.totalHits > 0) {
      entry.totalHits -= 1;
    }
  }

  async resetKey(key) {
    const redisKey = `${this.prefix}:${key}`;
    const client = getRedisClient();
    if (client) {
      try {
        await client.del(redisKey);
        return;
      } catch (err) {
        // Ignorer l'erreur Redis
      }
    }
    memoryFallback.delete(redisKey);
  }
}

function createRateLimitStore(prefix) {
  if (!process.env.REDIS_URL) return undefined;
  return new RedisRateLimitStore(`rl:${prefix}`);
}

module.exports = { createRateLimitStore };
