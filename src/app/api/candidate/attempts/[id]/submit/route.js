// src/app/api/candidate/attempts/[id]/submit/route.js
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET || "devsecret_change_me";
const TAGS = ["A1","A2","B1","B2","C1","C2"];

async function getUser() {
  const jar = await cookies();
  const t = jar.get("access_token")?.value;
  if (!t) return null;
  try { return jwt.verify(t, SECRET); } catch { return null; }
}

// helpers for String <-> Array and String <-> Object
const toArr = (v) => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
};
const toObj = (v, fallback = {}) => {
  if (!v) return fallback;
  if (typeof v === "string") {
    try { const p = JSON.parse(v); return (p && typeof p === "object") ? p : fallback; } catch { return fallback; }
  }
  return (v && typeof v === "object") ? v : fallback;
};

export async function POST(_req, context) {
  const { id } = await context.params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 0) Load attempt items for this user
  const items = await prisma.attemptItem.findMany({
    where: { attemptId: id, attempt: { userId: user.sub } },
    select: {
      id: true,
      selectedOptionIds: true,  // JSON string in DB
      correctOptionIds: true,   // JSON string in DB
      question: { select: { tag: true } },
    },
  });
  if (!items.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 1) Mark isCorrect per item (compare arrays after parsing)
  const updates = [];
  let overallCorrect = 0;
  for (const it of items) {
    const sel = toArr(it.selectedOptionIds).slice().sort().join(",");
    const ans = toArr(it.correctOptionIds).slice().sort().join(",");
    const isCorrect = sel === ans && ans.length > 0;
    if (isCorrect) overallCorrect++;
    updates.push(prisma.attemptItem.update({ where: { id: it.id }, data: { isCorrect } }));
  }

  // 2) Fetch thresholds (resultCriteria is a JSON string)
  const settings = await prisma.testSettings.findUnique({ where: { id: 1 } });
  const rc = {
    A1: 60, A2: 60, B1: 65, B2: 70, C1: 75, C2: 80,
    ...toObj(settings?.resultCriteria, {}),
  };

  // 3) Aggregate by tag
  const total = Object.fromEntries(TAGS.map(t => [t, 0]));
  const correct = Object.fromEntries(TAGS.map(t => [t, 0]));

  for (const it of items) {
    const tag = it.question?.tag;
    if (!tag || !(tag in total)) continue;

    total[tag]++;

    const sel = toArr(it.selectedOptionIds).slice().sort().join(",");
    const ans = toArr(it.correctOptionIds).slice().sort().join(",");
    if (sel === ans && ans.length > 0) correct[tag]++;
  }

  const perTag = {};
  for (const t of TAGS) {
    const tot = total[t];
    const cor = correct[t];
    const pct = tot ? (cor / tot) * 100 : null; // null if no questions for tag
    const threshold = Number(rc[t] ?? 0);
    const passed = tot === 0 ? null : pct >= threshold;
    perTag[t] = { total: tot, correct: cor, pct, threshold, passed };
  }

  // 4) Ladder evaluation: highest consecutive passed tag
  let lastPassed = null;
  for (const t of TAGS) {
    const info = perTag[t];
    if (info.total === 0) continue;   // ignore empty tags
    if (info.passed) lastPassed = t;
    else break;
  }
  const finalLevel = lastPassed || "A1";

  // 5) Persist in one transaction
  await prisma.$transaction([
    ...updates,
    prisma.attempt.update({
      where: { id },
      data: { status: "SUBMITTED", finishedAt: new Date(), level: finalLevel },
    }),
  ]);

  return NextResponse.json({ ok: true, level: finalLevel, perTag });
}
