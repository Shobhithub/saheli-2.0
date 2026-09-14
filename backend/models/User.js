// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },

  password: {
    type: String,
    required: true,
    select: true, // keep true if your login queries rely on it; change to false if you explicitly select("+password")
  },

  phone: {
    type: String,
    required: true,
    trim: true,
  },

  role: {
    type: String,
    enum: ["user", "police", "admin"],
    default: "user",
    index: true,
  },

  emergencyContacts: [
    {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relation: { type: String, trim: true },
    },
  ],

  // ✅ Forgot/Reset password fields (ADD THESE)
  resetPasswordTokenHash: {
    type: String,
    index: true,
  },
  resetPasswordExpiresAt: {
    type: Date,
    index: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre("save", async function () {
  // Guard is essential: without it, every save() would re-hash password
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;