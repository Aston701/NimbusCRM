import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { getStatusColor, getStatusLabel, formatZAR } from '@/lib/utils'
import { format } from 'date-fns'

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams

  const quotes = await prisma.quote.findMany({
    where: status ? { status: status as never } : undefined,
    include: {
      client: { select: { companyName: true, contactPerson: true } },
      createdBy: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const statusFilters = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Sent', value: 'SENT' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Rejected', value: 'REJECTED' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
          <p className="text-gray-500 text-sm">{quotes.length} quote{quotes.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/quotes/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Quote
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {statusFilters.map(f => (
          <Link
            key={f.value}
            href={f.value ? `/quotes?status=${f.value}` : '/quotes'}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              (status || '') === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        {quotes.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No quotes found.</p>
            <Link href="/quotes/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Create a Quote
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Quote #</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Once-Off</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Monthly</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Term</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes.map((q: any) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{q.quoteNumber}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{q.client.companyName}</div>
                    <div className="text-xs text-gray-400">{q.client.contactPerson}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                    {q.totalOnceOff > 0 ? formatZAR(q.totalOnceOff) : '-'}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell font-medium">
                    {q.totalMonthly > 0 ? `${formatZAR(q.totalMonthly)}/mo` : '-'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                    {q.contractTerm}m
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(q.status)}`}>
                      {getStatusLabel(q.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                    {format(new Date(q.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/quotes/${q.id}`} className="btn-secondary btn-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
