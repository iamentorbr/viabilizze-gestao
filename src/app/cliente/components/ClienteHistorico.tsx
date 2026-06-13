'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { BarChart2, Clock, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'

export default function ClienteHistorico({ clienteId, sabores }: { clienteId: string; sabores?: any[] }) {
  const [rodadas, setRodadas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandida, setExpandida] = useState<string | null>(null)
  const [detalhe, setDetalhe] = useState<Record<string, any[]>>({})

  useEffect(() => {
    supabase.from('producao_rodadas')
      .select('*, cliente_sabores(nome)')
      .eq('cliente_id', clienteId)
      .order('criado_em', { ascending: false })
      .then(({ data }) => { setRodadas(data ?? []); setLoading(false) })
  }, [clienteId])

  const carregarDetalhe = async (rodadaId: string) => {
    if (detalhe[rodadaId]) {
      setExpandida(expandida === rodadaId ? null : rodadaId)
      return
    }
    const { data } = await supabase.from('producao_compras_detalhe')
      .select('*').eq('rodada_id', rodadaId).order('status_compra')
    setDetalhe(prev => ({ ...prev, [rodadaId]: data ?? [] }))
    setExpandida(rodadaId)
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="stat-icon" style={{ background: '#e3f2fd', width: 30, height: 30, borderRadius: 8 }}>
          <Clock size={14} style={{ color: '#1565c0' }} />
        </div>
        <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Histórico de Rodadas de Produção</h3>
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1"
          style={{ background: '#e3f2fd', color: '#1565c0' }}>
          {rodadas.length} rodada(s)
        </span>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="spinner" /></div>
      ) : rodadas.length === 0 ? (
        <div className="card text-center py-16">
          <BarChart2 size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium" style={{ color: '#9aa0a6' }}>Nenhuma rodada registrada</p>
          <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>Use a Calculadora de Produção para criar a primeira.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rodadas.map(r => (
            <div key={r.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Cabeçalho da rodada */}
              <div className="px-5 py-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => carregarDetalhe(r.id)}>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-xs font-bold" style={{ color: '#F97316' }}>{r.numero ?? r.id.slice(0,8)}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: '#fff3e0', color: '#e65100' }}>
                      {r.cliente_sabores?.nome ?? '—'}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: '#9aa0a6' }}>
                    {r.data_producao ? new Date(r.data_producao).toLocaleDateString('pt-BR') : '—'}
                    {r.responsavel ? ` · ${r.responsavel}` : ''}
                  </p>
                </div>
                <div className="flex gap-5 ml-auto">
                  {[
                    { label: 'Embalagens', val: `${Number(r.estoque_embalagens).toLocaleString('pt-BR')} un` },
                    { label: 'Litros', val: `${Number(r.litros_totais).toFixed(2)} L` },
                    { label: 'Compras', val: `${Number(r.total_kg_compras).toFixed(3)} kg` },
                    { label: 'Caixas', val: Number(r.caixas_necessarias).toFixed(0) },
                  ].map(k => (
                    <div key={k.label} className="text-right hidden sm:block">
                      <p className="text-xs" style={{ color: '#9aa0a6' }}>{k.label}</p>
                      <p className="text-sm font-bold" style={{ color: '#1a1d23' }}>{k.val}</p>
                    </div>
                  ))}
                  <span className="badge-green self-center">{r.status}</span>
                  <span style={{ color: '#9aa0a6' }}>
                    {expandida === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
              </div>

              {/* Detalhe expandido */}
              {expandida === r.id && detalhe[r.id] && (
                <div style={{ borderTop: '1px solid #e8eaed' }}>
                  <div className="px-5 py-2" style={{ background: '#fafafa', borderBottom: '1px solid #e8eaed' }}>
                    <div className="flex items-center gap-1.5">
                      <ShoppingCart size={13} style={{ color: '#c62828' }} />
                      <span className="text-xs font-bold" style={{ color: '#1a1d23' }}>Lista de Compras desta Rodada</span>
                    </div>
                  </div>
                  <table className="vtable">
                    <thead><tr>
                      {['Fornecedor','Ingrediente','Necessidade (kg)','Estoque (kg)','Comprar (kg)','Status'].map(h=><th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {detalhe[r.id].map((d, i) => (
                        <tr key={i}>
                          <td style={{ color: '#5f6368' }}>{d.fornecedor}</td>
                          <td className="font-semibold" style={{ color: '#1a1d23' }}>{d.ingrediente}</td>
                          <td>{Number(d.qtd_necessaria).toFixed(3)}</td>
                          <td style={{ color: Number(d.estoque_remanescente) > 0 ? '#2e7d32' : '#9aa0a6' }}>
                            {Number(d.estoque_remanescente).toFixed(3)}
                          </td>
                          <td>
                            <span className="font-black" style={{ color: Number(d.qtd_comprar) > 0 ? '#c62828' : '#9aa0a6' }}>
                              {Number(d.qtd_comprar) <= 0 ? '—' : Number(d.qtd_comprar).toFixed(3)}
                            </span>
                          </td>
                          <td>
                            <span className={d.status_compra==='SUFICIENTE'?'badge-green':d.status_compra==='PARCIAL'?'badge-yellow':'badge-red'}>
                              {d.status_compra}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
