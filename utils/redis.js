import { createClient } from 'redis';
/* eslint-disable class-methods-use-this */

class RedisClient {
  constructor() {
    this.client = createClient();

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.client.connect().catch((err) => {
      console.error('Failed to connect to Redis:', err);
    });
  }

  isAlive() {
    return this.client.isReady;
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value;
    } catch (err) {
      console.error('Failed to get key from Redis:', err);
      return null;
    }
  }

  async set(key, value, duration) {
    try {
      await this.client.setEx(key, duration, value); // Redis v4+ setEx method for expiration
    } catch (err) {
      console.error('Failed to set key in Redis:', err);
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (err) {
      console.error('Failed to delete key from Redis:', err);
    }
  }
}

const redisClient = new RedisClient();
export default redisClient;
