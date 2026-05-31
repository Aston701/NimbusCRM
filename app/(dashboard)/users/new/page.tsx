'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react'

export default function NewUserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES',
  })

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setLoading(false)

    if (!res.ok) {
      const err = await res.json()
      setError(typeof err.error === 'string' ? err.error : 'Failed to create user.')
      return
    }

    router.push('/users')
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/users" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add User</h1>
        <p className="text-gray-500 text-sm mt-0.5">Create a new staff login for the CRM.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label className="label">Full Name <span className="text-red-500">*</span></label>
          <input
            className="input"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. John Smith"
            required
          />
        </div>

        <div>
          <label className="label">Email Address <span className="text-red-500">*</span></label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={e => set('email', e.target.value)}
            placeholder="john@company.co.za"
            required
          />
        </div>

        <div>
          <label className="label">Password <span className="text-red-500">*</span></label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              placeholder="Minimum 8 characters"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1">The user will use this password to log in.</p>
        </div>

        <div>
          <label className="label">Role <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            {[
              { value: 'SALES', label: 'Sales', desc: 'Can create clients and quotes' },
              { value: 'ADMIN', label: 'Admin', desc: 'Full access including user management' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`flex flex-col gap-0.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.role === opt.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={form.role === opt.value}
                  onChange={() => set('role', opt.value)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                <span className="text-xs text-gray-400">{opt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Link href="/users" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  )
}
