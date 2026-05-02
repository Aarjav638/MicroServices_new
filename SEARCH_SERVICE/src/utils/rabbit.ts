import RabbitMQ from "@aarjavjain/rabbitmq";
import { isValidObjectId } from "mongoose";
import Search, { ISearch } from "../models/SearchSchema";
import { ApiError } from "./error";
import { logger } from "./logger";
import { validateSearchBody } from "./validation";

export const EXCHANGE = 'social_events'
export const CREATE_QUEUE = "search.create"
export const DELETE_QUEUE = "search.delete"
export const UPDATE_QUEUE = "search.update"



export const rabbitClient = new RabbitMQ({
    config: {
        hostname: "localhost",
        port: 5672,
        username: "guest",
        password: "guest"
    },
    exchanges: [EXCHANGE],
    queues: [CREATE_QUEUE, DELETE_QUEUE, UPDATE_QUEUE],
    serviceName: 'Search Service'
})

export const saveSearchData = async (routingKey: string) => {
    try {
        const tag = await rabbitClient.consumeEvent<ISearch>(CREATE_QUEUE, EXCHANGE, routingKey, async (data) => {
            logger.info(`EVENT RECIEVED:${JSON.stringify(data)}`)
            const { content, postId, userId } = validateSearchBody(data)
            const search = new Search({
                content,
                userId,
                postId
            })
            await search.save()
            logger.info('Search record Created')
        })
        return tag
    } catch (error) {
        logger.error(`error saving search data ${error}`)
        throw error
    }
}

export const deleteSearchData = async (routingKey: string) => {
    try {
        const tag = await rabbitClient.consumeEvent<{ postId: string, userId: string }>(DELETE_QUEUE, EXCHANGE, routingKey, async (data) => {
            logger.info(`EVENT RECIEVED:${JSON.stringify(data)}`)
            const { postId, userId } = data
            if (!postId) {
                throw new ApiError('PostId missing cannot delete search record', 422, 'invalid_request_body')
            }
            if (!userId) {
                throw new ApiError('userId missing cannot delete search record', 422, 'invalid_request_body')
            }
            const isValidPostId = isValidObjectId(postId)
            const isValidUserId = isValidObjectId(userId)
            if (!isValidPostId) {
                throw new ApiError('PostId is not a valid post id', 422, 'invalid_id')
            }
            if (!isValidUserId) {
                throw new ApiError('userId is not a valid id', 422, 'invalid_id')
            }
            const result = await Search.findOneAndDelete({ postId: postId })
            logger.info(`Search record deleted ${result}`)
        })
        return tag
    } catch (error) {
        logger.error(`error saving search data ${error}`)
        throw error
    }
}


export const updateSearchData = async (routingKey: string) => {
    try {
        const tag = await rabbitClient.consumeEvent<{ postId: string, content: string }>(UPDATE_QUEUE, EXCHANGE, routingKey, async (data) => {
            logger.info(`EVENT RECIEVED:${JSON.stringify(data)}`)
            const { postId, content } = data
            if (!postId) {
                throw new ApiError('PostId missing cannot delete search record', 422, 'invalid_request_body')
            }
            if (!content) {
                throw new ApiError('content missing cannot update search record', 422, 'invalid_request_body')
            }
            const isValidId = isValidObjectId(postId)
            if (!isValidId) {
                throw new ApiError('PostId is not a valid post id', 422, 'invalid_id')
            }
            await Search.updateOne({ postId: postId }, {
                $set: {
                    content: content
                }
            })
            logger.info('Search records updated')
        })
        return tag
    } catch (error) {
        logger.error(`error saving search data ${error}`)
        throw error
    }
}