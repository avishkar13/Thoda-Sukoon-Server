// src/controllers/userController.js
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";


const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// helper: generate JWT
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * @route POST /api/users/register
 * @desc Register user (email/password) or create alias if no email
 * @access Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role = "student", aliasId } = req.body;

  // 1. Email-based Registration
  if (email) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      res.status(400);
      throw new Error("Email already registered");
    }

    if (!password) {
      res.status(400);
      throw new Error("Password required for email registration");
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name?.trim() || "User",
      email: normalizedEmail,
      password: hashed,
      role,
      aliasId: aliasId || undefined,
    });

    const token = generateToken({ id: user._id });
    return res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        aliasId: user.aliasId,
        role: user.role,
      },
    });
  }

  // 2. Anonymous/Alias Registration
  const user = await User.create({
    name: name?.trim() || "Anonymous",
    role,
    aliasId: aliasId || `anon_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  });

  const token = generateToken({ id: user._id });
  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      aliasId: user.aliasId,
      role: user.role,
    },
  });
});

/**
 * @route POST /api/users/login
 * @desc Login with email/password
 * @access Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const match = await bcrypt.compare(password, user.password || "");
  if (!match) {
    res.status(401);
    throw new Error("Invalid credentials");
  }

  const token = generateToken({ id: user._id });
  res.json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    aliasId: user.aliasId,
    role: user.role,
  },
});
});

/**
 * @route POST /api/users/google
 * @desc Sign in with Google ID token (client should send id_token)
 * @access Public
 */
export const googleSignIn = asyncHandler(async (req, res) => {
  const { id_token } = req.body;
  if (!id_token) {
    res.status(400);
    throw new Error("id_token required");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, sub, picture } = payload;

  // find or create user
  let user = await User.findOne({ email });

  if (!user) {
    // new user
    user = await User.create({
      name: name || "GoogleUser",
      email,
      googleId: sub,
      picture: picture || null,
      role: "student",
    });
  } else {
    // existing user: update googleId/picture if missing or changed
    if (!user.googleId) user.googleId = sub;
    if (picture && user.picture !== picture) user.picture = picture;
    await user.save();
  }

  const token = generateToken({ id: user._id });

  res.json({
  token,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    aliasId: user.aliasId,
    role: user.role,
    picture: user.picture, 
  },
});

});


/**
 * @route GET /api/users/me
 * @desc Get current user (protected)
 * @access Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.json(user); 
});

export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ source: "db", user });
});

/**
 * @route POST /api/users/logout
 * @desc Logout user
 * @access Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
  res.json({ message: "Logged out successfully" });
});
