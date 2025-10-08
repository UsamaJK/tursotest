export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { chromium } from "playwright";
import QRCode from "qrcode";
import React from "react";
import Certificate from "@/cert/Certificate";
import fs from "fs";
import path from "path";

// Always await cookies() in Next 15+
async function sessionFromCookies() {
  const store = await cookies();
  const t = store.get("access_token")?.value;
  if (!t) return null;
  try {
    return jwt.verify(t, process.env.JWT_ACCESS_SECRET || "devsecret_change_me");
  } catch {
    return null;
  }
}

// Convert logo to base64 data URL
function getLogoDataUrl() {
  try {
    const logoPath = path.join(process.cwd(), "public", "cert", "logo.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const base64Logo = logoBuffer.toString("base64");
    return `data:image/png;base64,${base64Logo}`;
  } catch (error) {
    console.error("Error reading logo:", error);
    return null;
  }
}

export async function GET(_req, ctx) {
  // Dynamic import keeps this server-only
  const { renderToStaticMarkup } = await import("react-dom/server");

  const { id } = await ctx.params;
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

  // Ensure issuance fields once
  let { certificateId, issuedAt, verifySlug, region } = attempt;
  if (!certificateId || !issuedAt || !verifySlug) {
    certificateId = `T-${String(Math.floor(Math.random() * 1_000_0000)).padStart(7, "0")}`;
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
  
  // Get logo as data URL for embedding in PDF
  const logoDataUrl = getLogoDataUrl();

  // Title-case the full name for display
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
        logoUrl={logoDataUrl}
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

  const browser = await chromium.launch(); // add { args: ['--no-sandbox'] } in restricted hosts
  const page = await browser.newPage({ deviceScaleFactor: 2 });
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