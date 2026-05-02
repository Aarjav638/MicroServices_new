import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'
import 'multer'
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_NAME } from '../config'
import { ApiError } from './error'

export const cloudinaryUtils = () => {

    if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) throw new ApiError('Missing Environmnet variables', 500, 'missinf_variables')

    cloudinary.config({
        cloud_name: CLOUDINARY_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET
    })


    const uploadMediaToCloudniary = (file: Express.Multer.File, folder = 'uploads'): Promise<UploadApiResponse> => {

        return new Promise((resolve, reject) => {
            if (!file) {
                return reject(new ApiError('File not provided', 400, 'no_file'))
            }

            cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'auto' // supports image, video, etc.
                },
                (error, result) => {
                    if (error) {
                        return reject(new ApiError(error.message, 500, 'cloudinary_upload_failed'))
                    }
                    if (!result) {
                        return reject(
                            new ApiError('Upload failed with no result', 500, 'no_result')
                        )
                    }

                    resolve(result)
                }
            ).end(file.buffer)
        })

    }
    const deleteMediaFromCloudniary = (publicId: string): Promise<{ result: string }> => {

        return new Promise((resolve, reject) => {
            if (!publicId) {
                return reject(new ApiError('publicId not found', 400, 'publicId'))
            }

            cloudinary.uploader.destroy(
                publicId,
                (error, result) => {
                    if (error) {
                        return reject(new ApiError(error.message, 500, 'cloudinary_delete_failed'))
                    }
                    if (!result) {
                        return reject(
                            new ApiError('delete failed with no result', 500, 'no_result')
                        )
                    }

                    resolve(result)
                }
            )
        })

    }
    return {
        uploadMediaToCloudniary,
        deleteMediaFromCloudniary
    }

}