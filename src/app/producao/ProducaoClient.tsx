'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  FlaskConical, BarChart2, Plus, X, Save,
  CheckCircle, Clock, PauseCircle, XCircle, User, Calendar
} from 'lucide-react'

// ─── TIPOS ───────────────────────────────────────────────────────────────────
const STATUS: Record<string, { label: string; badge: string; color: string; bg: string }> = {
  PLANEJADA:    { label: 'Planejada',    badge: 'badge-blue',   color: '#1565c0', bg: '#e3f2fd' },
  EM_ANDAMENTO: { label: 'Em Andamento', badge: 'badge-orange', color: '#F97316', bg: '#fff3e0' },
  PAUSADA:      { label: 'Pausada',      badge: 'badge-gray',   color: '#757575', bg: '#f5f5f5' },
  CONCLUIDA:    { label: 'Concluída',    badge: 'badge-green',  color: '#2e7d32', bg: '#e8f5e9' },
  CANCELADA:    { label: 'Cancelada',    badge: 'badge-red',    color: '#c62828', bg: '#fce4ec' },
}

export default function ProducaoClient() {
  const [ordens, setOrdens]   = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro]   = useState('TODOS')
  const [modal, setModal]     = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [form, setForm] = useState({
    cliente_id: '', sabor_id: '', quantidade_planejada: '',
    unidade_medida: 'L', data_planejada: '',
    numero_lote: '', responsavel: '', observacoes: '',
  })

  // Sabores do cliente selecionado no form
  const saboresDisponiveis = clientes
    .find(c => c.id === form.cliente_id)
    ?.cliente_sabores ?? []

  // ── CARREGAR ────────────────────────────────────────────────────────────────
  async function carregar() {
    setLoading(true)
    const [{ data: ords }, { data: clis }] = await Promise.all([
      supabase.from('ordens_producao')
        .select('*, clientes(nome), cliente_sabores(nome)')
        .order('criado_em', { ascending: false }),
      supabase.from('clientes')
        .select('id, nome, cliente_sabores(id, nome)')
        .eq('ativo', true)
        .order('nome'),
    ])
    setOrdens(ords ?? [])
    setClientes(clis ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  // ── CRIAR ────────────────────────────────────────────────────────────────────
  async function salvar() {
    if (!form.cliente_id || !form.quantidade_planejada) return
    setSalvando(true)
    const numero = `OP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`
    await supabase.from('ordens_producao').insert({
      numero,
      cliente_id:          form.cliente_id || null,
      produto_id:          form.sabor_id || null,  // reutilizamos produto_id para sabor
      quantidade_planejada: Number(form.quantidade_planejada),
      unidade_medida:      form.unidade_medida,
      data_planejada:      form.data_planejada || null,
      numero_lote:         form.numero_lote || null,
      responsavel:         form.responsavel || null,
      observacoes:         form.observacoes || null,
      status:              'PLANEJADA',
    })
    setModal(false)
    setForm({ cliente_id:'', sabor_id:'', quantidade_planejada:'', unidade_medida:'L', data_planejada:'', numero_lote:'', responsavel:'', observacoes:'' })
    setSalvando(false)
    carregar()
  }

  // ── ATUALIZAR STATUS ─────────────────────────────────────────────────────────
  async function atualizarStatus(id: string, status: string) {
    const up: any = { status }
    if (status === 'EM_ANDAMENTO') up.data_inicio = new Date().toISOString()
    if (status === 'CONCLUIDA')    up.data_fim    = new Date().toISOString()
    await supabase.from('ordens_producao').update(up).eq('id', id)
    setOrdens(prev => prev.map(o => o.id === id ? { ...o, ...up } : o))
  }

  const filtradas = filtro === 'TODOS' ? ordens : ordens.filter(o => o.status === filtro)

  // Totais por status
  const totais = Object.keys(STATUS).reduce((acc, s) => {
    acc[s] = ordens.filter(o => o.status === s).length
    return acc
  }, {} as Record<string, number>)

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* KPIs clicáveis */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS).map(([key, s]) => (
          <button key={key} onClick={() => setFiltro(filtro === key ? 'TODOS' : key)}
            className="stat-card text-left transition-all"
            style={{ borderTop: `3px solid ${s.color}`, opacity: filtro !== 'TODOS' && filtro !== key ? .5 : 1 }}>
            <p className="text-2xl font-black" style={{ color: s.color }}>{totais[key] ?? 0}</p>
            <p className="text-xs font-semibold mt-0.5" style={{ color: s.color }}>{s.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setFiltro('TODOS')}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={filtro === 'TODOS'
              ? { background: '#F97316', color: '#fff' }
              : { background: '#fff', color: '#5f6368', border: '1px solid #dadce0' }}>
            Todos ({ordens.length})
          </button>
          {Object.entries(STATUS).map(([key, s]) => (
            <button key={key} onClick={() => setFiltro(filtro === key ? 'TODOS' : key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={filtro === key
                ? { background: s.color, color: '#fff' }
                : { background: '#fff', color: '#5f6368', border: '1px solid #dadce0' }}>
              {s.label}
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
          <div className="stat-icon" style={{ background: '#fff3e0', width: 28, height: 28, borderRadius: 7 }}>
            <BarChart2 size={14} style={{ color: '#F97316' }} />
          </div>
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
            <p className="text-sm font-medium">Nenhuma ordem de produção cadastrada.</p>
            <p className="text-xs mt-1">Clique em "Nova Ordem" para criar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vtable">
              <thead><tr>
                {['Número','Cliente','Produto / Sabor','Lote','Qtd. Planejada','Data','Responsável','Status','Alterar'].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtradas.map(o => {
                  const sc = STATUS[o.status] ?? STATUS.PLANEJADA
                  return (
                    <tr key={o.id}>
                      <td>
                        <span className="font-mono text-xs font-bold" style={{ color: '#F97316' }}>
                          {o.numero}
                        </span>
                      </td>
                      <td>
                        <span className="font-semibold text-sm" style={{ color: '#1a1d23' }}>
                          {o.clientes?.nome ?? '—'}
                        </span>
                      </td>
                      <td style={{ color: '#5f6368' }}>
                        {o.cliente_sabores?.nome ?? '—'}
                      </td>
                      <td>
                        <span className="font-mono text-xs" style={{ color: '#9aa0a6' }}>
                          {o.numero_lote ?? '—'}
                        </span>
                      </td>
                      <td className="font-semibold" style={{ color: '#1a1d23' }}>
                        {Number(o.quantidade_planejada).toLocaleString('pt-BR')} {o.unidade_medida}
                      </td>
                      <td style={{ color: '#9aa0a6', whiteSpace: 'nowrap' }}>
                        {o.data_planejada
                          ? new Date(o.data_planejada + 'T00:00:00').toLocaleDateString('pt-BR')
                          : '—'}
                      </td>
                      <td style={{ color: '#5f6368' }}>{o.responsavel ?? '—'}</td>
                      <td><span className={sc.badge}>{sc.label}</span></td>
                      <td>
                        <select value={o.status}
                          onChange={e => atualizarStatus(o.id, e.target.value)}
                          className="input text-xs"
                          style={{ width: 'auto', height: 28, padding: '2px 6px' }}>
                          {Object.entries(STATUS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
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

      {/* ── MODAL NOVA ORDEM ──────────────────────────────────────────────────── */}
      {modal && (
        <div className="modal-bg">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                <FlaskConical size={15} style={{ color: '#F97316' }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Nova Ordem de Produção</h2>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Preencha os dados da ordem</p>
              </div>
              <button onClick={() => setModal(false)} className="ml-auto" style={{ color: '#9aa0a6' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">

              {/* Cliente */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                  Cliente *
                </label>
                <select
                  value={form.cliente_id}
                  onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value, sabor_id: '' }))}
                  className="input"
                >
                  <option value="">Selecione o cliente</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
                {clientes.length === 0 && (
                  <p className="text-xs mt-1" style={{ color: '#c62828' }}>
                    Nenhum cliente ativo cadastrado. Cadastre um cliente primeiro.
                  </p>
                )}
              </div>

              {/* Produto / Sabor — aparece só após selecionar cliente */}
              {form.cliente_id && (
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    Produto / Sabor
                  </label>
                  <select
                    value={form.sabor_id}
                    onChange={e => setForm(p => ({ ...p, sabor_id: e.target.value }))}
                    className="input"
                  >
                    <option value="">Selecione o sabor (opcional)</option>
                    {saboresDisponiveis.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                  {saboresDisponiveis.length === 0 && (
                    <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>
                      Este cliente não tem sabores cadastrados.
                    </p>
                  )}
                </div>
              )}

              {/* Grid de campos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    Quantidade Planejada *
                  </label>
                  <input type="number" min="0" step="0.01"
                    value={form.quantidade_planejada}
                    onChange={e => setForm(p => ({ ...p, quantidade_planejada: e.target.value }))}
                    className="input" placeholder="Ex: 1000" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    Unidade
                  </label>
                  <select value={form.unidade_medida}
                    onChange={e => setForm(p => ({ ...p, unidade_medida: e.target.value }))}
                    className="input">
                    {['L','mL','kg','g','un','cx'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    Data Planejada
                  </label>
                  <input type="date" value={form.data_planejada}
                    onChange={e => setForm(p => ({ ...p, data_planejada: e.target.value }))}
                    className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    Número do Lote
                  </label>
                  <input value={form.numero_lote}
                    onChange={e => setForm(p => ({ ...p, numero_lote: e.target.value }))}
                    className="input" placeholder="Ex: LT-001" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                  Responsável
                </label>
                <input value={form.responsavel}
                  onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))}
                  className="input" placeholder="Nome do responsável" />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                  Observações
                </label>
                <textarea value={form.observacoes}
                  onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  rows={2} className="input resize-none"
                  placeholder="Notas sobre a ordem de produção..." />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">
                Cancelar
              </button>
              <button onClick={salvar}
                disabled={salvando || !form.cliente_id || !form.quantidade_planejada}
                className="btn-primary flex-1 justify-center"
                style={{ opacity: (salvando || !form.cliente_id || !form.quantidade_planejada) ? .6 : 1 }}>
                <Save size={13} />
                {salvando ? 'Criando...' : 'Criar Ordem'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
