import axios from "axios";
import { MEDIA_SERVICE_URL } from "../config";
import { ApiError } from "./error";

export interface Media {
    _id: string;
    publicId: string;
    mime_type: string;
    file_name: string;
    url: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
}

export interface DeleteResponse { "message": string, "success": boolean, "deletedCount": number }

export interface MediaResponse {
    media: Media[];
}

export interface MediaContract {
    getMediasByIds(ids: string, userId: string): Promise<Media[]>;
}

export class MediaClient implements MediaContract {
    private baseUrl: string;
    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
    }
    async getMediasByIds(ids: string, userId: string): Promise<Media[]> {
        try {
            const params = {
                mediaIds: ids
            }
            const data = await axios.get<MediaResponse>(`${this.baseUrl}/mediaIds`, {
                params,
                headers: {
                    'x-user-id': userId,
                    'x-internal-call': 'true'
                }
            })
            return data.data.media
        } catch (error: any) {
            const status = error.response?.status;
            const message = error.response?.data?.message;
            const name = error.response?.data?.name;

            // IMPORTANT: treat missing media as empty result
            if (status === 404) {
                return [];
            }

            throw new ApiError(
                message || "Media service unavailable",
                status || 502,
                name || "media_service_error"
            );

        }

    }
    // async deleteMediasByIds(ids: string, userId: string): Promise<DeleteResponse> {
    //     try {
    //         const params = {
    //             mediaIds: ids
    //         }
    //         const data = await axios.delete<DeleteResponse>(`${this.baseUrl}/delete`, {
    //             params,
    //             headers: {
    //                 'x-user-id': userId,
    //                 'x-internal-call': 'true'
    //             }
    //         })
    //         return data.data
    //     } catch (error: any) {
    //         const status = error.response?.status;
    //         const message = error.response?.data?.message;
    //         const name = error.response?.data?.name;

    //         throw new ApiError(
    //             message || "Media service unavailable",
    //             status || 502,
    //             name || "media_service_error"
    //         );

    //     }

    // }
}


export const mediaClient = new MediaClient(`${MEDIA_SERVICE_URL}/media`)