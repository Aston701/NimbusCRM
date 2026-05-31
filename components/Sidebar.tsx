'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  FileText,
  LogOut,
  ChevronRight,
  Building2,
  UserCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { href: '/clients', label: 'Clients', icon: Users, adminOnly: false },
  { href: '/quotes', label: 'Quotes', icon: FileText, adminOnly: false },
  { href: '/users', label: 'Users', icon: UserCog, adminOnly: true },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6 text-blue-400" />
          <div>
            <div className="font-bold text-sm leading-tight">Nimbus CRM</div>
            <div className="text-xs text-slate-400 leading-tight">Dynamic Business Systems</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.filter(item => !item.adminOnly || isAdmin).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* User / Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        {session?.user && (
          <div className="px-3 mb-3">
            <div className="text-xs text-slate-400">Signed in as</div>
            <div className="text-sm font-medium truncate">{session.user.name}</div>
            <div className="text-xs text-slate-400 truncate">{session.user.email}</div>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
