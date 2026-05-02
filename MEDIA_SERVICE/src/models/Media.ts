
import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";


export interface IMedia {
    url: string;
    file_name: string;
    mime_type: string;
    createdAt:string;
    user:mongoose.Types.ObjectId;
    publicId:string
}


export type UserDocument = HydratedDocument<IMedia>;

type MediaModel = Model<IMedia>

const MediaSchema = new Schema<IMedia>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: 1
    },
    publicId: {
        type: String,
        required: true,
    },
    mime_type: {
        type: String,
        required: true
    },
    file_name: {
        type: String,
        required: true,
        trim: true,
    },
    url:{
        type:String,
        required:true
    }
}, {
    timestamps: true
})

const Media = model<IMedia, MediaModel>('Media', MediaSchema);

export default Media;

