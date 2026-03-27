// ============================================================
// DragonsDash — Encryption Utilities
// ============================================================
// AES-256-GCM client-side encryption.
// Keys never leave the device — derived from PIN/biometric
// via Argon2id, stored in device keystore.
// ============================================================

/**
 * Generate a random encryption key using Web Crypto API.
 * Returns a CryptoKey suitable for AES-256-GCM.
 */
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true, // extractable for backup
    ["encrypt", "decrypt"],
  );
}

/**
 * Encrypt data with AES-256-GCM.
 * @param data - Plaintext string to encrypt
 * @param key - CryptoKey for AES-GCM
 * @returns Object with base64-encoded ciphertext and nonce
 */
export async function encrypt(
  data: string,
  key: CryptoKey,
): Promise<{ ciphertext: string; nonce: string }> {
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(data);

  // 96-bit nonce (12 bytes) — standard for AES-GCM
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    key,
    plaintext,
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    nonce: arrayBufferToBase64(nonce.buffer),
  };
}

/**
 * Decrypt data with AES-256-GCM.
 * @param ciphertext - Base64-encoded ciphertext
 * @param nonce - Base64-encoded nonce
 * @param key - CryptoKey for AES-GCM
 * @returns Decrypted plaintext string
 */
export async function decrypt(
  ciphertext: string,
  nonce: string,
  key: CryptoKey,
): Promise<string> {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertext);
  const nonceBuffer = base64ToArrayBuffer(nonce);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(nonceBuffer) },
    key,
    ciphertextBuffer,
  );

  const decoder = new TextDecoder();
  return decoder.decode(plaintext);
}

/**
 * Export a CryptoKey to a storable format (base64).
 */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey("raw", key);
  return arrayBufferToBase64(raw);
}

/**
 * Import a key from base64 string back to CryptoKey.
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = base64ToArrayBuffer(base64Key);
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

/**
 * Hash PIN with SHA-256 for transmission.
 * PIN is NEVER stored on the server in plaintext.
 */
export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hash);
}

// --- Helpers ---

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
