import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// If TURSO env vars exist, use libSQL adapter; otherwise fall back to default Prisma
function makePrisma() {
  if (process.env.TURSO_DATABASE_URL) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }
  return new PrismaClient()
}

// Singleton across dev hot-reloads
const globalForPrisma = globalThis
export const prisma = globalForPrisma.__prisma__ ?? makePrisma()
if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma__ = prisma
