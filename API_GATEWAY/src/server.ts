import cors from 'cors';
import 'dotenv/config';
import Express from 'express';
import proxy, { ProxyOptions } from 'express-http-proxy';
import helmet from 'helmet';
import { AUTH_SERVICE_URL, MEDIA_SERVICE_URL, PORT, POST_SERVICE_URL, SEARCH_SERVICE_URL } from './config';
import { authMiddleWare } from './middlewares/authenticator';
import { GlobalErrorHandler } from './middlewares/errorHandler';
import { rateLimitter } from './middlewares/rate-limiter';
import { ApiError } from './utils/error';
import { logger } from './utils/logger';
const server = Express()

server.use(helmet())
server.use(cors({
    origin: '*'
}))

server.use(Express.json())
server.use(Express.urlencoded({ extended: true }))

const baseProxyOptions: ProxyOptions = {
    proxyReqPathResolver(req) {
        const path = req.originalUrl.replace(/^\/v1/, '')
        return path
    },

    proxyErrorHandler(err, _res, next) {
        logger.error(`Proxy error: ${err.message}`);
        next(new ApiError('Internal Server Error', 500, 'ProxyError'))
    },
    timeout: 10000
}


if (!AUTH_SERVICE_URL) {
    throw new ApiError('Auth Service not found', 500, 'ServiceNotFoundError')
}

server.use('/v1/auth', rateLimitter(), proxy(AUTH_SERVICE_URL, {
    ...baseProxyOptions,
    parseReqBody: true,
    proxyReqOptDecorator(proxyReqOpts, req) {
        proxyReqOpts.headers['content-type'] = proxyReqOpts.headers['content-type'] || 'application/json'
        proxyReqOpts.headers['x-forwarded-for'] =
            proxyReqOpts.headers['x-forwarded-for'] || req.ip;

        proxyReqOpts.headers['x-real-ip'] = req.ip;
        return proxyReqOpts
    },
    userResDecorator(proxyRes, proxyResData) {
        logger.info(`Data recieved from AuthService with status:${proxyRes.statusCode}`)
        return proxyResData
    },

}))


if (!POST_SERVICE_URL) {
    throw new ApiError('Post Service not found', 500, 'ServiceNotFoundError')
}
server.use('/v1/post', rateLimitter(100), authMiddleWare, proxy(POST_SERVICE_URL, {
    ...baseProxyOptions,
    parseReqBody: true,
    proxyReqOptDecorator(proxyReqOpts, req) {
        proxyReqOpts.headers['content-type'] = proxyReqOpts.headers['content-type'] || 'application/json'
        proxyReqOpts.headers['x-forwarded-for'] =
            proxyReqOpts.headers['x-forwarded-for'] || req.ip;

        proxyReqOpts.headers['x-real-ip'] = req.ip;
        // logger.info('userId',req.user?.userId)
        proxyReqOpts.headers['x-user-id'] = req.user?.userId;

        return proxyReqOpts
    },
    userResDecorator(proxyRes, proxyResData) {
        logger.info(`Data recieved from PostService with status:${proxyRes.statusCode}`)
        return proxyResData
    },

}))

if (!MEDIA_SERVICE_URL) {
    throw new ApiError('Media Service not found', 500, 'ServiceNotFoundError')
}
server.use('/v1/media', rateLimitter(100), authMiddleWare, proxy(MEDIA_SERVICE_URL, {
    ...baseProxyOptions,
    proxyReqOptDecorator(proxyReqOpts, req) {
        proxyReqOpts.headers['content-type'] = proxyReqOpts.headers['content-type'] || 'application/json'
        proxyReqOpts.headers['x-forwarded-for'] =
            proxyReqOpts.headers['x-forwarded-for'] || req.ip;
        proxyReqOpts.headers['x-real-ip'] = req.ip;
        proxyReqOpts.headers['x-user-id'] = req.user?.userId;

        return proxyReqOpts
    },
    userResDecorator(proxyRes, proxyResData) {
        logger.info(`Data recieved from MediaService with status:${proxyRes.statusCode}`)
        return proxyResData
    },

}))

if (!SEARCH_SERVICE_URL) {
    throw new ApiError('Search Service not found', 500, 'ServiceNotFoundError')
}
server.use('/v1/search', rateLimitter(100), proxy(SEARCH_SERVICE_URL, {
    ...baseProxyOptions,
    proxyReqOptDecorator(proxyReqOpts, req) {
        proxyReqOpts.headers['content-type'] = proxyReqOpts.headers['content-type'] || 'application/json'
        proxyReqOpts.headers['x-forwarded-for'] =
            proxyReqOpts.headers['x-forwarded-for'] || req.ip;
        proxyReqOpts.headers['x-real-ip'] = req.ip;

        return proxyReqOpts
    },
    userResDecorator(proxyRes, proxyResData) {
        logger.info(`Data recieved from SearchService with status:${proxyRes.statusCode}`)
        return proxyResData
    },

}))




server.use(GlobalErrorHandler)

server.listen(PORT, () => {
    console.log("Server is runnign on port:", PORT);
    logger.info(`Auth service runnign on host:${AUTH_SERVICE_URL}`)
    logger.info(`Post service runnign on host:${POST_SERVICE_URL}`)
    logger.info(`Media service runnign on host:${MEDIA_SERVICE_URL}`)
    logger.info(`Search service runnign on host:${SEARCH_SERVICE_URL}`)

})




