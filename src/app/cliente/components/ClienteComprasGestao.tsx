'use client'
import { useState, useMemo, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  ShoppingCart, AlertTriangle, CheckCircle, Package,
  Plus, Truck, X, Save, ChevronDown, ChevronUp, Clock
} from 'lucide-react'

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  funcional:   { bg: '#f3e5f5', color: '#8e24aa' },
  polpa:       { bg: '#fff3e0', color: '#e65100' },
  acido:       { bg: '#e8f5e9', color: '#2e7d32' },
  conservante: { bg: '#e3f2fd', color: '#1565c0' },
  aroma:       { bg: '#e0f2f1', color: '#004d40' },
  adocante:    { bg: '#fff8e1', color: '#f57f17' },
  outro:       { bg: '#f5f5f5', color: '#616161' },
}

// Status de pedidos de compra
const STATUS_PC: Record<string, { label: string; badge: string }> = {
  RASCUNHO:         { label: 'Rascunho',      badge: 'badge-gray'   },
  ENVIADO:          { label: 'Enviado',        badge: 'badge-blue'   },
  CONFIRMADO:       { label: 'Confirmado',     badge: 'badge-yellow' },
  RECEBIDO_PARCIAL: { label: 'Rec. Parcial',   badge: 'badge-yellow' },
  RECEBIDO:         { label: 'Recebido',       badge: 'badge-green'  },
  CANCELADO:        { label: 'Cancelado',      badge: 'badge-red'    },
}

export default function ClienteComprasGestao({ clienteId, sabores }: any) {
  const [subAba, setSubAba] = useState<'consolidado' | 'pedidos'>('consolidado')
  const [mps, setMps] = useState<any[]>([])
  const [pedidos, setPedidos] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [modalPedido, setModalPedido] = useState(false)
  const [modalFornecedor, setModalFornecedor] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [expandido, setExpandido] = useState<string | null>(null)

  // Estoques de embalagens para consolidado
  const [estoques, setEstoques] = useState<Record<string, number>>({})

  // Formulário pedido
  const [formPed, setFormPed] = useState({
    fornecedor: '', data_pedido: new Date().toISOString().split('T')[0],
    data_entrega_prevista: '', valor_total: '', observacoes: '',
  })
  const [formForn, setFormForn] = useState({ nome: '', email: '', telefone: '', cnpj_cpf: '' })

  useEffect(() => {
    async function load() {
      const qMp = await (supabase as any).from('cliente_materias_primas')
        .select('*').eq('cliente_id', clienteId).eq('ativo', true).order('categoria').order('nome')
      setMps(qMp.data ?? [])
      const qPed = await (supabase as any).from('pedidos_compra')
        .select('*, fornecedores(nome)').order('criado_em', { ascending: false }).limit(30)
      const pedAll = qPed.data
      setPedidos(pedAll ?? [])
      // Fornecedores únicos das MPs
      const fornSet = Array.from(new Set((qMp.data ?? []).map((m: any) => m.fornecedor))).sort() as string[]
      setFornecedores(fornSet)
      setLoading(false)
    }
    load()
  }, [clienteId])

  // ── CALCULADORA DO CONSOLIDADO ────────────────────────────────────────────
  const calcSabor = (sabor: any, estEmb: number) => {
    if (estEmb <= 0) return null
    const embLiq     = estEmb * (1 - Number(sabor.perda_embalagem_pct))
    const litrosLiq  = embLiq * (Number(sabor.volume_embalagem_ml) / 1000)
    const litrosTotais = litrosLiq * (1 + Number(sabor.perda_formulacao_pct))
    return { litrosTotais }
  }

  const consolidado = useMemo(() => {
    const mapa: Record<string, any> = {}
    sabores.forEach((sabor: any) => {
      const estEmb = estoques[sabor.id] ?? 0
      const c = calcSabor(sabor, estEmb)
      if (!c) return
      const ings = sabor.sabor_ingredientes ?? []
      ings.forEach((ing: any) => {
        const key = `${ing.fornecedor}||${ing.ingrediente}`
        const qtdNec = (Number(ing.g_por_litro) / 1000) * c.litrosTotais
        const mpMatch = mps.find((m: any) =>
          m.fornecedor === ing.fornecedor ||
          m.nome.toLowerCase().includes(ing.ingrediente.toLowerCase().split(' ')[0])
        )
        const estoque = mpMatch ? Number(mpMatch.estoque_atual) : 0
        if (!mapa[key]) {
          mapa[key] = {
            fornecedor: ing.fornecedor,
            ingrediente: ing.ingrediente,
            categoria: ing.categoria,
            necessidadeTotal: 0,
            estoqueDisponivel: estoque,
            sabores: [],
          }
        }
        mapa[key].necessidadeTotal += qtdNec
        if (!mapa[key].sabores.includes(sabor.nome)) mapa[key].sabores.push(sabor.nome)
      })
    })
    return Object.values(mapa).map((item: any) => ({
      ...item,
      totalComprar: Math.max(0, item.necessidadeTotal - item.estoqueDisponivel),
      status: item.necessidadeTotal <= item.estoqueDisponivel ? 'SUFICIENTE'
        : item.estoqueDisponivel > 0 ? 'PARCIAL' : 'INTEGRAL',
    })).sort((a: any, b: any) => b.totalComprar - a.totalComprar)
  }, [sabores, estoques, mps])

  const totalNec     = consolidado.reduce((s, i) => s + i.necessidadeTotal, 0)
  const totalEst     = consolidado.reduce((s, i) => s + i.estoqueDisponivel, 0)
  const totalComprar = consolidado.reduce((s, i) => s + i.totalComprar, 0)
  const precisaComprar = consolidado.filter(i => i.status !== 'SUFICIENTE').length

  // ── CRIAR PEDIDO ──────────────────────────────────────────────────────────
  const criarPedido = async () => {
    if (!formPed.fornecedor.trim()) return
    setSalvando(true)
    const numero = `PC-GS-${Date.now().toString().slice(-6)}`
    await supabase.from('pedidos_compra').insert({
      numero, status: 'RASCUNHO',
      fornecedor_id: (await supabase.from('fornecedores')
        .select('id').ilike('nome', `%${formPed.fornecedor}%`).single()).data?.id ?? null,
      data_pedido: formPed.data_pedido,
      data_entrega_prevista: formPed.data_entrega_prevista || null,
      valor_total: parseFloat(formPed.valor_total) || 0,
      observacoes: formPed.observacoes || null,
    })
    setModalPedido(false)
    setFormPed({ fornecedor: '', data_pedido: new Date().toISOString().split('T')[0], data_entrega_prevista: '', valor_total: '', observacoes: '' })
    setSalvando(false)
    const { data } = await supabase.from('pedidos_compra')
      .select('*, fornecedores(nome)').order('criado_em', { ascending: false }).limit(30)
    setPedidos(data ?? [])
  }

  const atualizarStatus = async (id: string, status: string) => {
    await supabase.from('pedidos_compra').update({ status }).eq('id', id)
    setPedidos(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  if (loading) return (
    <main className="p-6 flex justify-center py-16" style={{ background: '#f0f2f5' }}>
      <div className="spinner" />
    </main>
  )

  return (
    <main className="p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* Sub-abas */}
      <div className="flex gap-0 rounded-xl overflow-hidden"
        style={{ border: '1px solid #e8eaed', background: '#fff', width: 'fit-content' }}>
        {([
          { id: 'consolidado', label: 'Consolidado de Compras', icon: Package },
          { id: 'pedidos',     label: 'Pedidos de Compra',      icon: ShoppingCart },
        ] as const).map(sub => (
          <button key={sub.id} onClick={() => setSubAba(sub.id)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all"
            style={subAba === sub.id
              ? { background: '#F97316', color: '#fff' }
              : { color: '#5f6368' }}>
            <sub.icon size={13} />
            {sub.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-ABA: CONSOLIDADO
      ══════════════════════════════════════════════════════════════════════ */}
      {subAba === 'consolidado' && (
        <div className="space-y-4">

          {/* Entradas */}
          <div className="card">
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1a1d23' }}>
              Informe o estoque de embalagens por sabor
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {sabores.map((s: any) => (
                <div key={s.id}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    {s.nome} (un)
                  </label>
                  <input type="number" min={0} step={100}
                    value={estoques[s.id] || ''}
                    onChange={e => setEstoques(prev => ({ ...prev, [s.id]: Number(e.target.value) }))}
                    className="input" style={{ fontWeight: 700 }}
                    placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Resumo executivo */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3 flex items-center gap-3"
              style={{ background: '#1a1d23', borderBottom: '1px solid #252931' }}>
              <span className="text-xs font-black text-white">CONSOLIDADO DE COMPRAS</span>
              <span className="text-xs" style={{ color: '#9aa0a6' }}>
                {sabores.map((s: any) => s.nome).join(' · ')}
              </span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded font-bold"
                style={{
                  background: precisaComprar > 0 ? '#fce4ec' : '#e8f5e9',
                  color: precisaComprar > 0 ? '#c62828' : '#2e7d32',
                }}>
                {precisaComprar > 0 ? `⚠ ${precisaComprar} itens p/ comprar` : '✓ Estoque OK'}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 divide-x" style={{ background: '#fff' }}>
              {[
                { label: 'Itens', value: consolidado.length, color: '#1a1d23' },
                { label: 'Necessidade Total', value: `${totalNec.toFixed(2)} kg`, color: '#8e24aa' },
                { label: 'Estoque Disponível', value: `${totalEst.toFixed(2)} kg`, color: '#2e7d32' },
                { label: 'Total de Compra', value: `${totalComprar.toFixed(2)} kg`, color: '#c62828' },
                { label: 'Fornecedores', value: new Set(consolidado.map(i => i.fornecedor)).size, color: '#1565c0' },
              ].map(c => (
                <div key={c.label} className="p-4">
                  <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{c.label}</p>
                  <p className="text-sm font-black" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela consolidada */}
          {consolidado.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="overflow-x-auto">
                <table className="vtable">
                  <thead><tr>
                    {['Fornecedor','Ingrediente','Categoria','Sabores','Necessidade (kg)','Estoque (kg)','Comprar (kg)','Status'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {consolidado.map((item, idx) => {
                      const cat = CAT_STYLE[item.categoria] ?? CAT_STYLE.outro
                      return (
                        <tr key={idx}>
                          <td><span className="text-xs font-semibold" style={{ color: '#5f6368' }}>{item.fornecedor}</span></td>
                          <td><span className="font-semibold" style={{ color: '#1a1d23' }}>{item.ingrediente}</span></td>
                          <td>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ background: cat.bg, color: cat.color }}>
                              {item.categoria}
                            </span>
                          </td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {item.sabores.map((s: string) => (
                                <span key={s} className="text-xs px-1.5 py-0.5 rounded"
                                  style={{ background: '#fff3e0', color: '#e65100', fontWeight: 600 }}>{s}</span>
                              ))}
                            </div>
                          </td>
                          <td><span className="font-bold" style={{ color: '#1a1d23' }}>{item.necessidadeTotal.toFixed(3)}</span></td>
                          <td style={{ color: item.estoqueDisponivel > 0 ? '#2e7d32' : '#9aa0a6' }}>
                            {item.estoqueDisponivel.toFixed(3)}
                          </td>
                          <td>
                            <span className="font-black" style={{ color: item.totalComprar > 0 ? '#c62828' : '#9aa0a6' }}>
                              {item.totalComprar <= 0 ? '—' : item.totalComprar.toFixed(3)}
                            </span>
                          </td>
                          <td>
                            <span className={item.status === 'SUFICIENTE' ? 'badge-green' : item.status === 'PARCIAL' ? 'badge-yellow' : 'badge-red'}>
                              {item.status === 'SUFICIENTE' ? '✓ Suficiente' : item.status === 'PARCIAL' ? '⚠ Parcial' : '⚠ Comprar'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#fafafa', borderTop: '2px solid #e8eaed' }}>
                      <td colSpan={4} className="px-4 py-3">
                        <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9aa0a6' }}>
                          TOTAL GERAL
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="font-black" style={{ color: '#1a1d23' }}>{totalNec.toFixed(3)} kg</span></td>
                      <td className="px-4 py-3"><span className="font-black" style={{ color: '#2e7d32' }}>{totalEst.toFixed(3)} kg</span></td>
                      <td className="px-4 py-3"><span className="font-black" style={{ color: '#c62828' }}>{totalComprar.toFixed(3)} kg</span></td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {consolidado.length === 0 && Object.values(estoques).every(v => !v) && (
            <div className="card text-center py-12" style={{ color: '#9aa0a6' }}>
              <Package size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Informe o estoque de embalagens acima para consolidar as compras.</p>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-ABA: PEDIDOS
      ══════════════════════════════════════════════════════════════════════ */}
      {subAba === 'pedidos' && (
        <div className="space-y-4">

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Em Rascunho', value: pedidos.filter(p=>p.status==='RASCUNHO').length, color: '#616161', bg: '#f5f5f5' },
              { label: 'Enviados',    value: pedidos.filter(p=>p.status==='ENVIADO').length,   color: '#1565c0', bg: '#e3f2fd' },
              { label: 'Confirmados', value: pedidos.filter(p=>p.status==='CONFIRMADO').length, color: '#f57f17', bg: '#fff8e1' },
              { label: 'Recebidos',   value: pedidos.filter(p=>p.status==='RECEBIDO').length,  color: '#2e7d32', bg: '#e8f5e9' },
            ].map(k => (
              <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
                <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>{k.label}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Pedidos de Compra</h2>
            <button onClick={() => setModalPedido(true)} className="btn-primary text-xs">
              <Plus size={13} /> Novo Pedido
            </button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {pedidos.length === 0 ? (
              <div className="text-center py-12" style={{ color: '#9aa0a6' }}>
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum pedido de compra cadastrado.</p>
              </div>
            ) : (
              <table className="vtable">
                <thead><tr>
                  {['Número','Fornecedor','Data Pedido','Entrega Prevista','Valor Total','Status','Ação'].map(h=>(
                    <th key={h}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {pedidos.map(p => {
                    const sc = STATUS_PC[p.status] ?? STATUS_PC.RASCUNHO
                    return (
                      <tr key={p.id}>
                        <td><span className="font-mono text-xs font-bold" style={{ color: '#F97316' }}>{p.numero}</span></td>
                        <td className="font-semibold" style={{ color: '#1a1d23' }}>{p.fornecedores?.nome ?? '—'}</td>
                        <td style={{ color: '#9aa0a6' }}>{p.data_pedido ? new Date(p.data_pedido).toLocaleDateString('pt-BR') : '—'}</td>
                        <td style={{ color: '#9aa0a6' }}>{p.data_entrega_prevista ? new Date(p.data_entrega_prevista).toLocaleDateString('pt-BR') : '—'}</td>
                        <td className="font-bold" style={{ color: '#1a1d23' }}>
                          R$ {Number(p.valor_total ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td><span className={sc.badge}>{sc.label}</span></td>
                        <td>
                          <select value={p.status} onChange={e => atualizarStatus(p.id, e.target.value)}
                            className="input text-xs" style={{ width: 'auto', height: 28, padding: '2px 6px' }}>
                            {Object.entries(STATUS_PC).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL NOVO PEDIDO ────────────────────────────────────────────── */}
      {modalPedido && (
        <div className="modal-bg">
          <div className="modal-box">
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                <ShoppingCart size={14} style={{ color: '#F97316' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Novo Pedido de Compra</h2>
              <button onClick={() => setModalPedido(false)} className="ml-auto" style={{ color: '#9aa0a6' }}>
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Fornecedor *</label>
                <input list="forn-list" value={formPed.fornecedor}
                  onChange={e => setFormPed(p => ({ ...p, fornecedor: e.target.value }))}
                  className="input" placeholder="Digite ou selecione" />
                <datalist id="forn-list">
                  {fornecedores.map(f => <option key={f} value={f} />)}
                </datalist>
              </div>
              {[
                { key: 'data_pedido',            label: 'Data do Pedido',     type: 'date'   },
                { key: 'data_entrega_prevista',  label: 'Entrega Prevista',   type: 'date'   },
                { key: 'valor_total',            label: 'Valor Total (R$)',   type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                  <input type={f.type} value={(formPed as any)[f.key]}
                    onChange={e => setFormPed(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Observações</label>
                <textarea value={formPed.observacoes}
                  onChange={e => setFormPed(p => ({ ...p, observacoes: e.target.value }))}
                  rows={2} className="input resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalPedido(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={criarPedido} disabled={salvando} className="btn-primary flex-1 justify-center">
                {salvando ? 'Salvando...' : 'Criar Pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
