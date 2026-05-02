import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/error";
import { logger } from "../utils/logger";


export const authMiddleWare = (req: Request, _res: Response, next: NextFunction) => {
    try {
        const userId = req.header('x-user-id');
        console.log('useId', userId)
        if (!userId) throw new ApiError('unauthenticated', 401, 'auth_error');

        req.user = { userId };
        logger.info(req.user)
        next();

    } catch (e) {
        next(e);
    }
};