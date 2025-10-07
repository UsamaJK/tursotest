// src/app/api/candidate/attempts/[id]/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const SECRET = process.env.JWT_ACCESS_SECRET || "devsecret_change_me";

async function getUser() {
  const store = await cookies();
  const t = store.get("access_token")?.value;
  if (!t) return null;
  try { return jwt.verify(t, SECRET); } catch { return null; }
}

export async function GET(_req, ctx) {
  const { id } = await ctx.params;
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const attempt = await prisma.attempt.findFirst({
    where: { id, userId: user.sub },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          question: {
            select: {
              id: true, text: true, tag: true, allowMultiple: true,
              options: { select: { id: true, text: true, order: true }, orderBy: { order: "asc" } }
            }
          }
        }
      }
    }
  });
  if (!attempt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // compute remaining time from TestSettings.durationMin
  const settings = await prisma.testSettings.findUnique({ where: { id: 1 } });
  const durationMin = settings?.durationMin ?? 30;

  const now = Date.now();
  const startedMs = new Date(attempt.startedAt).getTime();
  const total = durationMin * 60; // seconds
  const elapsed = Math.floor((now - startedMs) / 1000);
  const secondsLeft = Math.max(0, total - elapsed);

  return NextResponse.json({
    id: attempt.id,
    status: attempt.status,
    durationMin,
    secondsLeft,                          // ⬅️ expose to client
    items: attempt.items.map(it => ({
      id: it.id,
      order: it.order,
      allowMultiple: it.allowMultiple,
      selectedOptionIds: it.selectedOptionIds,
      question: it.question,
    })),
  });
}