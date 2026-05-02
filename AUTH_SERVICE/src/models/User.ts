import argon2 from "argon2";

import { HydratedDocument, Model, model, Schema } from "mongoose";


export interface IUser {
    username: string;
    email: string;
    password: string;
    name: string;
}

interface IUserMethods {
    comparePassword(password: string): Promise<boolean>;
}

export type UserDocument = HydratedDocument<IUser,IUserMethods>;

type UserModel = Model<IUser, {}, IUserMethods>

const UserSchema = new Schema<IUser, {}, IUserMethods>({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: "text"
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
    }
}, {
    timestamps: true
})


UserSchema.pre('save', async function (this: UserDocument) {
    if (!this.isModified('password')) return
    this.password = await argon2.hash(this.password)
})

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    if (!password) return false
    return await argon2.verify(this.password, password)
}

const User = model<IUser, UserModel>('User', UserSchema);

export default User;

