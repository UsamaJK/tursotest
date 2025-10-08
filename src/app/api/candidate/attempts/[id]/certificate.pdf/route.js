export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

// keep your HTML design:
import React from 'react';
import Certificate from '@/cert/Certificate';

// headless chrome (serverless-friendly)
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';


if (process.env.VERCEL) {
    process.env.FONTCONFIG_PATH = '/tmp';
  }
// (optional) help fontconfig f
// ───────────────── helpers ─────────────────
async function sessionFromCookies() {
  const jar = await cookies();
  const t = jar.get('access_token')?.value;
  if (!t) return null;
  try {
    return jwt.verify(
      t,
      process.env.ACCESS_TOKEN_SECRET ||
        process.env.JWT_ACCESS_SECRET ||
        'devsecret_change_me'
    );
  } catch {
    return null;
  }
}

function fileToDataUrl(abs, mime = 'image/png') {
  const buf = fs.readFileSync(abs);
  return `data:${mime};base64,${buf.toString('base64')}`;
}
function placeholderLogo() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120">
    <rect width="100%" height="100%" fill="#0ea5e9"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui, -apple-system, Segoe UI" font-size="28" fill="white">
      English Proficiency
    </text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
function resolveLogoDataUrl() {
  try {
    const p1 = path.join(process.cwd(), 'public', 'cert', 'logo.png');
    if (fs.existsSync(p1)) return fileToDataUrl(p1, 'image/png');
    const fileEnv = process.env.CERT_LOGO_FILE;
    if (fileEnv) {
      const abs = path.isAbsolute(fileEnv) ? fileEnv : path.join(process.cwd(), fileEnv);
      if (fs.existsSync(abs)) {
        const ext = path.extname(abs).toLowerCase();
        const mime = ext === '.svg' ? 'image/svg+xml' : 'image/png';
        return fileToDataUrl(abs, mime);
      }
    }
    const urlEnv = process.env.CERT_LOGO_URL;
    if (urlEnv && /^https?:\/\//i.test(urlEnv)) return urlEnv;
    return placeholderLogo();
  } catch {
    return placeholderLogo();
  }
}

// dual-path launcher: Vercel (chromium) vs local (puppeteer or system Chrome)
async function launchBrowser() {
  const isServerless = !!process.env.VERCEL || process.env.NODE_ENV === 'production';

  if (isServerless) {
    // recommended flags for serverless
    chromium.setHeadlessMode = true;
    chromium.setGraphicsMode = false;

    const executablePath = await chromium.executablePath(); // /tmp/chromium on Vercel
    return await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless ?? true,
      defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
    });
  }

  // Local dev: prefer devDependency "puppeteer" if present
  try {
    const puppeteer = (await import('puppeteer')).default;
    return await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
    });
  } catch {
    // fall back to system Chrome paths
    const candidates =
      process.platform === 'darwin'
        ? [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium',
          ]
        : process.platform === 'win32'
        ? [
            'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
            'C:\\\\Program Files (x86)\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe',
          ]
        : ['/usr/bin/google-chrome', '/usr/bin/chromium-browser'];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        return await puppeteerCore.launch({
          headless: true,
          executablePath: p,
          defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
        });
      }
    }
    throw new Error(
      'No local Chrome found. Add devDependency "puppeteer" or set CERT_CHROME_PATH.'
    );
  }
}

// ───────────────── route ─────────────────
export async function GET(_req, context) {
  // use your existing HTML component (no design changes)
  const { renderToStaticMarkup } = await import('react-dom/server');

  const { id } = await context.params;
  const s = await sessionFromCookies();
  if (!s) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!attempt || (s.role !== 'ADMIN' && attempt.userId !== s.sub)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (attempt.status !== 'SUBMITTED') {
    return NextResponse.json({ error: 'Attempt not submitted' }, { status: 409 });
  }

  // ensure issuance fields once
  let { certificateId, issuedAt, verifySlug, region } = attempt;
  if (!certificateId || !issuedAt || !verifySlug) {
    certificateId = `T-${String(Math.floor(Math.random() * 1_000_0000)).padStart(7, '0')}`;
    verifySlug = crypto.randomUUID();
    issuedAt = new Date();
    await prisma.attempt.update({
      where: { id },
      data: { certificateId, verifySlug, issuedAt },
    });
  }
  region ||= 'European Union';

  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const verifyUrl = `${base}/verify/${verifySlug}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 6 });
  const logoUrl = resolveLogoDataUrl();

  const displayName = (attempt.user.fullName || '')
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
  const level = attempt.level || 'A1';

  // your HTML design (exact `<Certificate />`)
  const html =
    '<!doctype html>' +
    renderToStaticMarkup(
      <Certificate
        platform="English Proficiency Platform"
        logoUrl={logoUrl}
        user={{ name: displayName }}
        level={level}
        ladder={['A1', 'A2', 'B1', 'B2', 'C1', 'C2']}
        details={{
          certificateId,
          attemptId: attempt.id,
          issuedAt: issuedAt.toISOString(),
          region,
          descriptor: {
            A1: 'Can understand and use familiar everyday expressions and very basic phrases aimed at the satisfaction of needs of a concrete type.',
            A2: 'Can communicate in simple and routine tasks requiring a simple and direct exchange of information on familiar topics and activities.',
            B1: 'Can understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure, etc.',
            B2: 'Can understand the main ideas of complex text on both concrete and abstract topics, including technical discussions in their field of specialization.',
            C1: 'Can express ideas fluently and spontaneously without much obvious searching for expressions.',
            C2: 'Can understand with ease virtually everything heard or read and can express themselves spontaneously, very fluently and precisely.',
          }[level],
        }}
        verifyUrl={verifyUrl}
        qrDataUrl={qrDataUrl}
      />
    );

  // generate PDF with headless Chrome (serverless-safe)
  const browser = await launchBrowser();
  const page = await browser.newPage();

  // Improve font rendering / emoji support if needed:
  // await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB' });

  await page.setContent(html, { 
    waitUntil: ['load', 'networkidle0'] 
  });
  await page.evaluateHandle('document.fonts.ready');


  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
  });

  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${certificateId}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
