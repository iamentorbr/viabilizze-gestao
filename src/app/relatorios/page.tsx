'use client'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts'
import { BarChart2, Package, TrendingUp, FileText, Download } from 'lucide-react'

const relatoriosCards = [
  { titulo: 'Produção Mensal',            desc: 'Relatório detalhado de produção por sabor',  icon: BarChart2, cor: '#43a047', bg: '#e8f5e9' },
  { titulo: 'Consumo de Matérias-Primas', desc: 'Análise de consumo e projeção',               icon: Package,  cor: '#1e88e5', bg: '#e3f2fd' },
  { titulo: 'Indicadores de Qualidade',   desc: 'Taxas de aprovação e rejeição',               icon: TrendingUp, cor: '#F97316', bg: '#fff3e0' },
  { titulo: 'Histórico de Movimentações', desc: 'Entradas e saídas de estoque',                icon: FileText, cor: '#8e24aa', bg: '#f3e5f5' },
]

const producaoData = [
  { mes: 'Jan', a: 85000, b: 62000, c: 48000, d: 32000 },
  { mes: 'Fev', a: 95000, b: 55000, c: 60000, d: 42000 },
  { mes: 'Mar', a: 75000, b: 75000, c: 55000, d: 38000 },
  { mes: 'Abr', a: 98000, b: 68000, c: 63000, d: 45000 },
]

const eficienciaData = [
  { semana: 'Sem 1', ef: 92 },
  { semana: 'Sem 2', ef: 89 },
  { semana: 'Sem 3', ef: 95 },
  { semana: 'Sem 4', ef: 91 },
]

const qualidadeData = [
  { name: 'Aprovado', value: 94, color: '#1a1d23' },
  { name: 'Reprovado', value: 2,  color: '#ef4444' },
  { name: 'Ajuste',   value: 4,  color: '#F97316' },
]

const resumo = [
  { label: 'Produção Total', value: '—', sub: 'Sem dados ainda', color: '#F97316' },
  { label: 'Ordens Concluídas', value: '—', sub: '—', color: '#43a047' },
  { label: 'Taxa de Qualidade', value: '—', sub: '—', color: '#F97316' },
  { label: 'Eficiência Média', value: '—', sub: '—', color: '#1e88e5' },
]

export default function RelatoriosPage() {
  return (
    <AppLayout>
      <Header title="Relatórios e Análises" subtitle="Visualização de dados e indicadores" />
      <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

        {/* Cards de relatório — igual ao print */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {relatoriosCards.map(r => (
            <div key={r.titulo} className="card cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="stat-icon" style={{ background: r.bg }}>
                  <r.icon size={18} style={{ color: r.cor }} />
                </div>
                <button className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  style={{ border: '1px solid #e8eaed' }}>
                  <Download size={13} style={{ color: '#9aa0a6' }} />
                </button>
              </div>
              <h3 className="text-sm font-bold mt-3 mb-1" style={{ color: '#1a1d23' }}>{r.titulo}</h3>
              <p className="text-xs" style={{ color: '#9aa0a6' }}>{r.desc}</p>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Produção por Sabor */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={15} style={{ color: '#43a047' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Produção por Sabor (2024)</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={producaoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} tickFormatter={v => `${v/1000}k`} />
                <Tooltip formatter={(v: any) => `${(v/1000).toFixed(0)}k`} />
                <Bar dataKey="a" fill="#1a1d23" radius={[2,2,0,0]} />
                <Bar dataKey="b" fill="#3c4043" radius={[2,2,0,0]} />
                <Bar dataKey="c" fill="#5f6368" radius={[2,2,0,0]} />
                <Bar dataKey="d" fill="#9aa0a6" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Eficiência */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={15} style={{ color: '#F97316' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Eficiência de Produção (%)</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eficienciaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f2f5" />
                <XAxis dataKey="semana" tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                <YAxis domain={[80,100]} tick={{ fontSize: 11, fill: '#9aa0a6' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="ef" fill="#F97316" radius={[4,4,0,0]} name="Eficiência %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Qualidade + Resumo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card">
            <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>Distribuição de Qualidade</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={qualidadeData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {qualidadeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {qualidadeData.map(q => (
                  <div key={q.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: q.color }} />
                    <span className="text-xs" style={{ color: '#5f6368' }}>{q.name}: <span className="font-bold" style={{ color: '#1a1d23' }}>{q.value}%</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>Resumo do Período</h3>
            <div className="grid grid-cols-2 gap-3">
              {resumo.map(r => (
                <div key={r.label} className="p-3 rounded-xl" style={{ background: '#fafafa', border: '1px solid #f0f2f5' }}>
                  <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{r.label}</p>
                  <p className="text-xl font-black" style={{ color: '#1a1d23' }}>{r.value}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: r.color }}>{r.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  )
}
