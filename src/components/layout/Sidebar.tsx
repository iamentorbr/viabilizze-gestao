'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FlaskConical, Package,
  ShoppingCart, Tag, FolderKanban, BarChart3,
  Leaf, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard',  label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/clientes',   label: 'Clientes',     icon: Users },
  { href: '/producao',   label: 'Produção',     icon: FlaskConical },
  { href: '/estoque',    label: 'Estoque',      icon: Package },
  { href: '/compras',    label: 'Compras',      icon: ShoppingCart },
  { href: '/rotulagem',  label: 'Rotulagem',    icon: Tag },
  { href: '/projetos',   label: 'Projetos',     icon: FolderKanban },
  { href: '/relatorios', label: 'Relatórios',   icon: BarChart3 },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col z-30" style={{ background: 'var(--sidebar-bg)' }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-green-700">
        <div className="w-8 h-8 rounded-lg bg-green-400 flex items-center justify-center">
          <Leaf size={16} className="text-green-900" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-none">VIABILIZZE</p>
          <p className="text-green-300 text-xs">Gestão</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                active
                  ? 'bg-green-600 text-white'
                  : 'text-green-200 hover:bg-green-700 hover:text-white'
              )}
            >
              <Icon size={18} className={active ? 'text-white' : 'text-green-300 group-hover:text-white'} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-green-700">
        <p className="text-green-400 text-xs">VI.P & NÔUS Consultoria</p>
        <p className="text-green-500 text-xs">v1.0.0</p>
      </div>
    </aside>
  )
}
