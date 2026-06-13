'use client'
import { Package, AlertTriangle, TrendingDown, Plus } from 'lucide-react'

const ingredientes = [
  { codigo: 'ING-001', nome: 'Chá Preto Orgânico',   unidade: 'kg',  atual: 15.5, minimo: 5.0,  custo: 28.00,  status: 'OK' },
  { codigo: 'ING-002', nome: 'Açúcar Mascavo',        unidade: 'kg',  atual: 3.2,  minimo: 5.0,  custo: 8.50,   status: 'CRITICO' },
  { codigo: 'ING-003', nome: 'SCOBY Kombucha',        unidade: 'un',  atual: 8.0,  minimo: 3.0,  custo: 45.00,  status: 'OK' },
  { codigo: 'ING-004', nome: 'Gengibre Fresco',       unidade: 'kg',  atual: 4.8,  minimo: 5.0,  custo: 12.00,  status: 'ATENCAO' },
  { codigo: 'ING-005', nome: 'Limão Siciliano',       unidade: 'kg',  atual: 2.1,  minimo: 3.0,  custo: 18.00,  status: 'CRITICO' },
  { codigo: 'ING-006', nome: 'Água Filtrada',         unidade: 'L',   atual: 200,  minimo: 50.0, custo: 0.50,   status: 'OK' },
  { codigo: 'ING-007', nome: 'Maçã Fuji',             unidade: 'kg',  atual: 22.0, minimo: 10.0, custo: 6.80,   status: 'OK' },
  { codigo: 'ING-008', nome: 'Beterraba',             unidade: 'kg',  atual: 5.5,  minimo: 8.0,  custo: 4.50,   status: 'ATENCAO' },
]

const statusConfig: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  OK:       { label: 'OK',      badge: 'badge-green',  icon: <Package size={13} /> },
  ATENCAO:  { label: 'Atenção', badge: 'badge-yellow', icon: <AlertTriangle size={13} /> },
  CRITICO:  { label: 'Crítico', badge: 'badge-red',    icon: <TrendingDown size={13} /> },
}

export default function EstoqueClient() {
  const criticos = ingredientes.filter(i => i.status === 'CRITICO').length
  const atencao  = ingredientes.filter(i => i.status === 'ATENCAO').length
  const ok       = ingredientes.filter(i => i.status === 'OK').length

  return (
    <div className="p-6 space-y-5">
      {/* Alertas */}
      {criticos > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">{criticos} item(ns) em nível crítico de estoque</p>
            <p className="text-xs text-red-600">Realize pedidos de compra imediatamente para evitar paralisação da produção.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{ok}</p>
          <p className="text-xs text-gray-500 mt-1">Itens OK</p>
        </div>
        <div className="card text-center border-l-4 border-yellow-400">
          <p className="text-2xl font-bold text-yellow-500">{atencao}</p>
          <p className="text-xs text-gray-500 mt-1">Em Atenção</p>
        </div>
        <div className="card text-center border-l-4 border-red-500">
          <p className="text-2xl font-bold text-red-500">{criticos}</p>
          <p className="text-xs text-gray-500 mt-1">Críticos</p>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Matérias-Primas e Ingredientes</h2>
        <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          <Plus size={15} />
          Novo Item
        </button>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Código','Nome','Unidade','Estoque Atual','Estoque Mínimo','% Disponível','Custo Unit.','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {ingredientes.map(i => {
                const pct = Math.round((i.atual / (i.minimo * 2)) * 100)
                const sc = statusConfig[i.status]
                return (
                  <tr key={i.codigo} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{i.codigo}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{i.nome}</td>
                    <td className="px-4 py-3 text-gray-500">{i.unidade}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{i.atual} {i.unidade}</td>
                    <td className="px-4 py-3 text-gray-500">{i.minimo} {i.unidade}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${i.status==='OK'?'bg-green-500':i.status==='ATENCAO'?'bg-yellow-400':'bg-red-500'}`}
                            style={{ width: `${Math.min(pct,100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{Math.min(pct,100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">R$ {i.custo.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={sc.badge}>{sc.label}</span>
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
