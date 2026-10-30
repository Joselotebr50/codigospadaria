// Seed idempotente: cria dados iniciais apenas se nao existirem.
// NAO sobrescreve edicoes feitas pelo usuario (update: {}).
// Roda no build da Vercel: node scripts/seed.mjs
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

const db = new PrismaClient()

async function main() {
  const jsonPath = path.join(process.cwd(), 'download', 'padaria_base_unificada.json')
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const produtos = Array.isArray(data) ? data : data.produtos

  // Admin (cria apenas se nao existir)
  const hashed = await bcrypt.hash('admin123', 10)
  await db.user.upsert({
    where: { email: 'admin@padaria.com' },
    update: {},
    create: {
      email: 'admin@padaria.com',
      password: hashed,
      name: 'Administrador',
      role: 'admin',
    },
  })
  console.log('✅ Admin garantido: admin@padaria.com')

  // Produtos (cria apenas os que faltam; preserva edicoes e arquivamentos)
  let criados = 0
  for (const p of produtos) {
    const res = await db.product.upsert({
      where: { codigoSistema: p.codigo_sistema },
      update: {},
      create: {
        codigoSistema: p.codigo_sistema,
        descricao: p.descricao,
        unidade: p.unidade,
        codigoBalanca: p.codigo_balanca,
        categoria: p.categoria,
      },
    })
    if (res.createdAt.getTime() === res.updatedAt.getTime()) criados++
  }
  console.log(`✅ Produtos garantidos: ${produtos.length} (novos: ${criados})`)
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
