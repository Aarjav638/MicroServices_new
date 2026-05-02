import Joi from "joi";
import { ISearch } from "../models/SearchSchema";
import { ApiError } from "./error";

export const validateSearchBody = (data: unknown): ISearch => {

    const schema = Joi.object<ISearch>({
        content: Joi.string().trim().required().messages({
            "any.required": "content is required in event payload.",
            "string.empty": "content cannot be empty."
        }),
        userId: Joi.string().required().messages({
            "any.required": "userId is required in event payload.",
            "string.empty": "userId cannot be empty."
        }),
        postId: Joi.string().required().messages({
            "any.required": "postId is required in event payload.",
            "string.empty": "postId cannot be empty."
        })
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


