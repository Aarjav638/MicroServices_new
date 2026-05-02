
import mongoose, { HydratedDocument, Model, model, Schema } from "mongoose";


export interface IPost {
    user: mongoose.Types.ObjectId;
    content: string;
    mediaIds: string[];
    createdAt:Date
}

export type PostDocument = HydratedDocument<IPost>;

type PostModel = Model<IPost>

const PostSchema = new Schema<IPost>({
    content: {
        type: String,
        required: true,
        index: "text"
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
       ref:'User',
       required:true
    },
    mediaIds:[ {
        type: String,
    }]
}, {
    timestamps: true
})

PostSchema.index({ user: 1, createdAt: -1 });

const Post = model<IPost, PostModel>('Post', PostSchema);

export default Post;

