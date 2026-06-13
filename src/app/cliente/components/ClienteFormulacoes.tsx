'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { FlaskConical, Plus, Trash2, Save, Upload, CheckCircle } from 'lucide-react'

const CATEGORIAS = ['funcional','polpa','acido','conservante','aroma','adocante','outro']
const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  funcional:   { bg: '#f3e5f5', color: '#8e24aa' },
  polpa:       { bg: '#fff3e0', color: '#e65100' },
  acido:       { bg: '#e8f5e9', color: '#2e7d32' },
  conservante: { bg: '#e3f2fd', color: '#1565c0' },
  aroma:       { bg: '#e0f2f1', color: '#004d40' },
  adocante:    { bg: '#fff8e1', color: '#f57f17' },
  outro:       { bg: '#f5f5f5', color: '#616161' },
}

const ID = () => Math.random().toString(36).slice(2,9)

export default function ClienteFormulacoes({ clienteId, sabores, onUpdate }: any) {
  const [saborSel, setSaborSel] = useState<string>(sabores[0]?.id ?? '')
  const [editando, setEditando] = useState<Record<string, any>>({})
  const [salvando, setSalvando] = useState(false)
  const [saved, setSaved] = useState(false)
  const [novoSabor, setNovoSabor] = useState(false)
  const [formNovo, setFormNovo] = useState({ nome: '', volume_embalagem_ml: 250, perda_embalagem_pct: 5, perda_formulacao_pct: 5, unidades_por_caixa: 12 })

  const sabor = sabores.find((s: any) => s.id === saborSel)
  const ingredientes = sabor?.sabor_ingredientes ?? []

  const getIng = (ing: any) => ({ ...ing, ...(editando[ing.id] ?? {}) })

  const editar = (ingId: string, campo: string, valor: any) => {
    setEditando(prev => ({ ...prev, [ingId]: { ...(prev[ingId] ?? {}), [campo]: valor } }))
  }

  const salvarAlteracoes = async () => {
    setSalvando(true)
    const updates = Object.entries(editando)
    for (const [ingId, campos] of updates) {
      await supabase.from('sabor_ingredientes').update(campos).eq('id', ingId)
    }
    setEditando({})
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setSalvando(false)
    // Recarregar sabores
    const { data } = await supabase.from('cliente_sabores')
      .select('*, sabor_ingredientes(*)')
      .eq('cliente_id', clienteId).eq('ativo', true).order('criado_em')
    if (data) onUpdate(data)
  }

  const adicionarIngrediente = async () => {
    const novo = {
      sabor_id: saborSel, fornecedor: 'Fornecedor', ingrediente: 'Novo Ingrediente',
      g_por_litro: 0, unidade: 'kg', categoria: 'outro', estoque_atual: 0,
      ordem: ingredientes.length + 1,
    }
    await supabase.from('sabor_ingredientes').insert(novo)
    const { data } = await supabase.from('cliente_sabores')
      .select('*, sabor_ingredientes(*)').eq('cliente_id', clienteId).eq('ativo', true).order('criado_em')
    if (data) onUpdate(data)
  }

  const removerIngrediente = async (ingId: string) => {
    if (!confirm('Remover ingrediente?')) return
    await supabase.from('sabor_ingredientes').delete().eq('id', ingId)
    const { data } = await supabase.from('cliente_sabores')
      .select('*, sabor_ingredientes(*)').eq('cliente_id', clienteId).eq('ativo', true).order('criado_em')
    if (data) onUpdate(data)
  }

  const criarSabor = async () => {
    if (!formNovo.nome.trim()) return
    setSalvando(true)
    const { data } = await supabase.from('cliente_sabores').insert({
      cliente_id: clienteId,
      nome: formNovo.nome,
      volume_embalagem_ml: formNovo.volume_embalagem_ml,
      perda_embalagem_pct: formNovo.perda_embalagem_pct / 100,
      perda_formulacao_pct: formNovo.perda_formulacao_pct / 100,
      unidades_por_caixa: formNovo.unidades_por_caixa,
      ativo: true,
    }).select().single()
    if (data) {
      const { data: novos } = await supabase.from('cliente_sabores')
        .select('*, sabor_ingredientes(*)').eq('cliente_id', clienteId).eq('ativo', true).order('criado_em')
      if (novos) { onUpdate(novos); setSaborSel(data.id) }
    }
    setNovoSabor(false)
    setFormNovo({ nome: '', volume_embalagem_ml: 250, perda_embalagem_pct: 5, perda_formulacao_pct: 5, unidades_por_caixa: 12 })
    setSalvando(false)
  }

  const totalGl = ingredientes.reduce((s: number, i: any) => s + Number(getIng(i).g_por_litro), 0)

  return (
    <main className="p-6 space-y-5">

      {/* Abas de sabores */}
      <div className="flex items-center gap-2 flex-wrap">
        {sabores.map((s: any) => (
          <button key={s.id} onClick={() => setSaborSel(s.id)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={saborSel === s.id
              ? { background: '#F97316', color: '#fff' }
              : { background: '#fff', color: '#5f6368', border: '1px solid #dadce0' }}>
            {s.nome}
          </button>
        ))}
        <button onClick={() => setNovoSabor(true)}
          className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
          style={{ background: '#fff', color: '#5f6368', border: '1px dashed #dadce0' }}>
          <Plus size={14} /> Novo Sabor
        </button>
      </div>

      {sabor && (
        <>
          {/* Config do sabor */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="stat-icon" style={{ background: '#fff3e0', width: 30, height: 30, borderRadius: 8 }}>
                  <FlaskConical size={14} style={{ color: '#F97316' }} />
                </div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>{sabor.nome} — Parâmetros</h3>
              </div>
              <div className="text-xs" style={{ color: '#9aa0a6' }}>
                Total formulação: <span className="font-bold" style={{ color: '#1a1d23' }}>{totalGl.toFixed(3)} g/L</span>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Volume Embalagem (mL)', val: sabor.volume_embalagem_ml },
                { label: 'Perda Embalagem (%)', val: (sabor.perda_embalagem_pct*100).toFixed(0) },
                { label: 'Perda Formulação (%)', val: (sabor.perda_formulacao_pct*100).toFixed(0) },
                { label: 'Unidades/Caixa', val: sabor.unidades_por_caixa },
              ].map(p => (
                <div key={p.label} className="p-3 rounded-xl" style={{ background: '#fafafa', border: '1px solid #e8eaed' }}>
                  <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{p.label}</p>
                  <p className="text-lg font-black" style={{ color: '#1a1d23' }}>{p.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabela de ingredientes editável */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3.5 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
              <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>
                Formulação — {sabor.nome}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full ml-2"
                style={{ background: '#fff3e0', color: '#e65100', fontWeight: 600 }}>
                {ingredientes.length} ingredientes
              </span>
              <div className="ml-auto flex gap-2">
                {Object.keys(editando).length > 0 && (
                  <button onClick={salvarAlteracoes} disabled={salvando} className="btn-primary text-xs">
                    {saved ? <><CheckCircle size={13} /> Salvo!</> : <><Save size={13} /> {salvando ? 'Salvando...' : 'Salvar Alterações'}</>}
                  </button>
                )}
                <button onClick={adicionarIngrediente} className="btn-ghost text-xs">
                  <Plus size={13} /> Adicionar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="vtable">
                <thead><tr>
                  {['#','Fornecedor','Ingrediente','Categoria','g/L','Kg/L','Estoque (kg)',''].map(h=><th key={h}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {ingredientes.map((ing: any, idx: number) => {
                    const i = getIng(ing)
                    const cat = CAT_STYLE[i.categoria] ?? CAT_STYLE.outro
                    const hasEdit = !!editando[ing.id]
                    return (
                      <tr key={ing.id} style={hasEdit ? { background: '#fffbf5' } : {}}>
                        <td><span className="font-mono text-xs" style={{ color: '#bbb' }}>{String(idx+1).padStart(2,'0')}</span></td>
                        <td>
                          <input value={i.fornecedor ?? ''} onChange={e => editar(ing.id,'fornecedor',e.target.value)}
                            className="input text-xs" style={{ minWidth: 100, height: 28, padding: '2px 8px', borderColor: hasEdit ? '#F97316' : '#dadce0' }} />
                        </td>
                        <td>
                          <input value={i.ingrediente} onChange={e => editar(ing.id,'ingrediente',e.target.value)}
                            className="input text-xs" style={{ minWidth: 200, height: 28, padding: '2px 8px', borderColor: hasEdit ? '#F97316' : '#dadce0' }} />
                        </td>
                        <td>
                          <select value={i.categoria} onChange={e => editar(ing.id,'categoria',e.target.value)}
                            className="input text-xs" style={{ width: 120, height: 28, padding: '2px 6px' }}>
                            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="number" step="0.001" value={i.g_por_litro}
                            onChange={e => editar(ing.id,'g_por_litro',parseFloat(e.target.value)||0)}
                            className="input text-xs text-right" style={{ width: 80, height: 28, padding: '2px 8px', borderColor: hasEdit ? '#F97316' : '#dadce0' }} />
                        </td>
                        <td style={{ color: '#9aa0a6' }}>{(Number(i.g_por_litro)/1000).toFixed(6)}</td>
                        <td>
                          <input type="number" step="0.01" value={i.estoque_atual ?? 0}
                            onChange={e => editar(ing.id,'estoque_atual',parseFloat(e.target.value)||0)}
                            className="input text-xs text-right" style={{ width: 80, height: 28, padding: '2px 8px' }} />
                        </td>
                        <td>
                          <button onClick={() => removerIngrediente(ing.id)}
                            className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50 transition-colors"
                            style={{ color: '#9aa0a6' }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#fafafa', borderTop: '2px solid #e8eaed' }}>
                    <td colSpan={3} className="px-4 py-3">
                      <span className="text-xs font-bold uppercase" style={{ color: '#9aa0a6' }}>TOTAL INGREDIENTES</span>
                    </td>
                    <td></td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black" style={{ color: '#1a1d23' }}>{totalGl.toFixed(3)} g/L</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-black" style={{ color: '#8e24aa' }}>{(totalGl/1000).toFixed(6)} kg/L</span>
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal Novo Sabor */}
      {novoSabor && (
        <div className="modal-bg">
          <div className="modal-box">
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                <FlaskConical size={15} style={{ color: '#F97316' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Novo Sabor / Produto</h2>
            </div>
            <div className="space-y-3">
              {[
                { key: 'nome', label: 'Nome do Produto *', type: 'text' },
                { key: 'volume_embalagem_ml', label: 'Volume da Embalagem (mL)', type: 'number' },
                { key: 'perda_embalagem_pct', label: '% Perda de Embalagem', type: 'number' },
                { key: 'perda_formulacao_pct', label: '% Perda de Formulação', type: 'number' },
                { key: 'unidades_por_caixa', label: 'Unidades por Caixa', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                  <input type={f.type} value={(formNovo as any)[f.key]}
                    onChange={e => setFormNovo(p => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="input" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setNovoSabor(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
              <button onClick={criarSabor} disabled={salvando} className="btn-primary flex-1 justify-center">
                {salvando ? 'Criando...' : 'Criar Sabor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
