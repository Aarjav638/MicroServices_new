import { Router } from "express";
import { deletePost, getAllPost, getPostById, publishPostController, updatePost } from "../controllers/post-controller";
import { asyncHandler } from "../middlewares/errorHandler";
import { sensitiveRateLimit } from "../middlewares/rate-limiter";

const postRouter = Router()

console.log("POST ROUTES LOADED");

postRouter.post('/publish',sensitiveRateLimit(),asyncHandler(publishPostController))

postRouter.get('/',sensitiveRateLimit(100),asyncHandler(getAllPost))

postRouter.get('/:postId',sensitiveRateLimit(100),asyncHandler(getPostById))

postRouter.put('/update',sensitiveRateLimit(),asyncHandler(updatePost))


postRouter.delete('/delete/:postId',sensitiveRateLimit(),asyncHandler(deletePost))


export { postRouter };

