import express from "express";
import rateLimit from "express-rate-limit";
import { forgotPassword, resetPassword } from "../controllers/password.controller.js";

const router = express.Router();

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts, please try again later." },
});

router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password", resetPassword);

export default router;