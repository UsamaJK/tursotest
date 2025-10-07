import { NextResponse } from 'next/server';
import { sessionFromRequest } from '@/lib/server-auth';
import { questionCreateSchema, Level } from '@/lib/validation/question';

import { prisma } from '@/lib/prisma';

export async function GET(req) {
  const s = sessionFromRequest(req);
  if (!s || s.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const page = Number(searchParams.get('page') || '1');
  const pageSize = Math.min(Number(searchParams.get('pageSize') || '20'), 50);

  const where = tag && Level.options.includes(tag) ? { tag } : {};
  const [total, items] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, text: true, tag: true, allowMultiple: true,
        options: { select: { id: true, text: true, isCorrect: true, order: true }, orderBy: { order: 'asc' } },
        createdAt: true
      }
    })
  ]);

  return NextResponse.json({
    items,
    page, pageSize, total,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  });
}

export async function POST(req) {
  const s = sessionFromRequest(req);
  if (!s || s.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const parsed = questionCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;

  const created = await prisma.question.create({
    data: {
      text: data.text,
      tag: data.tag,
      allowMultiple: data.allowMultiple,
      options: {
        create: data.options.map(o => ({ text: o.text, isCorrect: o.isCorrect, order: o.order }))
      }
    },
    include: { options: { orderBy: { order: 'asc' } } }
  });

  return NextResponse.json({ ok: true, question: created }, { status: 201 });
}