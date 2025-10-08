import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

import {prisma} from "@/lib/prisma"
const SECRET = process.env.JWT_ACCESS_SECRET || "devsecret_change_me";

async function getUser() {
  const store = await cookies();
  const token = store.get("access_token")?.value;
  if (!token) return null;
  try { return jwt.verify(token, SECRET); } catch { return null; }
}

export async function GET() {
  const user = await getUser();
  if (!user || user.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const s = await prisma.testSettings.findUnique({ where: { id: 1 } });
  return NextResponse.json({ durationMin: s?.durationMin ?? 30 });
}