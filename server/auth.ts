import crypto from 'node:crypto';

const SECRET_KEY_STRING = process.env.SESSION_SECRET || 'yogantak-secret-encryption-key-phrase-32-chars';
// Derive a secure 32-byte key from the secret key string
const SECRET_KEY = crypto.scryptSync(SECRET_KEY_STRING, 'yogantak-salt-derivation', 32);

// Password Hashing
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, hash] = storedHash.split(':');
    if (!salt || !hash) return false;
    const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
  } catch (err) {
    return false;
  }
}

// Session Tokens (Encrypted JSON payloads)
export function createToken(payload: object): string {
  const iv = crypto.randomBytes(12); // 12 bytes standard for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', SECRET_KEY, iv);
  let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function verifyToken(token: string): any {
  if (!token) return null;
  try {
    const [ivHex, authTagHex, encrypted] = token.split(':');
    if (!ivHex || !authTagHex || !encrypted) return null;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', SECRET_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    return null;
  }
}
