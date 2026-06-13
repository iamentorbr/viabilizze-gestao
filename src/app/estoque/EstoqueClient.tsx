'use client'
import { useEffect, useState } from 'react'
import { supabase, type Ingrediente } from '@/lib/supabase'
import { Package, AlertTriangle, Plus, CheckCircle, TrendingDown } from 'lucide-react'

export default function EstoqueClient() {
  const [itens, setItens] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ codigo: '', nome: '', unidade_medida: 'kg', estoque_atual: '', estoque_minimo: '', custo_unitario: '', fornecedor_principal: '' })

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('ingredientes').select('*').eq('ativo', true).order('nome')
    setItens(data ?? []); setLoading(false)
  }
  useEffect(() => { carregar() }, [])

  const getStatus = (i: Ingrediente) => {
    if (i.estoque_atual <= i.estoque_minimo) return 'CRITICO'
    if (i.estoque_atual <= i.estoque_minimo * 1.5) return 'ATENCAO'
    return 'OK'
  }

  async function salvar() {
    if (!form.nome.trim() || !form.codigo.trim()) return
    setSalvando(true)
    await supabase.from('ingredientes').insert({
      ...form, ativo: true,
      estoque_atual:  Number(form.estoque_atual)  || 0,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      custo_unitario: Number(form.custo_unitario) || 0,
    })
    setModal(false)
    setForm({ codigo: '', nome: '', unidade_medida: 'kg', estoque_atual: '', estoque_minimo: '', custo_unitario: '', fornecedor_principal: '' })
    setSalvando(false); carregar()
  }

  async function atualizarEstoque(id: string, novo: number) {
    await supabase.from('ingredientes').update({ estoque_atual: novo }).eq('id', id)
    setItens(prev => prev.map(i => i.id === id ? { ...i, estoque_atual: novo } : i))
  }

  const criticos = itens.filter(i => getStatus(i) === 'CRITICO').length
  const atencao  = itens.filter(i => getStatus(i) === 'ATENCAO').length
  const ok       = itens.filter(i => getStatus(i) === 'OK').length

  return (
    <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* Alerta crítico */}
      {criticos > 0 && (
        <div className="alert-error flex items-center gap-3">
          <AlertTriangle size={17} style={{ color: '#c62828' }} className="shrink-0" />
          <div>
            <p className="text-sm font-bold" style={{ color: '#c62828' }}>{criticos} item(ns) abaixo do estoque mínimo</p>
            <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>Realize pedidos de compra para evitar paralisação da produção.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="stat-card" style={{ borderTop: '3px solid #22c55e' }}>
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-black" style={{ color: '#1a1d23' }}>{ok}</p><p className="text-xs font-medium" style={{ color: '#22c55e' }}>Itens OK</p></div>
            <div className="stat-icon" style={{ background: '#e8f5e9' }}><CheckCircle size={18} style={{ color: '#22c55e' }} /></div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-black" style={{ color: '#1a1d23' }}>{atencao}</p><p className="text-xs font-medium" style={{ color: '#f59e0b' }}>Em Atenção</p></div>
            <div className="stat-icon" style={{ background: '#fff8e1' }}><AlertTriangle size={18} style={{ color: '#f59e0b' }} /></div>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid #ef4444' }}>
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-black" style={{ color: '#1a1d23' }}>{criticos}</p><p className="text-xs font-medium" style={{ color: '#ef4444' }}>Críticos</p></div>
            <div className="stat-icon" style={{ background: '#fce4ec' }}><TrendingDown size={18} style={{ color: '#ef4444' }} /></div>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
          <div className="stat-icon" style={{ background: '#e8f5e9', width: 30, height: 30, borderRadius: 8 }}>
            <Package size={15} style={{ color: '#43a047' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Matérias-Primas</h3>
          <button onClick={() => setModal(true)} className="btn-primary ml-auto" style={{ padding: '6px 12px', fontSize: 12 }}>
            <Plus size={13} /> Novo Item
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : itens.length === 0 ? (
          <div className="text-center py-14" style={{ color: '#9aa0a6' }}>
            <Package size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum ingrediente cadastrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vtable">
              <thead><tr>
                {['Código','Nome','Un.','Estoque Atual','Mínimo','Nível','Custo Unit.','Status'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {itens.map(i => {
                  const st = getStatus(i)
                  const pct = i.estoque_minimo > 0 ? Math.min(Math.round((i.estoque_atual / (i.estoque_minimo * 2)) * 100), 100) : 100
                  const barColor = st==='OK'?'#22c55e':st==='ATENCAO'?'#f59e0b':'#ef4444'
                  return (
                    <tr key={i.id}>
                      <td><span className="font-mono text-xs" style={{ color: '#9aa0a6' }}>{i.codigo}</span></td>
                      <td><span className="font-semibold" style={{ color: '#1a1d23' }}>{i.nome}</span></td>
                      <td style={{ color: '#5f6368' }}>{i.unidade_medida}</td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <input type="number" step="0.1" defaultValue={i.estoque_atual}
                            onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v !== i.estoque_atual) atualizarEstoque(i.id, v) }}
                            className="input text-xs" style={{ width: 70, height: 28, padding: '2px 6px' }} />
                          <span className="text-xs" style={{ color: '#9aa0a6' }}>{i.unidade_medida}</span>
                        </div>
                      </td>
                      <td style={{ color: '#5f6368' }}>{i.estoque_minimo} {i.unidade_medida}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full h-1.5" style={{ width: 60, background: '#e8eaed' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className="text-xs" style={{ color: '#9aa0a6' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ color: '#3c4043' }}>R$ {Number(i.custo_unitario).toFixed(2)}</td>
                      <td>
                        <span className={st==='OK'?'badge-green':st==='ATENCAO'?'badge-yellow':'badge-red'}>
                          {st==='OK'?'OK':st==='ATENCAO'?'Atenção':'Crítico'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-bg">
          <div className="modal-box">
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon" style={{ background: '#e8f5e9', width: 32, height: 32, borderRadius: 8 }}>
                <Package size={15} style={{ color: '#43a047' }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Novo Ingrediente</h2>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Cadastre um novo item no estoque</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { key: 'codigo', label: 'Código *', type: 'text' },
                { key: 'nome', label: 'Nome *', type: 'text' },
                { key: 'unidade_medida', label: 'Unidade (kg, L, un...)', type: 'text' },
                { key: 'estoque_atual', label: 'Estoque Atual', type: 'number' },
                { key: 'estoque_minimo', label: 'Estoque Mínimo', type: 'number' },
                { key: 'custo_unitario', label: 'Custo Unitário (R$)', type: 'number' },
                { key: 'fornecedor_principal', label: 'Fornecedor Principal', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} className="input" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
                {salvando ? 'Salvando...' : 'Salvar Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
