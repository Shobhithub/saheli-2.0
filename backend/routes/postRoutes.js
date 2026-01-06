import express from 'express';
const router = express.Router();
import {
    getPosts,
    createPost,
    likePost,
    addComment
} from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getPosts).post(protect, createPost);
router.route('/:id/like').put(protect, likePost);
router.route('/:id/comment').post(protect, addComment);

export default router;
