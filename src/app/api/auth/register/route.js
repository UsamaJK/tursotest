// src/app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { signAccess } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const passwordRule = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const fieldsSchema = z.object({
  fullName: z.string().min(2, 'Full name is required.'),
  email: z.string().email('Enter a valid email.'),
  password: z.string().regex(passwordRule, 'Use 8+ chars with upper, lower & number.'),
  phone: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  consent: z.enum(['true'], { errorMap: () => ({ message: 'Consent is required.' }) })
});

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

async function saveUpload(file, prefix) {
  // Dev-friendly local storage to /public/uploads (swap to S3 later)
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error('FILE_TOO_LARGE');
  if (!ALLOWED_MIME.has(file.type)) throw new Error('BAD_MIME');

  const filename = `${prefix}_${crypto.randomUUID()}${extFromType(file.type)}`;
  const rel = path.posix.join('uploads', filename);
  const abs = path.join(process.cwd(), 'public', rel);
  await writeFile(abs, bytes);
  return `/${rel}`; // public URL
}

function extFromType(t) {
  if (t === 'image/jpeg') return '.jpg';
  if (t === 'image/png') return '.png';
  if (t === 'image/webp') return '.webp';
  if (t === 'application/pdf') return '.pdf';
  return '';
}

export async function POST(req) {
  // Expect multipart/form-data
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
    consent: form.get('consent') ?? ''
  };
  const parsed = fieldsSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.flatten() } }, { status: 422 });
  }

  const selfie = form.get('selfie');
  const idDoc = form.get('idDoc');
  if (!(selfie instanceof File) || !(idDoc instanceof File)) {
    return NextResponse.json({ ok: false, error: { code: 'FILES_REQUIRED', message: 'Selfie and ID document are required.' } }, { status: 400 });
  }

  // email uniqueness
  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) {
    return NextResponse.json({ ok: false, error: { code: 'EMAIL_EXISTS', message: 'This email is already registered.' } }, { status: 409 });
  }

  // Save files (local dev). Swap this to S3 later.
  let selfieUrl, idDocUrl;
  try {
    selfieUrl = await saveUpload(selfie, 'selfie');
    idDocUrl = await saveUpload(idDoc, 'id');
  } catch (e) {
    const map = { FILE_TOO_LARGE: 'File too large (max 5MB).', BAD_MIME: 'Unsupported file type.' };
    const msg = map[e.message] || 'Failed to save files.';
    return NextResponse.json({ ok: false, error: { code: 'UPLOAD_ERROR', message: msg } }, { status: 400 });
  }

  const hash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email: parsed.data.email,
        passwordHash: hash,
        role: 'CANDIDATE',
        fullName: parsed.data.fullName,
        phone: parsed.data.phone || null,
        country: parsed.data.country || null,
        city: parsed.data.city || null,
        kycStatus: 'PENDING' // if you added it
      }
    });

    await tx.identityVerification.create({
      data: {
        userId: u.id,
        selfieUrl,
        idDocUrl,
        status: 'PENDING',
        consentAt: new Date()
      }
    });

    return u;
  });

  // Auto-login after registration
  const token = signAccess({ sub: user.id, role: user.role, name: user.fullName, email:user.email });
  const res = NextResponse.json({ ok: true, data: { user: { id: user.id, role: user.role, name: user.fullName, email:user.email } } });
  res.cookies.set('access_token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  return res;
}