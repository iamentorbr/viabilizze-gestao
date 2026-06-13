'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FlaskConical, Package,
  ShoppingCart, Tag, FolderKanban, BarChart3,
  ChevronRight, TrendingUp
} from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/dashboard',  label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/clientes',   label: 'Clientes',          icon: Users },
  { href: '/producao',   label: 'Produção',          icon: FlaskConical },
  { href: '/estoque',    label: 'Estoque',           icon: Package },
  { href: '/compras',    label: 'Compras',           icon: ShoppingCart },
  { href: '/rotulagem',  label: 'Rotulagem',         icon: Tag },
  { href: '/projetos',   label: 'Projetos',          icon: FolderKanban },
  { href: '/relatorios', label: 'Relatórios',        icon: BarChart3 },
]

export default function Sidebar() {
  const path = usePathname()
  return (
    <aside
      className="fixed inset-y-0 left-0 w-60 flex flex-col z-30"
      style={{ background: '#111111', borderRight: '1px solid #222222' }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: '1px solid #1E1E1E' }}>
        <div className="flex items-center gap-3 mb-1">
          {/* Ícone V com seta — SVG inline baseado na marca */}
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
              <path d="M4 6 L20 30 L36 6" stroke="#1A1A1A" strokeWidth="8" strokeLinejoin="round" fill="none"/>
              <path d="M4 6 L20 26" stroke="#222" strokeWidth="7" strokeLinejoin="round" fill="none"/>
              <path d="M20 26 L28 10 L36 4" stroke="#F97316" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M30 4 L36 4 L36 10" stroke="#F97316" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
          </div>
          <div>
            <p className="font-black text-white text-sm leading-none tracking-wide">
              VIABILI<span style={{ color: '#F97316' }}>ZZE</span>
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>Assessoria Industrial</p>
          </div>
        </div>
      </div>

      {/* Label seção */}
      <div className="px-5 pt-5 pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#444' }}>Menu Principal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
              )}
              style={active
                ? { background: 'rgba(249,115,22,0.12)', color: '#F97316', borderLeft: '2px solid #F97316' }
                : { color: '#9CA3AF', borderLeft: '2px solid transparent' }
              }
            >
              <Icon
                size={17}
                style={{ color: active ? '#F97316' : '#6B7280' }}
              />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={13} style={{ color: '#F97316' }} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: '1px solid #1E1E1E' }}>
        <p className="text-xs font-semibold" style={{ color: '#F97316' }}>Alimentos & Bebidas</p>
        <p className="text-xs mt-0.5" style={{ color: '#444' }}>VI.P & NÔUS Consultoria · v2.0</p>
      </div>
    </aside>
  )
}
