import cors from 'cors';
import 'dotenv/config';
import Express from 'express';
import helmet from 'helmet';
import { PORT } from './config';
import { connectDatabase } from './db';
import { authMiddleWare } from './middlewares/authenticator';
import { GlobalErrorHandler } from './middlewares/errorHandler';
import { mediaRouter } from './routes/media';
import { logger } from './utils/logger';
import { consumeDeletePostEvent, rabbitClient } from './utils/messageQueue';

const server = Express()

server.use(helmet())
server.use(cors({
    origin: '*'
}))

server.use(Express.json())
server.use(Express.urlencoded({ extended: true }))


server.use((req, _res, next) => {
    console.log("HIT:", req.method, req.url, req.body, req.headers['x-user-id']);
    next();
});

server.use('/media', authMiddleWare, mediaRouter)

const startServer = async () => {
    try {
        await rabbitClient.connect({
            assertOptions: {
                durable: true
            }
        })
        //consume event

        const res = await consumeDeletePostEvent('post.deleted')
        if (res) {
            logger.info(`consumer setup Successfully ${res}`)
        }

        server.listen(PORT, () => {
            console.log("Server is runnign on port:", PORT);
            connectDatabase()
        })
    } catch (error) {
        console.error(error)
        throw error
    }
}

startServer()

server.use(GlobalErrorHandler)




