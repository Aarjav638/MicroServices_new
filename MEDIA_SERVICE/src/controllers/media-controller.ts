import { NextFunction, Request, RequestHandler, Response } from "express";
import { isValidObjectId } from "mongoose";
import { redisClient } from "../middlewares/rate-limiter";
import Media from "../models/Media";
import { deleteCachePattern, getCache, setCache } from "../utils/cache";
import { cloudinaryUtils } from "../utils/cloudinary";
import { ApiError } from "../utils/error";
import { parseQueryArray } from "../utils/validation";


export const publishMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {

    const file = req.file;
    if (!file) {
      throw new ApiError('No File Found, Please Add a file', 400, 'file_not_found')
    }
    const userId = req.user.userId

    const uploadResult = await cloudinaryUtils().uploadMediaToCloudniary(file, `user/${userId}/posts`)

    const media = await new Media({
      file_name: file.originalname,
      publicId: uploadResult.public_id,
      user: userId,
      url: uploadResult.secure_url,
      mime_type: file.mimetype
    }, { user: 0 }).save();
    await deleteCachePattern(`media:${userId}:*`);
    res.status(201).json({
      message: 'Media Created Successfully',
      success: true,
      media: {
        id: media._id,
        file_name: media.file_name,
        publicId: media.publicId,
        url: media.url,
        mime_type: media.mime_type,
        createdAt: media.createdAt
      }
    })
  } catch (e) {
    // logger.error('Error while registering',e)
    // const error = new ApiError('User Registration Failed',500,'Registration_Error')
    next(e)
  }
}

export const getAllMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const cursor = req.query.cursor as string | undefined;

    const query: any = { user: userId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const cacheKey = `media:${userId}:${cursor || "null"}:${limit}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        message: "Media Data fetched successfully",
        success: true,
        medias: cached.medias,
        nextCursor: cached.nextCursor
      });
    }
    const medias = await Media.find(query, { user: 0 })
      .sort({ createdAt: -1 }) // MUST match cursor logic
      .limit(limit + 1);

    let nextCursor = null;

    if (medias.length > limit) {
      const nextItem = medias.pop();
      nextCursor = nextItem?.createdAt;
    }



    setCache(cacheKey, { medias, nextCursor })

    return res.status(200).json({
      message: "Media Data fetched successfully",
      success: true,
      medias,
      nextCursor
    });

  } catch (e) {
    next(e);
  }
};

//Refresh Token
export const getMediaByIds: RequestHandler = async (req, res, next) => {
  try {
    const { mediaIds } = req.query;

    if (!mediaIds) {
      return res.status(400).json({
        message: "Please provide media ids/id",
        success: false,
      });
    }

    const ids = parseQueryArray(mediaIds)

    const cleanedIds = ids.map(id => id.trim()).filter((id) => isValidObjectId(id));

    const cacheKey = `media:${cleanedIds.sort().join(',')}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        message: "Media fetched successfully (cache)",
        success: true,
        media: cached
      });
    }

    const media = await Media.find(
      { _id: { $in: cleanedIds } },
      { user: 0 }
    );


    await setCache(cacheKey, media, 300);

    res.status(200).json({
      message: 'Media fetched successfully',
      success: true,
      media: media || []
    });

  } catch (e) {
    next(e);
  }
};

//Logout

export const deleteMedia: RequestHandler = async (req, res, next) => {
  try {
    const { mediaIds } = req.query
    if (!mediaIds) {
      return res.status(400).json({
        message: "Please provide media ids/id",
        success: false,
      });
    }

    const ids = parseQueryArray(mediaIds)

    const cleanedIds = ids.map(id => id.trim()).filter((id) => isValidObjectId(id));

    const userId = req.user.userId;


    // 1. Fetch all media
    const medias = await Media.find({ _id: { $in: cleanedIds } });


    // 2. Ensure ownership for ALL media
    const unauthorized = medias.some(
      (media) => media.user.toString() !== userId
    );

    if (unauthorized) {
      throw new ApiError("Unauthorized access", 403, "forbidden");
    }

    // 3. Delete from DB
    await Media.deleteMany({ _id: { $in: cleanedIds } });

    // 4. Delete from Cloudinary (parallel)
    await Promise.all(
      medias.map((media) =>
        cloudinaryUtils().deleteMediaFromCloudniary(media.publicId)
      )
    );

    // 5. Cache cleanup
    await deleteCachePattern(`media:${userId}:*`);

    await Promise.all(
      cleanedIds.map((id) => redisClient.del(`media:${id}`))
    );

    res.status(200).json({
      message: "Bulk delete successful",
      success: true,
      deletedCount: cleanedIds.length,
    });
  } catch (e) {
    next(e);
  }
};


