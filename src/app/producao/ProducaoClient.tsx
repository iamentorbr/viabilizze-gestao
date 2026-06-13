'use client'
import { useEffect, useState } from 'react'
import { supabase, type OrdemProducao } from '@/lib/supabase'
import { Plus, FlaskConical, Search } from 'lucide-react'

const statusConfig: Record<string, { label: string; badge: string }> = {
  PLANEJADA:    { label: 'Planejada',    badge: 'badge-blue' },
  EM_ANDAMENTO: { label: 'Em Andamento', badge: 'badge-yellow' },
  PAUSADA:      { label: 'Pausada',      badge: 'badge-gray' },
  CONCLUIDA:    { label: 'Concluída',    badge: 'badge-green' },
  CANCELADA:    { label: 'Cancelada',    badge: 'badge-red' },
}

export default function ProducaoClient() {
  const [ordens, setOrdens] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODOS')
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ produto_id: '', quantidade_planejada: '', unidade_medida: 'L', data_planejada: '', numero_lote: '', responsavel: '', observacoes: '' })

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('ordens_producao').select('*, produtos(nome)').order('criado_em', { ascending: false })
    setOrdens(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    carregar()
    supabase.from('produtos').select('id, nome').eq('ativo', true).then(({ data }) => setProdutos(data ?? []))
  }, [])

  async function salvar() {
    if (!form.produto_id || !form.quantidade_planejada) return
    setSalvando(true)
    const numero = `OP-${new Date().getFullYear()}-${String(ordens.length + 1).padStart(3, '0')}`
    await supabase.from('ordens_producao').insert({ ...form, numero, quantidade_planejada: Number(form.quantidade_planejada), status: 'PLANEJADA' })
    setModal(false)
    setForm({ produto_id: '', quantidade_planejada: '', unidade_medida: 'L', data_planejada: '', numero_lote: '', responsavel: '', observacoes: '' })
    setSalvando(false)
    carregar()
  }

  async function atualizarStatus(id: string, status: string) {
    const updates: any = { status }
    if (status === 'EM_ANDAMENTO') updates.data_inicio = new Date().toISOString()
    if (status === 'CONCLUIDA') updates.data_fim = new Date().toISOString()
    await supabase.from('ordens_producao').update(updates).eq('id', id)
    carregar()
  }

  const filtradas = filtro === 'TODOS' ? ordens : ordens.filter(o => o.status === filtro)

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['PLANEJADA','EM_ANDAMENTO','CONCLUIDA','PAUSADA'] as const).map(s => (
          <div key={s} className="card text-center cursor-pointer hover:border-green-300 border border-transparent" onClick={() => setFiltro(s)}>
            <p className={`text-2xl font-bold ${s==='PLANEJADA'?'text-blue-600':s==='EM_ANDAMENTO'?'text-yellow-500':s==='CONCLUIDA'?'text-green-600':'text-gray-500'}`}>
              {ordens.filter(o=>o.status===s).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">{statusConfig[s].label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {['TODOS','PLANEJADA','EM_ANDAMENTO','CONCLUIDA','PAUSADA'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filtro===f?'bg-green-600 text-white':'bg-white text-gray-600 border border-gray-200 hover:border-green-400'}`}>
              {f==='TODOS'?'Todos':statusConfig[f]?.label ?? f}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
          <Plus size={16} /> Nova Ordem
        </button>
      </div>

      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FlaskConical size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhuma ordem encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Número','Produto','Lote','Qtd. Planejada','Data','Status','Ações'].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtradas.map(o => {
                  const sc = statusConfig[o.status] ?? { label: o.status, badge: 'badge-gray' }
                  return (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-green-700">{o.numero}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{o.produtos?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{o.numero_lote ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{o.quantidade_planejada} {o.unidade_medida}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{o.data_planejada ? new Date(o.data_planejada).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="px-4 py-3"><span className={sc.badge}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <select value={o.status} onChange={e => atualizarStatus(o.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500">
                          {Object.entries(statusConfig).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
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
            <h2 className="text-lg font-bold text-gray-800 mb-4">Nova Ordem de Produção</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Produto *</label>
                <select value={form.produto_id} onChange={e => setForm(p=>({...p, produto_id: e.target.value}))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Selecione o produto</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              {[
                { key: 'quantidade_planejada', label: 'Quantidade Planejada *', type: 'number' },
                { key: 'unidade_medida', label: 'Unidade de Medida', type: 'text' },
                { key: 'data_planejada', label: 'Data Planejada', type: 'date' },
                { key: 'numero_lote', label: 'Número do Lote', type: 'text' },
                { key: 'responsavel', label: 'Responsável', type: 'text' },
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
                {salvando ? 'Salvando...' : 'Criar Ordem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
