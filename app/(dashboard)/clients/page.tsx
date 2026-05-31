import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Plus, Users, Search } from 'lucide-react'
import { format } from 'date-fns'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const { search: searchRaw } = await searchParams
  const search = searchRaw || ''

  const clients = await prisma.client.findMany({
    where: search
      ? {
          OR: [
            { companyName: { contains: search, mode: 'insensitive' } },
            { contactPerson: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    include: { _count: { select: { quotes: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/clients/new" className="btn-primary">
          <Plus className="w-4 h-4" /> New Client
        </Link>
      </div>

      {/* Search */}
      <form className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            name="search"
            defaultValue={search}
            className="input pl-9"
            placeholder="Search clients..."
          />
        </div>
      </form>

      {/* Table */}
      <div className="card overflow-hidden">
        {clients.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {search ? 'No clients found.' : 'No clients yet.'}
            </p>
            {!search && (
              <Link href="/clients/new" className="btn-primary mt-4 inline-flex">
                <Plus className="w-4 h-4" /> Add your first client
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Contact Person</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Quotes</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Added</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((client: any) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{client.companyName}</div>
                    {client.tradingName && (
                      <div className="text-xs text-gray-400">t/a {client.tradingName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{client.contactPerson}</td>
                  <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{client.email}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="badge bg-blue-50 text-blue-700">{client._count.quotes}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                    {format(new Date(client.createdAt), 'dd MMM yyyy')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/clients/${client.id}`}
                      className="btn-secondary btn-sm"
                    >
                      View
                    </Link>
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
