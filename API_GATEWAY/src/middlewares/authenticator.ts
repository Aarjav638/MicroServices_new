import { NextFunction, Request, Response } from "express";
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import { JWT_SECRET } from "../config";
import { ApiError } from "../utils/error";
import { logger } from "../utils/logger";

export const authMiddleWare = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    // if (req.headers['x-internal-call']) {
    //   const userId = req.headers['x-user-id'];

    //   if (!userId || typeof userId !== "string") {
    //     throw new ApiError("missing user id", 401, "auth_error");
    //   }

    //   req.user = { userId };
    //   return next();
    // }
    if (!JWT_SECRET) {
      logger.error('JWT secret not found in env')
      throw new ApiError('internal serval error', 500, 'server_error')
    };
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]
    if (!token) throw new ApiError('unauthenticated', 401, 'auth_error');
    const decoded = jwt.verify(token, JWT_SECRET);


    req.user = decoded as any;

    next();

  } catch (e) {
    if (e instanceof TokenExpiredError) {
      return next(
        new ApiError("token expired", 401, "token_expired")
      );
    }

    // invalid token
    if (e instanceof Error && e.name === "JsonWebTokenError") {
      return next(
        new ApiError("invalid token", 401, "invalid_token")
      );
    }
    next(e);
  }
};