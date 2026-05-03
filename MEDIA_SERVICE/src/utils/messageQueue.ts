import RabbitMQ from "@aarjavjain/rabbitmq";
import { isValidObjectId } from "mongoose";
import { RABBITMQ_HOST, RABBITMQ_PASSWORD, RABBITMQ_PORT, RABBITMQ_USER } from "../config";
import { redisClient } from "../middlewares/rate-limiter";
import Media from "../models/Media";
import { deleteCachePattern } from "./cache";
import { cloudinaryUtils } from "./cloudinary";
import { ApiError } from "./error";
import { logger } from "./logger";

export const EXCHANGE = 'social_events'
export const MEDIAQUEUE = 'media'

type MediaDeleteEvent = {
    postId: string,
    mediaIds: string[],
    userId: string
}
export const rabbitClient = new RabbitMQ({
    config: {
        hostname: RABBITMQ_HOST || "localhost",
        port: Number(RABBITMQ_PORT || '5672'),
        username: RABBITMQ_USER || "guest",
        password: RABBITMQ_PASSWORD || "guest"
    },
    serviceName: 'Media Service',
    queues: [MEDIAQUEUE],
    exchanges: [EXCHANGE]
})


export const consumeDeletePostEvent = async (routingKey: string) => {
    try {
        const consumerTag = await rabbitClient.consumeEvent<MediaDeleteEvent>(
            MEDIAQUEUE,
            EXCHANGE,
            routingKey,
            async (data) => {
                console.log("📥 EVENT RECEIVED:", data);
                const cleanedIds = data.mediaIds
                    .map(id => id.trim())
                    .filter(id => isValidObjectId(id));

                const userId = data.userId;

                const medias = await Media.find({
                    _id: { $in: cleanedIds }
                });

                const unauthorized = medias.some(
                    media => media.user.toString() !== userId
                );

                if (unauthorized) {
                    throw new ApiError(
                        "Unauthorized access",
                        403,
                        "forbidden"
                    );
                }

                await Media.deleteMany({
                    _id: { $in: cleanedIds }
                });

                await Promise.all(
                    medias.map(media =>
                        cloudinaryUtils().deleteMediaFromCloudniary(
                            media.publicId
                        )
                    )
                );

                await deleteCachePattern(`media:${userId}:*`);

                await Promise.all(
                    cleanedIds.map(id =>
                        redisClient.del(`media:${id}`)
                    )
                );

                logger.info(`Media deleted successfully for postId:${data.postId}`);
            }
        );
        return consumerTag
    } catch (error) {
        logger.error("Failed to start consumer");
        throw error;
    }
};
