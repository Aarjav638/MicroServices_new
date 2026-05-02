import { NextFunction, Request, RequestHandler, Response } from "express";
import mongoose from "mongoose";
import { redisClient } from "../middlewares/rate-limiter";
import Post from "../models/Post";
import { deleteCachePattern, getCache, setCache } from "../utils/cache";
import { ApiError } from "../utils/error";
import { logger } from "../utils/logger";
import { Media, mediaClient } from "../utils/mediaHelper";
import { PostCreateEvent, PostUpdateEvent, publishPostEvent } from "../utils/messageQueue";
import { validatePostBody, validateUpdatePostBody } from "../utils/validation";


export const publishPostController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, mediaIds } = validatePostBody(req.body)

    const userId = req.user.userId

    const post = await new Post({
      content,
      mediaIds: mediaIds || [],
      user: userId
    }, { user: 0 }).save();
    const published = await publishPostEvent<PostCreateEvent>('post.created', { postId: post._id.toString(), userId, content })
    logger.info(`Event Published success:${published}`)
    await deleteCachePattern(`posts:${userId}:*`);
    res.status(201).json({
      message: 'Post Created Successfully',
      success: true,
      post
    })
  } catch (e) {
    // logger.error('Error while registering',e)
    // const error = new ApiError('User Registration Failed',500,'Registration_Error')
    next(e)
  }
}

export const getAllPost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

    const cursor = req.query.cursor as string | undefined;

    const query: any = { user: userId };

    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const cacheKey = `posts:${userId}:${cursor || "null"}:${limit}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        message: "Posts fetched successfully (cache)",
        success: true,
        posts: cached.posts,
        nextCursor: cached.nextCursor
      });
    }
    const posts = await Post.find(query, { user: 0 })
      .sort({ createdAt: -1 }) // MUST match cursor logic
      .limit(limit + 1);
    const hasNextPage = posts.length > limit
    const paginatedPost = posts.slice(0, limit)
    const allMediaIds = paginatedPost.flatMap(p => p.mediaIds).filter(Boolean);
    let allMedias: Media[] = [];

    if (allMediaIds.length > 0) {
      allMedias = await mediaClient.getMediasByIds(allMediaIds.join(','), userId);
    }
    const mediaMap = new Map(allMedias.map(m => [m._id, m]));
    const hydratedPostsWithMediaUrl = paginatedPost.map((post) => {
      const postMedias = post.mediaIds.filter(Boolean).map(id => mediaMap.get(id)).filter((m): m is Media => Boolean(m));
      return ({
        ...post.toObject(),
        media: postMedias
      })
    })

    const nextCursor = hasNextPage
      ? paginatedPost[paginatedPost.length - 1]?.createdAt
      : null;



    setCache(cacheKey, { posts: hydratedPostsWithMediaUrl, nextCursor })

    return res.status(200).json({
      message: "Posts fetched successfully",
      success: true,
      posts: hydratedPostsWithMediaUrl,
      nextCursor
    });

  } catch (e) {
    next(e);
  }
};

//Refresh Token
export const getPostById: RequestHandler = async (req, res, next) => {
  try {

    const postId = req.params.postId
    const userId = req.user.userId

    const cacheKey = `post:${postId}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({
        message: "Post fetched successfully (cache)",
        success: true,
        post: cached.post
      });
    }

    const post = await Post.findById(postId, { user: 0 })
    if (!post) {
      throw new ApiError('Post not found', 404, 'Not_found')
    }
    let postMedias: Media[] = []
    if (post.mediaIds.length > 0) {
      postMedias = await mediaClient.getMediasByIds(post.mediaIds.filter(Boolean).join(','), userId)
    }
    const hydratedPost = {
      ...post.toObject(),
      media: postMedias
    }
    await setCache(cacheKey, { post: hydratedPost }, 300);
    res.status(200).json({
      message: 'Token Refreshed Successfully',
      success: true,
      post: hydratedPost
    })
  } catch (e) {
    next(e)
  }
}

//Logout

export const deletePost: RequestHandler = async (req, res, next) => {
  try {
    const postId = req.params.postId
    const userId = req.user.userId

    const post = await Post.findById(postId)
    if (!post) {
      throw new ApiError('Post not found', 404, 'Not_found')
    }
    if (post.user.toString() !== userId) {
      throw new ApiError('Unauthorize Access', 403, 'forbidden')
    }
    await Post.findByIdAndDelete(postId)

    if (post.mediaIds.length > 0) {
      const published = await publishPostEvent('post.deleted', {
        postId: post._id.toString(),
        mediaIds: post.mediaIds.filter(Boolean),
        userId
      })
      logger.info(`Event Published success:${published}`)
    }
    await deleteCachePattern(`posts:${post.user}:*`);
    await redisClient.del(`post:${postId}`);
    res.status(200).json({
      message: 'Delete successful',
      success: true
    })
  } catch (e) {
    next(e)
  }
}
export const updatePost = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { content, mediaIds, postId } = validateUpdatePostBody(req.body)
    const userId = req.user.userId


    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new ApiError("Invalid post id", 400, "INVALID_ID");
    }

    const post = await Post.findById(postId)

    if (!post) {
      throw new ApiError('Post not found', 404, 'Not_found')
    }

    // Optional: ensure user owns the post
    if (post.user.toString() !== userId) {
      throw new ApiError('Unauthorized', 403, 'Forbidden')
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      {
        content: content || post.content,
        mediaIds: mediaIds || post.mediaIds
      },
      { new: true }
    )
    const published = await publishPostEvent<PostUpdateEvent>('post.updated', { content: content || post.content, postId })
    logger.info(`Event Published success:${published}`)
    // 🔥 invalidate caches
    await deleteCachePattern(`posts:${userId}:*`);
    await redisClient.del(`post:${postId}`);

    res.status(200).json({
      message: 'Post updated Successfully',
      success: true,
      post: updatedPost
    })
  } catch (e) {
    next(e)
  }
}


