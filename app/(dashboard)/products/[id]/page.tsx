'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, Save } from 'lucide-react'

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [form, setForm] = useState({
    name: '', description: '',
    costPrice: '', sellPrice: '',
    recurringCostPrice: '', recurringSellPrice: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    fetch(`/api/products`)
      .then(r => r.json())
      .then((products: any[]) => {
        // fetch all and find by id since we don't have a GET /api/products/[id]
      })

    // fetch all products to find this one
    fetch('/api/products').then(async r => {
      // products only returns active ones, so fetch differently
    })

    // Use the edit endpoint directly
    fetch(`/api/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      .catch(() => {})

    // Load via a quick GET on the list and filter — or just use prisma studio
    // Actually we'll load via a dedicated fetch
    fetch(`/api/products/all`)
      .catch(() => {})

    // Simple approach: load via the update route returning the product
    loadProduct()
  }, [id])

  async function loadProduct() {
    // We'll fetch via a query param
    const res = await fetch(`/api/products?all=1`)
    if (res.ok) {
      const list = await res.json()
      const product = list.find((p: any) => p.id === id)
      if (product) {
        setForm({
          name: product.name,
          description: product.description || '',
          costPrice: String(product.costPrice),
          sellPrice: String(product.sellPrice),
          recurringCostPrice: String(product.recurringCostPrice || ''),
          recurringSellPrice: String(product.recurringSellPrice || ''),
        })
        setIsRecurring(product.isRecurring)
        setIsActive(product.isActive)
      }
    }
    setLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        costPrice: parseFloat(form.costPrice) || 0,
        sellPrice: parseFloat(form.sellPrice) || 0,
        isRecurring,
        isActive,
        recurringCostPrice: isRecurring ? (parseFloat(form.recurringCostPrice) || 0) : null,
        recurringSellPrice: isRecurring ? (parseFloat(form.recurringSellPrice) || 0) : null,
      }),
    })

    setSaving(false)
    if (!res.ok) { setError('Failed to save.'); return }
    setSuccess('Product saved.')
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Product Details</h2>
          <div>
            <label className="label">Product Name <span className="text-red-500">*</span></label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Status</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[{ v: true, l: 'Active' }, { v: false, l: 'Inactive' }].map(opt => (
                <label key={String(opt.v)} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer ${isActive === opt.v ? (opt.v ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50') : 'border-gray-200'}`}>
                  <input type="radio" className="sr-only" checked={isActive === opt.v} onChange={() => setIsActive(opt.v)} />
                  <span className="text-sm font-medium">{opt.l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Once-Off Pricing</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Cost Price (R)</label>
              <input type="number" min="0" step="0.01" className="input" value={form.costPrice} onChange={e => set('costPrice', e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className="label">Sell Price (R)</label>
              <input type="number" min="0" step="0.01" className="input" value={form.sellPrice} onChange={e => set('sellPrice', e.target.value)} placeholder="0.00" />
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
            <span className="font-semibold text-gray-900 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-blue-500" /> Has monthly recurring fee
            </span>
          </label>
          {isRecurring && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="label">Cost Price (R/mo)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.recurringCostPrice} onChange={e => set('recurringCostPrice', e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="label">Sell Price (R/mo)</label>
                <input type="number" min="0" step="0.01" className="input" value={form.recurringSellPrice} onChange={e => set('recurringSellPrice', e.target.value)} placeholder="0.00" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/products" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
