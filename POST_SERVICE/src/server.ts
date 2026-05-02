import cors from 'cors';
import 'dotenv/config';
import Express from 'express';
import helmet from 'helmet';
import { PORT } from './config';
import { connectDatabase } from './db';
import { authMiddleWare } from './middlewares/authenticator';
import { GlobalErrorHandler } from './middlewares/errorHandler';

import { postRouter } from './routes/post-routes';
import { rabbitClient } from './utils/messageQueue';

const server = Express()

server.use(helmet())
server.use(cors({
    origin: '*'
}))

server.use(Express.json())
server.use(Express.urlencoded({ extended: true }))


server.use((req, _res, next) => {
    console.log("HIT:", req.method, req.url, req.body);
    next();
});

server.use('/post', authMiddleWare, postRouter)

const startServer = async () => {
    try {

        await rabbitClient.connect({
            assertOptions: {
                durable: true
            }
        })

        server.listen(PORT, () => {
            console.log("Server is runnign on port:", PORT);
            connectDatabase()
        })

    } catch (error) {
        console.error(error)
        throw error
    }
}

server.use(GlobalErrorHandler)

startServer()




