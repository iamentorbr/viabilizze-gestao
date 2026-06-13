'use client'
import { useEffect, useState } from 'react'
import { supabase, type Ingrediente } from '@/lib/supabase'
import { Package, AlertTriangle, Plus, TrendingDown } from 'lucide-react'

export default function EstoqueClient() {
  const [itens, setItens] = useState<Ingrediente[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ codigo: '', nome: '', unidade_medida: 'kg', estoque_atual: '', estoque_minimo: '', custo_unitario: '', fornecedor_principal: '' })

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('ingredientes').select('*').eq('ativo', true).order('nome')
    setItens(data ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function statusItem(i: Ingrediente) {
    if (i.estoque_atual <= i.estoque_minimo) return 'CRITICO'
    if (i.estoque_atual <= i.estoque_minimo * 1.5) return 'ATENCAO'
    return 'OK'
  }

  async function salvar() {
    if (!form.nome.trim() || !form.codigo.trim()) return
    setSalvando(true)
    await supabase.from('ingredientes').insert({
      ...form,
      estoque_atual: Number(form.estoque_atual) || 0,
      estoque_minimo: Number(form.estoque_minimo) || 0,
      custo_unitario: Number(form.custo_unitario) || 0,
      ativo: true,
    })
    setModal(false)
    setForm({ codigo: '', nome: '', unidade_medida: 'kg', estoque_atual: '', estoque_minimo: '', custo_unitario: '', fornecedor_principal: '' })
    setSalvando(false)
    carregar()
  }

  async function atualizarEstoque(id: string, novo: number) {
    await supabase.from('ingredientes').update({ estoque_atual: novo }).eq('id', id)
    setItens(prev => prev.map(i => i.id === id ? { ...i, estoque_atual: novo } : i))
  }

  const criticos = itens.filter(i => statusItem(i) === 'CRITICO').length
  const atencao  = itens.filter(i => statusItem(i) === 'ATENCAO').length

  return (
    <div className="p-6 space-y-5">
      {criticos > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">{criticos} item(ns) em nível crítico de estoque</p>
            <p className="text-xs text-red-600">Realize pedidos de compra imediatamente.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center border-l-4 border-green-500">
          <p className="text-2xl font-bold text-green-600">{itens.filter(i=>statusItem(i)==='OK').length}</p>
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

      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">Matérias-Primas e Ingredientes</h2>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          <Plus size={15} /> Novo Item
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : itens.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum ingrediente cadastrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Código','Nome','Un.','Estoque Atual','Mínimo','Nível','Custo Unit.','Status'].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {itens.map(i => {
                  const st = statusItem(i)
                  const pct = i.estoque_minimo > 0 ? Math.min(Math.round((i.estoque_atual / (i.estoque_minimo * 2)) * 100), 100) : 100
                  return (
                    <tr key={i.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{i.codigo}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{i.nome}</td>
                      <td className="px-4 py-3 text-gray-500">{i.unidade_medida}</td>
                      <td className="px-4 py-3">
                        <input type="number" step="0.1" defaultValue={i.estoque_atual}
                          onBlur={e => { const v = parseFloat(e.target.value); if (!isNaN(v) && v !== i.estoque_atual) atualizarEstoque(i.id, v) }}
                          className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500" />
                        <span className="text-gray-400 text-xs ml-1">{i.unidade_medida}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{i.estoque_minimo} {i.unidade_medida}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-gray-200 rounded-full h-1.5">
                            <div className={`h-1.5 rounded-full ${st==='OK'?'bg-green-500':st==='ATENCAO'?'bg-yellow-400':'bg-red-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">R$ {Number(i.custo_unitario).toFixed(2)}</td>
                      <td className="px-4 py-3">
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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Ingrediente / Matéria-Prima</h2>
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
                  <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                {salvando ? 'Salvando...' : 'Salvar Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
