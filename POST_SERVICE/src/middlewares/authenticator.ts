import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/error";


export const authMiddleWare = (req: Request, _res: Response, next: NextFunction) => {
    try {
        const userId = req.header('x-user-id');
        if (!userId) throw new ApiError('unauthenticated', 401, 'auth_error');

        req.user = { userId };
        next();

    } catch (e) {
        next(e);
    }
};