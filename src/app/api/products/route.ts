import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Normalize text for accent-insensitive search
// Removes diacritics so "pao" matches "PÃO", "qjo" matches "QUEIJO", etc.
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove all combining diacritical marks
    .toUpperCase()
}

// GET /api/products - List all products with optional search and category filter
// Search is accent-insensitive: "pao" → PÃO, "qjo" → QUEIJO, etc.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoria = searchParams.get("categoria") || ""

    // Build Prisma where clause (category filter only)
    const where: Record<string, unknown> = {}
    if (categoria && categoria !== "Todos") {
      where.categoria = categoria
    }

    let products = await db.product.findMany({
      where,
      orderBy: { descricao: "asc" },
    })

    // Apply accent-insensitive search filtering in JS
    // Supports multiple words: "bolo choc" → matches BOLO ... CHOCOLATE
    // Each word must appear somewhere in the product text (AND logic)
    if (search) {
      // Split search into individual words (normalized, accent-free)
      const searchWords = search
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .map(normalize)

      const searchNum = parseInt(search) || -1

      products = products.filter((p) => {
        // Match by exact codigo_sistema or codigo_balanca number
        if (p.codigoSistema === searchNum) return true
        if (p.codigoBalanca === searchNum) return true

        // Match by partial codigo_sistema or codigo_balanca string
        if (String(p.codigoBalanca).includes(search.trim())) return true
        if (String(p.codigoSistema).includes(search.trim())) return true

        // Match descricao: every search word must be found (accent-insensitive)
        const descNorm = normalize(p.descricao)
        return searchWords.every((word) => descNorm.includes(word))
      })
    }

    // Get category counts
    const categories = await db.product.groupBy({
      by: ["categoria"],
      _count: { categoria: true },
      orderBy: { categoria: "asc" },
    })

    return NextResponse.json({
      products,
      categories: categories.map((c) => ({
        name: c.categoria,
        count: c._count.categoria,
      })),
      total: await db.product.count(),
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product (requires auth)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { descricao, codigoSistema, codigoBalanca, unidade, categoria } = body

    if (!descricao || !codigoSistema || !codigoBalanca || !unidade || !categoria) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios" },
        { status: 400 }
      )
    }

    const product = await db.product.create({
      data: {
        descricao,
        codigoSistema: parseInt(codigoSistema),
        codigoBalanca: parseInt(codigoBalanca),
        unidade,
        categoria,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Erro ao criar produto" },
      { status: 500 }
    )
  }
}
