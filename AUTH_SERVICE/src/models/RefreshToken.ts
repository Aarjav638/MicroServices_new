import mongoose, { model, Schema } from "mongoose";
import { IUser } from "./User";

interface RefreshToken{
    token:string,
    user:mongoose.Types.ObjectId | IUser,
    expiresAt:Date
}

const refreshTokenSchema = new Schema<RefreshToken>({
    token:{
        required:true,
        type:String
    },
    user:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        unique:true,
        index:true
    },
    expiresAt:{
        type:Date,
        required:true
    }
})

refreshTokenSchema.index({expiresAt:1},{expireAfterSeconds:0})

const RefreshToken = model<RefreshToken>('RefreshToken',refreshTokenSchema)

export default RefreshToken