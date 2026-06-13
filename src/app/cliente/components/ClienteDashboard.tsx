'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Beaker, Package, ShoppingCart, BarChart2, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

const CAT_COLOR: Record<string, string> = {
  funcional: '#8e24aa', polpa: '#e65100', acido: '#2e7d32',
  conservante: '#1565c0', aroma: '#004d40', adocante: '#f57f17', outro: '#757575',
}

export default function ClienteDashboard({ clienteId, cliente, sabores }: any) {
  const [rodadas, setRodadas] = useState<any[]>([])

  useEffect(() => {
    supabase.from('producao_rodadas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })
      .limit(5)
      .then(({ data }) => setRodadas(data ?? []))
  }, [clienteId])

  const totalIngredientes = sabores.reduce((s: number, sb: any) =>
    s + (sb.sabor_ingredientes?.length ?? 0), 0)

  const totalFornecedores = new Set(
    sabores.flatMap((sb: any) => sb.sabor_ingredientes?.map((i: any) => i.fornecedor) ?? [])
  ).size

  return (
    <main className="p-6 space-y-5">

      {/* Banner do cliente */}
      <div className="rounded-xl px-6 py-5"
        style={{ background: 'linear-gradient(135deg, #1a1d23 0%, #252931 100%)', border: '1px solid #2a2d33' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F97316' }}>
                Cliente Ativo
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            </div>
            <h1 className="text-2xl font-black text-white mb-1">{cliente.nome}</h1>
            <p className="text-xs" style={{ color: '#9aa0a6' }}>
              {sabores.length} sabor(es) · {totalIngredientes} ingredientes · {totalFornecedores} fornecedores
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs mb-1" style={{ color: '#6b7280' }}>Linha de Produtos</p>
            <div className="flex gap-1.5 justify-end">
              {sabores.map((sb: any) => (
                <span key={sb.id} className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: 'rgba(249,115,22,0.15)', color: '#F97316', border: '1px solid rgba(249,115,22,0.3)' }}>
                  {sb.nome}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Sabores Ativos', value: sabores.length, sub: 'na linha de produção', bg: '#fff3e0', color: '#F97316', icon: Beaker },
          { label: 'Ingredientes', value: totalIngredientes, sub: 'total na formulação', bg: '#f3e5f5', color: '#8e24aa', icon: Package },
          { label: 'Fornecedores', value: totalFornecedores, sub: 'parceiros ativos', bg: '#e3f2fd', color: '#1565c0', icon: ShoppingCart },
          { label: 'Rodadas', value: rodadas.length, sub: 'produções registradas', bg: '#e8f5e9', color: '#2e7d32', icon: BarChart2 },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{k.label}</p>
                <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>{k.sub}</p>
              </div>
              <div className="stat-icon" style={{ background: k.bg }}>
                <k.icon size={18} style={{ color: k.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cards por sabor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {sabores.map((sb: any) => {
          const ings = sb.sabor_ingredientes ?? []
          const totalGl = ings.reduce((s: number, i: any) => s + Number(i.g_por_litro), 0)
          const porCategoria = ings.reduce((acc: any, i: any) => {
            acc[i.categoria] = (acc[i.categoria] || 0) + 1; return acc
          }, {})

          return (
            <div key={sb.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-black" style={{ color: '#1a1d23' }}>{sb.nome}</h3>
                  <p className="text-xs" style={{ color: '#9aa0a6' }}>
                    Embalagem {sb.volume_embalagem_ml}mL · {sb.unidades_por_caixa} un/cx
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#fff3e0', color: '#e65100' }}>
                  {ings.length} ing.
                </span>
              </div>

              {/* Barra de composição por categoria */}
              <div className="mb-3">
                <p className="text-xs mb-1.5" style={{ color: '#9aa0a6' }}>Composição formulação</p>
                <div className="flex rounded-full overflow-hidden h-2">
                  {Object.entries(porCategoria).map(([cat, count]: any) => (
                    <div key={cat} style={{
                      width: `${(count / ings.length) * 100}%`,
                      background: CAT_COLOR[cat] ?? '#bbb',
                    }} title={cat} />
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {Object.entries(porCategoria).map(([cat, count]: any) => (
                    <span key={cat} className="text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: CAT_COLOR[cat] ?? '#bbb' }} />
                      <span style={{ color: '#6b7280' }}>{cat} ({count})</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Dados técnicos */}
              <div className="pt-3 space-y-1" style={{ borderTop: '1px solid #f0f2f5' }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#9aa0a6' }}>Total formulação</span>
                  <span className="font-bold" style={{ color: '#1a1d23' }}>{totalGl.toFixed(2)} g/L</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#9aa0a6' }}>Perda embalagem</span>
                  <span style={{ color: '#f59e0b' }}>{(sb.perda_embalagem_pct * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#9aa0a6' }}>Perda formulação</span>
                  <span style={{ color: '#f59e0b' }}>{(sb.perda_formulacao_pct * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Últimas rodadas */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
          <div className="stat-icon" style={{ background: '#e8f5e9', width: 28, height: 28, borderRadius: 7 }}>
            <Clock size={13} style={{ color: '#2e7d32' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Últimas Rodadas de Produção</h3>
        </div>
        {rodadas.length === 0 ? (
          <div className="text-center py-10" style={{ color: '#9aa0a6' }}>
            <Beaker size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma rodada registrada ainda.</p>
            <p className="text-xs mt-1">Use a Calculadora de Produção para gerar a primeira.</p>
          </div>
        ) : (
          <table className="vtable">
            <thead><tr>
              {['Nº','Sabor','Embalagens','Litros Totais','Kg Compras','Caixas','Status','Data'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rodadas.map(r => (
                <tr key={r.id}>
                  <td><span className="font-mono text-xs font-bold" style={{ color: '#F97316' }}>{r.numero ?? '—'}</span></td>
                  <td className="font-semibold" style={{ color: '#1a1d23' }}>{r.sabor_id}</td>
                  <td>{Number(r.estoque_embalagens).toLocaleString('pt-BR')}</td>
                  <td className="font-bold" style={{ color: '#1a1d23' }}>{Number(r.litros_totais).toFixed(2)} L</td>
                  <td>{Number(r.total_kg_compras).toFixed(3)} kg</td>
                  <td>{Number(r.caixas_necessarias).toFixed(0)}</td>
                  <td><span className="badge-green">{r.status}</span></td>
                  <td style={{ color: '#9aa0a6' }}>{r.data_producao ? new Date(r.data_producao).toLocaleDateString('pt-BR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  )
}
