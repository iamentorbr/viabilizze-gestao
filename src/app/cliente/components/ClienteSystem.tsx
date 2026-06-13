'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Calculator, Layers, ShoppingCart,
  Clock, FlaskConical, ArrowLeft, Settings, Settings2, ChevronRight, AlertTriangle
} from 'lucide-react'
import ClienteDashboard from './ClienteDashboard'
import ClienteCalculadora from './ClienteCalculadora'
import ClienteMateriasPrimas from './ClienteMateriasPrimas'
import ClienteComprasGestao from './ClienteComprasGestao'
import ClienteHistorico from './ClienteHistorico'
import ClienteConfiguracoes from './ClienteConfiguracoes'
import ClienteFormulacoes from './ClienteFormulacoes'

const SECOES = [
  {
    label: null,
    items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null }],
  },
  {
    label: 'Produção',
    items: [
      { id: 'calculadora', label: 'Calculadora', icon: Calculator, badge: null },
      { id: 'formulacoes', label: 'Formulações', icon: FlaskConical, badge: null },
    ],
  },
  {
    label: 'Estoque & Compras',
    items: [
      { id: 'materias', label: 'Matérias-Primas', icon: Layers, badge: 'mp' },
      { id: 'compras',  label: 'Compras',          icon: ShoppingCart, badge: null },
    ],
  },
  {
    label: 'Registros',
    items: [{ id: 'historico', label: 'Histórico', icon: Clock, badge: null }],
  },
  {
    label: 'Conta',
    items: [{ id: 'configuracoes', label: 'Configurações', icon: Settings2, badge: null }],
  },
]

const ABA_META: Record<string, { titulo: string; sub: string }> = {
  dashboard:   { titulo: 'Dashboard',               sub: 'Visão geral do cliente'               },
  calculadora: { titulo: 'Calculadora de Produção', sub: 'Calcule e formule suas produções'    },
  formulacoes: { titulo: 'Formulações',              sub: 'Gerencie as fórmulas por sabor'      },
  materias:    { titulo: 'Matérias-Primas',          sub: 'Controle de estoque de insumos'      },
  compras:     { titulo: 'Compras',                  sub: 'Consolidado e gestão de compras'     },
  historico:       { titulo: 'Histórico de Produção',    sub: 'Rodadas e movimentações registradas' },
  configuracoes:   { titulo: 'Configurações',              sub: 'Dados cadastrais e configurações do cliente' },
}

export default function ClienteSystem({ clienteId }: { clienteId: string }) {
  const router = useRouter()
  const [cliente, setCliente] = useState<any>(null)
  const [sabores, setSabores] = useState<any[]>([])
  const [alertas, setAlertas] = useState({ mpsCriticas: 0, mpsAtencao: 0 })
  const [aba, setAba] = useState('dashboard')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: s }, { data: mps }] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', clienteId).single(),
        supabase.from('cliente_sabores')
          .select('*, sabor_ingredientes(*)')
          .eq('cliente_id', clienteId).eq('ativo', true).order('criado_em'),
        supabase.from('cliente_materias_primas')
          .select('estoque_atual, estoque_minimo')
          .eq('cliente_id', clienteId).eq('ativo', true),
      ])
      setCliente(c); setSabores(s ?? [])
      const criticas = mps?.filter(m => Number(m.estoque_atual) <= Number(m.estoque_minimo)).length ?? 0
      const atencao  = mps?.filter(m => Number(m.estoque_atual) > Number(m.estoque_minimo) && Number(m.estoque_atual) <= Number(m.estoque_minimo) * 1.5).length ?? 0
      setAlertas({ mpsCriticas: criticas, mpsAtencao: atencao })
      setLoading(false)
    }
    load()
  }, [clienteId])

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#f0f2f5' }}>
      <div className="text-center"><div className="spinner mx-auto mb-3" />
        <p className="text-sm" style={{ color: '#9aa0a6' }}>Carregando sistema...</p>
      </div>
    </div>
  )
  if (!cliente) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#f0f2f5' }}>
      <p style={{ color: '#9aa0a6' }}>Cliente não encontrado.</p>
    </div>
  )

  const getBadge = (k: string | null) => {
    if (k === 'mp' && (alertas.mpsCriticas + alertas.mpsAtencao) > 0)
      return alertas.mpsCriticas + alertas.mpsAtencao
    return null
  }

  const meta = ABA_META[aba] ?? { titulo: aba, sub: '' }

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f2f5' }}>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 w-56 flex flex-col z-30 overflow-y-auto"
        style={{ background: '#1a1d23' }}>

        {/* Voltar + identidade */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #252931' }}>
          <button onClick={() => router.push('/clientes')}
            className="flex items-center gap-1.5 text-xs mb-3 transition-colors"
            style={{ color: '#5f6875' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F97316')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5f6875')}>
            <ArrowLeft size={12} /> Voltar a Clientes
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
              style={{ background: '#F97316' }}>
              {cliente.nome.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="font-black text-white text-sm leading-tight truncate">{cliente.nome}</p>
              <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>Assessoria Industrial</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {sabores.map((s: any) => (
              <span key={s.id} style={{ background: 'rgba(249,115,22,0.12)', color: '#F97316', fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                {s.nome}
              </span>
            ))}
          </div>
        </div>

        {/* Alerta crítico */}
        {alertas.mpsCriticas > 0 && (
          <button onClick={() => setAba('materias')}
            className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 w-auto transition-opacity hover:opacity-80"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={12} style={{ color: '#ef4444' }} />
            <p className="text-xs font-bold" style={{ color: '#ef4444' }}>
              {alertas.mpsCriticas} MP{alertas.mpsCriticas > 1 ? 's' : ''} crítica{alertas.mpsCriticas > 1 ? 's' : ''} — ver
            </p>
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3">
          {SECOES.map((sec, si) => (
            <div key={si}>
              {sec.label && <p className="nav-section">{sec.label}</p>}
              {sec.items.map(({ id, label, icon: Icon, badge: bk }) => {
                const active = aba === id
                const badgeN = getBadge(bk)
                return (
                  <button key={id} onClick={() => setAba(id)}
                    className="flex items-center gap-2.5 w-full px-5 py-2.5 text-sm transition-all"
                    style={active
                      ? { background: 'rgba(249,115,22,0.15)', color: '#F97316', fontWeight: 700, borderLeft: '3px solid #F97316' }
                      : { color: '#8b9199', fontWeight: 400, borderLeft: '3px solid transparent' }}
                    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#252931' }}
                    onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}>
                    <Icon size={15} style={{ color: active ? '#F97316' : '#5f6875', flexShrink: 0 }} />
                    <span className="flex-1 text-left truncate">{label}</span>
                    {badgeN !== null && (
                      <span style={{ background: '#ef4444', color: '#fff', fontSize: 10, padding: '1px 5px', borderRadius: 9999, fontWeight: 800 }}>
                        {badgeN}
                      </span>
                    )}
                    {active && <ChevronRight size={12} style={{ color: '#F97316', flexShrink: 0 }} />}
                  </button>
                )
              })}
            </div>
          ))}
          <div>
            <p className="nav-section">Sistema</p>
            <div className="flex items-center gap-2.5 px-5 py-2.5 text-sm cursor-pointer" style={{ color: '#5f6875' }}>
              <Settings size={15} style={{ color: '#5f6875' }} />
              <span>Configurações</span>
            </div>
          </div>
        </nav>

        <div className="px-3 mb-3">
          <div className="px-4 py-3 rounded-xl" style={{ background: '#252931' }}>
            <p className="text-xs font-bold" style={{ color: '#F97316' }}>VI.P & NÔUS</p>
            <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>Assessoria Industrial · v2.0</p>
          </div>
        </div>
      </aside>

      {/* ── CONTEÚDO ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: 224 }}>
        <header className="sticky top-0 z-20 flex items-center justify-between px-6"
          style={{ background: '#f0f2f5', borderBottom: '1px solid #e8eaed', height: 54 }}>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ width: 3, height: 16, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
              <h1 className="text-sm font-black uppercase tracking-wide" style={{ color: '#1a1d23' }}>
                {meta.titulo}
              </h1>
            </div>
            <p className="text-xs ml-3 mt-0.5" style={{ color: '#9aa0a6' }}>{meta.sub}</p>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm text-white"
            style={{ background: '#F97316' }}>
            {cliente.nome.charAt(0)}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {aba === 'dashboard'   && <ClienteDashboard    clienteId={clienteId} cliente={cliente} sabores={sabores} alertas={alertas} onAba={setAba} />}
          {aba === 'calculadora' && <ClienteCalculadora   clienteId={clienteId} sabores={sabores} onSaboresUpdate={setSabores} />}
          {aba === 'formulacoes' && <ClienteFormulacoes   clienteId={clienteId} sabores={sabores} onUpdate={setSabores} />}
          {aba === 'materias'    && <ClienteMateriasPrimas clienteId={clienteId} onAlertasUpdate={setAlertas} />}
          {aba === 'compras'     && <ClienteComprasGestao  clienteId={clienteId} sabores={sabores} />}
          {aba === 'historico'       && <ClienteHistorico        clienteId={clienteId} sabores={sabores} />}
          {aba === 'configuracoes'  && <ClienteConfiguracoes    clienteId={clienteId} onClienteUpdate={(nome: string) => setCliente((prev: any) => prev ? { ...prev, nome } : prev)} />}
        </div>
      </div>
    </div>
  )
}
