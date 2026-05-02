import { NextFunction, Request, RequestHandler, Response } from "express";
import { ApiError } from "../utils/error";
import { logger } from "../utils/logger";

const GlobalErrorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    let error: ApiError
    if (err instanceof ApiError) {
        error = err
    } else if (err instanceof Error) {
        error = new ApiError(err.message, 500, err.name)
    }
    else {
        error = new ApiError('Internal Server Error', 500, 'Internal Error')
    }

    logger.error({
    message: error.message,
    stack: error.stack,
    name: error.name
});
    res.status(error.status_code || 500).json({
        message: error.message || 'Internal Server Error',
        name: error.name || 'Api Error'
    })
}

const asyncHandler = (fn: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
};

export { asyncHandler, GlobalErrorHandler };

