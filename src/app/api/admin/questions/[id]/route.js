// src/app/api/admin/questions/[id]/route.js
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { questionCreateSchema } from '@/lib/validation/question';
import { prisma } from '@/lib/prisma';
import { verifyAccess } from '@/lib/auth';

async function requireAdmin() {
  const jar = await cookies(); // Next 15: async
  const token = jar.get('access_token')?.value;
  if (!token) return null;
  const claims = verifyAccess(token);
  return claims?.role === 'ADMIN' ? claims : null;
}

export async function GET(_req, context) {
  const ctx = await context;
  const p = await ctx.params;
  const id = p.id;

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const q = await prisma.question.findUnique({
    where: { id },
    include: { options: { orderBy: { order: 'asc' } } },
  });
  if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json(q);
}

export async function PUT(req, context) {
  const ctx = await context;
  const p = await ctx.params;
  const id = p.id;

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = questionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid payload', details: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const { text, tag, allowMultiple, options } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.question.update({
        where: { id },
        data: { text, tag, allowMultiple },
      });

      await tx.option.deleteMany({ where: { questionId: id } });
      await tx.option.createMany({
        data: options.map((o, i) => ({
          questionId: id,
          text: o.text,
          isCorrect: !!o.isCorrect,
          order: i,
        })),
      });

      return updated;
    });

    return NextResponse.json({ ok: true, id: result.id });
  } catch {
    return NextResponse.json({ error: 'Failed to update question' }, { status: 500 });
  }
}

export async function DELETE(_req, context) {
  const ctx = await context;
  const p = await ctx.params;
  const id = p.id;

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
