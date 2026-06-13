'use client'
import { useState } from 'react'
import { Plus, FlaskConical, Play, Pause, CheckCircle, XCircle, Filter } from 'lucide-react'

const ordens = [
  { numero: 'OP-2026-001', produto: 'Kombucha Gengibre 500ml', lote: 'L2026001', qtd: 200, unidade: 'L', status: 'EM_ANDAMENTO', data: '2026-05-20', responsavel: 'Ana Paula' },
  { numero: 'OP-2026-002', produto: 'Kefir Natural 1L',        lote: 'L2026002', qtd: 100, unidade: 'L', status: 'PLANEJADA',   data: '2026-05-25', responsavel: 'Ana Paula' },
  { numero: 'OP-2026-003', produto: 'Vinagre de Maçã 250ml',   lote: 'L2026003', qtd: 300, unidade: 'L', status: 'CONCLUIDA',   data: '2026-05-15', responsavel: 'Ana Paula' },
  { numero: 'OP-2026-004', produto: 'Fermentado de Beterraba',  lote: 'L2026004', qtd: 150, unidade: 'L', status: 'PAUSADA',    data: '2026-05-18', responsavel: 'Ana Paula' },
]

const statusConfig: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  PLANEJADA:    { label: 'Planejada',    badge: 'badge-blue',   icon: <FlaskConical size={14} /> },
  EM_ANDAMENTO: { label: 'Em Andamento', badge: 'badge-yellow', icon: <Play size={14} /> },
  PAUSADA:      { label: 'Pausada',      badge: 'badge-gray',   icon: <Pause size={14} /> },
  CONCLUIDA:    { label: 'Concluída',    badge: 'badge-green',  icon: <CheckCircle size={14} /> },
  CANCELADA:    { label: 'Cancelada',    badge: 'badge-red',    icon: <XCircle size={14} /> },
}

export default function ProducaoClient() {
  const [filtro, setFiltro] = useState('TODOS')

  const filtradas = filtro === 'TODOS' ? ordens : ordens.filter(o => o.status === filtro)

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Planejadas',    count: ordens.filter(o=>o.status==='PLANEJADA').length,    color: 'text-blue-600' },
          { label: 'Em Andamento',  count: ordens.filter(o=>o.status==='EM_ANDAMENTO').length, color: 'text-yellow-600' },
          { label: 'Concluídas',    count: ordens.filter(o=>o.status==='CONCLUIDA').length,    color: 'text-green-600' },
          { label: 'Pausadas',      count: ordens.filter(o=>o.status==='PAUSADA').length,      color: 'text-gray-600' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Header + Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {['TODOS','PLANEJADA','EM_ANDAMENTO','CONCLUIDA','PAUSADA'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                filtro === f
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-green-400'
              }`}
            >
              {f === 'TODOS' ? 'Todos' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          <Plus size={16} />
          Nova Ordem
        </button>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Número','Produto','Lote','Qtd. Planejada','Data','Status','Ações'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtradas.map(o => {
                const sc = statusConfig[o.status]
                return (
                  <tr key={o.numero} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-green-700">{o.numero}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{o.produto}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{o.lote}</td>
                    <td className="px-4 py-3 text-gray-700">{o.qtd} {o.unidade}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(o.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">
                      <span className={sc.badge}>{sc.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 hover:bg-green-50 rounded text-green-600" title="Ver detalhes">
                          <FlaskConical size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
