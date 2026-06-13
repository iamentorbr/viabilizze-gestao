'use client'
import { useEffect, useState } from 'react'
import { supabase, type Ingrediente } from '@/lib/supabase'
import { Package, AlertTriangle, Plus } from 'lucide-react'

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
    <div className="p-6 space-y-5">
      {criticos > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertTriangle size={18} style={{ color: '#EF4444' }} className="shrink-0" />
          <div>
            <p className="text-sm font-bold" style={{ color: '#EF4444' }}>{criticos} item(ns) em nível crítico</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Realize pedidos de compra imediatamente para evitar paralisação.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card stat-accent-green"><p className="text-2xl font-black text-white">{ok}</p><p className="text-xs mt-1" style={{color:'#10B981'}}>Itens OK</p></div>
        <div className="card stat-accent-blue"><p className="text-2xl font-black text-white">{atencao}</p><p className="text-xs mt-1" style={{color:'#F59E0B'}}>Em Atenção</p></div>
        <div className="card stat-accent-red"><p className="text-2xl font-black text-white">{criticos}</p><p className="text-xs mt-1" style={{color:'#EF4444'}}>Críticos</p></div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white uppercase tracking-wide">Matérias-Primas e Ingredientes</h2>
        <button onClick={() => setModal(true)} className="btn-primary text-xs"><Plus size={14} /> Novo Item</button>
      </div>

      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : itens.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#444' }}>
            <Package size={36} className="mx-auto mb-3" />
            <p className="text-sm">Nenhum ingrediente cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vtable">
              <thead><tr>
                {['Código','Nome','Un.','Estoque Atual','Mínimo','Nível','Custo Unit.','Status'].map(h=><th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {itens.map(i => {
                  const st = getStatus(i)
                  const pct = i.estoque_minimo > 0 ? Math.min(Math.round((i.estoque_atual / (i.estoque_minimo * 2)) * 100), 100) : 100
                  const barColor = st==='OK' ? '#10B981' : st==='ATENCAO' ? '#F59E0B' : '#EF4444'
                  return (
                    <tr key={i.id}>
                      <td><span className="font-mono text-xs" style={{ color: '#6B7280' }}>{i.codigo}</span></td>
                      <td className="font-semibold text-white">{i.nome}</td>
                      <td style={{ color: '#9CA3AF' }}>{i.unidade_medida}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <input type="number" step="0.1" defaultValue={i.estoque_atual}
                            onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v !== i.estoque_atual) atualizarEstoque(i.id, v) }}
                            className="input text-xs" style={{ width: 70, padding: '3px 8px', height: 28 }} />
                          <span className="text-xs" style={{ color: '#6B7280' }}>{i.unidade_medida}</span>
                        </div>
                      </td>
                      <td style={{ color: '#9CA3AF' }}>{i.estoque_minimo} {i.unidade_medida}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 rounded-full h-1.5" style={{ background: '#333' }}>
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className="text-xs" style={{ color: '#6B7280' }}>{pct}%</span>
                        </div>
                      </td>
                      <td className="text-white">R$ {Number(i.custo_unitario).toFixed(2)}</td>
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

      {modal && (
        <div className="modal-bg">
          <div className="modal-box">
            <div className="flex items-center gap-2 mb-5">
              <span style={{ width: 3, height: 18, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
              <h2 className="text-base font-black text-white">Novo Ingrediente</h2>
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
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} className="input" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center" style={{ opacity: salvando ? .6 : 1 }}>
                {salvando ? 'Salvando...' : 'Salvar Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
