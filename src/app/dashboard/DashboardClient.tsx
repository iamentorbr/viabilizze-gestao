'use client'
import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import { FlaskConical, Package, ShoppingCart, Users, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const estoqueStatus = [
  { name: 'OK', value: 0, color: '#16a34a' },
  { name: 'Atenção', value: 0, color: '#f59e0b' },
  { name: 'Crítico', value: 0, color: '#ef4444' },
]

export default function DashboardClient() {
  const [stats, setStats] = useState({ clientes: 0, ordens: 0, ordensAtivas: 0, pedidos: 0, itensEstoque: 0, itensCriticos: 0 })
  const [tarefas, setTarefas] = useState<any[]>([])
  const [estChart, setEstChart] = useState(estoqueStatus)
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
      const itensEstoque = ingredientes?.length ?? 0
      const itensCriticos = ingredientes?.filter(i => i.estoque_atual <= i.estoque_minimo).length ?? 0
      const itensAtencao = ingredientes?.filter(i => i.estoque_atual > i.estoque_minimo && i.estoque_atual <= i.estoque_minimo * 1.5).length ?? 0
      const itensOk = itensEstoque - itensCriticos - itensAtencao

      setStats({
        clientes: clientes ?? 0,
        ordens: ordens?.length ?? 0,
        ordensAtivas,
        pedidos: pedidos?.length ?? 0,
        itensEstoque,
        itensCriticos,
      })
      setTarefas(tarefasData ?? [])
      setEstChart([
        { name: 'OK', value: itensOk, color: '#16a34a' },
        { name: 'Atenção', value: itensAtencao, color: '#f59e0b' },
        { name: 'Crítico', value: itensCriticos, color: '#ef4444' },
      ])
      setLoading(false)
    }
    load()
  }, [])

  const kpis = [
    { label: 'Ordens de Produção', value: stats.ordens.toString(), sub: `${stats.ordensAtivas} em andamento`, icon: FlaskConical, color: 'bg-green-50 text-green-600' },
    { label: 'Itens em Estoque', value: stats.itensEstoque.toString(), sub: `${stats.itensCriticos} abaixo do mínimo`, icon: Package, color: 'bg-blue-50 text-blue-600' },
    { label: 'Pedidos de Compra', value: stats.pedidos.toString(), sub: 'em aberto', icon: ShoppingCart, color: 'bg-amber-50 text-amber-600' },
    { label: 'Clientes Ativos', value: stats.clientes.toString(), sub: 'cadastrados', icon: Users, color: 'bg-purple-50 text-purple-600' },
  ]

  const statusBadge: Record<string, string> = {
    PENDENTE: 'badge-yellow', EM_ANDAMENTO: 'badge-blue', CONCLUIDA: 'badge-green', CANCELADA: 'badge-gray',
  }

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Carregando dados...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-xl p-5 text-white">
        <p className="text-green-200 text-sm">Bem-vinda de volta,</p>
        <h2 className="text-xl font-bold">Ana Paula Santos</h2>
        <p className="text-green-200 text-sm mt-1">VIABILIZZE Consultoria — Setor Alimentício</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div className={`p-2 rounded-lg ${k.color} inline-flex mb-3`}><k.icon size={20} /></div>
            <p className="text-2xl font-bold text-gray-800">{k.value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-700">Status do Estoque</h3>
          </div>
          {stats.itensEstoque > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={estChart} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {estChart.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-2 flex-wrap">
                {estChart.map(e => (
                  <div key={e.name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                    <span className="text-xs text-gray-500">{e.name} ({e.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhum ingrediente cadastrado</div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-purple-600" />
            <h3 className="font-semibold text-gray-700">Tarefas Recentes</h3>
          </div>
          {tarefas.length > 0 ? (
            <div className="space-y-3">
              {tarefas.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {t.status === 'CONCLUIDA' ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                    : t.prioridade === 'URGENTE' ? <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    : <Clock size={16} className="text-gray-400 shrink-0" />}
                  <p className="text-sm text-gray-700 flex-1">{t.titulo}</p>
                  <span className={statusBadge[t.status] ?? 'badge-gray'}>{t.status.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Nenhuma tarefa cadastrada ainda</div>
          )}
        </div>
      </div>
    </div>
  )
}
