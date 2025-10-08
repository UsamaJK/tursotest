// src/app/api/candidate/attempts/start/route.js
export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const TAGS_FALLBACK = ["A1","A2","B1","B2","C1","C2"];
const SECRET = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_ACCESS_SECRET || "devsecret_change_me";

async function getUser() {
  const jar = await cookies();
  const token = jar.get("access_token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a; }
const toStrArray = (arr) => JSON.stringify(Array.isArray(arr) ? arr : []);

export async function POST() {
  const user = await getUser();
  if (!user || user.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // settings.criteria is a JSON string in SQLite/Turso — parse safely
  const settings = await prisma.testSettings.findUnique({ where: { id: 1 } });
  const crit = (() => {
    if (!settings?.criteria) return {};
    if (typeof settings.criteria === "string") {
      try { return JSON.parse(settings.criteria); } catch { return {}; }
    }
    return settings.criteria || {};
  })();

  const TAGS = TAGS_FALLBACK; // schema uses String for tag

  const items = [];
  for (const tag of TAGS) {
    const need = Number(crit[tag] || 0);
    if (!need) continue;

    const qs = await prisma.question.findMany({
      where: { tag },
      include: { options: { orderBy: { order: "asc" } } },
    });

    const chosen = shuffle(qs).slice(0, Math.min(need, qs.length));
    for (const q of chosen) {
      const optionIds = q.options.map(o => o.id);
      const correctOptionIds = q.options.filter(o => o.isCorrect).map(o => o.id);

      items.push({
        questionId: q.id,
        allowMultiple: q.allowMultiple,
        optionIds: toStrArray(optionIds),             // <-- stringify
        correctOptionIds: toStrArray(correctOptionIds),// <-- stringify
      });
    }
  }

  if (items.length === 0) {
    return NextResponse.json({ error: "No questions configured." }, { status: 409 });
  }

  const created = await prisma.attempt.create({
    data: {
      userId: user.sub,
      items: {
        create: items.map((it, i) => ({
          questionId: it.questionId,
          allowMultiple: it.allowMultiple,
          optionIds: it.optionIds,               // already string
          correctOptionIds: it.correctOptionIds, // already string
          order: i,
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ attemptId: created.id }, { status: 201 });
}
