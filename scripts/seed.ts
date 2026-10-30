import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const db = new PrismaClient()

interface ProductInput {
  codigo_sistema: number
  descricao: string
  unidade: string
  codigo_balanca: number
  categoria: string
}

interface PadariaData {
  produtos: ProductInput[]
}

async function main() {
  console.log('🌱 Seeding database...')

  // Read JSON data
  const jsonPath = path.join(process.cwd(), 'download', 'padaria_base_unificada.json')
  const rawData = fs.readFileSync(jsonPath, 'utf-8')
  const data: PadariaData = JSON.parse(rawData)

  // Clear existing data
  await db.product.deleteMany()
  await db.user.deleteMany()

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await db.user.create({
    data: {
      email: 'admin@padaria.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'admin',
    },
  })
  console.log(`✅ Admin user created: ${admin.email}`)

  // Seed products
  const products = data.produtos.map((p) => ({
    codigoSistema: p.codigo_sistema,
    descricao: p.descricao,
    unidade: p.unidade,
    codigoBalanca: p.codigo_balanca,
    categoria: p.categoria,
  }))

  const result = await db.product.createMany({ data: products })
  console.log(`✅ ${result.count} products seeded`)

  // Summary
  const categories = await db.product.groupBy({
    by: ['categoria'],
    _count: { categoria: true },
  })
  console.log('\n📊 Products by category:')
  categories.forEach((c) => {
    console.log(`   ${c.categoria}: ${c._count.categoria}`)
  })

  console.log('\n🎉 Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
