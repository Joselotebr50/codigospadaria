'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Search, Plus, Pencil, LogOut, Package, X, Loader2, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// Types
interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Product {
  id: string
  codigoSistema: number
  descricao: string
  unidade: string
  codigoBalanca: number
  categoria: string
  archived: boolean
  createdAt: string
  updatedAt: string
}

interface CategoryInfo {
  name: string
  count: number
}

// Category emoji map
const CATEGORY_EMOJI: Record<string, string> = {
  'Pães': '🍞',
  'Bolos': '🍰',
  'Biscoitos': '🍪',
  'Tortas': '🥧',
  'Pizzas': '🍕',
  'Confeitaria': '🧁',
  'Produtos Amanhecidos': '🔄',
  'Outros': '📦',
}

// Unit options
const UNIT_OPTIONS = ['KG', 'UND', '200G', '250G', '300G', '350G', '400G', '450G', '750G']

// Category options
const CATEGORY_OPTIONS = ['Biscoitos', 'Bolos', 'Confeitaria', 'Pães', 'Pizzas', 'Produtos Amanhecidos', 'Tortas', 'Outros']

// Product form state
interface ProductForm {
  descricao: string
  codigoSistema: string
  codigoBalanca: string
  unidade: string
  categoria: string
}

const emptyForm: ProductForm = {
  descricao: '',
  codigoSistema: '',
  codigoBalanca: '',
  unidade: 'KG',
  categoria: 'Pães',
}

export default function HomePage() {
  // Auth state
  const [user, setUser] = useState<User | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  // Products state
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<CategoryInfo[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [archivedCount, setArchivedCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')
  const [showArchived, setShowArchived] = useState(false)
  const [productsLoading, setProductsLoading] = useState(false)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductForm>(emptyForm)
  const [saving, setSaving] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('padaria_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('padaria_user')
      }
    }
  }, [])

  // Fetch products when user is authenticated or filters change
  const fetchProducts = useCallback(async () => {
    if (!user) return
    setProductsLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set('search', searchQuery)
      if (selectedCategory !== 'Todos') params.set('categoria', selectedCategory)
      params.set('archived', showArchived ? 'true' : 'false')

      const res = await fetch(`/api/products?${params.toString()}`)
      const data = await res.json()
      setProducts(data.products)
      setCategories(data.categories)
      setTotalCount(data.total)
      setArchivedCount(data.archivedCount || 0)
    } catch (err) {
      console.error('Error fetching products:', err)
      toast.error('Erro ao carregar produtos')
    } finally {
      setProductsLoading(false)
    }
  }, [user, searchQuery, selectedCategory, showArchived])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setLoginError(data.error || 'Erro ao fazer login')
        return
      }

      setUser(data)
      localStorage.setItem('padaria_user', JSON.stringify(data))
      toast.success(`Bem-vindo, ${data.name}!`)
    } catch {
      setLoginError('Erro de conexão com o servidor')
    } finally {
      setLoginLoading(false)
    }
  }

  // Archive/Unarchive product
  const handleToggleArchive = async (product: Product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id}`,
        },
        body: JSON.stringify({ archived: !product.archived }),
      })
      if (!res.ok) {
        toast.error('Erro ao arquivar produto')
        return
      }
      toast.success(product.archived ? 'Produto restaurado!' : 'Produto arquivado!')
      fetchProducts()
    } catch {
      toast.error('Erro de conexão')
    }
  }

  // Delete product permanently
  const handleDelete = async (product: Product) => {
    if (!confirm(`Excluir permanentemente "${product.descricao}"?`)) return
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user?.id}` },
      })
      if (!res.ok) {
        toast.error('Erro ao excluir produto')
        return
      }
      toast.success('Produto excluído permanentemente!')
      fetchProducts()
    } catch {
      toast.error('Erro de conexão')
    }
  }

  // Logout handler
  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('padaria_user')
    setProducts([])
    setCategories([])
    setTotalCount(0)
    setArchivedCount(0)
    setSearchQuery('')
    setSelectedCategory('Todos')
    setShowArchived(false)
    toast.info('Sessão encerrada')
  }

  // Open add modal
  const handleAdd = () => {
    setEditingProduct(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  // Open edit modal
  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      descricao: product.descricao,
      codigoSistema: String(product.codigoSistema),
      codigoBalanca: String(product.codigoBalanca),
      unidade: product.unidade,
      categoria: product.categoria,
    })
    setModalOpen(true)
  }

  // Save product (create or update)
  const handleSave = async () => {
    if (!form.descricao || !form.codigoSistema || !form.codigoBalanca) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setSaving(true)
    try {
      const payload = {
        descricao: form.descricao,
        codigoSistema: parseInt(form.codigoSistema),
        codigoBalanca: parseInt(form.codigoBalanca),
        unidade: form.unidade,
        categoria: form.categoria,
      }

      let res: Response
      if (editingProduct) {
        res = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.id}`,
          },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user?.id}`,
          },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Erro ao salvar produto')
        return
      }

      toast.success(editingProduct ? 'Produto atualizado!' : 'Produto criado!')
      setModalOpen(false)
      fetchProducts()
    } catch {
      toast.error('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  // Get filtered count for category chip
  const getCategoryCount = (catName: string) => {
    if (catName === 'Todos') return totalCount
    const found = categories.find((c) => c.name === catName)
    return found?.count || 0
  }

  // All categories for display
  const allCategories = ['Todos', ...CATEGORY_OPTIONS.filter((c) => categories.some((cat) => cat.name === c) || selectedCategory === c)]

  // ==================== LOGIN SCREEN ====================
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'oklch(0.96 0.01 85)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ backgroundColor: 'oklch(0.68 0.15 55)' }}>
                🍞
              </div>
              <CardTitle className="text-2xl font-bold" style={{ color: 'oklch(0.35 0.08 50)' }}>
                Padaria TATICO
              </CardTitle>
              <CardDescription className="text-sm">
                Sistema de Códigos de Produtos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@padaria.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-11"
                    autoComplete="current-password"
                  />
                </div>
                {loginError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="text-sm text-destructive bg-destructive/10 p-2 rounded-md"
                  >
                    {loginError}
                  </motion.div>
                )}
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={loginLoading}
                  style={{ backgroundColor: 'oklch(0.68 0.15 55)' }}
                >
                  {loginLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {loginLoading ? 'Entrando...' : 'Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // ==================== MAIN APP ====================
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'oklch(0.96 0.01 85)' }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ backgroundColor: 'oklch(0.68 0.15 55)', borderColor: 'oklch(0.58 0.12 55)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍞</span>
            <h1 className="text-lg font-bold text-white tracking-tight">Padaria TATICO</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80 hidden sm:inline">
              {user.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/90 hover:text-white hover:bg-white/20 h-9 px-2"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="sticky top-[52px] z-30 border-b" style={{ backgroundColor: 'oklch(0.96 0.01 85)', borderColor: 'oklch(0.88 0.03 85)' }}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, código sistema ou balança..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-11 bg-white/80 border-0 shadow-sm focus-visible:ring-2"
              style={{ '--tw-ring-color': 'oklch(0.68 0.15 55)' } as React.CSSProperties}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="sticky top-[108px] z-20 border-b" style={{ backgroundColor: 'oklch(0.96 0.01 85)', borderColor: 'oklch(0.88 0.03 85)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 px-4 py-3 overflow-x-auto hide-scrollbar">
            {/* Archived toggle */}
            <button
              onClick={() => { setShowArchived(!showArchived); setSelectedCategory('Todos') }}
              className={`
                flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                transition-all duration-200 whitespace-nowrap
                ${showArchived
                  ? 'text-white shadow-md scale-105'
                  : 'bg-white/60 text-foreground/70 hover:bg-white/90 hover:text-foreground shadow-sm'
                }
              `}
              style={showArchived ? { backgroundColor: 'oklch(0.55 0.08 250)' } : undefined}
            >
              <span>{showArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}</span>
              <span>{showArchived ? 'Arquivados' : 'Arquivados'}</span>
              <span className={`text-xs ${showArchived ? 'text-white/80' : 'text-muted-foreground'}`}>
                ({archivedCount})
              </span>
            </button>

            {!showArchived && allCategories.map((cat) => {
              const isActive = selectedCategory === cat
              const emoji = cat === 'Todos' ? '📋' : (CATEGORY_EMOJI[cat] || '📦')
              const count = getCategoryCount(cat)
              const displayName = cat === 'Produtos Amanhecidos' ? 'Amanhecidos' : cat

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium
                    transition-all duration-200 whitespace-nowrap
                    ${isActive
                      ? 'text-white shadow-md scale-105'
                      : 'bg-white/60 text-foreground/70 hover:bg-white/90 hover:text-foreground shadow-sm'
                    }
                  `}
                  style={isActive ? { backgroundColor: 'oklch(0.68 0.15 55)' } : undefined}
                >
                  <span>{emoji}</span>
                  <span>{displayName}</span>
                  <span className={`text-xs ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                    ({count})
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Product List */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-4 pb-24">
        {productsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.68 0.15 55)' }} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
            <p className="text-sm mt-1">Tente ajustar os filtros ou adicione um novo produto</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-0 shadow-sm bg-white/90">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Left side: info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm leading-tight mb-1.5 truncate" title={product.descricao}>
                            {product.descricao}
                          </h3>
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            <Badge
                              variant="secondary"
                              className="text-xs font-mono px-2"
                              style={{ backgroundColor: 'oklch(0.90 0.04 80)' }}
                            >
                              Sys: {product.codigoSistema}
                            </Badge>
                            <Badge
                              variant="outline"
                              className="text-xs px-2"
                            >
                              {product.unidade}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs">
                              {CATEGORY_EMOJI[product.categoria] || '📦'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {product.categoria === 'Produtos Amanhecidos' ? 'Amanhecidos' : product.categoria}
                            </span>
                          </div>
                        </div>
                        {/* Right side: Código Balança BIG */}
                        <div className="flex flex-col items-center justify-center flex-shrink-0 ml-2">
                          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                            Bal
                          </span>
                          <span
                            className="font-mono font-bold leading-none"
                            style={{
                              fontSize: product.codigoBalanca > 99999 ? '1.4rem' : '1.75rem',
                              color: 'oklch(0.45 0.10 50)',
                            }}
                          >
                            {product.codigoBalanca}
                          </span>
                        </div>
                        {/* Action buttons */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            className="h-7 w-7 hover:bg-amber-50"
                            style={{ color: 'oklch(0.55 0.10 55)' }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          {product.archived ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleArchive(product)}
                                className="h-7 w-7 hover:bg-green-50"
                                style={{ color: 'oklch(0.55 0.15 145)' }}
                                title="Restaurar"
                              >
                                <ArchiveRestore className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(product)}
                                className="h-7 w-7 hover:bg-red-50"
                                style={{ color: 'oklch(0.55 0.20 25)' }}
                                title="Excluir permanentemente"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleArchive(product)}
                              className="h-7 w-7 hover:bg-slate-50"
                              style={{ color: 'oklch(0.55 0.08 250)' }}
                              title="Arquivar"
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Results count */}
        {!productsLoading && products.length > 0 && (
          <p className="text-center text-xs text-muted-foreground mt-4 pb-4">
            {products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>

      {/* FAB - Add Product */}
      <motion.div
        className="fixed bottom-6 right-6 z-30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={handleAdd}
          className="h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-shadow"
          style={{ backgroundColor: 'oklch(0.68 0.15 55)' }}
          size="icon"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingProduct ? (
                <>
                  <Pencil className="h-5 w-5" style={{ color: 'oklch(0.68 0.15 55)' }} />
                  Editar Produto
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" style={{ color: 'oklch(0.68 0.15 55)' }} />
                  Novo Produto
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                placeholder="Ex: BOLO DE CHOCOLATE"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value.toUpperCase() })}
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="codigoSistema">Código Sistema *</Label>
                <Input
                  id="codigoSistema"
                  type="number"
                  placeholder="84347"
                  value={form.codigoSistema}
                  onChange={(e) => setForm({ ...form, codigoSistema: e.target.value })}
                  className="h-11 font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigoBalanca">Código Balança *</Label>
                <Input
                  id="codigoBalanca"
                  type="number"
                  placeholder="146425"
                  value={form.codigoBalanca}
                  onChange={(e) => setForm({ ...form, codigoBalanca: e.target.value })}
                  className="h-11 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unidade</Label>
              <Select value={form.unidade} onValueChange={(v) => setForm({ ...form, unidade: v })}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_EMOJI[c] || '📦'} {c === 'Produtos Amanhecidos' ? 'Amanhecidos' : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            {/* Archive button in edit modal */}
            {editingProduct && (
              <Button
                variant="outline"
                onClick={() => { handleToggleArchive(editingProduct); setModalOpen(false) }}
                disabled={saving}
                className="h-10 gap-1.5"
                style={{ borderColor: 'oklch(0.70 0.08 250)', color: 'oklch(0.45 0.08 250)' }}
              >
                {editingProduct.archived ? (
                  <><ArchiveRestore className="h-4 w-4" /> Restaurar</>
                ) : (
                  <><Archive className="h-4 w-4" /> Arquivar</>
                )}
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="h-10"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-10"
              style={{ backgroundColor: 'oklch(0.68 0.15 55)' }}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
