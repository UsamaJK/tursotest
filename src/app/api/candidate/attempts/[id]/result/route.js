import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import {prisma} from "@/lib/prisma"
const SECRET = process.env.JWT_ACCESS_SECRET || "devsecret_change_me";
const TAGS = ["A1","A2","B1","B2","C1","C2"];

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

  const att = await prisma.attempt.findFirst({
    where: { id, userId: user.sub },
    select: { id: true, status: true, level: true }
  });
  if (!att) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (att.status !== "SUBMITTED") return NextResponse.json({ error: "Not submitted" }, { status: 409 });

  const level = att.level || "A1";                      // baseline A1

  return NextResponse.json({
    id: att.id,
    status: att.status,
    level,
    ladder: TAGS,
    nextActions: {
      canDownloadCertificate: true,
      canRetake: true
    }
  });
}