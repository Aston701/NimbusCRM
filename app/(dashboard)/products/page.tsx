import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Package, RefreshCw } from 'lucide-react'
import { formatZAR } from '@/lib/utils'

export default async function ProductsPage() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') redirect('/dashboard')

  const products = await prisma.product.findMany({
    orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { quoteItems: true } } },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm">{products.filter(p => p.isActive).length} active products</p>
        </div>
        <Link href="/products/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add Product
        </Link>
      </div>

      <div className="card overflow-hidden">
        {products.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No products yet.</p>
            <Link href="/products/new" className="btn-primary mt-4 inline-flex">
              <Plus className="w-4 h-4" /> Add your first product
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">Product</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Once-Off Price</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Monthly Price</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Used in</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((p: any) => (
                <tr key={p.id} className={`hover:bg-gray-50 ${!p.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">{p.name}</p>
                        {p.description && <p className="text-xs text-gray-400">{p.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-gray-700">
                    {p.sellPrice > 0 ? formatZAR(p.sellPrice) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell text-gray-700">
                    {p.isRecurring && p.recurringSellPrice > 0 ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 text-blue-400" />
                        {formatZAR(p.recurringSellPrice)}/mo
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell text-gray-500">
                    {p._count.quoteItems} quote{p._count.quoteItems !== 1 ? 's' : ''}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/products/${p.id}`} className="btn-secondary btn-sm">Edit</Link>
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
