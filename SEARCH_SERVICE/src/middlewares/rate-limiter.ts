import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import Redis from 'ioredis'
import RedisStore from 'rate-limit-redis'
import { ApiError } from '../utils/error'
import { logger } from '../utils/logger'


export const redisClient = new Redis()

redisClient.on('error', (err) => {
    logger.error('Redis error', err);
});


const redisStore = new RedisStore({
    sendCommand: (...args: any[]) => (redisClient.call as any).apply(redisClient, args) as Promise<any>,
})

const sensitiveRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    legacyHeaders: false,
    standardHeaders: true,
    keyGenerator: (req) => {
        const ip =
            (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
            req.socket.remoteAddress ||
            req.ip;


        return `${ipKeyGenerator(ip || '')}:${req.baseUrl}${req.path}`;
    },
    handler: (req, _res, next) => {
        logger.warn(`Sensitive endpoint rate limit exceeds for IP: ${req.ip}`)
        const err = new ApiError('Too many requests', 429, 'limit-exceeded'
        )
        next(err)
    },
    store: redisStore


})

export { sensitiveRateLimit }

