// src/utils/cache.js
import redisClient from "../config/redis.js";

/**
 * get cached value by key (JSON parsed)
 */
export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (err) {
    console.error("Cache get error:", err);
    return null;
  }
};

/**
 * set cache with TTL seconds
 */
export const setCache = async (key, value, ttl = 60) => {
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    console.error("Cache set error:", err);
  }
};

/**
 * add token to blacklist (for logout)
 */
export const blacklistToken = async (token, ttl = 60 * 60 * 24 * 7) => { // default 7 days
  try {
    await redisClient.setEx(`bl:${token}`, "blacklisted", ttl);
  } catch (err) {
    console.error("Blacklist error:", err);
  }
};

export const isTokenBlacklisted = async (token) => {
  try {
    const val = await redisClient.get(`bl:${token}`);
    return !!val;
  } catch (err) {
    console.error("Blacklist check error:", err);
    return false;
  }
};
