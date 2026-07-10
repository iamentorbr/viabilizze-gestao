'use client'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FolderKanban, BarChart2,
  FileSearch, ArrowLeft, ChevronRight
} from 'lucide-react'

const ITENS = [
  { href: '/crm',            label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/crm/clientes',   label: 'Clientes',     icon: Users           },
  { href: '/crm/projetos',   label: 'Projetos',     icon: FolderKanban    },
  { href: '/crm/relatorios', label: 'Relatórios',   icon: BarChart2       },
  { href: '/crm/diagnostico',label: 'Diagnóstico',  icon: FileSearch      },
]

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f2f5' }}>

      {/* Sidebar CRM */}
      <aside className="fixed inset-y-0 left-0 w-56 flex flex-col z-30"
        style={{ background: '#1a1d23' }}>

        {/* Voltar */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #252931' }}>
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs mb-3 transition-colors"
            style={{ color: '#5f6875' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F97316')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5f6875')}>
            <ArrowLeft size={12} /> Trocar ambiente
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
              style={{ background: '#534AB7' }}>
              <LayoutDashboard size={15} />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-tight">CRM Global</p>
              <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>VIABILIZZE</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {ITENS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/crm' && pathname.startsWith(href))
            return (
              <button key={href} onClick={() => router.push(href)}
                className="flex items-center gap-2.5 w-full px-5 py-2.5 text-sm transition-all"
                style={active
                  ? { background: 'rgba(83,74,183,0.2)', color: '#A5A0E8', fontWeight: 700, borderLeft: '3px solid #534AB7' }
                  : { color: '#8b9199', borderLeft: '3px solid transparent' }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#252931' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                <Icon size={15} style={{ color: active ? '#A5A0E8' : '#5f6875', flexShrink: 0 }} />
                <span className="flex-1 text-left truncate">{label}</span>
                {active && <ChevronRight size={12} style={{ color: '#A5A0E8' }} />}
              </button>
            )
          })}
        </nav>

        <div className="px-3 mb-4">
          <div className="px-3 py-2.5 rounded-xl" style={{ background: '#252931' }}>
            <p className="text-xs font-bold" style={{ color: '#534AB7' }}>CRM GLOBAL</p>
            <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>Gestão estratégica</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col" style={{ marginLeft: 224 }}>
        {children}
      </div>
    </div>
  )
}
