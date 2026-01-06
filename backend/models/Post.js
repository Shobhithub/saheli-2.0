import mongoose from 'mongoose';

const commentSchema = mongoose.Schema({
    text: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true },
    avatar: { type: String },
}, { timestamps: true });

const postSchema = mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    content: { type: String, required: true },
    name: { type: String, required: true },
    avatar: { type: String },
    initials: { type: String },
    createdAt: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for comment count so we don't have to send all comments always if not needed
postSchema.virtual('commentCount').get(function () {
    return this.comments.length;
});

const Post = mongoose.model('Post', postSchema);
export default Post;
