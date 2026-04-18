// Cryptography utilities for End-to-End Encryption (E2EE)
// Uses Web Crypto API (AES-GCM)

// Helper to convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Derive an AES-GCM key from a passcode using PBKDF2
async function deriveKey(passcode, saltBuffer) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passcode),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string using a passcode.
 * @param {string} text 
 * @param {string} passcode 
 * @param {string} saltBase64 (optional)
 * @returns {Promise<{ cipherText: string, iv: string, salt: string }>} Base64 encoded strings
 */
export async function encryptText(text, passcode, saltBase64 = null) {
  const salt = saltBase64 ? base64ToArrayBuffer(saltBase64) : window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const key = await deriveKey(passcode, salt);
  const enc = new TextEncoder();
  
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );

  return {
    cipherText: arrayBufferToBase64(cipherBuffer),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt)
  };
}

/**
 * Decrypts a cipher string using a passcode.
 * @param {string} cipherTextBase64 
 * @param {string} passcode 
 * @param {string} ivBase64 
 * @param {string} saltBase64 
 * @returns {Promise<string>} Decrypted text
 */
export async function decryptText(cipherTextBase64, passcode, ivBase64, saltBase64) {
  try {
    const cipherBuffer = base64ToArrayBuffer(cipherTextBase64);
    const iv = base64ToArrayBuffer(ivBase64);
    const salt = base64ToArrayBuffer(saltBase64);

    const key = await deriveKey(passcode, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      cipherBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error("Incorrect passcode or corrupted data.");
  }
}
