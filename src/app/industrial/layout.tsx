'use client'
import { useRouter, usePathname } from 'next/navigation'
import {
  Factory, Users, Calculator, Beaker, Layers,
  ShoppingCart, Clock, Tag, ArrowLeft, ChevronRight,
  FlaskConical, Package
} from 'lucide-react'

const ITENS = [
  { href: '/industrial',           label: 'Clientes',          icon: Users      },
  { href: '/industrial/producao',  label: 'Ordens Produção',   icon: Package    },
  { href: '/industrial/calculadora', label: 'Calculadora',     icon: Calculator },
  { href: '/industrial/estoque',   label: 'Estoque',           icon: Layers     },
  { href: '/industrial/compras',   label: 'Compras',           icon: ShoppingCart },
  { href: '/industrial/rotulagem', label: 'Tabela Nutricional',icon: Tag        },
  { href: '/industrial/relatorios',label: 'Relatórios',        icon: FlaskConical },
]

export default function IndustrialLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f2f5' }}>

      <aside className="fixed inset-y-0 left-0 w-56 flex flex-col z-30"
        style={{ background: '#1a1d23' }}>

        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #252931' }}>
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs mb-3 transition-colors"
            style={{ color: '#5f6875' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F97316')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5f6875')}>
            <ArrowLeft size={12} /> Trocar ambiente
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#0F6E56' }}>
              <Factory size={15} color="#fff" />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-tight">Industrial</p>
              <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>Gestão de Produção</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-3">
          {ITENS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/industrial' && pathname.startsWith(href))
            return (
              <button key={href} onClick={() => router.push(href)}
                className="flex items-center gap-2.5 w-full px-5 py-2.5 text-sm transition-all"
                style={active
                  ? { background: 'rgba(15,110,86,0.2)', color: '#5DCAA5', fontWeight: 700, borderLeft: '3px solid #0F6E56' }
                  : { color: '#8b9199', borderLeft: '3px solid transparent' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#252931' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <Icon size={15} style={{ color: active ? '#5DCAA5' : '#5f6875', flexShrink: 0 }} />
                <span className="flex-1 text-left truncate">{label}</span>
                {active && <ChevronRight size={12} style={{ color: '#5DCAA5' }} />}
              </button>
            )
          })}
        </nav>

        <div className="px-3 mb-4">
          <div className="px-3 py-2.5 rounded-xl" style={{ background: '#252931' }}>
            <p className="text-xs font-bold" style={{ color: '#0F6E56' }}>GESTÃO INDUSTRIAL</p>
            <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>Por cliente</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col" style={{ marginLeft: 224 }}>
        {children}
      </div>
    </div>
  )
}
