/**
 * Pedido 19: Gerenciamento seguro de credenciais Zernio com Web Crypto API (AES-GCM).
 * A chave de criptografia é gerada localmente e armazenada separadamente do payload cifrado,
 * garantindo que o token Zernio nunca seja persistido em texto plano no navegador.
 */

const TOKEN_STORAGE_KEY = 'agente_trafego_zernio_token_enc_v1';
const KEY_STORAGE_KEY = 'agente_trafego_zernio_wrap_key_v1';

interface EncryptedPayload {
  iv: string;
  ciphertext: string;
  updatedAt: string;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getOrCreateDeviceKey(): Promise<CryptoKey> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) {
    throw new Error('Web Crypto API indisponível neste ambiente.');
  }

  const storedJwk = localStorage.getItem(KEY_STORAGE_KEY);
  if (storedJwk) {
    const jwk = JSON.parse(storedJwk) as JsonWebKey;
    return window.crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  const exported = await window.crypto.subtle.exportKey('jwk', key);
  localStorage.setItem(KEY_STORAGE_KEY, JSON.stringify(exported));
  return key;
}

export async function saveEncryptedToken(plainToken: string): Promise<void> {
  const trimmed = plainToken.trim();
  if (!trimmed) {
    clearEncryptedToken();
    return;
  }

  const key = await getOrCreateDeviceKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(trimmed);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  const payload: EncryptedPayload = {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuffer)),
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(payload));
}

export async function loadDecryptedToken(): Promise<string | null> {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as EncryptedPayload;
    const key = await getOrCreateDeviceKey();
    const iv = base64ToBytes(payload.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return null;
  }
}

export function hasStoredToken(): boolean {
  return Boolean(localStorage.getItem(TOKEN_STORAGE_KEY));
}

export function clearEncryptedToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}
