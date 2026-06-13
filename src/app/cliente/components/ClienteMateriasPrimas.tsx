'use client'
import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Package, Plus, AlertTriangle, CheckCircle, TrendingDown,
  TrendingUp, ArrowUpCircle, ArrowDownCircle, RefreshCw,
  ChevronDown, ChevronUp, Edit2, Save, X, Truck, Filter,
  BarChart2, Clock, Search
} from 'lucide-react'

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type MateriaPrima = {
  id: string
  fornecedor: string
  nome: string
  unidade: string
  categoria: string
  estoque_atual: number
  estoque_minimo: number
  custo_unitario: number
  observacoes?: string
  ativo: boolean
  atualizado_em: string
}

type Movimentacao = {
  id: string
  materia_prima_id: string
  tipo: 'ENTRADA' | 'SAIDA' | 'AJUSTE' | 'PERDA' | 'INVENTARIO'
  quantidade: number
  estoque_anterior: number
  estoque_posterior: number
  motivo?: string
  numero_nf?: string
  data_movimentacao: string
  responsavel?: string
}

// ─── ESTILOS POR CATEGORIA ────────────────────────────────────────────────────
const CAT: Record<string, { bg: string; color: string; label: string }> = {
  funcional:   { bg: '#f3e5f5', color: '#8e24aa', label: 'Funcional' },
  polpa:       { bg: '#fff3e0', color: '#e65100', label: 'Polpa/Suco' },
  acido:       { bg: '#e8f5e9', color: '#2e7d32', label: 'Ácido' },
  conservante: { bg: '#e3f2fd', color: '#1565c0', label: 'Conservante' },
  aroma:       { bg: '#e0f2f1', color: '#004d40', label: 'Aroma' },
  adocante:    { bg: '#fff8e1', color: '#f57f17', label: 'Adoçante' },
  outro:       { bg: '#f5f5f5', color: '#616161', label: 'Outro' },
}

const TIPO_MOV: Record<string, { label: string; cor: string; icone: React.ReactNode; sinal: 1 | -1 }> = {
  ENTRADA:    { label: 'Entrada',    cor: '#2e7d32', icone: <ArrowUpCircle   size={14}/>, sinal:  1 },
  SAIDA:      { label: 'Saída',      cor: '#c62828', icone: <ArrowDownCircle size={14}/>, sinal: -1 },
  AJUSTE:     { label: 'Ajuste',     cor: '#1565c0', icone: <RefreshCw       size={14}/>, sinal:  1 },
  PERDA:      { label: 'Perda',      cor: '#e65100', icone: <TrendingDown    size={14}/>, sinal: -1 },
  INVENTARIO: { label: 'Inventário', cor: '#6a1b9a', icone: <Package         size={14}/>, sinal:  1 },
}

const ID = () => Math.random().toString(36).slice(2, 9)

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function ClienteMateriasPrimas({ clienteId, onAlertasUpdate }: { clienteId: string; onAlertasUpdate?: (a: { mpsCriticas: number; mpsAtencao: number }) => void }) {
  const [mps, setMps] = useState<MateriaPrima[]>([])
  const [movs, setMovs] = useState<Record<string, Movimentacao[]>>({})
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroCat, setFiltroCat] = useState('TODAS')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')
  const [expandida, setExpandida] = useState<string | null>(null)
  const [modalMov, setModalMov] = useState<MateriaPrima | null>(null)
  const [modalEdit, setModalEdit] = useState<MateriaPrima | null>(null)
  const [modalNova, setModalNova] = useState(false)
  const [salvando, setSalvando] = useState(false)

  // Form movimentação
  const [formMov, setFormMov] = useState({
    tipo: 'ENTRADA' as keyof typeof TIPO_MOV,
    quantidade: '',
    motivo: '',
    numero_nf: '',
    responsavel: '',
  })

  // Form nova MP
  const [formNova, setFormNova] = useState({
    fornecedor: '', nome: '', unidade: 'kg', categoria: 'outro',
    estoque_atual: '', estoque_minimo: '', custo_unitario: '', observacoes: '',
  })

  // Form edição
  const [formEdit, setFormEdit] = useState<Partial<MateriaPrima>>({})

  // ── CARREGAR ──────────────────────────────────────────────────────────────
  const carregar = async () => {
    const { data } = await supabase
      .from('cliente_materias_primas')
      .select('*')
      .eq('cliente_id', clienteId)
      .eq('ativo', true)
      .order('categoria')
      .order('nome')
    const d = data ?? []
    setMps(d)
    if (onAlertasUpdate) {
      const criticas = d.filter(m => Number(m.estoque_atual) <= Number(m.estoque_minimo)).length
      const atencao  = d.filter(m => Number(m.estoque_atual) > Number(m.estoque_minimo) && Number(m.estoque_atual) <= Number(m.estoque_minimo) * 1.5).length
      onAlertasUpdate({ mpsCriticas: criticas, mpsAtencao: atencao })
    }
    setLoading(false)
  }

  const carregarMovs = async (mpId: string) => {
    if (movs[mpId]) return
    const { data } = await supabase
      .from('cliente_mp_movimentacoes')
      .select('*')
      .eq('materia_prima_id', mpId)
      .order('data_movimentacao', { ascending: false })
      .limit(20)
    setMovs(prev => ({ ...prev, [mpId]: data ?? [] }))
  }

  useEffect(() => { carregar() }, [clienteId])

  // ── STATUS ────────────────────────────────────────────────────────────────
  const getStatus = (mp: MateriaPrima) => {
    if (mp.estoque_atual <= 0) return 'SEM_ESTOQUE'
    if (mp.estoque_atual <= mp.estoque_minimo) return 'CRITICO'
    if (mp.estoque_atual <= mp.estoque_minimo * 1.5) return 'ATENCAO'
    return 'OK'
  }

  const statusStyle = (st: string) => ({
    SEM_ESTOQUE: { badge: 'badge-red',    label: 'Sem Estoque', barColor: '#ef4444' },
    CRITICO:     { badge: 'badge-red',    label: 'Crítico',     barColor: '#ef4444' },
    ATENCAO:     { badge: 'badge-yellow', label: 'Atenção',     barColor: '#f59e0b' },
    OK:          { badge: 'badge-green',  label: 'OK',          barColor: '#22c55e' },
  }[st] ?? { badge: 'badge-gray', label: '—', barColor: '#bbb' })

  // ── FILTROS + BUSCA ───────────────────────────────────────────────────────
  const mpsFiltradas = useMemo(() => {
    return mps.filter(mp => {
      const matchBusca = busca === '' ||
        mp.nome.toLowerCase().includes(busca.toLowerCase()) ||
        mp.fornecedor.toLowerCase().includes(busca.toLowerCase())
      const matchCat = filtroCat === 'TODAS' || mp.categoria === filtroCat
      const matchStatus = filtroStatus === 'TODOS' || getStatus(mp) === filtroStatus
      return matchBusca && matchCat && matchStatus
    })
  }, [mps, busca, filtroCat, filtroStatus])

  // ── TOTAIS ────────────────────────────────────────────────────────────────
  const totais = useMemo(() => ({
    total:      mps.length,
    ok:         mps.filter(m => getStatus(m) === 'OK').length,
    atencao:    mps.filter(m => getStatus(m) === 'ATENCAO').length,
    critico:    mps.filter(m => getStatus(m) === 'CRITICO').length,
    semEstoque: mps.filter(m => getStatus(m) === 'SEM_ESTOQUE').length,
    fornecedores: new Set(mps.map(m => m.fornecedor)).size,
  }), [mps])

  const categorias = useMemo(() =>
    (['TODAS'] as string[]).concat(Array.from(new Set(mps.map(m => m.categoria)))), [mps])

  // ── MOVIMENTAÇÃO ──────────────────────────────────────────────────────────
  const registrarMovimentacao = async () => {
    if (!modalMov || !formMov.quantidade) return
    setSalvando(true)

    const mp = mps.find(m => m.id === modalMov.id)!
    const qtd = parseFloat(formMov.quantidade)
    const sinal = TIPO_MOV[formMov.tipo].sinal
    const novoEstoque = formMov.tipo === 'AJUSTE' || formMov.tipo === 'INVENTARIO'
      ? qtd
      : Math.max(0, mp.estoque_atual + sinal * qtd)

    // Registrar movimentação
    await supabase.from('cliente_mp_movimentacoes').insert({
      cliente_id: clienteId,
      materia_prima_id: mp.id,
      tipo: formMov.tipo,
      quantidade: qtd,
      estoque_anterior: mp.estoque_atual,
      estoque_posterior: novoEstoque,
      motivo: formMov.motivo || null,
      numero_nf: formMov.numero_nf || null,
      responsavel: formMov.responsavel || null,
      data_movimentacao: new Date().toISOString(),
    })

    // Atualizar estoque
    await supabase.from('cliente_materias_primas')
      .update({ estoque_atual: novoEstoque })
      .eq('id', mp.id)

    // Atualizar localmente
    setMps(prev => prev.map(m => m.id === mp.id ? { ...m, estoque_atual: novoEstoque } : m))
    setMovs(prev => ({ ...prev, [mp.id]: [] })) // forçar reload

    setModalMov(null)
    setFormMov({ tipo: 'ENTRADA', quantidade: '', motivo: '', numero_nf: '', responsavel: '' })
    setSalvando(false)
  }

  // ── EDITAR MP ─────────────────────────────────────────────────────────────
  const salvarEdicao = async () => {
    if (!modalEdit) return
    setSalvando(true)
    await supabase.from('cliente_materias_primas').update(formEdit).eq('id', modalEdit.id)
    setMps(prev => prev.map(m => m.id === modalEdit.id ? { ...m, ...formEdit } as MateriaPrima : m))
    setModalEdit(null)
    setSalvando(false)
  }

  // ── NOVA MP ───────────────────────────────────────────────────────────────
  const criarMateriaPrima = async () => {
    if (!formNova.nome.trim() || !formNova.fornecedor.trim()) return
    setSalvando(true)
    await supabase.from('cliente_materias_primas').insert({
      cliente_id: clienteId,
      ...formNova,
      estoque_atual:  parseFloat(formNova.estoque_atual)  || 0,
      estoque_minimo: parseFloat(formNova.estoque_minimo) || 0,
      custo_unitario: parseFloat(formNova.custo_unitario) || 0,
      ativo: true,
    })
    setModalNova(false)
    setFormNova({ fornecedor:'',nome:'',unidade:'kg',categoria:'outro',estoque_atual:'',estoque_minimo:'',custo_unitario:'',observacoes:'' })
    setSalvando(false)
    carregar()
  }

  // ── TOGGLE EXPANDIR ───────────────────────────────────────────────────────
  const toggleExpandir = (mpId: string) => {
    if (expandida === mpId) {
      setExpandida(null)
    } else {
      setExpandida(mpId)
      carregarMovs(mpId)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* ── ALERTAS CRÍTICOS ───────────────────────────────────────────────── */}
      {(totais.critico + totais.semEstoque) > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(239,68,68,.06)', border: '1px solid rgba(239,68,68,.2)' }}>
          <AlertTriangle size={17} style={{ color: '#ef4444' }} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold" style={{ color: '#c62828' }}>
              {totais.semEstoque > 0 && `${totais.semEstoque} sem estoque`}
              {totais.semEstoque > 0 && totais.critico > 0 && ' · '}
              {totais.critico > 0 && `${totais.critico} em nível crítico`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>
              Solicite pedidos de compra para evitar paralisação da produção.
            </p>
          </div>
        </div>
      )}

      {/* ── KPIs ────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total de MPs',   value: totais.total,       color: '#1a1d23', bg: '#f0f2f5', border: '#e8eaed'  },
          { label: 'Fornecedores',   value: totais.fornecedores,color: '#1565c0', bg: '#e3f2fd', border: '#90caf9'  },
          { label: 'OK',             value: totais.ok,          color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7'  },
          { label: 'Atenção',        value: totais.atencao,     color: '#f57f17', bg: '#fff8e1', border: '#ffcc02'  },
          { label: 'Crítico',        value: totais.critico,     color: '#c62828', bg: '#fce4ec', border: '#f48fb1'  },
          { label: 'Sem Estoque',    value: totais.semEstoque,  color: '#6a1b9a', bg: '#f3e5f5', border: '#ce93d8'  },
        ].map(k => (
          <div key={k.label} className="rounded-xl p-4"
            style={{ background: k.bg, border: `1.5px solid ${k.border}` }}>
            <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{k.label}</p>
            <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* ── TOOLBAR ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Busca */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9aa0a6' }} />
          <input value={busca} onChange={e => setBusca(e.target.value)}
            placeholder="Buscar ingrediente ou fornecedor..."
            className="input pl-8 text-xs" style={{ height: 34, width: 260 }} />
        </div>

        {/* Filtro categoria */}
        <select value={filtroCat} onChange={e => setFiltroCat(e.target.value)}
          className="input text-xs" style={{ height: 34, width: 140 }}>
          {categorias.map(c => (
            <option key={c} value={c}>{c === 'TODAS' ? 'Todas Categorias' : (CAT[c]?.label ?? c)}</option>
          ))}
        </select>

        {/* Filtro status */}
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
          className="input text-xs" style={{ height: 34, width: 130 }}>
          {['TODOS','OK','ATENCAO','CRITICO','SEM_ESTOQUE'].map(s => (
            <option key={s} value={s}>{s === 'TODOS' ? 'Todos Status' : s.replace('_',' ')}</option>
          ))}
        </select>

        <div className="ml-auto">
          <button onClick={() => setModalNova(true)} className="btn-primary text-xs">
            <Plus size={14} /> Nova Matéria-Prima
          </button>
        </div>
      </div>

      {/* ── TABELA PRINCIPAL ────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
          <div className="stat-icon" style={{ background: '#fff3e0', width: 28, height: 28, borderRadius: 7 }}>
            <Package size={14} style={{ color: '#F97316' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>
            Matérias-Primas — Geração S
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold ml-1"
            style={{ background: '#fff3e0', color: '#e65100' }}>
            {mpsFiltradas.length} de {mps.length}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner" /></div>
        ) : mpsFiltradas.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#9aa0a6' }}>
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma matéria-prima encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vtable">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Ingrediente</th>
                  <th>Categoria</th>
                  <th className="text-right">Estoque Atual</th>
                  <th className="text-right">Mín.</th>
                  <th style={{ width: 120 }}>Nível</th>
                  <th>Status</th>
                  <th>Ações</th>
                  <th style={{ width: 36 }}></th>
                </tr>
              </thead>
              <tbody>
                {mpsFiltradas.map(mp => {
                  const st = getStatus(mp)
                  const ss = statusStyle(st)
                  const cat = CAT[mp.categoria] ?? CAT.outro
                  const pct = mp.estoque_minimo > 0
                    ? Math.min(100, Math.round((mp.estoque_atual / (mp.estoque_minimo * 2)) * 100))
                    : mp.estoque_atual > 0 ? 100 : 0
                  const isExp = expandida === mp.id

                  return (
                    <>
                      {/* ── LINHA PRINCIPAL ─────────────────────────────── */}
                      <tr key={mp.id}
                        style={isExp ? { background: '#fffbf5' } : {}}>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <Truck size={12} style={{ color: '#9aa0a6' }} />
                            <span className="text-xs font-semibold" style={{ color: '#5f6368' }}>
                              {mp.fornecedor}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="font-semibold" style={{ color: '#1a1d23' }}>{mp.nome}</span>
                        </td>
                        <td>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: cat.bg, color: cat.color }}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="text-right">
                          <span className="font-black text-sm"
                            style={{ color: st === 'OK' ? '#2e7d32' : st === 'SEM_ESTOQUE' ? '#9aa0a6' : '#c62828' }}>
                            {Number(mp.estoque_atual).toFixed(3)}
                          </span>
                          <span className="text-xs ml-1" style={{ color: '#9aa0a6' }}>{mp.unidade}</span>
                        </td>
                        <td className="text-right">
                          <span className="text-xs" style={{ color: '#9aa0a6' }}>
                            {Number(mp.estoque_minimo).toFixed(3)} {mp.unidade}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-full h-1.5" style={{ background: '#e8eaed', minWidth: 60 }}>
                              <div className="h-1.5 rounded-full transition-all"
                                style={{ width: `${pct}%`, background: ss.barColor }} />
                            </div>
                            <span className="text-xs w-7 text-right" style={{ color: '#9aa0a6' }}>{pct}%</span>
                          </div>
                        </td>
                        <td>
                          <span className={ss.badge}>{ss.label}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-1">
                            {/* Botão Entrada */}
                            <button
                              onClick={() => { setModalMov(mp); setFormMov(f => ({ ...f, tipo: 'ENTRADA' })) }}
                              title="Registrar entrada"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}>
                              <ArrowUpCircle size={12} /> Entrada
                            </button>
                            {/* Botão Saída */}
                            <button
                              onClick={() => { setModalMov(mp); setFormMov(f => ({ ...f, tipo: 'SAIDA' })) }}
                              title="Registrar saída"
                              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                              style={{ background: '#fce4ec', color: '#c62828', border: '1px solid #f48fb1' }}>
                              <ArrowDownCircle size={12} /> Saída
                            </button>
                            {/* Editar */}
                            <button
                              onClick={() => { setModalEdit(mp); setFormEdit({ ...mp }) }}
                              title="Editar"
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: '#f5f5f5', color: '#757575' }}>
                              <Edit2 size={12} />
                            </button>
                          </div>
                        </td>
                        {/* Expandir histórico */}
                        <td>
                          <button onClick={() => toggleExpandir(mp.id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: isExp ? '#fff3e0' : '#f5f5f5', color: isExp ? '#F97316' : '#9aa0a6' }}>
                            {isExp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </td>
                      </tr>

                      {/* ── LINHA EXPANDIDA: HISTÓRICO ───────────────────── */}
                      {isExp && (
                        <tr key={`${mp.id}-exp`}>
                          <td colSpan={9} style={{ padding: 0, background: '#fffbf5' }}>
                            <div style={{ borderTop: '1px dashed #F97316', borderBottom: '1px solid #e8eaed' }}>
                              {/* Cabeçalho histórico */}
                              <div className="px-5 py-2.5 flex items-center gap-2"
                                style={{ background: '#fff9f0', borderBottom: '1px solid #f0e8da' }}>
                                <Clock size={13} style={{ color: '#F97316' }} />
                                <span className="text-xs font-bold" style={{ color: '#1a1d23' }}>
                                  Histórico de Movimentações — {mp.nome}
                                </span>
                                <button
                                  onClick={() => { setModalMov(mp); setFormMov(f => ({ ...f, tipo: 'AJUSTE' })) }}
                                  className="ml-auto text-xs px-2 py-1 rounded-lg font-semibold"
                                  style={{ background: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9' }}>
                                  <RefreshCw size={11} className="inline mr-1" />
                                  Ajuste / Inventário
                                </button>
                              </div>

                              {/* Tabela de movimentações */}
                              {!movs[mp.id] ? (
                                <div className="flex justify-center py-4"><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} /></div>
                              ) : movs[mp.id].length === 0 ? (
                                <div className="text-center py-6 text-xs" style={{ color: '#9aa0a6' }}>
                                  Nenhuma movimentação registrada. Use os botões de Entrada / Saída para começar.
                                </div>
                              ) : (
                                <table className="vtable" style={{ fontSize: 12 }}>
                                  <thead>
                                    <tr style={{ background: '#fafafa' }}>
                                      {['Data','Tipo','Quantidade','Est. Anterior','Est. Posterior','NF/Referência','Motivo','Responsável'].map(h=>(
                                        <th key={h} style={{ fontSize: 10 }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {movs[mp.id].map(m => {
                                      const tm = TIPO_MOV[m.tipo]
                                      return (
                                        <tr key={m.id}>
                                          <td style={{ color: '#9aa0a6', whiteSpace: 'nowrap' }}>
                                            {new Date(m.data_movimentacao).toLocaleDateString('pt-BR')}
                                          </td>
                                          <td>
                                            <div className="flex items-center gap-1" style={{ color: tm.cor }}>
                                              {tm.icone}
                                              <span className="font-semibold text-xs">{tm.label}</span>
                                            </div>
                                          </td>
                                          <td>
                                            <span className="font-bold" style={{ color: tm.cor }}>
                                              {m.tipo === 'SAIDA' || m.tipo === 'PERDA' ? '-' : '+'}
                                              {Number(m.quantidade).toFixed(3)} {mp.unidade}
                                            </span>
                                          </td>
                                          <td style={{ color: '#9aa0a6' }}>{Number(m.estoque_anterior).toFixed(3)}</td>
                                          <td>
                                            <span className="font-semibold" style={{ color: '#1a1d23' }}>
                                              {Number(m.estoque_posterior).toFixed(3)}
                                            </span>
                                          </td>
                                          <td style={{ color: '#5f6368' }}>{m.numero_nf ?? '—'}</td>
                                          <td style={{ color: '#5f6368', maxWidth: 160 }}>
                                            <span className="truncate block">{m.motivo ?? '—'}</span>
                                          </td>
                                          <td style={{ color: '#9aa0a6' }}>{m.responsavel ?? '—'}</td>
                                        </tr>
                                      )
                                    })}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PAINEL POR FORNECEDOR ────────────────────────────────────────────── */}
      <div className="card">
        <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>
          Resumo por Fornecedor
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from(new Set(mps.map(m => m.fornecedor))).sort().map(forn => {
            const itens = mps.filter(m => m.fornecedor === forn)
            const criticos = itens.filter(m => ['CRITICO','SEM_ESTOQUE'].includes(getStatus(m))).length
            const categorias = [...new Set(itens.map(m => m.categoria))]
            return (
              <div key={forn} className="rounded-xl p-4"
                style={{
                  border: `1.5px solid ${criticos > 0 ? 'rgba(239,68,68,.25)' : '#e8eaed'}`,
                  background: criticos > 0 ? 'rgba(239,68,68,.03)' : '#fafafa',
                }}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Truck size={14} style={{ color: '#F97316' }} />
                    <span className="font-bold text-sm" style={{ color: '#1a1d23' }}>{forn}</span>
                  </div>
                  {criticos > 0 && (
                    <span className="badge-red">{criticos} crítico{criticos > 1 ? 's' : ''}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {categorias.map(c => {
                    const cs = CAT[c] ?? CAT.outro
                    return (
                      <span key={c} className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: cs.bg, color: cs.color, fontWeight: 600 }}>
                        {cs.label}
                      </span>
                    )
                  })}
                </div>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>
                  {itens.length} ingrediente{itens.length > 1 ? 's' : ''}
                </p>
                {/* Mini lista */}
                <div className="mt-2 space-y-1">
                  {itens.map(m => {
                    const st = getStatus(m)
                    const ss = statusStyle(st)
                    return (
                      <div key={m.id} className="flex items-center justify-between text-xs">
                        <span className="truncate" style={{ color: '#5f6368', maxWidth: 160 }}>{m.nome}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold" style={{ color: '#1a1d23' }}>
                            {Number(m.estoque_atual).toFixed(1)} {m.unidade}
                          </span>
                          <span className={ss.badge} style={{ fontSize: 10, padding: '1px 5px' }}>{ss.label}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAIS
      ══════════════════════════════════════════════════════════════════════════ */}

      {/* ── MODAL: MOVIMENTAÇÃO ──────────────────────────────────────────────── */}
      {modalMov && (
        <div className="modal-bg">
          <div className="modal-box">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon"
                style={{ background: formMov.tipo === 'ENTRADA' ? '#e8f5e9' : formMov.tipo === 'SAIDA' || formMov.tipo === 'PERDA' ? '#fce4ec' : '#e3f2fd',
                         width: 34, height: 34, borderRadius: 9 }}>
                {TIPO_MOV[formMov.tipo].icone}
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>
                  Registrar Movimentação
                </h2>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>{modalMov.nome}</p>
              </div>
              <button onClick={() => setModalMov(null)} className="ml-auto" style={{ color: '#9aa0a6' }}>
                <X size={16} />
              </button>
            </div>

            {/* Tipo de movimentação */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2" style={{ color: '#5f6368' }}>
                Tipo de Movimentação
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {(Object.entries(TIPO_MOV) as [keyof typeof TIPO_MOV, any][]).map(([tipo, info]) => (
                  <button key={tipo} onClick={() => setFormMov(f => ({ ...f, tipo }))}
                    className="flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition-all border"
                    style={formMov.tipo === tipo
                      ? { background: info.cor + '18', color: info.cor, borderColor: info.cor }
                      : { background: '#fafafa', color: '#9aa0a6', borderColor: '#e8eaed' }}>
                    <span style={{ color: formMov.tipo === tipo ? info.cor : '#bbb' }}>{info.icone}</span>
                    {info.label}
                  </button>
                ))}
              </div>
              {(formMov.tipo === 'AJUSTE' || formMov.tipo === 'INVENTARIO') && (
                <p className="text-xs mt-2 px-3 py-2 rounded-lg"
                  style={{ background: '#e3f2fd', color: '#1565c0' }}>
                  ℹ️ {formMov.tipo === 'AJUSTE' ? 'Ajuste' : 'Inventário'}: o valor informado será o <strong>novo estoque absoluto</strong>, não uma adição/subtração.
                </p>
              )}
            </div>

            {/* Estoque atual */}
            <div className="flex items-center justify-between mb-4 px-3 py-2.5 rounded-xl"
              style={{ background: '#fafafa', border: '1px solid #e8eaed' }}>
              <span className="text-xs" style={{ color: '#9aa0a6' }}>Estoque atual</span>
              <span className="font-black text-base" style={{ color: '#1a1d23' }}>
                {Number(modalMov.estoque_atual).toFixed(3)} {modalMov.unidade}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                  {formMov.tipo === 'AJUSTE' || formMov.tipo === 'INVENTARIO'
                    ? 'Novo Estoque (valor absoluto) *'
                    : `Quantidade (${modalMov.unidade}) *`}
                </label>
                <input type="number" step="0.001" min="0"
                  value={formMov.quantidade}
                  onChange={e => setFormMov(f => ({ ...f, quantidade: e.target.value }))}
                  className="input" style={{ fontWeight: 700, fontSize: 15 }}
                  placeholder="0.000" autoFocus />
                {formMov.quantidade && !['AJUSTE','INVENTARIO'].includes(formMov.tipo) && (
                  <p className="text-xs mt-1" style={{ color: TIPO_MOV[formMov.tipo].cor }}>
                    → Novo estoque: {Math.max(0, Number(modalMov.estoque_atual) + TIPO_MOV[formMov.tipo].sinal * parseFloat(formMov.quantidade)).toFixed(3)} {modalMov.unidade}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>NF / Referência</label>
                <input value={formMov.numero_nf} onChange={e => setFormMov(f => ({ ...f, numero_nf: e.target.value }))}
                  className="input" placeholder="Ex: NF-001234" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Motivo / Observação</label>
                <input value={formMov.motivo} onChange={e => setFormMov(f => ({ ...f, motivo: e.target.value }))}
                  className="input" placeholder="Ex: Recebimento pedido 05/2026" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Responsável</label>
                <input value={formMov.responsavel} onChange={e => setFormMov(f => ({ ...f, responsavel: e.target.value }))}
                  className="input" placeholder="Nome do responsável" />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalMov(null)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={registrarMovimentacao} disabled={salvando || !formMov.quantidade}
                className="btn-primary flex-1 justify-center"
                style={{ opacity: (!formMov.quantidade || salvando) ? .6 : 1 }}>
                {salvando ? 'Salvando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDITAR MP ─────────────────────────────────────────────────── */}
      {modalEdit && (
        <div className="modal-bg">
          <div className="modal-box">
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                <Edit2 size={14} style={{ color: '#F97316' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Editar Matéria-Prima</h2>
              <button onClick={() => setModalEdit(null)} className="ml-auto" style={{ color: '#9aa0a6' }}>
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'fornecedor', label: 'Fornecedor' },
                { key: 'nome',       label: 'Nome do Ingrediente' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                  <input value={(formEdit as any)[f.key] ?? ''}
                    onChange={e => setFormEdit(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Categoria</label>
                  <select value={formEdit.categoria ?? 'outro'}
                    onChange={e => setFormEdit(p => ({ ...p, categoria: e.target.value }))} className="input">
                    {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Unidade</label>
                  <select value={formEdit.unidade ?? 'kg'}
                    onChange={e => setFormEdit(p => ({ ...p, unidade: e.target.value }))} className="input">
                    {['kg','g','L','mL','un'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Estoque Mínimo ({formEdit.unidade})</label>
                  <input type="number" step="0.01" value={formEdit.estoque_minimo ?? 0}
                    onChange={e => setFormEdit(p => ({ ...p, estoque_minimo: parseFloat(e.target.value) || 0 }))} className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Custo Unit. (R$)</label>
                  <input type="number" step="0.01" value={formEdit.custo_unitario ?? 0}
                    onChange={e => setFormEdit(p => ({ ...p, custo_unitario: parseFloat(e.target.value) || 0 }))} className="input" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Observações</label>
                <textarea value={formEdit.observacoes ?? ''}
                  onChange={e => setFormEdit(p => ({ ...p, observacoes: e.target.value }))}
                  rows={2} className="input resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalEdit(null)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={salvarEdicao} disabled={salvando} className="btn-primary flex-1 justify-center">
                <Save size={13} /> {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: NOVA MATÉRIA-PRIMA ────────────────────────────────────────── */}
      {modalNova && (
        <div className="modal-bg">
          <div className="modal-box">
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon" style={{ background: '#e8f5e9', width: 32, height: 32, borderRadius: 8 }}>
                <Plus size={14} style={{ color: '#2e7d32' }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Nova Matéria-Prima</h2>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Adicione ao catálogo da Geração S</p>
              </div>
              <button onClick={() => setModalNova(false)} className="ml-auto" style={{ color: '#9aa0a6' }}>
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { key: 'fornecedor', label: 'Fornecedor *' },
                { key: 'nome',       label: 'Nome do Ingrediente *' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                  <input value={(formNova as any)[f.key]}
                    onChange={e => setFormNova(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Categoria</label>
                  <select value={formNova.categoria}
                    onChange={e => setFormNova(p => ({ ...p, categoria: e.target.value }))} className="input">
                    {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Unidade</label>
                  <select value={formNova.unidade}
                    onChange={e => setFormNova(p => ({ ...p, unidade: e.target.value }))} className="input">
                    {['kg','g','L','mL','un'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'estoque_atual',  label: 'Estoque Atual' },
                  { key: 'estoque_minimo', label: 'Estoque Mínimo' },
                  { key: 'custo_unitario', label: 'Custo Unit. (R$)' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                    <input type="number" step="0.01" value={(formNova as any)[f.key]}
                      onChange={e => setFormNova(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Observações</label>
                <textarea value={formNova.observacoes}
                  onChange={e => setFormNova(p => ({ ...p, observacoes: e.target.value }))}
                  rows={2} className="input resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalNova(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={criarMateriaPrima} disabled={salvando} className="btn-primary flex-1 justify-center">
                {salvando ? 'Salvando...' : 'Criar Matéria-Prima'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
