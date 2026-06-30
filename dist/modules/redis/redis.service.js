"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = exports.REDIS_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
exports.REDIS_CLIENT = 'REDIS_CLIENT';
let RedisService = class RedisService {
    constructor(redis, cfg) {
        this.redis = redis;
        this.cfg = cfg;
        this.defaultTtl = cfg.get('redis.ttl', 3600);
    }
    async get(key) {
        const val = await this.redis.get(key);
        if (!val)
            return null;
        try {
            return JSON.parse(val);
        }
        catch {
            return val;
        }
    }
    async set(key, value, ttl) {
        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttl ?? this.defaultTtl) {
            await this.redis.setex(key, ttl ?? this.defaultTtl, serialized);
        }
        else {
            await this.redis.set(key, serialized);
        }
    }
    async del(...keys) {
        if (keys.length)
            await this.redis.del(...keys);
    }
    async exists(key) {
        return (await this.redis.exists(key)) === 1;
    }
    async ttl(key) {
        return this.redis.ttl(key);
    }
    async incr(key) {
        return this.redis.incr(key);
    }
    async expire(key, seconds) {
        await this.redis.expire(key, seconds);
    }
    async delByPattern(pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length)
            await this.redis.del(...keys);
    }
    async hset(key, field, value) {
        await this.redis.hset(key, field, JSON.stringify(value));
    }
    async hget(key, field) {
        const val = await this.redis.hget(key, field);
        if (!val)
            return null;
        try {
            return JSON.parse(val);
        }
        catch {
            return val;
        }
    }
    async hgetall(key) {
        const raw = await this.redis.hgetall(key);
        if (!raw || !Object.keys(raw).length)
            return null;
        return Object.fromEntries(Object.entries(raw).map(([k, v]) => {
            try {
                return [k, JSON.parse(v)];
            }
            catch {
                return [k, v];
            }
        }));
    }
    async zadd(key, score, member) {
        await this.redis.zadd(key, score, member);
    }
    async zrange(key, start, stop) {
        return this.redis.zrange(key, start, stop);
    }
    async publish(channel, message) {
        await this.redis.publish(channel, JSON.stringify(message));
    }
    async setSession(userId, tokenId, data, ttl = 86400 * 30) {
        await this.set(`session:${userId}:${tokenId}`, data, ttl);
    }
    async getSession(userId, tokenId) {
        return this.get(`session:${userId}:${tokenId}`);
    }
    async invalidateAllSessions(userId) {
        await this.delByPattern(`session:${userId}:*`);
    }
    async setOtp(email, otp, ttl = 600) {
        await this.set(`otp:${email}`, otp, ttl);
    }
    async verifyOtp(email, otp) {
        const stored = await this.get(`otp:${email}`);
        if (stored === otp) {
            await this.del(`otp:${email}`);
            return true;
        }
        return false;
    }
    async rateLimit(key, limit, window) {
        const count = await this.incr(`rl:${key}`);
        if (count === 1)
            await this.expire(`rl:${key}`, window);
        return count <= limit;
    }
    async cacheOrFetch(key, fetcher, ttl) {
        const cached = await this.get(key);
        if (cached !== null)
            return cached;
        const fresh = await fetcher();
        await this.set(key, fresh, ttl);
        return fresh;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.REDIS_CLIENT)),
    __metadata("design:paramtypes", [ioredis_1.default,
        config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map