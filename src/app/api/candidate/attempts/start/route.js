import { NextResponse } from "next/server";
import { PrismaClient, Level } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_ACCESS_SECRET || "devsecret_change_me";

async function getUser() {
  const store = await cookies();
  const token = store.get("access_token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]} return a; }

export async function POST() {
  const user = await getUser();
  if (!user || user.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await prisma.testSettings.findUnique({ where: { id: 1 } });
  const crit = settings?.criteria || {};

  const items = [];
  for (const tag of Object.values(Level)) {
    const need = Number(crit[tag] || 0);
    if (!need) continue;

    const qs = await prisma.question.findMany({
      where: { tag },
      include: { options: { orderBy: { order: "asc" } } },
    });

    const chosen = shuffle(qs).slice(0, Math.min(need, qs.length));
    for (const q of chosen) {
      items.push({
        questionId: q.id,
        allowMultiple: q.allowMultiple,
        optionIds: q.options.map(o => o.id),
        correctOptionIds: q.options.filter(o => o.isCorrect).map(o => o.id),
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
          optionIds: it.optionIds,
          correctOptionIds: it.correctOptionIds,
          order: i,
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ attemptId: created.id }, { status: 201 });
}