import winston from "winston";
import { NODE_ENV } from "../config";

const APPENV = NODE_ENV

const logger = winston.createLogger({
    level:APPENV==='production'?'info':'debug',
    format:winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({stack:true}),
        winston.format.splat(),
        winston.format.json()
    ),
    defaultMeta:{
        service:"Gateway-Service"
    },
    transports:[
        new winston.transports.Console(
           { format:winston.format.combine(
                winston.format.colorize(),
                winston.format.simple() 
            )}
        ),
        new winston.transports.File({
            filename:'error.log',
            level:"error"
        }),
        new winston.transports.File({filename:'combined.log'})
    ]
})
 
export { logger };

