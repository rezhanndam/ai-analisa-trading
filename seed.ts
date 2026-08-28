import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  // Assets (SQLite tidak support skipDuplicates di createMany, pakai upsert)
  const assets = [
    { id: 'BTC-USDT', symbol: 'BTCUSDT', type: 'CRYPTO', provider: 'BINANCE' },
    { id: 'EUR-USD', symbol: 'EUR_USD', type: 'FOREX', provider: 'OANDA' },
  ]
  
  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {},
      create: asset,
    })
  }

  // Admin user untuk login (single-user, Section 2)
  const email = process.env.ADMIN_EMAIL || 'admin@aitrading.local'
  const password = process.env.ADMIN_PASSWORD || 'admin123'
  const hashed = await bcrypt.hash(password, 10)

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, password: hashed },
  })

  console.log(`Seed done. Admin: ${email} / password: ${process.env.ADMIN_PASSWORD ? '(dari env)' : 'admin123'}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())