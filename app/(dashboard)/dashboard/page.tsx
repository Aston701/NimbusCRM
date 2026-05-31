import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Users, FileText, CheckCircle, Clock, Plus } from 'lucide-react'
import { getStatusColor, getStatusLabel, formatZAR } from '@/lib/utils'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  const [totalClients, totalQuotes, acceptedQuotes, sentQuotes, recentQuotes] = await Promise.all([
    prisma.client.count(),
    prisma.quote.count(),
    prisma.quote.count({ where: { status: 'ACCEPTED' } }),
    prisma.quote.count({ where: { status: 'SENT' } }),
    prisma.quote.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { companyName: true } } },
    }),
  ])

  const stats = [
    { label: 'Total Clients', value: totalClients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Quotes', value: totalQuotes, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Accepted', value: acceptedQuotes, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Awaiting Response', value: sentQuotes, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Welcome back, {session?.user.name}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/clients/new" className="btn-secondary btn-sm">
            <Plus className="w-4 h-4" /> New Client
          </Link>
          <Link href="/quotes/new" className="btn-primary btn-sm">
            <Plus className="w-4 h-4" /> New Quote
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Quotes */}
      <div className="card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recent Quotes</h2>
          <Link href="/quotes" className="text-sm text-blue-600 hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentQuotes.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No quotes yet. <Link href="/quotes/new" className="text-blue-600 hover:underline">Create your first quote</Link>
            </div>
          ) : (
            recentQuotes.map((q: any) => (
              <Link
                key={q.id}
                href={`/quotes/${q.id}`}
                className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{q.quoteNumber}</p>
                    <p className="text-xs text-gray-500">{q.client.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{formatZAR(q.totalMonthly)}/mo</p>
                    <p className="text-xs text-gray-500">{format(new Date(q.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                  <span className={`badge ${getStatusColor(q.status)}`}>
                    {getStatusLabel(q.status)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
