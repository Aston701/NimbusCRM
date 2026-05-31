'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Send,
  Download,
  CheckCircle,
  RefreshCw,
  FileText,
  Upload,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { format } from 'date-fns'

function formatZAR(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-yellow-100 text-yellow-700',
  }
  const labels: Record<string, string> = {
    DRAFT: 'Draft', SENT: 'Sent', ACCEPTED: 'Accepted', REJECTED: 'Rejected', EXPIRED: 'Expired',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || map.DRAFT}`}>
      {labels[status] || status}
    </span>
  )
}

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    const res = await fetch(`/api/quotes/${id}`)
    const data = await res.json()
    setQuote(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function sendQuote() {
    setSending(true)
    setMessage('')
    const res = await fetch(`/api/quotes/${id}/send`, { method: 'POST' })
    if (res.ok) {
      setMessage('Quote sent successfully!')
      load()
    } else {
      setMessage('Failed to send. Check email configuration.')
    }
    setSending(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!quote) return <div className="p-6">Quote not found.</div>

  const onceOffItems = quote.items.filter((i: any) => i.sellPrice > 0)
  const recurringItems = quote.items.filter((i: any) => i.isRecurring && i.recurringSellPrice > 0)

  const uploadedDocIds = (quote.uploadedDocs || []).map((d: any) => d.documentTypeId)

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/quotes" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Quotes
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{quote.quoteNumber}</h1>
              <Badge status={quote.status} />
            </div>
            <p className="text-gray-500 text-sm mt-0.5">
              {quote.client.companyName} · Created by {quote.createdBy.name} · {format(new Date(quote.createdAt), 'dd MMM yyyy')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/quotes/${id}/pdf`}
              target="_blank"
              className="btn-secondary btn-sm"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </a>
            {(quote.status === 'DRAFT' || quote.status === 'SENT') && (
              <button
                onClick={sendQuote}
                disabled={sending}
                className="btn-primary btn-sm"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {quote.status === 'SENT' ? 'Resend Quote' : 'Send to Client'}
              </button>
            )}
          </div>
        </div>
        {message && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Client + Quote Info */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Client</h2>
            <Link href={`/clients/${quote.clientId}`} className="text-blue-600 hover:underline font-medium">
              {quote.client.companyName}
            </Link>
            <p className="text-sm text-gray-500 mt-0.5">{quote.client.contactPerson}</p>
            <p className="text-sm text-gray-500">{quote.client.email}</p>
            <p className="text-sm text-gray-500">{quote.client.phone}</p>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-3 text-sm">Quote Details</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Contract Term</dt>
                <dd className="font-medium">{quote.contractTerm} months</dd>
              </div>
              {quote.validUntil && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Valid Until</dt>
                  <dd>{format(new Date(quote.validUntil), 'dd MMM yyyy')}</dd>
                </div>
              )}
              {quote.sentAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sent</dt>
                  <dd>{format(new Date(quote.sentAt), 'dd MMM yyyy')}</dd>
                </div>
              )}
              {quote.acceptedAt && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Accepted</dt>
                  <dd className="text-green-600 font-medium">{format(new Date(quote.acceptedAt), 'dd MMM yyyy')}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Onboarding status */}
          {quote.onboarding && (
            <div className={`card p-5 ${quote.onboarding.status === 'SUBMITTED' ? 'border-green-200' : 'border-blue-200'}`}>
              <h2 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Onboarding
              </h2>
              <p className={`text-sm font-medium ${quote.onboarding.status === 'SUBMITTED' ? 'text-green-600' : 'text-blue-600'}`}>
                {quote.onboarding.status === 'SUBMITTED' ? 'Completed' : 'In Progress'}
              </p>
              {quote.onboarding.submittedAt && (
                <p className="text-xs text-gray-400 mt-1">
                  Submitted {format(new Date(quote.onboarding.submittedAt), 'dd MMM yyyy')}
                </p>
              )}
              <a
                href={`/portal/${quote.onboarding.token}`}
                target="_blank"
                className="btn-secondary btn-sm mt-3 inline-flex"
              >
                <ExternalLink className="w-3 h-3" /> View Portal
              </a>
            </div>
          )}

          {/* Totals */}
          <div className="card p-5 bg-slate-900 text-white border-0">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Totals (excl. VAT)</h2>
            {quote.totalOnceOff > 0 && (
              <div className="flex justify-between mb-1">
                <span className="text-slate-400 text-sm">Once-Off</span>
                <span className="font-mono font-semibold">{formatZAR(quote.totalOnceOff)}</span>
              </div>
            )}
            {quote.totalMonthly > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400 text-sm">Monthly</span>
                <span className="font-mono font-semibold text-blue-300">{formatZAR(quote.totalMonthly)}/mo</span>
              </div>
            )}
            <div className="border-t border-slate-700 mt-3 pt-3 text-xs text-slate-500">
              All prices exclude VAT (15%)
            </div>
          </div>
        </div>

        {/* Right: Items + Docs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Once-off items */}
          {onceOffItems.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 font-semibold text-sm text-gray-900">
                Once-Off Items
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 font-medium">Description</th>
                    <th className="text-right px-5 py-2.5 font-medium">Cost</th>
                    <th className="text-right px-5 py-2.5 font-medium">Sell</th>
                    <th className="text-right px-5 py-2.5 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {onceOffItems.map((item: any, idx: number) => {
                    const margin = item.costPrice > 0 ? ((item.sellPrice - item.costPrice) / item.sellPrice * 100) : null
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-5 py-3">{item.description}</td>
                        <td className="px-5 py-3 text-right text-gray-500">{formatZAR(item.costPrice)}</td>
                        <td className="px-5 py-3 text-right font-medium">{formatZAR(item.sellPrice)}</td>
                        <td className="px-5 py-3 text-right text-gray-400 text-xs">
                          {margin !== null ? `${margin.toFixed(0)}%` : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Recurring items */}
          {recurringItems.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 font-semibold text-sm text-gray-900 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-blue-500" /> Monthly Recurring Items
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                    <th className="text-left px-5 py-2.5 font-medium">Description</th>
                    <th className="text-right px-5 py-2.5 font-medium">Cost/mo</th>
                    <th className="text-right px-5 py-2.5 font-medium">Sell/mo</th>
                    <th className="text-right px-5 py-2.5 font-medium">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recurringItems.map((item: any, idx: number) => {
                    const cost = item.recurringCostPrice || 0
                    const sell = item.recurringSellPrice || 0
                    const margin = cost > 0 ? ((sell - cost) / sell * 100) : null
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-5 py-3">{item.description}</td>
                        <td className="px-5 py-3 text-right text-gray-500">{formatZAR(cost)}</td>
                        <td className="px-5 py-3 text-right font-medium text-blue-700">{formatZAR(sell)}</td>
                        <td className="px-5 py-3 text-right text-gray-400 text-xs">
                          {margin !== null ? `${margin.toFixed(0)}%` : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Required documents */}
          {quote.requiredDocs?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-500" /> Required Documents
              </h2>
              <div className="space-y-2">
                {quote.requiredDocs.map((rd: any) => {
                  const uploaded = uploadedDocIds.includes(rd.documentTypeId)
                  return (
                    <div key={rd.id} className={`flex items-center gap-3 p-2.5 rounded-lg ${uploaded ? 'bg-green-50' : 'bg-gray-50'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${uploaded ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className="text-sm">{rd.documentType.name}</span>
                      {uploaded && <span className="ml-auto text-xs text-green-600 font-medium">Uploaded</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Uploaded documents */}
          {quote.uploadedDocs?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-3 text-sm">
                Uploaded Documents ({quote.uploadedDocs.length})
              </h2>
              <div className="space-y-2">
                {quote.uploadedDocs.map((doc: any) => (
                  <a
                    key={doc.id}
                    href={`/api/uploads/${quote.id}/${doc.fileName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-gray-900 group-hover:text-blue-700">
                        {doc.originalName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {doc.documentType?.name || doc.label} · {(doc.fileSize / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <Download className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {(quote.notes || quote.internalNotes) && (
            <div className="card p-5">
              {quote.notes && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Client Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.internalNotes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Internal Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{quote.internalNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
