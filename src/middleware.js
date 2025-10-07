import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_ACCESS_SECRET || 'devsecret';

export function middleware(req) {
  const { pathname } = req.nextUrl;
  if (pathname !== '/') return NextResponse.next();

  // Parse cookie from header for reliability
  const cookieHeader = req.headers.get('cookie') || '';
  const token = cookieHeader.split('; ').find(c => c.startsWith('access_token='))?.split('=')[1];

  let user = null;
  if (token) { try { user = jwt.verify(token, SECRET); } catch {} }

  if (user?.role === 'ADMIN')      return NextResponse.redirect(new URL('/admin', req.url));
  if (user?.role === 'CANDIDATE')  return NextResponse.redirect(new URL('/candidate', req.url));

  return NextResponse.next();
}

export const config = { matcher: ['/'] };