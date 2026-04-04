import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Injectable()
export class RedisService {
  private readonly defaultTtl: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly cfg: ConfigService,
  ) {
    this.defaultTtl = cfg.get<number>('redis.ttl', 3600);
  }

  // ── Basic KV ──────────────────────────────────────────────
  async get<T = string>(key: string): Promise<T | null> {
    const val = await this.redis.get(key);
    if (!val) return null;
    try { return JSON.parse(val) as T; } catch { return val as any; }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttl ?? this.defaultTtl) {
      await this.redis.setex(key, ttl ?? this.defaultTtl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (keys.length) await this.redis.del(...keys);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }

  async incr(key: string): Promise<number> {
    return this.redis.incr(key);
  }

  async expire(key: string, seconds: number): Promise<void> {
    await this.redis.expire(key, seconds);
  }

  // ── Pattern delete ────────────────────────────────────────
  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length) await this.redis.del(...keys);
  }

  // ── Hash ──────────────────────────────────────────────────
  async hset(key: string, field: string, value: any): Promise<void> {
    await this.redis.hset(key, field, JSON.stringify(value));
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    const val = await this.redis.hget(key, field);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val as any; }
  }

  async hgetall<T = Record<string, any>>(key: string): Promise<T | null> {
    const raw = await this.redis.hgetall(key);
    if (!raw || !Object.keys(raw).length) return null;
    return Object.fromEntries(
      Object.entries(raw).map(([k, v]) => {
        try { return [k, JSON.parse(v)]; } catch { return [k, v]; }
      }),
    ) as T;
  }

  // ── Sorted sets (leaderboards, rankings) ─────────────────
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.redis.zadd(key, score, member);
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redis.zrange(key, start, stop);
  }

  // ── Pub/Sub ───────────────────────────────────────────────
  async publish(channel: string, message: any): Promise<void> {
    await this.redis.publish(channel, JSON.stringify(message));
  }

  // ── Session management ────────────────────────────────────
  async setSession(userId: string, tokenId: string, data: any, ttl = 86400 * 30): Promise<void> {
    await this.set(`session:${userId}:${tokenId}`, data, ttl);
  }

  async getSession(userId: string, tokenId: string): Promise<any> {
    return this.get(`session:${userId}:${tokenId}`);
  }

  async invalidateAllSessions(userId: string): Promise<void> {
    await this.delByPattern(`session:${userId}:*`);
  }

  // ── OTP ───────────────────────────────────────────────────
  async setOtp(email: string, otp: string, ttl = 600): Promise<void> {
    await this.set(`otp:${email}`, otp, ttl);
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const stored = await this.get<string>(`otp:${email}`);
    if (stored === otp) { await this.del(`otp:${email}`); return true; }
    return false;
  }

  // ── Rate limiting ─────────────────────────────────────────
  async rateLimit(key: string, limit: number, window: number): Promise<boolean> {
    const count = await this.incr(`rl:${key}`);
    if (count === 1) await this.expire(`rl:${key}`, window);
    return count <= limit;
  }

  // ── Cache helper ──────────────────────────────────────────
  async cacheOrFetch<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  }
}
