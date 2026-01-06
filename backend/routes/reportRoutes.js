import express from 'express';
const router = express.Router();
import {
    getReports,
    getAllReports,
    createReport,
    updateStatus,
    addFeedback
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

router.route('/').get(protect, getReports).post(protect, createReport);
router.route('/all').get(protect, getAllReports);
router.route('/:id/status').put(protect, updateStatus);
router.route('/:id/feedback').put(protect, addFeedback);

export default router;

