import express from 'express';
import { loginUser, registerUser, logoutUser, updateEmergencyContacts } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.put('/emergency-contacts', updateEmergencyContacts);

export default router;
