'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react'

export default function NewProductPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '',
    costPrice: '', sellPrice: '',
    recurringCostPrice: '', recurringSellPrice: '',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        description: form.description || undefined,
        costPrice: parseFloat(form.costPrice) || 0,
        sellPrice: parseFloat(form.sellPrice) || 0,
        isRecurring,
        recurringCostPrice: isRecurring ? (parseFloat(form.recurringCostPrice) || 0) : null,
        recurringSellPrice: isRecurring ? (parseFloat(form.recurringSellPrice) || 0) : null,
      }),
    })

    setLoading(false)
    if (!res.ok) { setError('Failed to create product.'); return }
    router.push('/products')
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Product Details</h2>
          <div>
            <label className="label">Product Name <span className="text-red-500">*</span></label>
            <input className="input" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Hosted PBX Line" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional short description" />
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Once-Off Pricing</h2>
          <p className="text-xs text-gray-400">Leave at 0 if this product has no once-off fee.</p>
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
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
