'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data: Record<string, string> = {}
    formData.forEach((v, k) => {
      if (typeof v === 'string' && v.trim()) data[k] = v.trim()
    })

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    setLoading(false)

    if (!res.ok) {
      const err = await res.json()
      setError('Failed to create client. Please check required fields.')
      return
    }

    const client = await res.json()
    router.push(`/clients/${client.id}`)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/clients" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Client</h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Details */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Company Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Company Name <span className="text-red-500">*</span></label>
              <input name="companyName" className="input" required />
            </div>
            <div>
              <label className="label">Trading Name</label>
              <input name="tradingName" className="input" placeholder="If different from company name" />
            </div>
            <div>
              <label className="label">Registration No.</label>
              <input name="registrationNo" className="input" placeholder="e.g. 2024/000000/07" />
            </div>
            <div>
              <label className="label">VAT Number</label>
              <input name="vatNo" className="input" placeholder="e.g. 4123456789" />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Contact Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Contact Person <span className="text-red-500">*</span></label>
              <input name="contactPerson" className="input" required />
            </div>
            <div>
              <label className="label">Email Address <span className="text-red-500">*</span></label>
              <input name="email" type="email" className="input" required />
            </div>
            <div>
              <label className="label">Phone Number <span className="text-red-500">*</span></label>
              <input name="phone" className="input" required />
            </div>
            <div>
              <label className="label">Alternate Phone</label>
              <input name="alternatePhone" className="input" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Street Address</label>
              <input name="address" className="input" />
            </div>
            <div>
              <label className="label">City</label>
              <input name="city" className="input" />
            </div>
            <div>
              <label className="label">Province</label>
              <select name="province" className="input">
                <option value="">Select province...</option>
                {['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Postal Code</label>
              <input name="postalCode" className="input" />
            </div>
            <div>
              <label className="label">Country</label>
              <input name="country" className="input" defaultValue="South Africa" />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea name="notes" className="input" rows={3} placeholder="Internal notes about this client..." />
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/clients" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  )
}
