import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

// GET /api/products - List all products with optional search and category filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const categoria = searchParams.get("categoria") || ""

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { descricao: { contains: search } },
        { codigoSistema: { equals: parseInt(search) || -1 } },
        { codigoBalanca: { equals: parseInt(search) || -1 } },
      ]
    }

    if (categoria && categoria !== "Todos") {
      where.categoria = categoria
    }

    const products = await db.product.findMany({
      where,
      orderBy: { descricao: "asc" },
    })

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
