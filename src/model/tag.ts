import mongoose, { Document, Schema } from 'mongoose';

export interface ITag extends Document {
  name: string;
  createdAt: Date;
  postId: number;
}

const tagSchema = new Schema({
  name: {
    required: true,
    type: String,
  },

  createdAt: {
    type: Date,
  },

  postId: {
    required: true,
    type: Number,
  },
});

const Tag = mongoose.model<ITag>('Tag', tagSchema);

export default Tag;