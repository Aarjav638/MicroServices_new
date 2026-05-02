//user Registration

import { RequestHandler } from "express";
import RefreshToken from "../models/RefreshToken";
import User from "../models/User";
import { ApiError } from "../utils/error";
import { logger } from "../utils/logger";
import { generateTokens } from "../utils/tokens";
import { validateLogin, validateRegistration } from "../utils/validation";

export const registerUser: RequestHandler = async (req, res, next) => {
  try {
    const { name, email, password, username } = validateRegistration(req.body)
    let user = await User.findOne({ $or: [{ email }, { username }] })

    if (user) {
      throw new ApiError('User Already Exists', 400, 'ValidationError')
    }

    user = new User({
      name,
      password,
      email,
      username
    })
    await user.save()
    const { accessToken, refershToken } = await generateTokens(user)

    res.status(201).json({
      message: 'User Created Successfully',
      success: true,
      accessToken,
      refershToken
    })
  } catch(e) {
    // logger.error('Error while registering',e)
    // const error = new ApiError('User Registration Failed',500,'Registration_Error')
    next(e)
  }
}

//user Login
export const loginUser: RequestHandler = async (req, res, next) => {
  try {
    const {  email, password } = validateLogin(req.body)
    let user = await User.findOne({ email:email })

    if (!user) {
      throw new ApiError('User not Exists', 404, 'not_found')
    }
    const isValid = await user.comparePassword(password)
    if(!isValid){
       throw new ApiError('Invalid Credentials', 400, 'validationError') 
    }

    const { accessToken, refershToken } = await generateTokens(user)

    res.status(200).json({
      message: 'User Login Successfully',
      success: true,
      accessToken,
      refershToken
    })
  } catch(e) {
    next(e)
  }
}

//Refresh Token
export const refreshTokenController: RequestHandler = async (req, res, next) => {
  try {
    logger.info('Refresh endpoint hit')
    const { refreshToken } = req.body

    if(!refreshToken){
      throw new ApiError('Refresh token missing', 400, 'missing_token')
    }



    let storedToken = await RefreshToken.findOne({ token:refreshToken })

    if (!storedToken||storedToken.expiresAt < new Date() ) {
      throw new ApiError('token not Exists or expired token', 401, 'invalid_token')
    }

    const user =await User.findById(storedToken.user)
    

    if(!user){
       throw new ApiError('User not Exists', 404, 'not_found')
    }

    const { accessToken, refershToken:newRefreshToken } = await generateTokens(user)


    res.status(200).json({
      message: 'Token Refreshed Successfully',
      success: true,
      accessToken,
      refershToken:newRefreshToken
    })
  } catch(e) {
    next(e)
  }
}

//Logout

export const logoutUser: RequestHandler = async (req, res, next) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      throw new ApiError('Refresh token missing', 400, 'missing_token')
    }

    const deletedToken = await RefreshToken.findOneAndDelete({ token: refreshToken })

    if (!deletedToken) {
      throw new ApiError('Invalid refresh token', 400, 'invalid_token')
    }

    res.status(200).json({
      message: 'Logout successful',
      success: true
    })
  } catch (e) {
    next(e)
  }
}


