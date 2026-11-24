// Generate SYNC_SECRET from an alphanumeric PIN using PBKDF2-SHA256
// Usage: node scripts/generate-sync-secret.js <PIN>
// Outputs: SYNC_SECRET=dbs_<64-hex-char-token>

import crypto from 'node:crypto';

const APP_SALT = 'digital-bookshelf-pin-salt-v1';
const ITERATIONS = 150000;
const KEY_LENGTH = 32; // bytes = 256 bits
const TOKEN_PREFIX = 'dbs_';

function usage() {
  console.error('Usage: npm run sync:token -- <alphanumeric-pin>');
  process.exit(1);
}

// Get PIN argument (skip npm's extra args)
let pin = null;
for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i];
  if (arg === '--') continue; // npm separator
  if (!pin) pin = arg;
}

if (!pin) usage();

if (!/^[a-zA-Z0-9]+$/.test(pin)) {
  console.error('Error: PIN must be alphanumeric (letters and numbers only).');
  process.exit(1);
}

// Derive key using PBKDF2-SHA256
const derivedKey = crypto.pbkdf2Sync(pin, APP_SALT, ITERATIONS, KEY_LENGTH, 'sha256');
const hex = derivedKey.toString('hex');
const token = `${TOKEN_PREFIX}${hex}`;
console.log('SYNC_SECRET=' + token);
