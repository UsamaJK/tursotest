// src/app/api/candidate/attempts/[id]/certificate.pdf/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import QRCode from "qrcode";
import React from "react";
import Certificate from "@/cert/Certificate";
import fs from "fs";
import path from "path";

import chromium from "@sparticuz/chromium";
import puppeteerCore from "puppeteer-core";

// ---------- session ----------
async function sessionFromCookies() {
  const jar = await cookies();
  const t = jar.get("access_token")?.value;
  if (!t) return null;
  try {
    return jwt.verify(
      t,
      process.env.ACCESS_TOKEN_SECRET ||
        process.env.JWT_ACCESS_SECRET ||
        "devsecret_change_me"
    );
  } catch {
    return null;
  }
}

// ---------- logo helpers ----------
function fileToDataUrl(absPath, mime = "image/png") {
  const buf = fs.readFileSync(absPath);
  return `data:${mime};base64,${buf.toString("base64")}`;
}
function inlinePlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="120">
    <rect width="100%" height="100%" fill="#0ea5e9"/>
    <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle"
      font-family="system-ui, -apple-system, Segoe UI" font-size="28" fill="white">
      English Proficiency
    </text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}
function resolveLogoDataUrl() {
  try {
    const fromPublic = path.join(process.cwd(), "public", "cert", "logo.png");
    if (fs.existsSync(fromPublic)) return fileToDataUrl(fromPublic, "image/png");
    const fileEnv = process.env.CERT_LOGO_FILE;
    if (fileEnv) {
      const abs = path.isAbsolute(fileEnv)
        ? fileEnv
        : path.join(process.cwd(), fileEnv);
      if (fs.existsSync(abs)) {
        const ext = path.extname(abs).toLowerCase();
        const mime = ext === ".svg" ? "image/svg+xml" : "image/png";
        return fileToDataUrl(abs, mime);
      }
    }
    const urlEnv = process.env.CERT_LOGO_URL;
    if (urlEnv && /^https?:\/\//i.test(urlEnv)) return urlEnv;
    return inlinePlaceholder();
  } catch {
    return inlinePlaceholder();
  }
}

// ---------- browser launcher (dual-path) ----------
async function launchBrowser(html) {
  const isServerless =
    !!process.env.VERCEL ||
    !!process.env.AWS_REGION ||
    process.env.NODE_ENV === "production";

  // Try serverless-friendly path first if on Vercel
  if (isServerless) {
    const executablePath = await chromium.executablePath();
    const browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: chromium.headless ?? true,
      defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
    });
    return browser;
  }

  // ---- Local dev fallbacks ----
  // 1) If dev installed "puppeteer", prefer its executablePath
  try {
    // This import only exists if you installed `puppeteer` (not core)
    // eslint-disable-next-line import/no-extraneous-dependencies
    const puppeteer = (await import("puppeteer")).default;
    const browser = await puppeteer.launch({
      headless: true,
      defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
    });
    return browser;
  } catch {
    // continue to manual paths
  }

  // 2) Manual Chrome paths for common OSes
  const candidates = [];
  if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium"
    );
  } else if (process.platform === "win32") {
    candidates.push(
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    );
  } else {
    candidates.push("/usr/bin/google-chrome", "/usr/bin/chromium-browser");
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const b = await puppeteerCore.launch({
        headless: true,
        executablePath: p,
        defaultViewport: { width: 1200, height: 800, deviceScaleFactor: 2 },
      });
      return b;
    }
  }

  throw new Error(
    "No runnable Chromium/Chrome found. For local dev, install `puppeteer` (devDependency) or set CERT_CHROME_PATH to a Chrome executable."
  );
}

// ---------- route ----------
export async function GET(_req, context) {
  const { renderToStaticMarkup } = await import("react-dom/server");

  const { id } = await context.params;
  const s = await sessionFromCookies();
  if (!s) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!attempt || (s.role !== "ADMIN" && attempt.userId !== s.sub)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (attempt.status !== "SUBMITTED") {
    return NextResponse.json({ error: "Attempt not submitted" }, { status: 409 });
  }

  // ensure issuance data
  let { certificateId, issuedAt, verifySlug, region } = attempt;
  if (!certificateId || !issuedAt || !verifySlug) {
    certificateId = `T-${String(Math.floor(Math.random() * 1_000_0000)).padStart(
      7,
      "0"
    )}`;
    verifySlug = crypto.randomUUID();
    issuedAt = new Date();
    await prisma.attempt.update({
      where: { id },
      data: { certificateId, verifySlug, issuedAt },
    });
  }
  region ||= "European Union";

  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const verifyUrl = `${base}/verify/${verifySlug}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, scale: 6 });
  const logoUrl = resolveLogoDataUrl();

  const displayName = (attempt.user.fullName || "")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  const level = attempt.level || "A1";

  const html =
    "<!doctype html>" +
    renderToStaticMarkup(
      <Certificate
        platform="English Proficiency Platform"
        logoUrl={logoUrl}
        user={{ name: displayName }}
        level={level}
        ladder={["A1", "A2", "B1", "B2", "C1", "C2"]}
        details={{
          certificateId,
          attemptId: attempt.id,
          issuedAt: issuedAt.toISOString(),
          region,
          descriptor: {
            A1: "Can understand and use familiar everyday expressions and very basic phrases aimed at the satisfaction of needs of a concrete type.",
            A2: "Can communicate in simple and routine tasks requiring a simple and direct exchange of information on familiar topics and activities.",
            B1: "Can understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure, etc.",
            B2: "Can understand the main ideas of complex text on both concrete and abstract topics, including technical discussions in their field of specialization.",
            C1: "Can express ideas fluently and spontaneously without much obvious searching for expressions.",
            C2: "Can understand with ease virtually everything heard or read and can express themselves spontaneously, very fluently and precisely.",
          }[level],
        }}
        verifyUrl={verifyUrl}
        qrDataUrl={qrDataUrl}
      />
    );

  // ▶ Launch headless Chrome in a way that works both on Vercel and locally
  const browser = await launchBrowser();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
  });
  await browser.close();

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${certificateId}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
