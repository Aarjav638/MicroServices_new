import { Router } from "express";
import { loginUser, logoutUser, refreshTokenController, registerUser } from "../controllers/user-controller";
import { asyncHandler } from "../middlewares/errorHandler";
import { sensitiveRateLimit } from "../middlewares/rate-limiter";

const authRouter = Router()

console.log("AUTH ROUTES LOADED");

authRouter.post('/register',sensitiveRateLimit,asyncHandler(registerUser))

authRouter.post('/login',sensitiveRateLimit,asyncHandler(loginUser))

authRouter.post('/refreshToken',sensitiveRateLimit,asyncHandler(refreshTokenController))


authRouter.post('/logout',sensitiveRateLimit,asyncHandler(logoutUser))


export { authRouter };

