// src/app/api/admin/settings/route.js
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const TAGS = ["A1","A2","B1","B2","C1","C2"];
const percent = z.coerce.number().int().min(0).max(100);

const settingsSchema = z.object({
  durationMin: z.coerce.number().int().min(1).max(600),
  criteria: z.object({
    A1: z.coerce.number().int().min(0),
    A2: z.coerce.number().int().min(0),
    B1: z.coerce.number().int().min(0),
    B2: z.coerce.number().int().min(0),
    C1: z.coerce.number().int().min(0),
    C2: z.coerce.number().int().min(0),
  }),
  resultCriteria: z.object({
    A1: percent, A2: percent, B1: percent, B2: percent, C1: percent, C2: percent,
  }),
});

const toStr = (obj) => JSON.stringify(obj ?? {});
const toObj = (val) => {
  if (!val) return {};
  if (typeof val === "string") { try { return JSON.parse(val); } catch { return {}; } }
  return val;
};

async function countsByTag() {
  const rows = await prisma.question.groupBy({ by: ["tag"], _count: { tag: true } });
  const map = Object.fromEntries(TAGS.map(t => [t, 0]));
  for (const r of rows) map[r.tag] = r._count.tag;
  return map;
}

export async function GET() {
  let settings = await prisma.testSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await prisma.testSettings.create({
      data: {
        id: 1,
        durationMin: 30,
        criteria: toStr({ A1:0,A2:0,B1:0,B2:0,C1:0,C2:0 }),
        resultCriteria: toStr({ A1:60,A2:60,B1:60,B2:60,C1:60,C2:60 }),
      },
    });
  }

  const available = await countsByTag();
  const criteria       = { A1:0,A2:0,B1:0,B2:0,C1:0,C2:0, ...toObj(settings.criteria) };
  const resultCriteria = { A1:60,A2:60,B1:60,B2:60,C1:60,C2:60, ...toObj(settings.resultCriteria) };

  return NextResponse.json({
    durationMin: settings.durationMin,
    criteria,
    resultCriteria,
    available,
    updatedAt: settings.updatedAt,
  });
}

export async function PUT(req) {
  const body = await req.json().catch(() => ({}));
  const parsed = settingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", details: parsed.error.flatten() }, { status: 422 });
  }

  const { durationMin, criteria, resultCriteria } = parsed.data;

  const available = await countsByTag();
  const fieldErrors = {};
  for (const t of TAGS) {
    if ((criteria[t] ?? 0) > (available[t] ?? 0)) fieldErrors[t] = `Max ${available[t]} available for ${t}`;
  }
  const total = TAGS.reduce((s,t)=> s + (Number(criteria[t])||0), 0);
  if (total <= 0) fieldErrors._total = "Total must be greater than 0.";
  if (Object.keys(fieldErrors).length) {
    return NextResponse.json({ error:"Validation failed", fieldErrors }, { status: 422 });
  }

  await prisma.testSettings.upsert({
    where: { id: 1 },
    update: {
      durationMin,
      criteria: toStr(criteria),
      resultCriteria: toStr(resultCriteria),
    },
    create: {
      id: 1,
      durationMin,
      criteria: toStr(criteria),
      resultCriteria: toStr(resultCriteria),
    },
  });

  return NextResponse.json({ ok: true });
}
