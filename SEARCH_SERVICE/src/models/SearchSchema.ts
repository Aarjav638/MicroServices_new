
import { Model, model, Schema } from "mongoose";


export interface ISearch {
    postId: string;
    content: string;
    userId: string;
    createdAt: Date;
}

type SearchModel = Model<ISearch>

const SearchSchema = new Schema<ISearch>({
    postId: {
        type: String,
        required: true,
        unique: true,
    },
    userId: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
}, {
    timestamps: true
})

SearchSchema.index({ content: 'text', createdAt: -1 })

const Search = model<ISearch, SearchModel>('Search', SearchSchema);

export default Search;

