'use client'
import { useEffect, useState, useMemo } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import {
  FolderKanban, Plus, CheckCircle, Clock, AlertTriangle,
  Circle, ChevronDown, ChevronUp, Trash2, Edit3,
  User, Calendar, Tag, X, Save, BarChart2, Target
} from 'lucide-react'

// ─── TIPOS ───────────────────────────────────────────────────────────────────
type Projeto = {
  id: string
  nome: string
  descricao?: string
  cliente_id?: string
  responsavel?: string
  prioridade: string
  status: string
  data_inicio?: string
  data_prevista_fim?: string
  data_conclusao?: string
  cor?: string
  criado_em: string
}

type Tarefa = {
  id: string
  projeto_id?: string
  titulo: string
  descricao?: string
  status: string
  prioridade: string
  responsavel?: string
  data_vencimento?: string
  data_conclusao?: string
  criado_em: string
}

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const STATUS_PROJ = ['ATIVO', 'PAUSADO', 'CONCLUIDO', 'CANCELADO'] as const
const STATUS_TAR  = ['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'] as const
const PRIORIDADES = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'] as const

const CORES_PROJ = ['#F97316','#1565c0','#2e7d32','#8e24aa','#c62828','#00838f','#ef6c00','#37474f']

const STATUS_PROJ_STYLE: Record<string, { label: string; badge: string; color: string }> = {
  ATIVO:     { label: 'Ativo',     badge: 'badge-green',  color: '#2e7d32' },
  PAUSADO:   { label: 'Pausado',   badge: 'badge-yellow', color: '#f57f17' },
  CONCLUIDO: { label: 'Concluído', badge: 'badge-blue',   color: '#1565c0' },
  CANCELADO: { label: 'Cancelado', badge: 'badge-red',    color: '#c62828' },
}

const STATUS_TAR_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  PENDENTE:     { label: 'Pendente',     color: '#9aa0a6', bg: '#f5f5f5' },
  EM_ANDAMENTO: { label: 'Em Andamento', color: '#1565c0', bg: '#e3f2fd' },
  CONCLUIDA:    { label: 'Concluída',    color: '#2e7d32', bg: '#e8f5e9' },
  CANCELADA:    { label: 'Cancelada',    color: '#c62828', bg: '#fce4ec' },
}

const PRIOR_STYLE: Record<string, { label: string; badge: string; color: string }> = {
  BAIXA:   { label: 'Baixa',   badge: 'badge-gray',   color: '#9aa0a6' },
  MEDIA:   { label: 'Média',   badge: 'badge-blue',   color: '#1565c0' },
  ALTA:    { label: 'Alta',    badge: 'badge-yellow', color: '#f57f17' },
  URGENTE: { label: 'Urgente', badge: 'badge-red',    color: '#c62828' },
}

const FORM_P_VAZIO = {
  nome: '', descricao: '', responsavel: '', prioridade: 'MEDIA',
  data_inicio: '', data_prevista_fim: '', cor: '#F97316', cliente_id: '',
}
const FORM_T_VAZIO = {
  titulo: '', descricao: '', projeto_id: '', prioridade: 'MEDIA',
  responsavel: '', data_vencimento: '',
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ProjetosPage() {
  const [projetos, setProjetos]     = useState<Projeto[]>([])
  const [tarefas, setTarefas]       = useState<Tarefa[]>([])
  const [clientes, setClientes]     = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [salvando, setSalvando]     = useState(false)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [filtroPrior, setFiltroPrior]   = useState('TODAS')

  // Modais
  const [modalP, setModalP]         = useState(false)
  const [modalT, setModalT]         = useState(false)
  const [modalEditP, setModalEditP] = useState<Projeto | null>(null)
  const [modalEditT, setModalEditT] = useState<Tarefa | null>(null)
  const [confirmDel, setConfirmDel] = useState<{ tipo: 'projeto' | 'tarefa'; id: string; nome: string } | null>(null)

  // Forms
  const [formP, setFormP] = useState({ ...FORM_P_VAZIO })
  const [formT, setFormT] = useState({ ...FORM_T_VAZIO })
  const [formEditP, setFormEditP] = useState<Partial<Projeto>>({})
  const [formEditT, setFormEditT] = useState<Partial<Tarefa>>({})

  // ── CARREGAR ────────────────────────────────────────────────────────────────
  async function carregar() {
    setLoading(true)
    const [{ data: p }, { data: t }, { data: c }] = await Promise.all([
      supabase.from('projetos').select('*').order('criado_em', { ascending: false }),
      supabase.from('tarefas').select('*').order('criado_em', { ascending: false }),
      supabase.from('clientes').select('id, nome').eq('ativo', true).order('nome'),
    ])
    setProjetos(p ?? [])
    setTarefas(t ?? [])
    setClientes(c ?? [])
    setLoading(false)
  }
  useEffect(() => { carregar() }, [])

  // ── FILTROS ──────────────────────────────────────────────────────────────────
  const projetosFiltrados = useMemo(() => {
    return projetos.filter(p => {
      const matchStatus = filtroStatus === 'TODOS' || p.status === filtroStatus
      const matchPrior  = filtroPrior  === 'TODAS' || p.prioridade === filtroPrior
      return matchStatus && matchPrior
    })
  }, [projetos, filtroStatus, filtroPrior])

  // ── TOTAIS ───────────────────────────────────────────────────────────────────
  const totais = useMemo(() => ({
    total:     projetos.length,
    ativos:    projetos.filter(p => p.status === 'ATIVO').length,
    concluidos:projetos.filter(p => p.status === 'CONCLUIDO').length,
    tarefasPendentes: tarefas.filter(t => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA').length,
  }), [projetos, tarefas])

  // ── CRUD PROJETOS ────────────────────────────────────────────────────────────
  async function criarProjeto() {
    if (!formP.nome.trim()) return
    setSalvando(true)
    await supabase.from('projetos').insert({
      nome:              formP.nome,
      descricao:         formP.descricao || null,
      responsavel:       formP.responsavel || null,
      prioridade:        formP.prioridade,
      cliente_id:        formP.cliente_id || null,
      data_inicio:       formP.data_inicio || null,
      data_prevista_fim: formP.data_prevista_fim || null,
      cor:               formP.cor,
      status:            'ATIVO',
    })
    setModalP(false)
    setFormP({ ...FORM_P_VAZIO })
    setSalvando(false)
    carregar()
  }

  async function salvarEdicaoProjeto() {
    if (!modalEditP) return
    setSalvando(true)
    await supabase.from('projetos').update(formEditP).eq('id', modalEditP.id)
    setModalEditP(null)
    setSalvando(false)
    carregar()
  }

  async function atualizarStatusProjeto(id: string, status: string) {
    const updates: any = { status }
    if (status === 'CONCLUIDO') updates.data_conclusao = new Date().toISOString().split('T')[0]
    await supabase.from('projetos').update(updates).eq('id', id)
    setProjetos(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  // ── CRUD TAREFAS ─────────────────────────────────────────────────────────────
  async function criarTarefa() {
    if (!formT.titulo.trim()) return
    setSalvando(true)
    await supabase.from('tarefas').insert({
      titulo:          formT.titulo,
      descricao:       formT.descricao || null,
      projeto_id:      formT.projeto_id || null,
      prioridade:      formT.prioridade,
      responsavel:     formT.responsavel || null,
      data_vencimento: formT.data_vencimento || null,
      status:          'PENDENTE',
    })
    setModalT(false)
    setFormT({ ...FORM_T_VAZIO })
    setSalvando(false)
    carregar()
  }

  async function salvarEdicaoTarefa() {
    if (!modalEditT) return
    setSalvando(true)
    await supabase.from('tarefas').update(formEditT).eq('id', modalEditT.id)
    setModalEditT(null)
    setSalvando(false)
    carregar()
  }

  async function ciclarStatusTarefa(tarefa: Tarefa) {
    const ciclo: Record<string, string> = {
      PENDENTE: 'EM_ANDAMENTO', EM_ANDAMENTO: 'CONCLUIDA', CONCLUIDA: 'PENDENTE',
    }
    const novoStatus = ciclo[tarefa.status] ?? 'PENDENTE'
    const updates: any = { status: novoStatus }
    if (novoStatus === 'CONCLUIDA') updates.data_conclusao = new Date().toISOString()
    await supabase.from('tarefas').update(updates).eq('id', tarefa.id)
    setTarefas(prev => prev.map(t => t.id === tarefa.id ? { ...t, ...updates } : t))
  }

  // ── DELETAR ──────────────────────────────────────────────────────────────────
  async function confirmarDelete() {
    if (!confirmDel) return
    if (confirmDel.tipo === 'projeto') {
      await supabase.from('tarefas').delete().eq('projeto_id', confirmDel.id)
      await supabase.from('projetos').delete().eq('id', confirmDel.id)
    } else {
      await supabase.from('tarefas').delete().eq('id', confirmDel.id)
    }
    setConfirmDel(null)
    carregar()
  }

  // ── HELPERS ──────────────────────────────────────────────────────────────────
  const toggleExpand = (id: string) =>
    setExpandidos(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const tarefasDoProjeto = (projetoId: string) =>
    tarefas.filter(t => t.projeto_id === projetoId)

  const progresso = (projetoId: string) => {
    const ts = tarefasDoProjeto(projetoId)
    if (!ts.length) return 0
    return Math.round((ts.filter(t => t.status === 'CONCLUIDA').length / ts.length) * 100)
  }

  const isVencida = (data?: string) =>
    data && new Date(data) < new Date() ? true : false

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <Header title="Projetos" subtitle="Gestão de projetos e tarefas" />
      <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total de Projetos', value: totais.total,     color: '#F97316', bg: '#fff3e0', icon: FolderKanban },
            { label: 'Projetos Ativos',   value: totais.ativos,    color: '#2e7d32', bg: '#e8f5e9', icon: Target       },
            { label: 'Concluídos',        value: totais.concluidos,color: '#1565c0', bg: '#e3f2fd', icon: CheckCircle  },
            { label: 'Tarefas Pendentes', value: totais.tarefasPendentes, color: '#c62828', bg: '#fce4ec', icon: Clock },
          ].map(k => (
            <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{k.label}</p>
                  <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                </div>
                <div className="stat-icon" style={{ background: k.bg }}>
                  <k.icon size={18} style={{ color: k.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="input text-xs" style={{ height: 34, width: 140 }}>
            <option value="TODOS">Todos Status</option>
            {STATUS_PROJ.map(s => <option key={s} value={s}>{STATUS_PROJ_STYLE[s].label}</option>)}
          </select>
          <select value={filtroPrior} onChange={e => setFiltroPrior(e.target.value)}
            className="input text-xs" style={{ height: 34, width: 140 }}>
            <option value="TODAS">Todas Prioridades</option>
            {PRIORIDADES.map(p => <option key={p} value={p}>{PRIOR_STYLE[p].label}</option>)}
          </select>
          <div className="ml-auto flex gap-2">
            <button onClick={() => setModalT(true)} className="btn-ghost text-xs">
              <Plus size={13} /> Nova Tarefa Avulsa
            </button>
            <button onClick={() => setModalP(true)} className="btn-primary text-xs">
              <Plus size={13} /> Novo Projeto
            </button>
          </div>
        </div>

        {/* Lista de projetos */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : projetosFiltrados.length === 0 && tarefas.filter(t => !t.projeto_id).length === 0 ? (
          <div className="card text-center py-16">
            <FolderKanban size={42} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-semibold" style={{ color: '#1a1d23' }}>Nenhum projeto cadastrado</p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#9aa0a6' }}>Clique em "Novo Projeto" para começar</p>
            <button onClick={() => setModalP(true)} className="btn-primary mx-auto">
              <Plus size={14} /> Criar Primeiro Projeto
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Tarefas avulsas */}
            {tarefas.filter(t => !t.projeto_id).length > 0 && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
                  <div className="stat-icon" style={{ background: '#f3e5f5', width: 28, height: 28, borderRadius: 7 }}>
                    <Clock size={13} style={{ color: '#8e24aa' }} />
                  </div>
                  <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Tarefas Avulsas</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1"
                    style={{ background: '#f3e5f5', color: '#8e24aa' }}>
                    {tarefas.filter(t => !t.projeto_id).length}
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: '#f0f2f5' }}>
                  {tarefas.filter(t => !t.projeto_id).map(t => (
                    <TarefaRow key={t.id} tarefa={t}
                      onCiclar={() => ciclarStatusTarefa(t)}
                      onEditar={() => { setModalEditT(t); setFormEditT({ ...t }) }}
                      onDeletar={() => setConfirmDel({ tipo: 'tarefa', id: t.id, nome: t.titulo })} />
                  ))}
                </div>
              </div>
            )}

            {/* Cards de projeto */}
            {projetosFiltrados.map(p => {
              const ts    = tarefasDoProjeto(p.id)
              const pct   = progresso(p.id)
              const isExp = expandidos.has(p.id)
              const ss    = STATUS_PROJ_STYLE[p.status] ?? STATUS_PROJ_STYLE.ATIVO
              const ps    = PRIOR_STYLE[p.prioridade] ?? PRIOR_STYLE.MEDIA
              const clienteNome = clientes.find(c => c.id === p.cliente_id)?.nome
              const pendentes = ts.filter(t => t.status !== 'CONCLUIDA' && t.status !== 'CANCELADA').length
              const vencidas  = ts.filter(t => isVencida(t.data_vencimento) && t.status !== 'CONCLUIDA').length

              return (
                <div key={p.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: `4px solid ${p.cor ?? '#F97316'}` }}>

                  {/* Cabeçalho do projeto */}
                  <div className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      {/* Ícone colorido */}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm text-white mt-0.5"
                        style={{ background: p.cor ?? '#F97316' }}>
                        {p.nome.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-base font-black leading-tight" style={{ color: '#1a1d23' }}>
                              {p.nome}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={ss.badge}>{ss.label}</span>
                              <span className={ps.badge}>{ps.label}</span>
                              {clienteNome && (
                                <span className="text-xs px-2 py-0.5 rounded-full"
                                  style={{ background: '#fff3e0', color: '#e65100', fontWeight: 600 }}>
                                  {clienteNome}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => { setFormT(f => ({ ...f, projeto_id: p.id })); setModalT(true) }}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold"
                              style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}>
                              <Plus size={11} /> Tarefa
                            </button>
                            <button onClick={() => { setModalEditP(p); setFormEditP({ ...p }) }}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: '#f5f5f5', color: '#757575' }}>
                              <Edit3 size={13} />
                            </button>
                            <button onClick={() => setConfirmDel({ tipo: 'projeto', id: p.id, nome: p.nome })}
                              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"
                              style={{ color: '#9aa0a6' }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {p.descricao && (
                          <p className="text-xs mt-1.5" style={{ color: '#5f6368' }}>{p.descricao}</p>
                        )}

                        {/* Metadados */}
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          {p.responsavel && (
                            <span className="flex items-center gap-1 text-xs" style={{ color: '#9aa0a6' }}>
                              <User size={11} /> {p.responsavel}
                            </span>
                          )}
                          {p.data_prevista_fim && (
                            <span className="flex items-center gap-1 text-xs"
                              style={{ color: isVencida(p.data_prevista_fim) && p.status !== 'CONCLUIDO' ? '#c62828' : '#9aa0a6' }}>
                              <Calendar size={11} />
                              Prazo: {new Date(p.data_prevista_fim + 'T00:00:00').toLocaleDateString('pt-BR')}
                              {isVencida(p.data_prevista_fim) && p.status !== 'CONCLUIDO' && ' ⚠'}
                            </span>
                          )}
                          {vencidas > 0 && (
                            <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#c62828' }}>
                              <AlertTriangle size={11} /> {vencidas} tarefa{vencidas > 1 ? 's' : ''} vencida{vencidas > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    {ts.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: '#9aa0a6' }}>Progresso</span>
                          <span className="text-xs font-bold" style={{ color: p.cor ?? '#F97316' }}>
                            {pct}% — {ts.filter(t => t.status === 'CONCLUIDA').length}/{ts.length} tarefas
                          </span>
                        </div>
                        <div className="h-2 rounded-full" style={{ background: '#e8eaed' }}>
                          <div className="h-2 rounded-full transition-all"
                            style={{ width: `${pct}%`, background: pct === 100 ? '#2e7d32' : p.cor ?? '#F97316' }} />
                        </div>
                      </div>
                    )}

                    {/* Expandir tarefas */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        {/* Seletor de status rápido */}
                        <select value={p.status} onChange={e => atualizarStatusProjeto(p.id, e.target.value)}
                          className="input text-xs" style={{ height: 26, padding: '2px 6px', width: 'auto' }}>
                          {STATUS_PROJ.map(s => <option key={s} value={s}>{STATUS_PROJ_STYLE[s].label}</option>)}
                        </select>
                      </div>
                      <button onClick={() => toggleExpand(p.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold"
                        style={{ color: isExp ? p.cor ?? '#F97316' : '#9aa0a6' }}>
                        {ts.length} tarefa{ts.length !== 1 ? 's' : ''}
                        {pendentes > 0 && <span className="font-black" style={{ color: '#c62828' }}>({pendentes} pendente{pendentes > 1 ? 's' : ''})</span>}
                        {isExp ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Tarefas expandidas */}
                  {isExp && (
                    <div style={{ borderTop: `1px dashed ${p.cor ?? '#F97316'}` }}>
                      {ts.length === 0 ? (
                        <div className="text-center py-6 text-xs" style={{ color: '#9aa0a6' }}>
                          Nenhuma tarefa. Clique em "+ Tarefa" para adicionar.
                        </div>
                      ) : (
                        <div className="divide-y" style={{ borderColor: '#f0f2f5' }}>
                          {ts.map(t => (
                            <TarefaRow key={t.id} tarefa={t}
                              onCiclar={() => ciclarStatusTarefa(t)}
                              onEditar={() => { setModalEditT(t); setFormEditT({ ...t }) }}
                              onDeletar={() => setConfirmDel({ tipo: 'tarefa', id: t.id, nome: t.titulo })} />
                          ))}
                        </div>
                      )}
                      <div className="px-5 py-3" style={{ borderTop: '1px solid #f0f2f5' }}>
                        <button onClick={() => { setFormT(f => ({ ...f, projeto_id: p.id })); setModalT(true) }}
                          className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: p.cor ?? '#F97316' }}>
                          <Plus size={13} /> Adicionar Tarefa ao Projeto
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ═══ MODAIS ═══════════════════════════════════════════════════════════ */}

        {/* Novo Projeto */}
        {modalP && (
          <div className="modal-bg">
            <div className="modal-box" style={{ maxWidth: 520 }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                  <FolderKanban size={15} style={{ color: '#F97316' }} />
                </div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Novo Projeto</h2>
                <button onClick={() => setModalP(false)} className="ml-auto" style={{ color: '#9aa0a6' }}><X size={16} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Nome do Projeto *</label>
                  <input value={formP.nome} onChange={e => setFormP(p => ({ ...p, nome: e.target.value }))}
                    className="input" placeholder="Ex: Linha de Bebidas Funcionais 2026" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Descrição</label>
                  <textarea value={formP.descricao} onChange={e => setFormP(p => ({ ...p, descricao: e.target.value }))}
                    rows={2} className="input resize-none" placeholder="Objetivo e escopo do projeto..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Cliente Associado</label>
                    <select value={formP.cliente_id} onChange={e => setFormP(p => ({ ...p, cliente_id: e.target.value }))} className="input">
                      <option value="">Nenhum</option>
                      {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Responsável</label>
                    <input value={formP.responsavel} onChange={e => setFormP(p => ({ ...p, responsavel: e.target.value }))}
                      className="input" placeholder="Nome" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Prioridade</label>
                    <select value={formP.prioridade} onChange={e => setFormP(p => ({ ...p, prioridade: e.target.value }))} className="input">
                      {PRIORIDADES.map(v => <option key={v} value={v}>{PRIOR_STYLE[v].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Cor do Projeto</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {CORES_PROJ.map(c => (
                        <button key={c} onClick={() => setFormP(p => ({ ...p, cor: c }))}
                          className="w-6 h-6 rounded-full transition-all"
                          style={{ background: c, outline: formP.cor === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Data de Início</label>
                    <input type="date" value={formP.data_inicio} onChange={e => setFormP(p => ({ ...p, data_inicio: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Previsão de Conclusão</label>
                    <input type="date" value={formP.data_prevista_fim} onChange={e => setFormP(p => ({ ...p, data_prevista_fim: e.target.value }))} className="input" />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button onClick={() => setModalP(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={criarProjeto} disabled={salvando || !formP.nome.trim()} className="btn-primary flex-1 justify-center"
                  style={{ opacity: (salvando || !formP.nome.trim()) ? .6 : 1 }}>
                  {salvando ? 'Criando...' : 'Criar Projeto'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editar Projeto */}
        {modalEditP && (
          <div className="modal-bg">
            <div className="modal-box" style={{ maxWidth: 520 }}>
              <div className="flex items-center gap-2 mb-5">
                <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                  <Edit3 size={14} style={{ color: '#F97316' }} />
                </div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Editar Projeto</h2>
                <button onClick={() => setModalEditP(null)} className="ml-auto" style={{ color: '#9aa0a6' }}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'nome',        label: 'Nome *',      type: 'text' },
                  { key: 'descricao',   label: 'Descrição',   type: 'textarea' },
                  { key: 'responsavel', label: 'Responsável', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                    {f.type === 'textarea'
                      ? <textarea value={(formEditP as any)[f.key] ?? ''} onChange={e => setFormEditP(p => ({ ...p, [f.key]: e.target.value }))} rows={2} className="input resize-none" />
                      : <input type="text" value={(formEditP as any)[f.key] ?? ''} onChange={e => setFormEditP(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
                    }
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Status</label>
                    <select value={formEditP.status ?? 'ATIVO'} onChange={e => setFormEditP(p => ({ ...p, status: e.target.value }))} className="input">
                      {STATUS_PROJ.map(s => <option key={s} value={s}>{STATUS_PROJ_STYLE[s].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Prioridade</label>
                    <select value={formEditP.prioridade ?? 'MEDIA'} onChange={e => setFormEditP(p => ({ ...p, prioridade: e.target.value }))} className="input">
                      {PRIORIDADES.map(v => <option key={v} value={v}>{PRIOR_STYLE[v].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Início</label>
                    <input type="date" value={formEditP.data_inicio ?? ''} onChange={e => setFormEditP(p => ({ ...p, data_inicio: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Previsão Conclusão</label>
                    <input type="date" value={formEditP.data_prevista_fim ?? ''} onChange={e => setFormEditP(p => ({ ...p, data_prevista_fim: e.target.value }))} className="input" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Cor</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {CORES_PROJ.map(c => (
                      <button key={c} onClick={() => setFormEditP(p => ({ ...p, cor: c }))}
                        className="w-6 h-6 rounded-full transition-all"
                        style={{ background: c, outline: formEditP.cor === c ? `3px solid ${c}` : 'none', outlineOffset: 2 }} />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModalEditP(null)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={salvarEdicaoProjeto} disabled={salvando} className="btn-primary flex-1 justify-center">
                  <Save size={13} /> {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nova Tarefa */}
        {modalT && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="flex items-center gap-2 mb-5">
                <div className="stat-icon" style={{ background: '#e8f5e9', width: 32, height: 32, borderRadius: 8 }}>
                  <CheckCircle size={14} style={{ color: '#2e7d32' }} />
                </div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Nova Tarefa</h2>
                <button onClick={() => { setModalT(false); setFormT({ ...FORM_T_VAZIO }) }} className="ml-auto" style={{ color: '#9aa0a6' }}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Título *</label>
                  <input value={formT.titulo} onChange={e => setFormT(p => ({ ...p, titulo: e.target.value }))}
                    className="input" placeholder="O que precisa ser feito?" autoFocus />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Descrição</label>
                  <textarea value={formT.descricao} onChange={e => setFormT(p => ({ ...p, descricao: e.target.value }))}
                    rows={2} className="input resize-none" placeholder="Detalhes adicionais..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Projeto</label>
                    <select value={formT.projeto_id} onChange={e => setFormT(p => ({ ...p, projeto_id: e.target.value }))} className="input">
                      <option value="">Tarefa Avulsa</option>
                      {projetos.filter(p => p.status === 'ATIVO').map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Prioridade</label>
                    <select value={formT.prioridade} onChange={e => setFormT(p => ({ ...p, prioridade: e.target.value }))} className="input">
                      {PRIORIDADES.map(v => <option key={v} value={v}>{PRIOR_STYLE[v].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Responsável</label>
                    <input value={formT.responsavel} onChange={e => setFormT(p => ({ ...p, responsavel: e.target.value }))}
                      className="input" placeholder="Nome" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Vencimento</label>
                    <input type="date" value={formT.data_vencimento} onChange={e => setFormT(p => ({ ...p, data_vencimento: e.target.value }))} className="input" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setModalT(false); setFormT({ ...FORM_T_VAZIO }) }} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={criarTarefa} disabled={salvando || !formT.titulo.trim()} className="btn-primary flex-1 justify-center"
                  style={{ opacity: (salvando || !formT.titulo.trim()) ? .6 : 1 }}>
                  {salvando ? 'Criando...' : 'Criar Tarefa'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Editar Tarefa */}
        {modalEditT && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="flex items-center gap-2 mb-5">
                <div className="stat-icon" style={{ background: '#e8f5e9', width: 32, height: 32, borderRadius: 8 }}>
                  <Edit3 size={14} style={{ color: '#2e7d32' }} />
                </div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Editar Tarefa</h2>
                <button onClick={() => setModalEditT(null)} className="ml-auto" style={{ color: '#9aa0a6' }}><X size={16} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Título *</label>
                  <input value={formEditT.titulo ?? ''} onChange={e => setFormEditT(p => ({ ...p, titulo: e.target.value }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Descrição</label>
                  <textarea value={formEditT.descricao ?? ''} onChange={e => setFormEditT(p => ({ ...p, descricao: e.target.value }))} rows={2} className="input resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Status</label>
                    <select value={formEditT.status ?? 'PENDENTE'} onChange={e => setFormEditT(p => ({ ...p, status: e.target.value }))} className="input">
                      {STATUS_TAR.map(s => <option key={s} value={s}>{STATUS_TAR_STYLE[s].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Prioridade</label>
                    <select value={formEditT.prioridade ?? 'MEDIA'} onChange={e => setFormEditT(p => ({ ...p, prioridade: e.target.value }))} className="input">
                      {PRIORIDADES.map(v => <option key={v} value={v}>{PRIOR_STYLE[v].label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Responsável</label>
                    <input value={formEditT.responsavel ?? ''} onChange={e => setFormEditT(p => ({ ...p, responsavel: e.target.value }))} className="input" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Vencimento</label>
                    <input type="date" value={formEditT.data_vencimento ?? ''} onChange={e => setFormEditT(p => ({ ...p, data_vencimento: e.target.value }))} className="input" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModalEditT(null)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={salvarEdicaoTarefa} disabled={salvando} className="btn-primary flex-1 justify-center">
                  <Save size={13} /> {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmar Delete */}
        {confirmDel && (
          <div className="modal-bg">
            <div className="modal-box" style={{ maxWidth: 400 }}>
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#fce4ec' }}>
                  <Trash2 size={22} style={{ color: '#c62828' }} />
                </div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>
                  Excluir {confirmDel.tipo === 'projeto' ? 'Projeto' : 'Tarefa'}?
                </h2>
                <p className="text-sm mt-1" style={{ color: '#5f6368' }}>
                  <strong>"{confirmDel.nome}"</strong> será excluído permanentemente.
                  {confirmDel.tipo === 'projeto' && <span className="block text-xs mt-1 text-red-600">Todas as tarefas deste projeto também serão excluídas.</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmDel(null)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={confirmarDelete}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-bold"
                  style={{ background: '#c62828', color: '#fff' }}>
                  <Trash2 size={14} /> Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  )
}

// ─── COMPONENTE DE LINHA DE TAREFA ─────────────────────────────────────────────
function TarefaRow({ tarefa, onCiclar, onEditar, onDeletar }: {
  tarefa: Tarefa
  onCiclar: () => void
  onEditar: () => void
  onDeletar: () => void
}) {
  const ss = STATUS_TAR_STYLE[tarefa.status] ?? STATUS_TAR_STYLE.PENDENTE
  const ps = PRIOR_STYLE[tarefa.prioridade] ?? PRIOR_STYLE.MEDIA
  const vencida = tarefa.data_vencimento && new Date(tarefa.data_vencimento) < new Date() && tarefa.status !== 'CONCLUIDA'
  const concluida = tarefa.status === 'CONCLUIDA'

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors group">
      {/* Botão de status circular */}
      <button onClick={onCiclar}
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
        style={{
          borderColor: ss.color,
          background: concluida ? ss.color : 'transparent',
        }}
        title={`Status: ${ss.label} — clique para avançar`}>
        {concluida && <CheckCircle size={12} color="#fff" strokeWidth={3} />}
      </button>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate"
          style={{ color: concluida ? '#9aa0a6' : '#1a1d23', textDecoration: concluida ? 'line-through' : 'none', fontWeight: concluida ? 400 : 500 }}>
          {tarefa.titulo}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs px-1.5 py-0.5 rounded font-medium"
            style={{ background: ss.bg, color: ss.color }}>{ss.label}</span>
          {tarefa.responsavel && (
            <span className="text-xs flex items-center gap-0.5" style={{ color: '#9aa0a6' }}>
              <User size={10} /> {tarefa.responsavel}
            </span>
          )}
          {tarefa.data_vencimento && (
            <span className="text-xs flex items-center gap-0.5" style={{ color: vencida ? '#c62828' : '#9aa0a6', fontWeight: vencida ? 700 : 400 }}>
              <Calendar size={10} />
              {new Date(tarefa.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
              {vencida && ' ⚠'}
            </span>
          )}
        </div>
      </div>

      {/* Prioridade + ações */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className={ps.badge} style={{ fontSize: 10 }}>{ps.label}</span>
        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEditar}
            className="w-6 h-6 rounded flex items-center justify-center" style={{ color: '#9aa0a6' }}>
            <Edit3 size={12} />
          </button>
          <button onClick={onDeletar}
            className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50" style={{ color: '#9aa0a6' }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
