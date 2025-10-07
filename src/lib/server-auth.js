import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_ACCESS_SECRET || 'devsecret';

// For Server Components / Pages
export async function getSession() {
  // Next 15: cookies() is async in RSC
  const store = await cookies();
  const token = store.get('access_token')?.value;
  if (!token) return null;
  try {
    return jwt.verify(token, SECRET); // { sub, role, name, iat, exp }
  } catch {
    return null;
  }
}

// For API route handlers (Request object)
export function sessionFromRequest(req) {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = cookieHeader.split('; ')
    .find(c => c.startsWith('access_token='))?.split('=')[1];
  if (!token) return null;
  try { return jwt.verify(token, SECRET); } catch { return null; }
}