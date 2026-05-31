'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Eye, EyeOff, Save, Shield, User } from 'lucide-react'

export default function EditUserPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'SALES',
    isActive: true,
    newPassword: '',
  })

  function set(field: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .then(data => {
        setUser(data)
        setForm({
          name: data.name,
          email: data.email,
          role: data.role,
          isActive: data.isActive,
          newPassword: '',
        })
        setLoading(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      role: form.role,
      isActive: form.isActive,
    }
    if (form.newPassword) payload.newPassword = form.newPassword

    const res = await fetch(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (!res.ok) {
      const err = await res.json()
      setError(typeof err.error === 'string' ? err.error : 'Failed to save changes.')
      return
    }

    setSuccess('Changes saved successfully.')
    setForm(prev => ({ ...prev, newPassword: '' }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <Link href="/users" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Users
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-700 font-semibold text-sm">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
            <p className="text-gray-500 text-sm">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{user?._count?.quotes ?? 0}</p>
          <p className="text-xs text-gray-500">Quotes created</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{user?._count?.clients ?? 0}</p>
          <p className="text-xs text-gray-500">Clients added</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{success}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Details */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Account Details</h2>

          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Email Address</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">Role</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { value: 'SALES', label: 'Sales', desc: 'Create clients & quotes', icon: User },
                { value: 'ADMIN', label: 'Admin', desc: 'Full access', icon: Shield },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
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
                  <opt.icon className={`w-4 h-4 ${form.role === opt.value ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{opt.label}</p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Account Status</label>
            <div className="grid grid-cols-2 gap-3 mt-1">
              {[
                { value: true, label: 'Active', desc: 'Can log in' },
                { value: false, label: 'Inactive', desc: 'Login blocked' },
              ].map(opt => (
                <label
                  key={String(opt.value)}
                  className={`flex flex-col gap-0.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.isActive === opt.value
                      ? opt.value ? 'border-green-500 bg-green-50' : 'border-red-400 bg-red-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="isActive"
                    checked={form.isActive === opt.value}
                    onChange={() => set('isActive', opt.value)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-800">{opt.label}</span>
                  <span className="text-xs text-gray-400">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="card p-5 space-y-3">
          <div>
            <h2 className="font-semibold text-gray-900">Reset Password</h2>
            <p className="text-xs text-gray-400 mt-0.5">Leave blank to keep the current password.</p>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input pr-10"
              value={form.newPassword}
              onChange={e => set('newPassword', e.target.value)}
              placeholder="New password (min 8 characters)"
              minLength={form.newPassword ? 8 : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/users" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
