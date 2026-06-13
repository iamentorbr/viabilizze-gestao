'use client'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { FlaskConical, Package, ShoppingCart, Users, CheckCircle, Clock, AlertTriangle, ArrowUpRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function DashboardClient() {
  const [stats, setStats] = useState({ clientes: 0, ordens: 0, ordensAtivas: 0, pedidos: 0, itensEstoque: 0, itensCriticos: 0 })
  const [tarefas, setTarefas] = useState<any[]>([])
  const [estChart, setEstChart] = useState([
    { name: 'OK', value: 0, color: '#10B981' },
    { name: 'Atenção', value: 0, color: '#F59E0B' },
    { name: 'Crítico', value: 0, color: '#EF4444' },
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [
        { count: clientes },
        { data: ordens },
        { data: pedidos },
        { data: ingredientes },
        { data: tarefasData },
      ] = await Promise.all([
        supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('ativo', true),
        supabase.from('ordens_producao').select('status'),
        supabase.from('pedidos_compra').select('status, valor_total'),
        supabase.from('ingredientes').select('estoque_atual, estoque_minimo'),
        supabase.from('tarefas').select('titulo, status, prioridade').order('criado_em', { ascending: false }).limit(5),
      ])
      const ordensAtivas = ordens?.filter(o => o.status === 'EM_ANDAMENTO').length ?? 0
      const total = ingredientes?.length ?? 0
      const criticos = ingredientes?.filter(i => i.estoque_atual <= i.estoque_minimo).length ?? 0
      const atencao  = ingredientes?.filter(i => i.estoque_atual > i.estoque_minimo && i.estoque_atual <= i.estoque_minimo * 1.5).length ?? 0
      setStats({ clientes: clientes ?? 0, ordens: ordens?.length ?? 0, ordensAtivas, pedidos: pedidos?.length ?? 0, itensEstoque: total, itensCriticos: criticos })
      setTarefas(tarefasData ?? [])
      setEstChart([
        { name: 'OK', value: total - criticos - atencao, color: '#10B981' },
        { name: 'Atenção', value: atencao, color: '#F59E0B' },
        { name: 'Crítico', value: criticos, color: '#EF4444' },
      ])
      setLoading(false)
    }
    load()
  }, [])

  const kpis = [
    { label: 'Ordens de Produção', value: stats.ordens, sub: `${stats.ordensAtivas} em andamento`, icon: FlaskConical, accent: '#F97316', bg: 'rgba(249,115,22,0.08)' },
    { label: 'Itens no Estoque',   value: stats.itensEstoque, sub: `${stats.itensCriticos} abaixo do mínimo`, icon: Package, accent: '#3B82F6', bg: 'rgba(59,130,246,0.08)' },
    { label: 'Pedidos de Compra',  value: stats.pedidos, sub: 'total cadastrados', icon: ShoppingCart, accent: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
    { label: 'Clientes Ativos',    value: stats.clientes, sub: 'em carteira', icon: Users, accent: '#10B981', bg: 'rgba(16,185,129,0.08)' },
  ]

  const statusBadge: Record<string, string> = {
    PENDENTE: 'badge-yellow', EM_ANDAMENTO: 'badge-blue', CONCLUIDA: 'badge-green', CANCELADA: 'badge-gray',
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) return (
      <div style={{ background: '#1C1C1C', border: '1px solid #333', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
        <p style={{ color: '#9CA3AF', marginBottom: 2 }}>{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color, fontWeight: 700 }}>{p.name}: {p.value}</p>
        ))}
      </div>
    )
    return null
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-72">
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-xs" style={{ color: '#6B7280' }}>Carregando dados...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-5">

      {/* Banner de boas-vindas */}
      <div className="rounded-xl px-6 py-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #1E1E1E 100%)', border: '1px solid #2A2A2A' }}>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#F97316' }}>
            Bem-vinda de volta
          </p>
          <h2 className="text-xl font-black text-white">Ana Paula Santos</h2>
          <p className="text-xs mt-1" style={{ color: '#6B7280' }}>
            VIABILIZZE · Assessoria Industrial · Alimentos & Bebidas
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg"
          style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
          <span className="text-xs font-bold" style={{ color: '#F97316' }}>Sistema Ativo</span>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="card card-hover" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: k.bg }}>
                <k.icon size={18} style={{ color: k.accent }} />
              </div>
              <ArrowUpRight size={14} style={{ color: '#444' }} />
            </div>
            <p className="text-2xl font-black text-white mb-0.5">{k.value}</p>
            <p className="text-xs font-semibold text-white">{k.label}</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>{k.sub}</p>
            <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl" style={{ background: k.accent, opacity: 0.4 }} />
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Estoque Donut */}
        <div className="card">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Status do Estoque</p>
          {stats.itensEstoque > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={estChart} cx="50%" cy="50%" innerRadius={42} outerRadius={65} dataKey="value" strokeWidth={0}>
                    {estChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-3">
                {estChart.map(e => (
                  <div key={e.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: e.color }} />
                      <span className="text-xs" style={{ color: '#9CA3AF' }}>{e.name}</span>
                    </div>
                    <span className="text-xs font-bold text-white">{e.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40" style={{ color: '#444' }}>
              <Package size={32} className="mb-2" />
              <p className="text-xs">Nenhum item cadastrado</p>
            </div>
          )}
        </div>

        {/* Tarefas recentes */}
        <div className="card lg:col-span-2">
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#9CA3AF' }}>Tarefas Recentes</p>
          {tarefas.length > 0 ? (
            <div className="space-y-2">
              {tarefas.map((t, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                  style={{ background: '#161616', border: '1px solid #222' }}>
                  {t.status === 'CONCLUIDA'
                    ? <CheckCircle size={15} style={{ color: '#10B981' }} className="shrink-0" />
                    : t.prioridade === 'URGENTE'
                    ? <AlertTriangle size={15} style={{ color: '#EF4444' }} className="shrink-0" />
                    : <Clock size={15} style={{ color: '#6B7280' }} className="shrink-0" />}
                  <p className="text-sm text-white flex-1 leading-snug">{t.titulo}</p>
                  <span className={statusBadge[t.status] ?? 'badge-gray'}>{t.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40" style={{ color: '#444' }}>
              <Clock size={32} className="mb-2" />
              <p className="text-xs">Nenhuma tarefa cadastrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
