import cors from 'cors';
import 'dotenv/config';
import Express from 'express';
import helmet from 'helmet';
import { PORT } from './config';
import { connectDatabase } from './db';
import { GlobalErrorHandler } from './middlewares/errorHandler';
import { limitHandler } from './middlewares/rate-limiter';
import { authRouter } from './routes/auth';

const server = Express()

server.use(helmet())
server.use(cors({
    origin: '*'
}))

server.use(Express.json())
server.use(Express.urlencoded({ extended: true }))

server.use(limitHandler)

server.use('/auth', authRouter)


server.use(GlobalErrorHandler)

server.listen(PORT, () => {
    console.log("Server is runnign on port:", PORT);
    connectDatabase()
})




