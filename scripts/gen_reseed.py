#!/usr/bin/env python3
"""
Resync the database with cleaned JSON data.
"""
import json
import subprocess

# Load cleaned JSON
with open("/home/z/my-project/download/padaria_base_unificada.json", "r", encoding="utf-8") as f:
    data = json.load(f)

products = data["produtos"]
print(f"Produtos no JSON limpo: {len(products)}")

# Generate a seed script that will delete all products and re-insert
seed_code = '''import { db } from "@/lib/db";

async function main() {
  // Delete all existing products
  await db.product.deleteMany({});
  console.log("Deleted all products");

  const products = [
'''

for p in products:
    seed_code += f'    {{ codigoSistema: {p["codigo_sistema"]}, descricao: "{p["descricao"]}", unidade: "{p["unidade"]}", codigoBalanca: {p["codigo_balanca"]}, categoria: "{p["categoria"]}" }},\n'

seed_code += '''  ];

  for (const product of products) {
    await db.product.create({ data: product });
  }
  console.log(`Seeded ${products.length} products`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
'''

with open("/home/z/my-project/scripts/reseed.ts", "w", encoding="utf-8") as f:
    f.write(seed_code)

print("Script de re-seed gerado: scripts/reseed.ts")
