import { RequestHandler, Router } from "express";
import multer from "multer";
import { deleteMedia, getAllMedia, getMediaByIds, publishMedia } from "../controllers/media-controller";
import { asyncHandler } from "../middlewares/errorHandler";
import { sensitiveRateLimit } from "../middlewares/rate-limiter";
import { ApiError } from "../utils/error";

const mediaRouter = Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // max 5Mb file can be uploaded
    }
}).single('file')

console.log("Media ROUTES LOADED");
export const uploadMiddleware: RequestHandler = (req, res, next) => {
    upload(req, res, (err: any) => {
        if (err) {
            // Multer-specific errors
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(
                        new ApiError('File too large', 400, 'file_too_large')
                    )
                }

                return next(
                    new ApiError(err.message, 400, 'multer_error')
                )
            }

            // Unknown errors
            return next(
                new ApiError(err.message || 'Upload failed', 500, 'upload_error')
            )
        }
        if (!req.file) {
            return next(
                new ApiError('Upload failed, No file found', 400, 'upload_error')
            )
        }

        next()
    })
}

mediaRouter.post('/publish', sensitiveRateLimit(), uploadMiddleware, asyncHandler(publishMedia))

mediaRouter.get('/mediaIds', sensitiveRateLimit(100), asyncHandler(getMediaByIds))
mediaRouter.get('/', sensitiveRateLimit(100), asyncHandler(getAllMedia))




mediaRouter.delete('/delete', sensitiveRateLimit(), asyncHandler(deleteMedia))


export { mediaRouter };

