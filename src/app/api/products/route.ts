import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// Normalize text for accent-insensitive search
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
}

// GET /api/products - List products with search, category, and archive filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoria = searchParams.get("categoria") || ""
    const archived = searchParams.get("archived") // "true", "false", or omitted

    // Build Prisma where clause
    const where: Record<string, unknown> = {}

    // Archive filter: by default show non-archived; "true" shows archived only; "all" shows both
    if (archived === "true") {
      where.archived = true
    } else if (archived === "false" || !archived) {
      where.archived = false
    }
    // if archived === "all", don't filter

    if (categoria && categoria !== "Todos") {
      where.categoria = categoria
    }

    let products = await db.product.findMany({
      where,
      orderBy: { descricao: "asc" },
    })

    // Apply accent-insensitive search filtering in JS
    if (search) {
      const searchWords = search
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0)
        .map(normalize)

      const searchNum = parseInt(search) || -1

      products = products.filter((p) => {
        if (p.codigoSistema === searchNum) return true
        if (p.codigoBalanca === searchNum) return true
        if (String(p.codigoBalanca).includes(search.trim())) return true
        if (String(p.codigoSistema).includes(search.trim())) return true
        const descNorm = normalize(p.descricao)
        return searchWords.every((word) => descNorm.includes(word))
      })
    }

    // Get category counts (non-archived only for main view)
    const categories = await db.product.groupBy({
      by: ["categoria"],
      where: { archived: archived === "true" ? true : false },
      _count: { categoria: true },
      orderBy: { categoria: "asc" },
    })

    // Get archived count
    const archivedCount = await db.product.count({ where: { archived: true } })

    return NextResponse.json({
      products,
      categories: categories.map((c) => ({
        name: c.categoria,
        count: c._count.categoria,
      })),
      total: await db.product.count({ where: { archived: false } }),
      archivedCount,
    })
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
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
