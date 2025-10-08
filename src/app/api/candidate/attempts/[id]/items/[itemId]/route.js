// src/app/api/candidate/attempts/[id]/items/[itemId]/route.js
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET || "devsecret_change_me";

async function getUser() {
  const jar = await cookies();
  const t = jar.get("access_token")?.value;
  if (!t) return null;
  try { return jwt.verify(t, SECRET); } catch { return null; }
}

const toArr = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try { const parsed = JSON.parse(v); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  return [];
};

export async function PATCH(req, context) {
  const { id, itemId } = await context.params; // Next 15: await params once
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const requested = toArr(body?.selectedOptionIds).map(String); // normalize to string[]

  // Load item and ensure it belongs to this user & attempt
  const item = await prisma.attemptItem.findFirst({
    where: { id: itemId, attempt: { id, userId: user.sub } },
    select: { allowMultiple: true, optionIds: true }
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // optionIds is stored as JSON string in DB → parse
  const allowedOptionIds = toArr(item.optionIds).map(String);

  // keep only valid options
  const filtered = requested.filter(x => allowedOptionIds.includes(x));

  // single vs multi-select logic + dedupe
  const toSaveArray = item.allowMultiple
    ? [...new Set(filtered)]
    : (filtered[0] ? [filtered[0]] : []);

  // write back as JSON string
  await prisma.attemptItem.update({
    where: { id: itemId },
    data: { selectedOptionIds: JSON.stringify(toSaveArray) },
  });

  return NextResponse.json({ ok: true });
}
