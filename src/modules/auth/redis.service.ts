// redis.service.ts
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  async set(key: string, value: string, ttl: number) {
    return this.redis.set(key, value, 'EX', ttl);
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async del(key: string) {
    return this.redis.del(key);
  }

  async incr(key: string) {
    return this.redis.incr(key);
  }

  async expire(key: string, ttl: number) {
    return this.redis.expire(key, ttl);
  }
}
