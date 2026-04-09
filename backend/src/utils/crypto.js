// utils/crypto.js
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const algorithm = "aes-256-ctr";
let key;
const getKey = () => {
  if (key) return key;

  const encryptionKey = process.env.CHAT_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.warn("⚠️ CHAT_ENCRYPTION_KEY is missing in .env! Encryption will be insecure.");
  }
  key = crypto.scryptSync(encryptionKey || "fallback-secret-password", "salt", 32);
  return key;
};

export const encryptMessage = (text) => {
  if (!text) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptMessage = (hash) => {
  if (!hash || !hash.includes(":")) {
    throw new Error("Invalid or plain-text hash format");
  }
  const [ivHex, encryptedHex] = hash.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

/**
 * Safely decrypts a message. 
 * If decryption fails or if the message is plain text, it returns the original string.
 */
export function safeDecryptMessage(encrypted) {
  if (!encrypted || typeof encrypted !== "string") return "";
  
  // Heuristic: If it doesn't have a colon, it's likely plain-text (pre-encryption)
  if (!encrypted.includes(":")) return encrypted;

  try {
    return decryptMessage(encrypted);
  } catch (err) {
    // If it has a colon but decryption fails, it might be corrupted or encrypted with a different key
    // We return the encrypted string so at least something is visible (or maybe the user changed keys)
    console.error("Decryption failed for message:", err.message);
    return encrypted; // Return as-is on failure so we don't return blank strings
  }
}
