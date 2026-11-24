// PIN Authentication Module
// Derives a deterministic 256-bit auth token from user-entered PIN using PBKDF2-SHA256
// The same PIN + fixed salt = same token on every device, no secrets stored in code

// Fixed public salt - NOT a secret, just a domain separator
const APP_SALT = 'digital-bookshelf-pin-salt-v1';
const ITERATIONS = 150_000; // PBKDF2 iterations
const KEY_LENGTH = 32; // 256 bits = 32 bytes
const TOKEN_PREFIX = 'dbs_'; // Prefix to identify our tokens

export interface PinAuthState {
  isLocked: boolean;
  token: string | null;
  clientId: string | null;
}

let authState: PinAuthState = {
  isLocked: true,
  token: null,
  clientId: null,
};

let authListeners: Set<(state: PinAuthState) => void> = new Set();

function notifyListeners() {
  authListeners.forEach(cb => cb({ ...authState }));
}

/**
 * Derive auth token from PIN using PBKDF2-SHA256
 * @param pin - User-entered alphanumeric PIN (8+ chars recommended)
 * @returns Promise resolving to hex-encoded 256-bit token with prefix
 */
export async function deriveTokenFromPin(pin: string): Promise<string> {
  if (!pin || pin.length < 4) {
    throw new Error('PIN must be at least 4 characters');
  }

  const encoder = new TextEncoder();
  const salt = encoder.encode(APP_SALT);
  const pinBuffer = encoder.encode(pin);

  // Import PIN as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    pinBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  // Derive 256-bit key
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH * 8
  );

  // Convert to hex
  const hex = Array.from(new Uint8Array(derivedBits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${TOKEN_PREFIX}${hex}`;
}

/**
 * Unlock the app with a PIN - derives token and stores in memory
 */
export async function unlockWithPin(pin: string): Promise<{ token: string; clientId: string }> {
  const token = await deriveTokenFromPin(pin);
  const clientId = token.slice(-8); // Last 8 chars as client identifier

  authState = {
    isLocked: false,
    token,
    clientId,
  };

  notifyListeners();
  return { token, clientId };
}

/**
 * Lock the app - clear token from memory
 */
export function lock(): void {
  authState = {
    isLocked: true,
    token: null,
    clientId: null,
  };
  notifyListeners();
}

/**
 * Get current auth state (reactive via listener)
 */
export function getAuthState(): PinAuthState {
  return { ...authState };
}

/**
 * Subscribe to auth state changes
 */
export function onAuthChange(listener: (state: PinAuthState) => void): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

/**
 * Check if currently unlocked
 */
export function isUnlocked(): boolean {
  return !authState.isLocked && authState.token !== null;
}

/**
 * Get the current auth token for API requests
 */
export function getAuthToken(): string | null {
  return authState.token;
}

/**
 * Get the current client ID
 */
export function getClientId(): string | null {
  return authState.clientId;
}

/**
 * Create Authorization header value
 */
export function getAuthHeader(): string | null {
  const token = authState.token;
  return token ? `Bearer ${token}` : null;
}

/**
 * Validate PIN format (alphanumeric, 8+ chars recommended)
 */
export function validatePinFormat(pin: string): { valid: boolean; message?: string } {
  if (!pin) return { valid: false, message: 'PIN is required' };
  if (pin.length < 4) return { valid: false, message: 'PIN must be at least 4 characters' };
  if (pin.length > 128) return { valid: false, message: 'PIN is too long' };
  if (!/^[a-zA-Z0-9]+$/.test(pin)) {
    return { valid: false, message: 'PIN must contain only letters and numbers' };
  }
  // Warn if too short (but don't block)
  if (pin.length < 8) {
    return { valid: true, message: 'For better security, use 8+ characters' };
  }
  return { valid: true };
}

/**
 * Generate a secure random PIN (for initial setup / recovery)
 * The user must save this PIN - it derives to the SYNC_SECRET token
 */
export function generateSecurePin(length = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => charset[byte % charset.length]).join('');
}