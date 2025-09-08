// src/controllers/userController.js
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

import User from "../models/User.js";
import { getCache, setCache, blacklistToken } from "../utils/cache.js";

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

  if (email) {
    // register with email
    const existing = await User.findOne({ email });
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
      name,
      email,
      password: hashed,
      role,
      aliasId: aliasId || undefined,
    });

    const token = generateToken({ id: user._id });
    res.status(201).json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } else {
    // alias/anonymous user
    const user = await User.create({
      name: name || "Anonymous",
      role,
      aliasId: aliasId || `anon_${Date.now()}_${Math.random().toString(36).slice(2,8)}`,
    });
    const token = generateToken({ id: user._id });
    res.status(201).json({ token, user: { id: user._id, aliasId: user.aliasId, role: user.role } });
  }
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
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
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
  // payload contains email, name, sub, picture, locale
  const { email, name, sub, picture } = payload;

  // find or create user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name: name || "GoogleUser",
      email,
      role: "student",
      // you can store google sub in aliasId or another field if needed
    });
  }

  const token = generateToken({ id: user._id });
  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, picture },
  });
});

/**
 * @route GET /api/users/me
 * @desc Get current user (protected)
 * @access Private
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by protect middleware
  const user = req.user;
  res.json({ user });
});

/**
 * @route GET /api/users/:id
 * @desc Get user by id, using cache
 * @access Private (or you can make public as needed)
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cacheKey = `user:${id}`;
  // try cache
  const cached = await getCache(cacheKey);
  if (cached) {
    return res.json({ source: "cache", user: cached });
  }

  const user = await User.findById(id).select("-password");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // set cache for 120 seconds
  await setCache(cacheKey, user, 120);
  res.json({ source: "db", user });
});

/**
 * @route POST /api/users/logout
 * @desc Logout - blacklist token (simple approach)
 * @access Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
  // read token from header
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) {
    return res.status(400).json({ message: "No token provided" });
  }
  // add to blacklist with TTL equal to remaining token life or a chosen TTL
  // here we set 7 days TTL (customizable)
  await blacklistToken(token, 60 * 60 * 24 * 7);
  res.json({ message: "Logged out" });
});
