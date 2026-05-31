import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Building2, Mail, Phone, MapPin } from 'lucide-react'
import { getStatusColor, getStatusLabel, formatZAR } from '@/lib/utils'
import { format } from 'date-fns'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      quotes: {
        include: { createdBy: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
      createdBy: { select: { name: true } },
    },
  })

  if (!client) notFound()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link href="/clients" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back to Clients
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.companyName}</h1>
            {client.tradingName && <p className="text-gray-500">t/a {client.tradingName}</p>}
          </div>
          <Link href={`/quotes/new?clientId=${client.id}`} className="btn-primary">
            <Plus className="w-4 h-4" /> New Quote
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-500" /> Company
            </h2>
            <dl className="space-y-2.5 text-sm">
              {client.registrationNo && (
                <div>
                  <dt className="text-gray-400 text-xs">Registration No</dt>
                  <dd className="text-gray-700">{client.registrationNo}</dd>
                </div>
              )}
              {client.vatNo && (
                <div>
                  <dt className="text-gray-400 text-xs">VAT Number</dt>
                  <dd className="text-gray-700">{client.vatNo}</dd>
                </div>
              )}
              <div>
                <dt className="text-gray-400 text-xs">Added by</dt>
                <dd className="text-gray-700">{client.createdBy.name}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Date Added</dt>
                <dd className="text-gray-700">{format(new Date(client.createdAt), 'dd MMM yyyy')}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-500" /> Contact
            </h2>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-gray-400 text-xs">Contact Person</dt>
                <dd className="text-gray-700 font-medium">{client.contactPerson}</dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Email</dt>
                <dd className="text-gray-700">
                  <a href={`mailto:${client.email}`} className="text-blue-600 hover:underline">{client.email}</a>
                </dd>
              </div>
              <div>
                <dt className="text-gray-400 text-xs">Phone</dt>
                <dd className="text-gray-700">
                  <a href={`tel:${client.phone}`} className="text-blue-600 hover:underline">{client.phone}</a>
                </dd>
              </div>
              {client.alternatePhone && (
                <div>
                  <dt className="text-gray-400 text-xs">Alternate Phone</dt>
                  <dd className="text-gray-700">{client.alternatePhone}</dd>
                </div>
              )}
            </dl>
          </div>

          {(client.address || client.city) && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" /> Address
              </h2>
              <p className="text-sm text-gray-700">
                {[client.address, client.city, client.province, client.postalCode, client.country]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            </div>
          )}

          {client.notes && (
            <div className="card p-5">
              <h2 className="font-semibold text-gray-900 mb-2 text-sm">Notes</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Quotes */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Quotes <span className="text-gray-400 font-normal">({client.quotes.length})</span>
              </h2>
              <Link href={`/quotes/new?clientId=${client.id}`} className="btn-primary btn-sm">
                <Plus className="w-3 h-3" /> New Quote
              </Link>
            </div>
            {client.quotes.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No quotes yet for this client.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {client.quotes.map((q: any) => (
                  <Link
                    key={q.id}
                    href={`/quotes/${q.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{q.quoteNumber}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(q.createdAt), 'dd MMM yyyy')} · {q.createdBy.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        {q.totalOnceOff > 0 && (
                          <p className="text-xs text-gray-500">{formatZAR(q.totalOnceOff)} once-off</p>
                        )}
                        {q.totalMonthly > 0 && (
                          <p className="text-sm font-medium">{formatZAR(q.totalMonthly)}/mo</p>
                        )}
                      </div>
                      <span className={`badge ${getStatusColor(q.status)}`}>
                        {getStatusLabel(q.status)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
