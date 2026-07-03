'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Calculator, Layers, ShoppingCart,
  Clock, FlaskConical, ArrowLeft, Settings, Settings2, ChevronRight, AlertTriangle,
  Beaker, Package, CheckCircle, TrendingUp, ArrowRight, Truck, BarChart2, Tag, Crown
} from 'lucide-react'
import ClienteCalculadora from './ClienteCalculadora'
import ClienteMateriasPrimas from './ClienteMateriasPrimas'
import ClienteComprasGestao from './ClienteComprasGestao'
import ClienteHistorico from './ClienteHistorico'
import ClienteConfiguracoes from './ClienteConfiguracoes'
import ClienteFormulacoes from './ClienteFormulacoes'
import ClienteRotulagem from './ClienteRotulagem'
import CalculadoraViabilizze from '@/components/CalculadoraViabilizze'

// ─── DASHBOARD DO CLIENTE (inline — sem arquivo externo) ─────────────────────

const CAT_COLOR: Record<string, { color: string; bg: string }> = {
  funcional:   { color: '#8e24aa', bg: '#f3e5f5' },
  polpa:       { color: '#e65100', bg: '#fff3e0' },
  acido:       { color: '#2e7d32', bg: '#e8f5e9' },
  conservante: { color: '#1565c0', bg: '#e3f2fd' },
  aroma:       { color: '#004d40', bg: '#e0f2f1' },
  adocante:    { color: '#f57f17', bg: '#fff8e1' },
  outro:       { color: '#616161', bg: '#f5f5f5' },
}

function ClienteDashboard({ clienteId, cliente, sabores, alertas, onAba }: any) {
  const [mps, setMps] = useState<any[]>([])
  const [rodadas, setRodadas] = useState<any[]>([])
  const [movRecentes, setMovRecentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: mp }, { data: rod }, { data: mov }] = await Promise.all([
        supabase.from('cliente_materias_primas')
          .select('*').eq('cliente_id', clienteId).eq('ativo', true).order('categoria'),
        supabase.from('producao_rodadas')
          .select('*, cliente_sabores(nome)')
          .eq('cliente_id', clienteId)
          .order('criado_em', { ascending: false }).limit(4),
        supabase.from('cliente_mp_movimentacoes')
          .select('*, cliente_materias_primas(nome, unidade)')
          .eq('cliente_id', clienteId)
          .order('data_movimentacao', { ascending: false }).limit(5),
      ])
      setMps(mp ?? [])
      setRodadas(rod ?? [])
      setMovRecentes(mov ?? [])
      setLoading(false)
    }
    load()
  }, [clienteId])

  const getStatus = (m: any) => {
    const ea = Number(m.estoque_atual), em = Number(m.estoque_minimo)
    if (ea <= 0) return 'SEM_ESTOQUE'
    if (ea <= em) return 'CRITICO'
    if (ea <= em * 1.5) return 'ATENCAO'
    return 'OK'
  }

  const mpsCriticas = mps.filter(m => ['CRITICO','SEM_ESTOQUE'].includes(getStatus(m)))
  const totalIngredientes = sabores.reduce((s: number, sb: any) => s + (sb.sabor_ingredientes?.length ?? 0), 0)
  const totalFornecedores = new Set(mps.map((m: any) => m.fornecedor)).size

  if (loading) return (
    <main className="p-6 flex justify-center py-16" style={{ background: '#f0f2f5' }}>
      <div className="spinner" />
    </main>
  )

  return (
    <main className="p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* Banner */}
      <div className="rounded-xl px-6 py-5 flex items-start justify-between"
        style={{ background: 'linear-gradient(135deg, #1a1d23 0%, #252931 100%)', border: '1px solid #2a2d33' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#F97316' }}>Sistema Ativo</span>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
          </div>
          <h1 className="text-2xl font-black text-white mb-1">{cliente.nome}</h1>
          <p className="text-xs" style={{ color: '#9aa0a6' }}>
            {sabores.length} sabor(es) · {totalIngredientes} ingredientes · {totalFornecedores} fornecedores · {mps.length} MPs
          </p>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end hidden sm:flex">
          {sabores.map((s: any) => (
            <span key={s.id} className="text-xs px-2.5 py-1 rounded-full font-bold"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
              {s.nome}
            </span>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Sabores Ativos', value: sabores.length, sub: 'linha de produção', color: '#F97316', bg: '#fff3e0', icon: Beaker, aba: 'calculadora' },
          { label: 'Matérias-Primas', value: mps.length, sub: `${alertas.mpsCriticas} crítica${alertas.mpsCriticas !== 1 ? 's' : ''}`, color: alertas.mpsCriticas > 0 ? '#c62828' : '#2e7d32', bg: alertas.mpsCriticas > 0 ? '#fce4ec' : '#e8f5e9', icon: Layers, aba: 'materias' },
          { label: 'Fornecedores', value: totalFornecedores, sub: 'parceiros ativos', color: '#1565c0', bg: '#e3f2fd', icon: Truck, aba: 'compras' },
          { label: 'Rodadas', value: rodadas.length, sub: 'produções registradas', color: '#6a1b9a', bg: '#f3e5f5', icon: FlaskConical, aba: 'historico' },
        ].map(k => (
          <button key={k.label} onClick={() => onAba(k.aba)}
            className="stat-card text-left group hover:shadow-md transition-shadow"
            style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{k.label}</p>
                <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs mt-0.5" style={{ color: k.color }}>{k.sub}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="stat-icon" style={{ background: k.bg }}>
                  <k.icon size={18} style={{ color: k.color }} />
                </div>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: k.color }} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Alertas críticos */}
      {mpsCriticas.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,.2)' }}>
          <div className="px-5 py-3 flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,.06)', borderBottom: '1px solid rgba(239,68,68,.12)' }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} style={{ color: '#ef4444' }} />
              <span className="text-sm font-bold" style={{ color: '#c62828' }}>
                {mpsCriticas.length} Matéria{mpsCriticas.length > 1 ? 's-Primas' : '-Prima'} precisam de atenção imediata
              </span>
            </div>
            <button onClick={() => onAba('materias')} className="text-xs font-bold flex items-center gap-1" style={{ color: '#ef4444' }}>
              Ver todas <ChevronRight size={12} />
            </button>
          </div>
          <div className="bg-white">
            {mpsCriticas.slice(0, 4).map((mp: any) => {
              const st = getStatus(mp)
              return (
                <div key={mp.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: st === 'SEM_ESTOQUE' ? '#9aa0a6' : '#ef4444' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1a1d23' }}>{mp.nome}</p>
                    <p className="text-xs" style={{ color: '#9aa0a6' }}>{mp.fornecedor}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black" style={{ color: st === 'SEM_ESTOQUE' ? '#9aa0a6' : '#ef4444' }}>
                      {Number(mp.estoque_atual).toFixed(3)} {mp.unidade}
                    </p>
                    <p className="text-xs" style={{ color: '#9aa0a6' }}>mín: {Number(mp.estoque_minimo).toFixed(3)}</p>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 9999, background: st === 'SEM_ESTOQUE' ? '#f5f5f5' : '#fce4ec', color: st === 'SEM_ESTOQUE' ? '#616161' : '#c62828' }}>
                    {st === 'SEM_ESTOQUE' ? 'Sem Estoque' : 'Crítico'}
                  </span>
                </div>
              )
            })}
            {mpsCriticas.length > 4 && (
              <div className="px-5 py-2.5 text-center">
                <button onClick={() => onAba('materias')} className="text-xs font-semibold" style={{ color: '#F97316' }}>
                  + {mpsCriticas.length - 4} outros itens →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Composição + Estoque por categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon" style={{ background: '#fff3e0', width: 28, height: 28, borderRadius: 7 }}>
              <Beaker size={13} style={{ color: '#F97316' }} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Linha de Produtos</h3>
          </div>
          <div className="space-y-3">
            {sabores.map((sb: any) => {
              const ings = sb.sabor_ingredientes ?? []
              const totalGl = ings.reduce((s: number, i: any) => s + Number(i.g_por_litro), 0)
              const porCat = ings.reduce((acc: any, i: any) => { acc[i.categoria] = (acc[i.categoria] || 0) + 1; return acc }, {})
              return (
                <div key={sb.id} className="p-3 rounded-xl" style={{ background: '#fafafa', border: '1px solid #f0f2f5' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold" style={{ color: '#1a1d23' }}>{sb.nome}</span>
                    <span className="text-xs" style={{ color: '#9aa0a6' }}>{ings.length} ing. · {totalGl.toFixed(1)} g/L</span>
                  </div>
                  <div className="flex rounded-full overflow-hidden h-2 mb-1.5">
                    {Object.entries(porCat).map(([cat, cnt]: any) => (
                      <div key={cat} title={cat} style={{ width: `${(cnt/ings.length)*100}%`, background: CAT_COLOR[cat]?.color ?? '#bbb' }} />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(porCat).map(([cat, cnt]: any) => {
                      const cc = CAT_COLOR[cat] ?? CAT_COLOR.outro
                      return (
                        <span key={cat} className="text-xs flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: cc.color }} />
                          <span style={{ color: '#9aa0a6' }}>{cat} ({cnt})</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon" style={{ background: '#e8f5e9', width: 28, height: 28, borderRadius: 7 }}>
              <Layers size={13} style={{ color: '#2e7d32' }} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Estoque por Categoria</h3>
            <button onClick={() => onAba('materias')} className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: '#F97316' }}>
              Ver tudo <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(
              mps.reduce((acc: any, mp: any) => {
                if (!acc[mp.categoria]) acc[mp.categoria] = { total: 0, criticos: 0 }
                acc[mp.categoria].total++
                if (['CRITICO','SEM_ESTOQUE'].includes(getStatus(mp))) acc[mp.categoria].criticos++
                return acc
              }, {})
            ).map(([cat, info]: any) => {
              const cc = CAT_COLOR[cat] ?? CAT_COLOR.outro
              const pct = Math.round(((info.total - info.criticos) / info.total) * 100)
              return (
                <div key={cat} className="flex items-center gap-3 p-2.5 rounded-lg" style={{ background: '#fafafa', border: '1px solid #f0f2f5' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: cc.bg }}>
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: cc.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold capitalize" style={{ color: '#1a1d23' }}>{cat}</span>
                      <span className="text-xs" style={{ color: '#9aa0a6' }}>{info.total} item(ns)</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: '#e8eaed' }}>
                      <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: info.criticos > 0 ? '#ef4444' : cc.color }} />
                    </div>
                  </div>
                  {info.criticos > 0 && <span className="text-xs font-bold shrink-0" style={{ color: '#ef4444' }}>{info.criticos} ⚠</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Rodadas + Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
            <div className="stat-icon" style={{ background: '#e3f2fd', width: 26, height: 26, borderRadius: 6 }}>
              <FlaskConical size={13} style={{ color: '#1565c0' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: '#1a1d23' }}>Últimas Rodadas</span>
            <button onClick={() => onAba('historico')} className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: '#F97316' }}>
              Ver todas <ChevronRight size={12} />
            </button>
          </div>
          {rodadas.length === 0 ? (
            <div className="text-center py-10 text-xs" style={{ color: '#9aa0a6' }}>
              <Clock size={28} className="mx-auto mb-2 opacity-30" />
              Nenhuma rodada registrada. Use a Calculadora para começar.
            </div>
          ) : (
            <div>
              {rodadas.map(r => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #f0f2f5' }}>
                  <div>
                    <p className="text-xs font-bold" style={{ color: '#F97316' }}>{r.numero ?? r.id.slice(0,8)}</p>
                    <p className="text-xs" style={{ color: '#9aa0a6' }}>{r.data_producao ? new Date(r.data_producao).toLocaleDateString('pt-BR') : '—'}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: '#1a1d23' }}>{r.cliente_sabores?.nome ?? '—'}</p>
                    <p className="text-xs" style={{ color: '#9aa0a6' }}>{Number(r.litros_totais ?? 0).toFixed(0)} L · {Number(r.estoque_embalagens ?? 0).toLocaleString('pt-BR')} embalagens</p>
                  </div>
                  <span className="badge-green shrink-0">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
            <div className="stat-icon" style={{ background: '#fff3e0', width: 26, height: 26, borderRadius: 6 }}>
              <BarChart2 size={13} style={{ color: '#F97316' }} />
            </div>
            <span className="text-sm font-bold" style={{ color: '#1a1d23' }}>Movimentações de MP</span>
            <button onClick={() => onAba('materias')} className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: '#F97316' }}>
              Gerenciar <ChevronRight size={12} />
            </button>
          </div>
          {movRecentes.length === 0 ? (
            <div className="text-center py-10 text-xs" style={{ color: '#9aa0a6' }}>
              <Package size={28} className="mx-auto mb-2 opacity-30" />
              Nenhuma movimentação registrada ainda.
            </div>
          ) : (
            <div>
              {movRecentes.map(m => {
                const isPos = ['ENTRADA','AJUSTE','INVENTARIO'].includes(m.tipo)
                return (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #f0f2f5' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: isPos ? '#e8f5e9' : '#fce4ec' }}>
                      <span className="text-xs font-black" style={{ color: isPos ? '#2e7d32' : '#c62828' }}>{isPos ? '+' : '−'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: '#1a1d23' }}>{m.cliente_materias_primas?.nome ?? '—'}</p>
                      <p className="text-xs" style={{ color: '#9aa0a6' }}>{m.tipo} · {new Date(m.data_movimentacao).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className="text-sm font-black shrink-0" style={{ color: isPos ? '#2e7d32' : '#c62828' }}>
                      {isPos ? '+' : '−'}{Number(m.quantidade).toFixed(3)} {m.cliente_materias_primas?.unidade}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

// ─── FIM DO DASHBOARD INLINE ─────────────────────────────────────────────────

const SECOES = [
  { label: null, items: [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null }] },
  { label: 'Produção', items: [
    { id: 'calculadora', label: 'Calculadora', icon: Calculator, badge: null },
    { id: 'formulacoes', label: 'Formulações', icon: FlaskConical, badge: null },
  ]},
  { label: 'Estoque & Compras', items: [
    { id: 'materias', label: 'Matérias-Primas', icon: Layers, badge: 'mp' },
    { id: 'compras',  label: 'Compras',          icon: ShoppingCart, badge: null },
  ]},
  { label: 'Rotulagem', items: [{ id: 'rotulagem', label: 'Tabela Nutricional', icon: Tag, badge: null }] },
  { label: 'Produtos VIABILIZZE', items: [{ id: 'calc-viabilizze', label: 'Calculadora VIABILIZZE', icon: Crown, badge: null }] },
  { label: 'Registros', items: [{ id: 'historico', label: 'Histórico', icon: Clock, badge: null }] },
  { label: 'Conta',     items: [{ id: 'configuracoes', label: 'Configurações', icon: Settings2, badge: null }] },
]

const ABA_META: Record<string, { titulo: string; sub: string }> = {
  dashboard:     { titulo: 'Dashboard',               sub: 'Visão geral do cliente'                   },
  calculadora:   { titulo: 'Calculadora de Produção', sub: 'Calcule e formule suas produções'          },
  formulacoes:   { titulo: 'Formulações',              sub: 'Gerencie as fórmulas por sabor'            },
  materias:      { titulo: 'Matérias-Primas',          sub: 'Controle de estoque de insumos'            },
  compras:       { titulo: 'Compras',                  sub: 'Consolidado e gestão de compras'           },
  historico:     { titulo: 'Histórico de Produção',    sub: 'Rodadas e movimentações registradas'       },
  rotulagem:     { titulo: 'Tabela Nutricional',        sub: 'Rotulagem nutricional — IN 75/2020 ANVISA · RDC 429/2020' },
  'calc-viabilizze': { titulo: 'Calculadora VIABILIZZE', sub: 'Percentual de polpa/suco — Legislação MAPA IN 49/2018' },
  configuracoes: { titulo: 'Configurações',            sub: 'Dados cadastrais e configurações do cliente' },
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
      setCliente(c)
      setSabores(s ?? [])
      const criticas = mps?.filter(m => Number(m.estoque_atual) <= Number(m.estoque_minimo)).length ?? 0
      const atencao  = mps?.filter(m => Number(m.estoque_atual) > Number(m.estoque_minimo) && Number(m.estoque_atual) <= Number(m.estoque_minimo) * 1.5).length ?? 0
      setAlertas({ mpsCriticas: criticas, mpsAtencao: atencao })
      setLoading(false)
    }
    load()
  }, [clienteId])

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#f0f2f5' }}>
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
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

      {/* SIDEBAR */}
      <aside className="fixed inset-y-0 left-0 w-56 flex flex-col z-30 overflow-y-auto" style={{ background: '#1a1d23' }}>

        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #252931' }}>
          <button onClick={() => router.push('/clientes')}
            className="flex items-center gap-1.5 text-xs mb-3 transition-colors"
            style={{ color: '#5f6875' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F97316')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5f6875')}>
            <ArrowLeft size={12} /> Voltar a Clientes
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0" style={{ background: '#F97316' }}>
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

        {alertas.mpsCriticas > 0 && (
          <button onClick={() => setAba('materias')}
            className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 transition-opacity hover:opacity-80"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertTriangle size={12} style={{ color: '#ef4444' }} />
            <p className="text-xs font-bold" style={{ color: '#ef4444' }}>
              {alertas.mpsCriticas} MP{alertas.mpsCriticas > 1 ? 's' : ''} crítica{alertas.mpsCriticas > 1 ? 's' : ''} — ver
            </p>
          </button>
        )}

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
            <p className="text-xs font-bold" style={{ color: '#F97316' }}>VIABILIZZE</p>
            <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>Assessoria Industrial · v2.0</p>
          </div>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col" style={{ marginLeft: 224 }}>
        <header className="sticky top-0 z-20 flex items-center justify-between px-6"
          style={{ background: '#f0f2f5', borderBottom: '1px solid #e8eaed', height: 54 }}>
          <div>
            <div className="flex items-center gap-2">
              <span style={{ width: 3, height: 16, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
              <h1 className="text-sm font-black uppercase tracking-wide" style={{ color: '#1a1d23' }}>{meta.titulo}</h1>
            </div>
            <p className="text-xs ml-3 mt-0.5" style={{ color: '#9aa0a6' }}>{meta.sub}</p>
          </div>
          <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-sm text-white" style={{ background: '#F97316' }}>
            {cliente.nome.charAt(0)}
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          {aba === 'dashboard'     && <ClienteDashboard    clienteId={clienteId} cliente={cliente} sabores={sabores} alertas={alertas} onAba={setAba} />}
          {aba === 'calculadora'   && <ClienteCalculadora   clienteId={clienteId} sabores={sabores} onSaboresUpdate={setSabores} />}
          {aba === 'formulacoes'   && <ClienteFormulacoes   clienteId={clienteId} sabores={sabores} onUpdate={setSabores} />}
          {aba === 'materias'      && <ClienteMateriasPrimas clienteId={clienteId} onAlertasUpdate={setAlertas} />}
          {aba === 'compras'       && <ClienteComprasGestao  clienteId={clienteId} sabores={sabores} />}
          {aba === 'historico'     && <ClienteHistorico      clienteId={clienteId} sabores={sabores} />}
          {aba === 'rotulagem'     && <ClienteRotulagem      clienteId={clienteId} sabores={sabores} />}
          {aba === 'calc-viabilizze' && <div className="p-6"><CalculadoraViabilizze clienteId={clienteId} /></div>}
          {aba === 'configuracoes' && <ClienteConfiguracoes  clienteId={clienteId} onClienteUpdate={(nome: string) => setCliente((prev: any) => prev ? { ...prev, nome } : prev)} />}
        </div>
      </div>
    </div>
  )
}
