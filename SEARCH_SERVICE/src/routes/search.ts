import { Router } from "express";
import { searchHandler } from "../controllers/search-controller";
import { asyncHandler } from "../middlewares/errorHandler";
import { sensitiveRateLimit } from "../middlewares/rate-limiter";

const searchRouter = Router()

console.log("SEARCH ROUTES LOADED");

searchRouter.get('/', sensitiveRateLimit, asyncHandler(searchHandler))

export { searchRouter };

