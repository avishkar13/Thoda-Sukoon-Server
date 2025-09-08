import { createClient } from "redis";

let redisClient;

async function connectRedis() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL,  // from Upstash
      socket: {
        tls: true,                // required for Upstash
        rejectUnauthorized: false // ignore self-signed cert issues
      }
    });

    redisClient.on("connect", () => console.log("✅ Redis connected"));
    redisClient.on("error", (err) => console.error("❌ Redis error:", err));

    await redisClient.connect();
  }
  return redisClient;
}

export default connectRedis;
