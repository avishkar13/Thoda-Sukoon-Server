// utils/crypto.js
import crypto from "crypto";

const algorithm = "aes-256-ctr";
const key = crypto.scryptSync(process.env.CHAT_ENCRYPTION_KEY, "salt", 32);

export const encryptMessage = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
};

export const decryptMessage = (hash) => {
  const [ivHex, encryptedHex] = hash.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
};

export function safeDecryptMessage(encrypted) {
  if (!encrypted || typeof encrypted !== "string") return "";
  try {
    return decryptMessage(encrypted);
  } catch (err) {
    console.error("Failed to decrypt message:", encrypted, err.message);
    return "";
  }
}
