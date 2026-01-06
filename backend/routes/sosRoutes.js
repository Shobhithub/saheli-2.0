import express from 'express';
import { createSOS, getActiveSOS, resolveSOS } from '../controllers/sosController.js';
import { protect } from '../middleware/authMiddleware.js'; // We need to create/check this

const router = express.Router();

// For now, we might skip 'protect' if we haven't implemented the middleware file yet.
// But to do it "properly", we should check basic auth.
// Let's create the route without protect first to ensure the basic flow works, then add auth.
router.post('/create', createSOS);
router.get('/active', getActiveSOS);
router.put('/:id/resolve', resolveSOS);

export default router;

