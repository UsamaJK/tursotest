import jwt from 'jsonwebtoken';

export function signAccess(payload) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET || 'devsecret', { expiresIn: '15m' });
}

export function readUserFromCookie(req) {
  const cookie = req.headers.get('cookie') || '';
  const token = cookie.split('; ').find(c => c.startsWith('access_token='))?.split('=')[1];
  if (!token) return null;
  try { return jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'devsecret'); }
  catch { return null; }
}