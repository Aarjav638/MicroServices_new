import Joi from "joi";
import { IPost } from "../models/Post";
import { ApiError } from "./error";

export const validatePostBody = (data:unknown):Omit<IPost,'user'>=>{

    const schema = Joi.object<Omit<IPost,'user'>>({
        content:Joi.string().max(200).required(),
        mediaIds:Joi.array().items(Joi.string()).optional(),
    })

    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        throw new ApiError(
            error.details.map(e => e.message).join(", "),
            422,
            "ValidationError"
        );
    }

    return value;
}

export const validateUpdatePostBody = (data:unknown):Omit<IPost,'user'>&{postId:string}=>{

    const schema = Joi.object<Omit<IPost,'user'>&{postId:string}>({
        content:Joi.string().max(200).optional(),
        mediaIds:Joi.array().items(Joi.string()).optional(),
        postId:Joi.string().required(),
    })

    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });

    if (error) {
        throw new ApiError(
            error.details.map(e => e.message).join(", "),
            422,
            "ValidationError"
        );
    }

    return value;
}

