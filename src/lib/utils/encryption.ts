import crypto from "crypto";

// Advanced Encryption Standard (AES) configuration
const ALGORITHM = "aes-256-cbc";

// Encrypts plain text using the TOKEN_ENCRYPTION_KEY env variable
export function encryptToken(text: string): string {
  const secretKey = process.env.TOKEN_ENCRYPTION_KEY;

  if (!secretKey) {
    // Fallback: If no key is configured in dev, warn and return plain text
    if (process.env.NODE_ENV !== "production") {
      console.warn("WARNING: TOKEN_ENCRYPTION_KEY environment variable is not defined. Tokens are stored in plain text.");
      return text;
    }
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is required in production.");
  }

  // Derive a stable 32-byte key from the configured string
  const key = crypto.createHash("sha256").update(secretKey).digest();
  
  // Random initialization vector (IV) for unique cipher outputs
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Output IV + Encrypted text separated by colon
  return `${iv.toString("hex")}:${encrypted}`;
}

// Decrypts cipher text back into plain text
export function decryptToken(encryptedText: string): string {
  const secretKey = process.env.TOKEN_ENCRYPTION_KEY;

  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      return encryptedText; // Fallback plain text return
    }
    throw new Error("TOKEN_ENCRYPTION_KEY environment variable is required in production.");
  }

  const parts = encryptedText.split(":");
  if (parts.length !== 2) {
    // If not in standard iv:cipher format, assume it was stored as plain text
    return encryptedText;
  }

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];

  const key = crypto.createHash("sha256").update(secretKey).digest();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
