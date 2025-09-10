// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import { isTokenBlacklisted } from "../utils/cache.js";

export const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, token missing");
  }

  // check blacklist
  const blacklisted = await isTokenBlacklisted(token);
  if (blacklisted) {
    res.status(401);
    throw new Error("Token is invalidated (logged out)");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }
    req.user = user; // attach user object
    next();
  } catch (err) {
    console.error("JWT verify error:", err);
    res.status(401);
    throw new Error("Not authorized, invalid token");
  }
});

// middleware to restrict admin routes
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403);
    throw new Error("Access denied: Admins only");
  }
};
