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

export async function GET(req) {
  const user = await getUser();
  if (!user || user.role !== "CANDIDATE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 10)));

  const where = { userId: user.sub };

  const [total, items] = await Promise.all([
    prisma.attempt.count({ where }),
    prisma.attempt.findMany({
      where,
      orderBy: { startedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      // select ONLY the fields that exist in your schema
      select: {
        id: true,
        startedAt: true,
        finishedAt: true,
        status: true,
        level: true,
      },
    }),
  ]);

  return NextResponse.json({
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    items,
  });
}