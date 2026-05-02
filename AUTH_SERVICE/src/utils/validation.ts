import Joi from "joi";
import { IUser } from "../models/User";
import { ApiError } from "./error";

export const validateRegistration = (data:unknown):IUser=>{

    const schema = Joi.object<IUser>({
        username:Joi.string().min(3).max(50).required(),
        name:Joi.string().min(3).required(),
        email:Joi.string().email().required(),
        password:Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$')).required().messages({
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, and one special character',
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password is required',
    }),
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


export const validateLogin = (data:unknown):Omit<IUser,'username'|'name'>=>{

const schema = Joi.object<Omit<IUser, 'username' | 'name'>>({
  email: Joi.string().email().required(),

  password: Joi.string()
    .min(6)
    .pattern(
      new RegExp(
        '^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{6,}$'
      )
    )
    .required()
    .messages({
      'string.pattern.base':
        'Password must contain at least one lowercase letter, one uppercase letter, and one special character',
      'string.min': 'Password must be at least 6 characters long',
      'string.empty': 'Password is required',
    }),
});
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