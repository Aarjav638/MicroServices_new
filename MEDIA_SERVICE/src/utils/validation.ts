import Joi from "joi";
import { IMedia } from "../models/Media";
import { ApiError } from "./error";

export const validateMediaBody = (data: unknown): Omit<IMedia, 'user'> => {

    const schema = Joi.object<Omit<IMedia, 'user'>>({
        url: Joi.string().required(),
        publicId: Joi.string().required(),
        file_name: Joi.string().required(),
        mime_type: Joi.string().required(),
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

export const parseQueryArray = (value: unknown): string[] => {

    if (Array.isArray(value)) {
        return value.filter((v): v is string => typeof v === 'string');
    }
    if (typeof value === 'string') {
        return value.split(',');
    }
    return [];
};