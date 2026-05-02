import mongoose from "mongoose";
import { DB_URL } from "../config";
import { ApiError } from "../utils/error";
import { logger } from "../utils/logger";

export const connectDatabase = async()=>{
    if(!DB_URL)throw new ApiError('Db url not found in env',500,'server error')
    try{

        const db = await mongoose.connect(DB_URL,{
            dbName:'Posts'
        })
        logger.info('Connection to database success')
        return db
    }catch(e){
        logger.error('Failed to connect with db',e)
    }
}