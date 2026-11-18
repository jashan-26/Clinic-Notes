/**
 * Web Crypto API — AES-GCM 256-bit encryption for local notes
 * Guarantees that saved doctor notes are stored encrypted on disk/localStorage.
 */

const SALT = new TextEncoder().encode('ClinicNotes-Salt-2026-Hospital-Grade');

async function deriveKey(passphrase) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export class NotesCrypto {
  /**
   * Encrypt plaintext string with doctor's passphrase
   */
  static async encrypt(plainText, passphrase) {
    if (!passphrase) {
      // If no passphrase set, return plain string marked as unencrypted
      return { encrypted: false, payload: plainText };
    }

    try {
      const key = await deriveKey(passphrase);
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encodedText = new TextEncoder().encode(plainText);

      const ciphertext = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedText
      );

      // Convert buffer & IV to base64
      const ivBase64 = btoa(String.fromCharCode(...iv));
      const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

      return {
        encrypted: true,
        iv: ivBase64,
        payload: cipherBase64,
      };
    } catch (err) {
      console.error('Encryption failed:', err);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt payload with doctor's passphrase
   */
  static async decrypt(record, passphrase) {
    if (!record.encrypted) {
      return record.payload;
    }

    if (!passphrase) {
      throw new Error('Passphrase required to decrypt note');
    }

    try {
      const key = await deriveKey(passphrase);
      const iv = Uint8Array.from(atob(record.iv), (c) => c.charCodeAt(0));
      const ciphertext = Uint8Array.from(atob(record.payload), (c) => c.charCodeAt(0));

      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (err) {
      throw new Error('Incorrect passphrase or corrupted note.');
    }
  }
}
