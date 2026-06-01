'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2, RefreshCw, Package, PenLine } from 'lucide-react'

interface Client { id: string; companyName: string; contactPerson: string }
interface Product {
  id: string; name: string; description?: string
  costPrice: number; sellPrice: number
  isRecurring: boolean; recurringCostPrice?: number; recurringSellPrice?: number
}
interface DocumentType { id: string; name: string; description?: string }

interface QuoteItem {
  productId: string | null
  description: string
  quantity: number
  costPrice: number
  sellPrice: number
  isRecurring: boolean
  recurringCostPrice: number
  recurringSellPrice: number
  isCustom: boolean
}

const emptyItem = (): QuoteItem => ({
  productId: null, description: '', quantity: 1,
  costPrice: 0, sellPrice: 0,
  isRecurring: false, recurringCostPrice: 0, recurringSellPrice: 0,
  isCustom: true,
})

function formatZAR(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
}

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('clientId')

  const [clients, setClients] = useState<Client[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [docTypes, setDocTypes] = useState<DocumentType[]>([])
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '')
  const [contractTerm, setContractTerm] = useState(12)
  const [validUntil, setValidUntil] = useState('')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [items, setItems] = useState<QuoteItem[]>([emptyItem()])
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/products').then(r => r.json()),
      fetch('/api/document-types').then(r => r.json()),
    ]).then(([c, p, d]) => { setClients(c); setProducts(p); setDocTypes(d) })
  }, [])

  function addItem() { setItems(prev => [...prev, emptyItem()]) }
  function removeItem(idx: number) { setItems(prev => prev.filter((_, i) => i !== idx)) }

  function updateItem<K extends keyof QuoteItem>(idx: number, field: K, value: QuoteItem[K]) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  function selectProduct(idx: number, productId: string) {
    if (!productId) {
      setItems(prev => prev.map((item, i) => i === idx ? { ...emptyItem(), isCustom: true } : item))
      return
    }
    const p = products.find(p => p.id === productId)
    if (!p) return
    setItems(prev => prev.map((item, i) => i === idx ? {
      ...item,
      productId: p.id,
      description: p.name,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
      isRecurring: p.isRecurring,
      recurringCostPrice: p.recurringCostPrice ?? 0,
      recurringSellPrice: p.recurringSellPrice ?? 0,
      isCustom: false,
    } : item))
  }

  function toggleDoc(id: string) {
    setSelectedDocIds(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id])
  }

  const totalOnceOff = items.reduce((s, i) => s + i.sellPrice * i.quantity, 0)
  const totalMonthly = items.reduce((s, i) => s + (i.isRecurring ? i.recurringSellPrice * i.quantity : 0), 0)

  async function handleSubmit(e: React.FormEvent, sendNow = false) {
    e.preventDefault()
    setError('')
    if (!selectedClientId) { setError('Please select a client.'); return }
    if (items.some(i => !i.description.trim())) { setError('All items must have a description.'); return }
    setLoading(true)

    const payload = {
      clientId: selectedClientId,
      contractTerm,
      validUntil: validUntil || null,
      notes: notes || null,
      internalNotes: internalNotes || null,
      items: items.map(({ isCustom, ...i }) => i),
      requiredDocIds: selectedDocIds,
    }

    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) { setError('Failed to create quote.'); setLoading(false); return }
    const quote = await res.json()

    if (sendNow) await fetch(`/api/quotes/${quote.id}/send`, { method: 'POST' })
    router.push(`/quotes/${quote.id}`)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/quotes" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Quotes
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Quote</h1>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

      <form onSubmit={e => handleSubmit(e, false)} className="space-y-6">
        {/* Quote Details */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quote Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Client <span className="text-red-500">*</span></label>
              <select className="input" value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} required>
                <option value="">Select a client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.companyName} — {c.contactPerson}</option>)}
              </select>
              <Link href="/clients/new" className="text-xs text-blue-600 hover:underline mt-1 inline-block">+ Add new client</Link>
            </div>
            <div>
              <label className="label">Contract Term <span className="text-red-500">*</span></label>
              <select className="input" value={contractTerm} onChange={e => setContractTerm(parseInt(e.target.value))}>
                {[1,3,6,12,24,36,48,60].map(m => <option key={m} value={m}>{m} month{m !== 1 ? 's' : ''}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Valid Until</label>
              <input type="date" className="input" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Line Items</h2>
            <button type="button" onClick={addItem} className="btn-secondary btn-sm">
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                {/* Item header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Item {idx + 1}</span>
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Product selector */}
                <div className="mb-3">
                  <label className="label">Product</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <select
                        className="input pl-9"
                        value={item.productId || ''}
                        onChange={e => selectProduct(idx, e.target.value)}
                      >
                        <option value="">— Custom item —</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    {!item.isCustom && (
                      <button
                        type="button"
                        title="Switch to custom"
                        onClick={() => setItems(prev => prev.map((it, i) => i === idx ? { ...it, productId: null, isCustom: true } : it))}
                        className="btn-secondary btn-sm px-2.5"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Description + Quantity row */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div className="col-span-3">
                    <label className="label">Description <span className="text-red-500">*</span></label>
                    <input
                      className="input"
                      value={item.description}
                      onChange={e => updateItem(idx, 'description', e.target.value)}
                      placeholder={item.isCustom ? 'Product or service description' : ''}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Qty</label>
                    <input
                      type="number" min="1" step="1"
                      className="input text-center font-medium"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                </div>

                {/* Once-off pricing */}
                <div className="bg-white rounded-lg p-3 mb-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Once-Off Fee (per unit)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Cost Price (R)</label>
                      <input type="number" min="0" step="0.01" className="input" value={item.costPrice || ''} onChange={e => updateItem(idx, 'costPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    </div>
                    <div>
                      <label className="label">Sell Price (R)</label>
                      <input type="number" min="0" step="0.01" className="input" value={item.sellPrice || ''} onChange={e => updateItem(idx, 'sellPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                    </div>
                  </div>
                  {item.quantity > 1 && item.sellPrice > 0 && (
                    <p className="text-xs text-blue-600 mt-1.5">Line total: {formatZAR(item.sellPrice * item.quantity)}</p>
                  )}
                </div>

                {/* Recurring toggle */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={item.isRecurring} onChange={e => updateItem(idx, 'isRecurring', e.target.checked)} />
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Has monthly recurring fee
                    </span>
                  </label>
                  {item.isRecurring && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 mb-2">Monthly Recurring (per unit)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Cost Price (R/mo)</label>
                          <input type="number" min="0" step="0.01" className="input" value={item.recurringCostPrice || ''} onChange={e => updateItem(idx, 'recurringCostPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                        </div>
                        <div>
                          <label className="label">Sell Price (R/mo)</label>
                          <input type="number" min="0" step="0.01" className="input" value={item.recurringSellPrice || ''} onChange={e => updateItem(idx, 'recurringSellPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" />
                        </div>
                      </div>
                      {item.quantity > 1 && item.recurringSellPrice > 0 && (
                        <p className="text-xs text-blue-600 mt-1.5">Monthly line total: {formatZAR(item.recurringSellPrice * item.quantity)}/mo</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 bg-gray-900 text-white rounded-lg p-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-300 text-sm">Once-Off Total (excl. VAT)</span>
              <span className="font-mono font-semibold">{formatZAR(totalOnceOff)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-300 text-sm">Once-Off Total (incl. VAT 15%)</span>
              <span className="font-mono">{formatZAR(totalOnceOff * 1.15)}</span>
            </div>
            <div className="border-t border-gray-700 pt-3">
              <div className="flex justify-between mb-1">
                <span className="text-gray-300 text-sm">Monthly Total (excl. VAT)</span>
                <span className="font-mono font-semibold">{formatZAR(totalMonthly)}/mo</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300 text-sm">Monthly Total (incl. VAT 15%)</span>
                <span className="font-mono text-blue-300 font-bold">{formatZAR(totalMonthly * 1.15)}/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Required Documents */}
        {docTypes.length > 0 && (
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-1">Required Documents</h2>
            <p className="text-sm text-gray-500 mb-4">Select all documents the client must upload during onboarding.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {docTypes.map(doc => (
                <label key={doc.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedDocIds.includes(doc.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <input type="checkbox" className="mt-0.5 w-4 h-4 rounded text-blue-600" checked={selectedDocIds.includes(doc.id)} onChange={() => toggleDoc(doc.id)} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{doc.name}</p>
                    {doc.description && <p className="text-xs text-gray-400">{doc.description}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="card p-6 space-y-3">
          <h2 className="font-semibold text-gray-900">Notes</h2>
          <div>
            <label className="label">Client-Facing Notes</label>
            <textarea className="input" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Appears on the quote PDF..." />
          </div>
          <div>
            <label className="label">Internal Notes</label>
            <textarea className="input" rows={2} value={internalNotes} onChange={e => setInternalNotes(e.target.value)} placeholder="Not shown to client..." />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end pb-8">
          <Link href="/quotes" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-secondary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save as Draft
          </button>
          <button type="button" disabled={loading} onClick={e => handleSubmit(e as never, true)} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Save & Send to Client
          </button>
        </div>
      </form>
    </div>
  )
}
