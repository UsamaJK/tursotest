import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// (Optional) force dynamic for always-fresh data:
// export const dynamic = 'force-dynamic'

export async function GET() {
  const users = await prisma.user.findMany()
  return NextResponse.json(users, { status: 200 })
}

export async function POST(req) {
  const { name, email } = await req.json()
  const user = await prisma.user.create({ data: { name, email } })
  return NextResponse.json(user, { status: 201 })
}
