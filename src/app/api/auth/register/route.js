// src/app/api/auth/register/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';
import { put } from '@vercel/blob';

import { prisma } from '@/lib/prisma';
import { signAccess } from '@/lib/auth';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const fieldsSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Enter a valid email.'),
  password: z.string().regex(passwordRule, 'Use 8+ chars with upper, lower & number.'),
  phone: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  consent: z.enum(['true'], { errorMap: () => ({ message: 'Consent is required.' }) }),
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_BYTES = 5 * 1024 * 1024;

function extFromType(t) {
  if (t === 'image/jpeg') return '.jpg';
  if (t === 'image/png') return '.png';
  if (t === 'image/webp') return '.webp';
  if (t === 'application/pdf') return '.pdf';
  return '';
}

async function uploadToBlob(file, prefix) {
  if (!(file instanceof File)) throw new Error('BAD_FILE');

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error('FILE_TOO_LARGE');
  if (!ALLOWED_MIME.has(file.type)) throw new Error('BAD_MIME');

  const key = `${prefix}/${crypto.randomUUID()}${extFromType(file.type)}`;

  const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
  // Token (local dev) => must be public; Vercel prod (no token) => can be private
  const access = hasToken ? 'public' : 'private';

  const { url } = await put(key, bytes, {
    access,
    contentType: file.type,
    token: hasToken ? process.env.BLOB_READ_WRITE_TOKEN : undefined,
  });

  return url;
}

export async function POST(req) {
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ ok: false, error: { code: 'BAD_REQUEST', message: 'Expected form-data' } }, { status: 400 });
  }

  const fields = {
    fullName: form.get('fullName') ?? '',
    email: form.get('email') ?? '',
    password: form.get('password') ?? '',
    phone: form.get('phone') ?? '',
    country: form.get('country') ?? '',
    city: form.get('city') ?? '',
    consent: form.get('consent') ?? '',
  };

  const parsed = fieldsSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } },
      { status: 422 }
    );
  }

  const selfie = form.get('selfie');
  const idDoc  = form.get('idDoc');
  if (!(selfie instanceof File) || !(idDoc instanceof File)) {
    return NextResponse.json(
      { ok: false, error: { code: 'FILES_REQUIRED', message: 'Selfie and ID document are required.' } },
      { status: 400 }
    );
  }

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json(
      { ok: false, error: { code: 'EMAIL_EXISTS', message: 'This email is already registered.' } },
      { status: 409 }
    );
  }

  let selfieUrl, idDocUrl;
  try {
    selfieUrl = await uploadToBlob(selfie, 'selfies');
    idDocUrl  = await uploadToBlob(idDoc,  'id-docs');
  } catch (e) {
    const code = e.message || 'UPLOAD_ERROR';
    const map = {
      BAD_FILE: 'Invalid file.',
      FILE_TOO_LARGE: 'File too large (max 5MB).',
      BAD_MIME: 'Unsupported file type.',
    };
    return NextResponse.json(
      { ok: false, error: { code, message: map[code] || code.replace(/_/g, ' ') } },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: parsed.data.email,
        passwordHash,
        role: 'CANDIDATE',
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        country: parsed.data.country || null,
        city: parsed.data.city || null,
        kycStatus: 'PENDING',
      },
    });

    await tx.identityVerification.create({
      data: {
        userId: u.id,
        selfieUrl,
        idDocUrl,
        status: 'PENDING',
        consentAt: new Date(),
      },
    });

    return u;
  });

  const token = signAccess({ sub: user.id, role: user.role, name: user.fullName, email: user.email });

  const res = NextResponse.json({
    ok: true,
    data: { user: { id: user.id, role: user.role, name: user.fullName, email: user.email } },
  });

  const isProd = process.env.NODE_ENV === 'production';
  res.cookies.set('access_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  });

  return res;
}
