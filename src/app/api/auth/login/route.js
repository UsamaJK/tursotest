export const runtime = 'nodejs';
import bcrypt from 'bcrypt';
import { NextResponse } from 'next/server';
import { signAccess } from '@/lib/auth';

import { prisma } from '@/lib/prisma';

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

  const token = signAccess({ sub: user.id, role: user.role, name: user.fullName, email:user.email });

  const res = NextResponse.json({
    user: { id: user.id, role: user.role, name: user.fullName, email:user.email }
  });
  res.cookies.set('access_token', token, {
    httpOnly: true, secure: false, sameSite: 'lax', path: '/'
  });
  return res;
}