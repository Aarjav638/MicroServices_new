import cors from 'cors';
import 'dotenv/config';
import Express from 'express';
import helmet from 'helmet';
import { PORT } from './config';
import { connectDatabase } from './db';
import { GlobalErrorHandler } from './middlewares/errorHandler';
import { searchRouter } from './routes/search';
import { logger } from './utils/logger';
import { deleteSearchData, rabbitClient, saveSearchData, updateSearchData } from './utils/rabbit';

const server = Express()

server.use(helmet())
server.use(cors({
    origin: '*'
}))

server.use(Express.json())
server.use(Express.urlencoded({ extended: true }))

server.use((req, _res, next) => {
    console.log("HIT:", req.method, req.url, req.query.query);
    next();
});

server.use('/search', searchRouter)

const startServer = async () => {
    await rabbitClient.connect({
        assertOptions: {
            durable: true
        }
    })

    //consume event

    const delRes = await deleteSearchData('post.deleted')
    if (delRes) {
        logger.info(`delete consumer setup Successfully ${delRes}`)
    }
    const saveRes = await saveSearchData('post.created')
    if (saveRes) {
        logger.info(`save consumer setup Successfully ${saveRes}`)
    }
    const updateRes = await updateSearchData('post.updated')
    if (updateRes) {
        logger.info(`update consumer setup Successfully ${updateRes}`)
    }
    server.listen(PORT, () => {
        console.log("Server is runnign on port:", PORT);
        connectDatabase()
    })

}
startServer()
server.use(GlobalErrorHandler)





