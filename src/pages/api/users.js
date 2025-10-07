// /pages/api/users.js

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

// ---------- Turso (libSQL) setup ----------
// Comment this block OUT if you're using a local DB
const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const adapter = new PrismaLibSQL(libsql)
const prisma = new PrismaClient({ adapter })

// ---------- Local DB (e.g. SQLite/Postgres/MySQL via Prisma) ----------
// Uncomment this line INSTEAD if you want to use your local DB
// const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const users = await prisma.user.findMany()
    console.log('users', users)
    return res.status(200).json(users)
  } else if (req.method === 'POST') {
    const { name, email } = req.body
    const user = await prisma.user.create({
      data: { name, email },
    })
    return res.status(201).json(user)
  } else {
    // Method Not Allowed
    return res.status(405).end()
  }
}
