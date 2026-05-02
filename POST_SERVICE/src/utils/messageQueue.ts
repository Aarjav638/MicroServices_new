import RabbitMQ from "@aarjavjain/rabbitmq";
import { logger } from "./logger";

export type MediaDeleteEvent = {
    postId: string,
    mediaIds: string[],
    userId: string
}
export type PostDeleteEvent = {
    postId: string,
}
export type PostCreateEvent = {
    postId: string;
    content: string;
    userId: string;
}
export type PostUpdateEvent = {
    postId: string;
    content: string;
}
export type RoutingKey = 'post.created' | 'post.deleted' | 'post.updated'
export const EXCHANGE = 'social_events'
export const MEDIAQUEUE = 'media'
export const rabbitClient = new RabbitMQ({
    config: {
        hostname: 'localhost',
        username: 'guest',
        password: 'guest',
        port: 5672
    },
    serviceName: 'Post Service',
    queues: [MEDIAQUEUE],
    exchanges: [EXCHANGE]
})


export const publishPostEvent = async <T>(routingKey: RoutingKey, payload: T) => {
    try {
        console.log("📤 PUBLISHING PAYLOAD:", payload);
        const result = await rabbitClient.publishEvent<T>(
            EXCHANGE,
            routingKey,
            payload,
            { exchangeType: 'topic', exchangeAssertOptions: { durable: true }, publishOptions: { persistent: true } }
        );
        console.log("📤 PUBLISH RESULT:", result);
        return result
    } catch (error) {
        logger.error(`Failed to start publisher`);
        throw error;
    }
};
