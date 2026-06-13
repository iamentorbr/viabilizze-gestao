'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FlaskConical, Package,
  ShoppingCart, Tag, FolderKanban, BarChart3,
  ChevronRight, Settings, Home
} from 'lucide-react'
import clsx from 'clsx'

const sections = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/projetos',  label: 'Projetos',  icon: FolderKanban },
    ],
  },
  {
    label: 'Produção',
    items: [
      { href: '/producao',  label: 'Ordens de Produção', icon: FlaskConical },
    ],
  },
  {
    label: 'Estoque',
    items: [
      { href: '/estoque',  label: 'Matérias-Primas',  icon: Package },
    ],
  },
  {
    label: 'Compras',
    items: [
      { href: '/compras',  label: 'Gestão de Compras', icon: ShoppingCart },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/clientes', label: 'Clientes',  icon: Users },
    ],
  },
  {
    label: 'Rotulagem',
    items: [
      { href: '/rotulagem', label: 'Rótulos e Tabelas', icon: Tag },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { href: '/relatorios', label: 'Análises', icon: BarChart3 },
    ],
  },
]

export default function Sidebar() {
  const path = usePathname()

  return (
    <aside
      className="fixed inset-y-0 left-0 w-56 flex flex-col z-30 overflow-y-auto"
      style={{ background: '#1a1d23' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5" style={{ borderBottom: '1px solid #252931' }}>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: '#F97316' }}
        >
          <svg viewBox="0 0 20 20" fill="none" width="14" height="14">
            <path d="M3 4L10 14L17 4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 14L14 7L17 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".7"/>
            <line x1="15" y1="4" x2="17" y2="4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="17" y1="4" x2="17" y2="6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <span className="font-black text-white text-sm tracking-wide">
            VIABILI<span style={{ color: '#F97316' }}>ZZE</span>
          </span>
          <p className="text-xs leading-none mt-0.5" style={{ color: '#5f6875' }}>
            Assessoria Industrial
          </p>
        </div>
      </div>

      {/* Nav com seções */}
      <nav className="flex-1 py-2">
        {sections.map(sec => (
          <div key={sec.label}>
            <p className="nav-section">{sec.label}</p>
            {sec.items.map(({ href, label, icon: Icon }) => {
              const active = path === href || path.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm transition-all"
                  style={
                    active
                      ? { background: 'rgba(249,115,22,0.15)', color: '#F97316', fontWeight: 600 }
                      : { color: '#8b9199', fontWeight: 400 }
                  }
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#252931' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Icon size={15} style={{ color: active ? '#F97316' : '#5f6875', flexShrink: 0 }} />
                  <span className="flex-1 truncate">{label}</span>
                  {active && <ChevronRight size={12} style={{ color: '#F97316' }} />}
                </Link>
              )
            })}
          </div>
        ))}

        {/* Sistema */}
        <div>
          <p className="nav-section">Sistema</p>
          <div
            className="flex items-center gap-2.5 mx-2 px-3 py-2 rounded-lg text-sm cursor-pointer"
            style={{ color: '#5f6875' }}
          >
            <Settings size={15} style={{ color: '#5f6875' }} />
            <span>Configurações</span>
          </div>
        </div>
      </nav>

      {/* Usuário */}
      <div className="px-4 py-3 mx-2 mb-3 rounded-xl" style={{ background: '#252931' }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0"
            style={{ background: '#F97316', color: '#fff' }}
          >
            AP
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">Ana Paula Santos</p>
            <p className="text-xs truncate" style={{ color: '#5f6875' }}>Produção</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
