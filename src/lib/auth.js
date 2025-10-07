// src/lib/auth.js
import jwt from 'jsonwebtoken';

// Use ONE env var everywhere (fallbacks keep current code working)
const SECRET =
  process.env.ACCESS_TOKEN_SECRET ||
  process.env.JWT_ACCESS_SECRET ||
  'devsecret';

export function signAccess(payload, opts = {}) {
  // 15m is fine for admin routes; tune as you like
  return jwt.sign(payload, SECRET, {
    algorithm: 'HS256',
    expiresIn: '15m',
    ...opts,
  });
}

export function verifyAccess(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

/**
 * For places where you have a Request (e.g. middleware or route handlers
 * that want to read cookies off the Request instead of next/headers)
 */
export function readUserFromCookie(req) {
  const cookie = req.headers.get?.('cookie') || '';
  const token = cookie
    .split('; ')
    .find((c) => c.startsWith('access_token='))
    ?.split('=')[1];
  if (!token) return null;
  return verifyAccess(token);
}
