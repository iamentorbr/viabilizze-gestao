'use client'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import {
  FlaskConical, Package, ShoppingCart, Users,
  TrendingUp, AlertTriangle, CheckCircle, Clock
} from 'lucide-react'

const producaoMes = [
  { mes: 'Jan', litros: 1200 },
  { mes: 'Fev', litros: 1800 },
  { mes: 'Mar', litros: 1400 },
  { mes: 'Abr', litros: 2100 },
  { mes: 'Mai', litros: 1900 },
  { mes: 'Jun', litros: 2400 },
]

const comprasMes = [
  { mes: 'Jan', valor: 3200 },
  { mes: 'Fev', valor: 4100 },
  { mes: 'Mar', valor: 2800 },
  { mes: 'Abr', valor: 5200 },
  { mes: 'Mai', valor: 3900 },
  { mes: 'Jun', valor: 4600 },
]

const estoqueStatus = [
  { name: 'OK', value: 68, color: '#16a34a' },
  { name: 'Atenção', value: 22, color: '#f59e0b' },
  { name: 'Crítico', value: 10, color: '#ef4444' },
]

const kpis = [
  {
    label: 'Ordens de Produção',
    value: '12',
    sub: '3 em andamento',
    icon: FlaskConical,
    color: 'bg-green-50 text-green-600',
    trend: '+2 esta semana',
  },
  {
    label: 'Itens em Estoque',
    value: '47',
    sub: '5 abaixo do mínimo',
    icon: Package,
    color: 'bg-blue-50 text-blue-600',
    trend: '⚠️ Verificar',
  },
  {
    label: 'Pedidos de Compra',
    value: '8',
    sub: '2 aguardando entrega',
    icon: ShoppingCart,
    color: 'bg-amber-50 text-amber-600',
    trend: 'R$ 12.400 em aberto',
  },
  {
    label: 'Clientes Ativos',
    value: '6',
    sub: '1 novo este mês',
    icon: Users,
    color: 'bg-purple-50 text-purple-600',
    trend: '+1 novo',
  },
]

const tarefasRecentes = [
  { titulo: 'Revisar ficha técnica - Kombucha Gengibre', status: 'PENDENTE', prioridade: 'ALTA' },
  { titulo: 'Atualizar rótulo produto linha verão', status: 'EM_ANDAMENTO', prioridade: 'MEDIA' },
  { titulo: 'Pedido de compra fornecedor BioInsumos', status: 'CONCLUIDA', prioridade: 'ALTA' },
  { titulo: 'Inventário matérias-primas trimestral', status: 'PENDENTE', prioridade: 'URGENTE' },
]

const statusBadge: Record<string, string> = {
  PENDENTE: 'badge-yellow',
  EM_ANDAMENTO: 'badge-blue',
  CONCLUIDA: 'badge-green',
  CANCELADA: 'badge-gray',
}

const prioridadeBadge: Record<string, string> = {
  BAIXA: 'badge-gray',
  MEDIA: 'badge-blue',
  ALTA: 'badge-yellow',
  URGENTE: 'badge-red',
}

export default function DashboardClient() {
  return (
    <div className="p-6 space-y-6">
      {/* Boas vindas */}
      <div className="bg-gradient-to-r from-green-700 to-green-600 rounded-xl p-5 text-white">
        <p className="text-green-200 text-sm">Bem-vinda de volta,</p>
        <h2 className="text-xl font-bold">Ana Paula Santos</h2>
        <p className="text-green-200 text-sm mt-1">VIABILIZZE Consultoria — Setor Alimentício</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${k.color}`}>
                <k.icon size={20} />
              </div>
              <span className="text-xs text-gray-400 text-right">{k.trend}</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{k.value}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">{k.label}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Produção */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-green-600" />
            <h3 className="font-semibold text-gray-700">Produção — Litros/Mês</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={producaoMes}>
              <defs>
                <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="litros" stroke="#16a34a" fill="url(#colorProd)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Compras */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart size={18} className="text-amber-600" />
            <h3 className="font-semibold text-gray-700">Compras — R$/Mês</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comprasMes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `R$ ${Number(v).toLocaleString('pt-BR')}`} />
              <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Estoque + Tarefas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Estoque Pizza */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Package size={18} className="text-blue-600" />
            <h3 className="font-semibold text-gray-700">Status do Estoque</h3>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={estoqueStatus} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                {estoqueStatus.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [`${v}%`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {estoqueStatus.map((e) => (
              <div key={e.name} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: e.color }} />
                <span className="text-xs text-gray-500">{e.name} ({e.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarefas recentes */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-purple-600" />
            <h3 className="font-semibold text-gray-700">Tarefas Recentes</h3>
          </div>
          <div className="space-y-3">
            {tarefasRecentes.map((t, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {t.status === 'CONCLUIDA'
                  ? <CheckCircle size={16} className="text-green-500 shrink-0" />
                  : t.prioridade === 'URGENTE'
                  ? <AlertTriangle size={16} className="text-red-500 shrink-0" />
                  : <Clock size={16} className="text-gray-400 shrink-0" />
                }
                <p className="text-sm text-gray-700 flex-1 leading-snug">{t.titulo}</p>
                <div className="flex gap-1 shrink-0">
                  <span className={statusBadge[t.status]}>{t.status.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
