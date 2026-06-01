'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle,
  Upload,
  Download,
  Loader2,
  FileText,
  AlertCircle,
  ChevronRight,
  Building2,
  RefreshCw,
  CreditCard,
} from 'lucide-react'
import SignaturePad from '@/components/SignaturePad'

function formatZAR(n: number) {
  return `R ${n.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`
}

type Step = 'view' | 'accepted' | 'onboarding' | 'complete' | string

export default function ClientPortalPage() {
  const { token } = useParams<{ token: string }>()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<Step>('view')
  const [error, setError] = useState('')
  const [accepting, setAccepting] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [debitSignature, setDebitSignature] = useState<string | null>(null)
  const [debitAuthorized, setDebitAuthorized] = useState(false)

  async function loadQuote() {
    const res = await fetch(`/api/portal/${token}`)
    if (!res.ok) {
      setError('Invalid or expired link. Please contact your sales representative.')
      setLoading(false)
      return
    }
    const data = await res.json()
    setQuote(data)

    // Pre-fill form with client data
    setFormData({
      contactPerson: data.client.contactPerson || '',
      email: data.client.email || '',
      phone: data.client.phone || '',
      address: data.client.address || '',
      city: data.client.city || '',
      province: data.client.province || '',
      postalCode: data.client.postalCode || '',
      vatNo: data.client.vatNo || '',
      registrationNo: data.client.registrationNo || '',
    })

    // Determine current step
    if (data.onboarding?.status === 'SUBMITTED') {
      setStep('complete')
    } else if (data.status === 'ACCEPTED') {
      setStep('onboarding')
    } else {
      setStep('view')
    }

    // Track already-uploaded docs
    const uploaded: Record<string, boolean> = {}
    for (const doc of data.uploadedDocs || []) {
      if (doc.documentTypeId) uploaded[doc.documentTypeId] = true
    }
    setUploadedDocs(uploaded)

    setLoading(false)
  }

  useEffect(() => { loadQuote() }, [token])

  async function acceptQuote() {
    setAccepting(true)
    setError('')
    const res = await fetch(`/api/portal/${token}/accept`, { method: 'POST' })
    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Failed to accept quote.')
      setAccepting(false)
      return
    }
    await loadQuote()
    setStep('onboarding')
    setAccepting(false)
  }

  async function uploadDocument(docTypeId: string, file: File) {
    setUploadingId(docTypeId)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('documentTypeId', docTypeId)

    const res = await fetch(`/api/portal/${token}/upload`, { method: 'POST', body: fd })
    if (res.ok) {
      setUploadedDocs(prev => ({ ...prev, [docTypeId]: true }))
    } else {
      alert('Upload failed. Please try again.')
    }
    setUploadingId(null)
  }

  async function submitOnboarding(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (debitAuthorized && !debitSignature) {
      setError('Please draw your signature to authorize the debit order.')
      setSubmitting(false)
      return
    }

    const res = await fetch(`/api/portal/${quote.onboarding?.token || token}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        cofSigned: true,
        debitOrderAuthorized: debitAuthorized,
        debitOrderSignature: debitSignature || undefined,
        debitOrderAmount: quote.totalMonthly * 1.15,
      }),
    })

    if (!res.ok) {
      setError('Failed to submit. Please try again.')
      setSubmitting(false)
      return
    }

    setStep('complete')
    setSubmitting(false)
  }

  const company = {
    name: 'Dynamic Business Systems',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Link Not Found</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  const onceOffItems = quote.items.filter((i: any) => i.sellPrice > 0)
  const recurringItems = quote.items.filter((i: any) => i.isRecurring && i.recurringSellPrice > 0)
  const requiredDocs = quote.requiredDocs || []
  const allDocsUploaded = requiredDocs.every((rd: any) => uploadedDocs[rd.documentTypeId])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Portal Header */}
      <header className="bg-slate-900 text-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Building2 className="w-6 h-6 text-blue-400" />
          <div>
            <p className="font-bold text-sm">{company.name}</p>
            <p className="text-xs text-slate-400">Client Portal</p>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Step indicator */}
        {step !== 'complete' && (
          <div className="flex items-center gap-2 mb-6">
            {[
              { key: 'view', label: 'Review Quote' },
              { key: 'onboarding', label: 'Onboarding' },
              { key: 'complete', label: 'Done' },
            ].map((s, idx) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                    (step === 'view' && idx === 0) ||
                    (step === 'accepted' && idx === 0) ||
                    (step === 'onboarding' && idx === 1) ||
                    (step === 'complete' && idx === 2)
                      ? 'bg-blue-600 text-white'
                      : idx < (['view', 'accepted', 'onboarding', 'complete'].indexOf(step))
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <span className="text-sm text-gray-600 hidden sm:inline">{s.label}</span>
                {idx < 2 && <ChevronRight className="w-4 h-4 text-gray-300" />}
              </div>
            ))}
          </div>
        )}

        {/* ===== STEP: VIEW QUOTE ===== */}
        {(step === 'view' || step === 'accepted') && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Your Quotation</h1>
                  <p className="text-gray-500 text-sm">{quote.quoteNumber}</p>
                </div>
                <span className="badge bg-blue-100 text-blue-700">
                  {quote.contractTerm} month contract
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Dear <strong>{quote.client.contactPerson}</strong>, please review the quotation below from {company.name}.
              </p>

              {/* Once-off items */}
              {onceOffItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">Once-Off Fees</h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Description</th>
                          <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">Amount (excl. VAT)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {onceOffItems.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatZAR(item.sellPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Recurring items */}
              {recurringItems.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-500" /> Monthly Recurring Fees
                  </h3>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium">Description</th>
                          <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium">Monthly (excl. VAT)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recurringItems.map((item: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3">{item.description}</td>
                            <td className="px-4 py-3 text-right font-medium text-blue-700">{formatZAR(item.recurringSellPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Totals */}
              <div className="bg-slate-900 text-white rounded-lg p-4 mb-4">
                {quote.totalOnceOff > 0 && (
                  <div className="flex justify-between mb-1.5">
                    <span className="text-slate-300 text-sm">Once-Off Total (incl. VAT)</span>
                    <span className="font-mono font-semibold">{formatZAR(quote.totalOnceOff * 1.15)}</span>
                  </div>
                )}
                {quote.totalMonthly > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-300 text-sm">Monthly Total (incl. VAT)</span>
                    <span className="font-mono font-bold text-blue-300">{formatZAR(quote.totalMonthly * 1.15)}/mo</span>
                  </div>
                )}
              </div>

              {quote.notes && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4 border-l-4 border-blue-400">
                  <p className="text-sm text-gray-700">{quote.notes}</p>
                </div>
              )}

              {/* PDF Download */}
              <a
                href={`/api/portal/${token}/cof`}
                target="_blank"
                className="btn-secondary btn-sm inline-flex mb-6"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </a>

              {/* Accept button */}
              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm text-gray-600 mb-4">
                  By clicking <strong>Accept Quotation</strong>, you agree to the terms and conditions outlined in this quote and the {quote.contractTerm}-month contract term.
                </p>
                {error && (
                  <div className="mb-3 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
                )}
                <button
                  onClick={acceptQuote}
                  disabled={accepting}
                  className="btn-success w-full sm:w-auto py-3 px-8"
                >
                  {accepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  {accepting ? 'Processing...' : 'Accept Quotation'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== STEP: ONBOARDING ===== */}
        {step === 'onboarding' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-green-200 p-5">
              <div className="flex items-center gap-3 mb-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="font-semibold text-green-800">Quote Accepted!</h2>
              </div>
              <p className="text-sm text-gray-600 ml-8">
                Thank you! Please complete your onboarding below.
              </p>
            </div>

            <form onSubmit={submitOnboarding} className="space-y-4">
              {/* Contact Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Confirm Your Details</h2>
                <p className="text-sm text-gray-500 mb-4">
                  Please review and update your details. All fields marked with <span className="text-red-500">*</span> are required.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Contact Person <span className="text-red-500">*</span></label>
                    <input
                      className="input"
                      value={formData.contactPerson || ''}
                      onChange={e => setFormData(p => ({ ...p, contactPerson: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email Address <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email || ''}
                      onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone Number <span className="text-red-500">*</span></label>
                    <input
                      className="input"
                      value={formData.phone || ''}
                      onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">VAT Number</label>
                    <input
                      className="input"
                      value={formData.vatNo || ''}
                      onChange={e => setFormData(p => ({ ...p, vatNo: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Registration No.</label>
                    <input
                      className="input"
                      value={formData.registrationNo || ''}
                      onChange={e => setFormData(p => ({ ...p, registrationNo: e.target.value }))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Street Address</label>
                    <input
                      className="input"
                      value={formData.address || ''}
                      onChange={e => setFormData(p => ({ ...p, address: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input
                      className="input"
                      value={formData.city || ''}
                      onChange={e => setFormData(p => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Province</label>
                    <select
                      className="input"
                      value={formData.province || ''}
                      onChange={e => setFormData(p => ({ ...p, province: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(prov => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Postal Code</label>
                    <input
                      className="input"
                      value={formData.postalCode || ''}
                      onChange={e => setFormData(p => ({ ...p, postalCode: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              {/* Banking Details */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Banking Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Bank Name</label>
                    <input
                      className="input"
                      value={formData.bankName || ''}
                      onChange={e => setFormData(p => ({ ...p, bankName: e.target.value }))}
                      placeholder="e.g. ABSA, FNB, Standard Bank"
                    />
                  </div>
                  <div>
                    <label className="label">Account Holder</label>
                    <input
                      className="input"
                      value={formData.accountHolder || ''}
                      onChange={e => setFormData(p => ({ ...p, accountHolder: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Account Number</label>
                    <input
                      className="input"
                      value={formData.accountNumber || ''}
                      onChange={e => setFormData(p => ({ ...p, accountNumber: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="label">Account Type</label>
                    <select
                      className="input"
                      value={formData.accountType || ''}
                      onChange={e => setFormData(p => ({ ...p, accountType: e.target.value }))}
                    >
                      <option value="">Select...</option>
                      <option>Current / Cheque</option>
                      <option>Savings</option>
                      <option>Transmission</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Branch Code</label>
                    <input
                      className="input"
                      value={formData.branchCode || ''}
                      onChange={e => setFormData(p => ({ ...p, branchCode: e.target.value }))}
                      placeholder="e.g. 632005"
                    />
                  </div>
                </div>
              </div>

              {/* Debit Order Mandate */}
              <div className="bg-white rounded-xl border border-blue-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Debit Order Authorisation
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  Please read and sign below to authorise your monthly debit order.
                </p>

                {/* Mandate box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-gray-700 leading-relaxed">
                  <p className="font-semibold text-blue-900 mb-2">DEBIT ORDER MANDATE</p>
                  <p>
                    I/We, <strong>{quote.client.contactPerson}</strong> of{' '}
                    <strong>{quote.client.companyName}</strong>, hereby authorise{' '}
                    <strong>{company.name}</strong> to debit my/our bank account as detailed
                    above on the <strong>1st day of each month</strong>, with the amount of{' '}
                    <strong>{formatZAR(quote.totalMonthly * 1.15)}</strong> (inclusive of VAT),
                    being the monthly service fee as per our signed agreement.
                  </p>
                  <p className="mt-2">
                    This authority shall remain in force until cancelled by either party in
                    writing with <strong>30 (thirty) days&apos; notice</strong>. I/We confirm
                    that the bank account details provided are correct and that I/we are
                    authorised to sign this mandate.
                  </p>
                </div>

                {/* Authorise checkbox */}
                <label className="flex items-start gap-3 mb-4 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 rounded text-blue-600"
                    checked={debitAuthorized}
                    onChange={e => setDebitAuthorized(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">
                    I confirm I have read and agree to the debit order mandate above.
                  </span>
                </label>

                {/* Signature */}
                {debitAuthorized && (
                  <SignaturePad
                    label="Sign here to authorise"
                    onChange={setDebitSignature}
                  />
                )}
              </div>

              {/* Document Uploads */}
              {requiredDocs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-2">Required Documents</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Please upload all required documents. Accepted formats: PDF, JPG, PNG, Word documents (max 10MB each).
                  </p>

                  <div className="space-y-3">
                    {requiredDocs.map((rd: any) => {
                      const uploaded = uploadedDocs[rd.documentTypeId]
                      const uploading = uploadingId === rd.documentTypeId
                      return (
                        <div
                          key={rd.id}
                          className={`flex items-center gap-4 p-3.5 rounded-lg border ${
                            uploaded ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          {uploaded ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800">{rd.documentType.name}</p>
                            {rd.documentType.description && (
                              <p className="text-xs text-gray-400">{rd.documentType.description}</p>
                            )}
                          </div>
                          {uploaded ? (
                            <span className="text-xs text-green-600 font-medium">Uploaded</span>
                          ) : (
                            <label className="btn-primary btn-sm cursor-pointer">
                              {uploading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Upload className="w-3.5 h-3.5" />
                              )}
                              {uploading ? 'Uploading...' : 'Upload'}
                              <input
                                type="file"
                                className="sr-only"
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                disabled={uploading}
                                onChange={e => {
                                  const file = e.target.files?.[0]
                                  if (file) uploadDocument(rd.documentTypeId, file)
                                }}
                              />
                            </label>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* COF */}
              <div className="bg-white rounded-xl border border-amber-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" /> Customer Order Form (COF)
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Please download the Customer Order Form, sign it, and upload it as a document.
                </p>
                <a
                  href={`/api/portal/${token}/cof`}
                  target="_blank"
                  className="btn-secondary btn-sm inline-flex mb-3"
                >
                  <Download className="w-3.5 h-3.5" /> Download COF
                </a>
                <div className="mt-3">
                  <label className="label">Upload Signed COF</label>
                  <label className="flex items-center gap-2 btn-secondary btn-sm w-fit cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Upload Signed COF
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        setUploadingId('cof')
                        const fd = new FormData()
                        fd.append('file', file)
                        fd.append('label', 'Signed Customer Order Form (COF)')
                        await fetch(`/api/portal/${token}/upload`, { method: 'POST', body: fd })
                        setUploadingId(null)
                        alert('COF uploaded successfully!')
                      }}
                    />
                  </label>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <button type="submit" disabled={submitting} className="btn-success w-full py-3">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Onboarding'}
              </button>
            </form>
          </div>
        )}

        {/* ===== STEP: COMPLETE ===== */}
        {step === 'complete' && (
          <div className="bg-white rounded-xl border border-green-200 p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">All Done!</h1>
            <p className="text-gray-600 mb-4">
              Thank you, <strong>{quote.client.contactPerson}</strong>. Your onboarding is complete.
            </p>
            <p className="text-sm text-gray-500">
              Our team will review your documentation and be in touch shortly.
              Please don&apos;t hesitate to contact us if you have any questions.
            </p>
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <strong>{company.name}</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
