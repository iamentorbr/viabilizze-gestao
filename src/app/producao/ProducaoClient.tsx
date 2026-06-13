'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, FlaskConical } from 'lucide-react'

const STATUS: Record<string, { label: string; badge: string }> = {
  PLANEJADA:    { label: 'Planejada',    badge: 'badge-blue' },
  EM_ANDAMENTO: { label: 'Em Andamento', badge: 'badge-orange' },
  PAUSADA:      { label: 'Pausada',      badge: 'badge-gray' },
  CONCLUIDA:    { label: 'Concluída',    badge: 'badge-green' },
  CANCELADA:    { label: 'Cancelada',    badge: 'badge-red' },
}

const STAT_COLORS: Record<string, string> = {
  PLANEJADA: '#3B82F6', EM_ANDAMENTO: '#F97316', CONCLUIDA: '#10B981', PAUSADA: '#6B7280'
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
    setOrdens(data ?? []); setLoading(false)
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
    setModal(false); setForm({ produto_id: '', quantidade_planejada: '', unidade_medida: 'L', data_planejada: '', numero_lote: '', responsavel: '', observacoes: '' })
    setSalvando(false); carregar()
  }

  async function atualizarStatus(id: string, status: string) {
    const up: any = { status }
    if (status === 'EM_ANDAMENTO') up.data_inicio = new Date().toISOString()
    if (status === 'CONCLUIDA')    up.data_fim = new Date().toISOString()
    await supabase.from('ordens_producao').update(up).eq('id', id); carregar()
  }

  const filtradas = filtro === 'TODOS' ? ordens : ordens.filter(o => o.status === filtro)

  return (
    <div className="p-6 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['PLANEJADA','EM_ANDAMENTO','CONCLUIDA','PAUSADA'] as const).map(s => (
          <div key={s} className="card card-hover cursor-pointer" style={{ borderLeft: `3px solid ${STAT_COLORS[s]}` }}
            onClick={() => setFiltro(filtro === s ? 'TODOS' : s)}>
            <p className="text-2xl font-black text-white">{ordens.filter(o=>o.status===s).length}</p>
            <p className="text-xs mt-1" style={{ color: STAT_COLORS[s] }}>{STATUS[s].label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {['TODOS','PLANEJADA','EM_ANDAMENTO','CONCLUIDA','PAUSADA'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={filtro===f
                ? { background: '#F97316', color: '#000' }
                : { background: '#1C1C1C', color: '#9CA3AF', border: '1px solid #2A2A2A' }}>
              {f==='TODOS' ? 'Todos' : STATUS[f]?.label ?? f}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)} className="btn-primary text-xs">
          <Plus size={14} /> Nova Ordem
        </button>
      </div>

      {/* Tabela */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-16" style={{ color: '#444' }}>
            <FlaskConical size={36} className="mx-auto mb-3" />
            <p className="text-sm">Nenhuma ordem encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vtable">
              <thead><tr>
                {['Número','Produto','Lote','Qtd. Planejada','Data','Status','Alterar Status'].map(h=>(
                  <th key={h}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtradas.map(o => {
                  const sc = STATUS[o.status] ?? { label: o.status, badge: 'badge-gray' }
                  return (
                    <tr key={o.id}>
                      <td><span className="font-mono text-xs font-bold" style={{ color: '#F97316' }}>{o.numero}</span></td>
                      <td className="font-semibold text-white">{o.produtos?.nome ?? '—'}</td>
                      <td><span className="font-mono text-xs" style={{ color: '#6B7280' }}>{o.numero_lote ?? '—'}</span></td>
                      <td className="text-white">{o.quantidade_planejada} {o.unidade_medida}</td>
                      <td style={{ color: '#9CA3AF' }}>{o.data_planejada ? new Date(o.data_planejada).toLocaleDateString('pt-BR') : '—'}</td>
                      <td><span className={sc.badge}>{sc.label}</span></td>
                      <td>
                        <select value={o.status} onChange={e => atualizarStatus(o.id, e.target.value)}
                          className="input text-xs" style={{ width: 'auto', padding: '4px 8px', height: 30 }}>
                          {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
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

      {/* Modal */}
      {modal && (
        <div className="modal-bg">
          <div className="modal-box">
            <div className="flex items-center gap-2 mb-5">
              <span style={{ width: 3, height: 18, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
              <h2 className="text-base font-black text-white">Nova Ordem de Produção</h2>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Produto *</label>
                <select value={form.produto_id} onChange={e => setForm(p=>({...p,produto_id:e.target.value}))} className="input select">
                  <option value="">Selecione o produto</option>
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              {[
                { key: 'quantidade_planejada', label: 'Quantidade Planejada *', type: 'number' },
                { key: 'unidade_medida', label: 'Unidade (L, kg, un...)', type: 'text' },
                { key: 'data_planejada', label: 'Data Planejada', type: 'date' },
                { key: 'numero_lote', label: 'Número do Lote', type: 'text' },
                { key: 'responsavel', label: 'Responsável', type: 'text' },
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
                {salvando ? 'Salvando...' : 'Criar Ordem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
