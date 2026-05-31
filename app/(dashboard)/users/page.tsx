import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, UserCheck, UserX, Shield, User } from 'lucide-react'
import { format } from 'date-fns'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      _count: { select: { quotes: true, clients: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-sm">{users.length} user{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/users/new" className="btn-primary">
          <Plus className="w-4 h-4" /> Add User
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-5 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Email</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Role</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Activity</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-semibold text-xs">
                        {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-400 md:hidden">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-gray-600 hidden md:table-cell">{user.email}</td>
                <td className="px-5 py-3.5">
                  {user.role === 'ADMIN' ? (
                    <span className="badge bg-purple-100 text-purple-700 flex items-center gap-1 w-fit">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  ) : (
                    <span className="badge bg-blue-100 text-blue-700 flex items-center gap-1 w-fit">
                      <User className="w-3 h-3" /> Sales
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 hidden lg:table-cell">
                  <p className="text-xs text-gray-500">
                    {user._count.quotes} quote{user._count.quotes !== 1 ? 's' : ''} ·{' '}
                    {user._count.clients} client{user._count.clients !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400">Joined {format(new Date(user.createdAt), 'dd MMM yyyy')}</p>
                </td>
                <td className="px-5 py-3.5">
                  {user.isActive ? (
                    <span className="badge bg-green-100 text-green-700 flex items-center gap-1 w-fit">
                      <UserCheck className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <span className="badge bg-red-100 text-red-700 flex items-center gap-1 w-fit">
                      <UserX className="w-3 h-3" /> Inactive
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Link href={`/users/${user.id}`} className="btn-secondary btn-sm">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
