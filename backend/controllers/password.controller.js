import crypto from "crypto";
import bcrypt from "bcryptjs";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { sendResetEmail } from "../utils/mailer.js";

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email || typeof email !== "string") {
    res.status(400);
    throw new Error("Email is required");
  }

  const cleanEmail = email.trim().toLowerCase();

  // Security: always return generic response
  const genericResponse = {
    message: "If the account exists, a password reset link has been sent.",
  };

  const user = await User.findOne({ email: cleanEmail });
  if (!user) return res.status(200).json(genericResponse);

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const expiresMin = Number(process.env.RESET_TOKEN_EXPIRES_MIN || 15);
  const expiresAt = new Date(Date.now() + expiresMin * 60 * 1000);

  user.resetPasswordTokenHash = tokenHash;
  user.resetPasswordExpiresAt = expiresAt;
  await user.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:8080";
  const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

  try {
    await sendResetEmail({ to: user.email, resetUrl });
  } catch (err) {
    // email fail -> clear token
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    res.status(500);
    throw new Error("Failed to send reset email");
  }

  return res.status(200).json(genericResponse);
});

// POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || typeof token !== "string") {
    res.status(400);
    throw new Error("Token is required");
  }
  if (!newPassword || typeof newPassword !== "string") {
    res.status(400);
    throw new Error("New password is required");
  }
  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const tokenHash = hashToken(token);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Reset token is invalid or expired");
  }

  user.password = await bcrypt.hash(newPassword, 12);
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  return res.status(200).json({ message: "Password reset successful" });
});