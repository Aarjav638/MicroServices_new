import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import RefreshToken from '../models/RefreshToken';
import { UserDocument } from "../models/User";
import { ApiError } from "./error";

export const generateTokens = async (user: UserDocument) => {

    if (!JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    try {

        const accessToken = jwt.sign({
            userId: user._id,
            username: user.username
        }, JWT_SECRET, { expiresIn: '60m' })
        const refershToken = crypto.randomBytes(40).toString('hex')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 364) // expires in 1 year
        await RefreshToken.findOneAndUpdate(
            { user: user._id },
            {
                token: refershToken,
                expiresAt: expiresAt
            },
            { upsert: true, returnDocument: 'after' }
        );
        return { accessToken, refershToken }
    } catch {
        throw new ApiError('Failed to genrate Tokens', 500, 'authenticationError')
    }
}
