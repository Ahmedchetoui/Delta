let redisClient = null;
let redisUnavailable = false;

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
    const client = getRedisClient();
    const redisKey = `${this.prefix}:${key}`;
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
  }

  async decrement(key) {
    const client = getRedisClient();
    if (!client) return;
    await client.decr(`${this.prefix}:${key}`);
  }

  async resetKey(key) {
    const client = getRedisClient();
    if (!client) return;
    await client.del(`${this.prefix}:${key}`);
  }
}

function createRateLimitStore(prefix) {
  if (!process.env.REDIS_URL) return undefined;
  return new RedisRateLimitStore(`rl:${prefix}`);
}

module.exports = { createRateLimitStore };
