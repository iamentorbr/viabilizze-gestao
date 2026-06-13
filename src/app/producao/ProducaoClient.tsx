'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, FlaskConical, BarChart2, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

const STATUS: Record<string, { label: string; badge: string }> = {
  PLANEJADA:    { label: 'Planejada',    badge: 'badge-blue' },
  EM_ANDAMENTO: { label: 'Em Andamento', badge: 'badge-orange' },
  PAUSADA:      { label: 'Pausada',      badge: 'badge-gray' },
  CONCLUIDA:    { label: 'Concluída',    badge: 'badge-green' },
  CANCELADA:    { label: 'Cancelada',    badge: 'badge-red' },
}
const STAT_COLORS: Record<string, { bg: string; color: string; icon: string }> = {
  PLANEJADA:    { bg: '#e3f2fd', color: '#1e88e5', icon: '#1e88e5' },
  EM_ANDAMENTO: { bg: '#fff3e0', color: '#F97316', icon: '#F97316' },
  CONCLUIDA:    { bg: '#e8f5e9', color: '#43a047', icon: '#43a047' },
  PAUSADA:      { bg: '#f5f5f5', color: '#757575', icon: '#757575' },
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
    setModal(false)
    setForm({ produto_id: '', quantidade_planejada: '', unidade_medida: 'L', data_planejada: '', numero_lote: '', responsavel: '', observacoes: '' })
    setSalvando(false); carregar()
  }

  async function atualizarStatus(id: string, status: string) {
    const up: any = { status }
    if (status === 'EM_ANDAMENTO') up.data_inicio = new Date().toISOString()
    if (status === 'CONCLUIDA')    up.data_fim    = new Date().toISOString()
    await supabase.from('ordens_producao').update(up).eq('id', id); carregar()
  }

  const filtradas = filtro === 'TODOS' ? ordens : ordens.filter(o => o.status === filtro)

  return (
    <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {(['PLANEJADA','EM_ANDAMENTO','CONCLUIDA','PAUSADA'] as const).map(s => {
          const c = STAT_COLORS[s]
          return (
            <div key={s} className="stat-card cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => setFiltro(filtro === s ? 'TODOS' : s)}
              style={{ borderTop: `3px solid ${c.color}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-black" style={{ color: '#1a1d23' }}>{ordens.filter(o=>o.status===s).length}</p>
                  <p className="text-xs font-medium mt-0.5" style={{ color: c.color }}>{STATUS[s].label}</p>
                </div>
                <div className="stat-icon" style={{ background: c.bg }}>
                  <FlaskConical size={18} style={{ color: c.color }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {['TODOS','PLANEJADA','EM_ANDAMENTO','CONCLUIDA','PAUSADA'].map(f => (
            <button key={f} onClick={() => setFiltro(f)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filtro===f
                ? { background: '#F97316', color: '#fff', border: '1px solid #F97316' }
                : { background: '#fff', color: '#5f6368', border: '1px solid #dadce0' }}>
              {f === 'TODOS' ? 'Todos' : STATUS[f]?.label ?? f}
            </button>
          ))}
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={14} /> Nova Ordem
        </button>
      </div>

      {/* Tabela */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
          <BarChart2 size={15} style={{ color: '#43a047' }} />
          <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Ordens de Produção</h3>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#fff3e0', color: '#F97316' }}>
            {filtradas.length} {filtradas.length === 1 ? 'ordem' : 'ordens'}
          </span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-14" style={{ color: '#9aa0a6' }}>
            <FlaskConical size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma ordem cadastrada nesta indústria.</p>
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
                      <td><span className="font-semibold" style={{ color: '#1a1d23' }}>{o.produtos?.nome ?? '—'}</span></td>
                      <td><span className="font-mono text-xs" style={{ color: '#9aa0a6' }}>{o.numero_lote ?? '—'}</span></td>
                      <td>{o.quantidade_planejada} {o.unidade_medida}</td>
                      <td style={{ color: '#9aa0a6' }}>{o.data_planejada ? new Date(o.data_planejada).toLocaleDateString('pt-BR') : '—'}</td>
                      <td><span className={sc.badge}>{sc.label}</span></td>
                      <td>
                        <select value={o.status} onChange={e => atualizarStatus(o.id, e.target.value)}
                          className="input text-xs" style={{ width: 'auto', height: 30, padding: '2px 8px' }}>
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
              <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                <FlaskConical size={15} style={{ color: '#F97316' }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Nova Ordem de Produção</h2>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Preencha os dados da ordem</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Produto *</label>
                <select value={form.produto_id} onChange={e => setForm(p=>({...p,produto_id:e.target.value}))} className="input">
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
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]}
                    onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} className="input" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
                {salvando ? 'Salvando...' : 'Criar Ordem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
