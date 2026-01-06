import asyncHandler from 'express-async-handler';
import Post from '../models/Post.js';
import User from '../models/User.js';

// @desc    Get all posts
// @route   GET /api/posts
// @access  Private
const getPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
});

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
    if (!req.body.content) {
        res.status(400);
        throw new Error('Please add text content');
    }

    // Ensure user is populated from auth middleware
    const post = await Post.create({
        content: req.body.content,
        user: req.user._id,
        name: req.user.fullName,
        avatar: '',
        initials: req.user.fullName ? req.user.fullName.charAt(0).toUpperCase() : 'U',
    });

    res.status(200).json(post);
});

// @desc    Like a post
// @route   PUT /api/posts/:id/like
// @access  Private
const likePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    // Check if the post has already been liked
    if (post.likes.filter(like => like.toString() === req.user._id.toString()).length > 0) {
        // Unlike
        const removeIndex = post.likes.map(like => like.toString()).indexOf(req.user._id.toString());
        post.likes.splice(removeIndex, 1);
    } else {
        // Like
        post.likes.unshift(req.user._id);
    }

    await post.save();
    res.json(post.likes);
});

// @desc    Comment on a post
// @route   POST /api/posts/:id/comment
// @access  Private
const addComment = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const newComment = {
        text: req.body.text,
        name: req.user.fullName,
        avatar: '',
        user: req.user._id
    };

    post.comments.unshift(newComment);

    await post.save();
    res.json(post.comments);
});

export {
    getPosts,
    createPost,
    likePost,
    addComment,
};
