'use client'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import {
  FlaskConical, Package, ShoppingCart, Users,
  TrendingUp, AlertTriangle, CheckCircle, Clock,
  BarChart2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="card card-sm shadow-lg" style={{ minWidth: 120 }}>
      <p className="text-xs font-semibold mb-1" style={{ color: '#9aa0a6' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>{p.value}</p>
      ))}
    </div>
  )
}

export default function DashboardClient() {
  const [stats, setStats] = useState({
    clientes: 0, ordens: 0, ordensAtivas: 0,
    pedidos: 0, itensEstoque: 0, itensCriticos: 0,
  })
  const [tarefas, setTarefas] = useState<any[]>([])
  const [estChart, setEstChart] = useState([
    { name: 'OK', value: 0, color: '#22c55e' },
    { name: 'Atenção', value: 0, color: '#f59e0b' },
    { name: 'Crítico', value: 0, color: '#ef4444' },
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
      const total    = ingredientes?.length ?? 0
      const criticos = ingredientes?.filter(i => i.estoque_atual <= i.estoque_minimo).length ?? 0
      const atencao  = ingredientes?.filter(i => i.estoque_atual > i.estoque_minimo && i.estoque_atual <= i.estoque_minimo * 1.5).length ?? 0
      setStats({
        clientes: clientes ?? 0,
        ordens: ordens?.length ?? 0,
        ordensAtivas: ordens?.filter(o => o.status === 'EM_ANDAMENTO').length ?? 0,
        pedidos: pedidos?.length ?? 0,
        itensEstoque: total,
        itensCriticos: criticos,
      })
      setTarefas(tarefasData ?? [])
      setEstChart([
        { name: 'OK', value: total - criticos - atencao, color: '#22c55e' },
        { name: 'Atenção', value: atencao, color: '#f59e0b' },
        { name: 'Crítico', value: criticos, color: '#ef4444' },
      ])
      setLoading(false)
    }
    load()
  }, [])

  const kpis = [
    {
      label: 'Ordens de Produção',
      value: stats.ordens,
      sub: `${stats.ordensAtivas} em andamento`,
      subColor: stats.ordensAtivas > 0 ? '#F97316' : '#9aa0a6',
      icon: FlaskConical,
      iconBg: '#fff3e0',
      iconColor: '#F97316',
    },
    {
      label: 'Matérias-Primas',
      value: stats.itensEstoque,
      sub: stats.itensCriticos > 0 ? `${stats.itensCriticos} abaixo do mínimo` : 'todos em nível normal',
      subColor: stats.itensCriticos > 0 ? '#ef4444' : '#22c55e',
      icon: Package,
      iconBg: '#e8f5e9',
      iconColor: '#43a047',
    },
    {
      label: 'Pedidos de Compra',
      value: stats.pedidos,
      sub: 'total cadastrados',
      subColor: '#9aa0a6',
      icon: ShoppingCart,
      iconBg: '#e3f2fd',
      iconColor: '#1e88e5',
    },
    {
      label: 'Clientes Ativos',
      value: stats.clientes,
      sub: 'em carteira',
      subColor: '#9aa0a6',
      icon: Users,
      iconBg: '#f3e5f5',
      iconColor: '#8e24aa',
    },
  ]

  const statusBadge: Record<string, string> = {
    PENDENTE: 'badge-yellow',
    EM_ANDAMENTO: 'badge-blue',
    CONCLUIDA: 'badge-green',
    CANCELADA: 'badge-gray',
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#f0f2f5' }}>
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm" style={{ color: '#9aa0a6' }}>Carregando dados...</p>
      </div>
    </div>
  )

  return (
    <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* KPI Cards — idêntico ao print */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: '#9aa0a6' }}>{k.label}</p>
                <p className="text-3xl font-black mb-0.5" style={{ color: '#1a1d23' }}>
                  <span style={{ color: '#F97316' }}>{k.value}</span>
                  <span className="text-sm font-normal ml-1" style={{ color: '#9aa0a6' }}>
                    {k.label.toLowerCase().includes('cliente') ? 'ativos' :
                     k.label.toLowerCase().includes('matéria') ? 'itens' :
                     k.label.toLowerCase().includes('ordem') ? 'ordens' : 'pedidos'}
                  </span>
                </p>
                <p className="text-xs font-medium" style={{ color: k.subColor }}>{k.sub}</p>
              </div>
              <div className="stat-icon" style={{ background: k.iconBg }}>
                <k.icon size={20} style={{ color: k.iconColor }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Linha 2: Gráfico Produção vs Meta + Alertas de Estoque */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Produção vs Meta */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon" style={{ background: '#e8f5e9', width: 30, height: 30, borderRadius: 8 }}>
              <BarChart2 size={15} style={{ color: '#43a047' }} />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Produção vs Meta (Semana)</h3>
            </div>
          </div>
          {stats.ordens === 0 ? (
            <div className="flex items-center justify-center h-48" style={{ color: '#9aa0a6' }}>
              <div className="text-center">
                <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma ordem concluída para exibir.</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { dia: 'Seg', prod: 120, meta: 150 },
                { dia: 'Ter', prod: 180, meta: 150 },
                { dia: 'Qua', prod: 140, meta: 150 },
                { dia: 'Qui', prod: 160, meta: 150 },
                { dia: 'Sex', prod: 200, meta: 150 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="dia" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="prod" fill="#F97316" radius={[4,4,0,0]} name="Produção" />
                <Bar dataKey="meta" fill="#e8eaed" radius={[4,4,0,0]} name="Meta" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alertas de Estoque */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon" style={{ background: '#fff8e1', width: 30, height: 30, borderRadius: 8 }}>
              <AlertTriangle size={15} style={{ color: '#f59e0b' }} />
            </div>
            <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Alertas de Estoque</h3>
          </div>
          {stats.itensCriticos === 0 ? (
            <div className="flex items-center justify-center h-48" style={{ color: '#9aa0a6' }}>
              <div className="text-center">
                <CheckCircle size={32} className="mx-auto mb-2" style={{ color: '#22c55e', opacity: .5 }} />
                <p className="text-sm">Nenhum material abaixo do estoque mínimo.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {estChart.filter(e => e.value > 0).map(e => (
                <div key={e.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: '#fafafa', border: '1px solid #f0f2f5' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                    <span className="text-sm" style={{ color: '#3c4043' }}>{e.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color: e.color }}>{e.value} itens</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ordens Recentes */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <div className="stat-icon" style={{ background: '#e8f5e9', width: 30, height: 30, borderRadius: 8 }}>
            <FlaskConical size={15} style={{ color: '#43a047' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Tarefas Recentes</h3>
        </div>
        {tarefas.length === 0 ? (
          <div className="flex items-center justify-center py-10" style={{ color: '#9aa0a6' }}>
            <div className="text-center">
              <Clock size={30} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma ordem cadastrada nesta indústria.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {tarefas.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg"
                style={{ background: '#fafafa', border: '1px solid #f0f2f5' }}>
                {t.status === 'CONCLUIDA'
                  ? <CheckCircle size={15} style={{ color: '#22c55e' }} />
                  : t.prioridade === 'URGENTE'
                  ? <AlertTriangle size={15} style={{ color: '#ef4444' }} />
                  : <Clock size={15} style={{ color: '#9aa0a6' }} />}
                <span className="flex-1 text-sm" style={{ color: '#3c4043' }}>{t.titulo}</span>
                <span className={statusBadge[t.status] ?? 'badge-gray'}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
