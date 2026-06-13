'use client'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Beaker, Save, Copy, CheckCircle, Package, ShoppingCart, Box } from 'lucide-react'

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  funcional:   { bg: '#f3e5f5', color: '#8e24aa' },
  polpa:       { bg: '#fff3e0', color: '#e65100' },
  acido:       { bg: '#e8f5e9', color: '#2e7d32' },
  conservante: { bg: '#e3f2fd', color: '#1565c0' },
  aroma:       { bg: '#e0f2f1', color: '#004d40' },
  adocante:    { bg: '#fff8e1', color: '#f57f17' },
  outro:       { bg: '#f5f5f5', color: '#616161' },
}

export default function ClienteCalculadoraProducao({ clienteId, sabores, onSaboresUpdate }: any) {
  const [saborId, setSaborId] = useState<string>(sabores[0]?.id ?? '')
  const [estoqueEmbalagens, setEstoqueEmbalagens] = useState<number>(0)
  const [estoqueCaixas, setEstoqueCaixas] = useState<number>(0)
  const [estoqueIngredientes, setEstoqueIngredientes] = useState<Record<string, number>>({})
  const [responsavel, setResponsavel] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [rodadaSalva, setRodadaSalva] = useState<any>(null)

  const sabor = sabores.find((s: any) => s.id === saborId)
  const ingredientes = sabor?.sabor_ingredientes ?? []

  const calc = useMemo(() => {
    if (!sabor || estoqueEmbalagens <= 0) return null
    const perdaEmb   = estoqueEmbalagens * Number(sabor.perda_embalagem_pct)
    const embLiq     = estoqueEmbalagens - perdaEmb
    const litrosLiq  = embLiq * (Number(sabor.volume_embalagem_ml) / 1000)
    const perdaForm  = litrosLiq * Number(sabor.perda_formulacao_pct)
    const litrosTotais = litrosLiq + perdaForm
    const insumos = ingredientes.map((ing: any) => {
      const gL = Number(ing.g_por_litro)
      const qtdNecessaria = (gL / 1000) * litrosTotais
      const estoque = Number(estoqueIngredientes[ing.id] ?? ing.estoque_atual ?? 0)
      const qtdComprar = Math.max(0, qtdNecessaria - estoque)
      return { ...ing, qtdNecessaria, estoqueRemanescente: estoque, qtdComprar,
        statusCompra: qtdComprar <= 0 ? 'SUFICIENTE' : estoque > 0 ? 'PARCIAL' : 'INTEGRAL' }
    })
    const totalKgFormula = insumos.reduce((s: number, i: any) => s + i.qtdNecessaria, 0)
    const totalKgCompras = insumos.reduce((s: number, i: any) => s + i.qtdComprar, 0)
    const caixasBrutas     = embLiq / Number(sabor.unidades_por_caixa)
    const perdaCaixas      = caixasBrutas * 0.05
    const caixasNecessarias = caixasBrutas + perdaCaixas
    const caixasComprar    = Math.max(0, caixasNecessarias - estoqueCaixas)
    return { perdaEmb, embLiq, litrosLiq, perdaForm, litrosTotais, insumos,
      totalKgFormula, totalKgCompras, caixasBrutas, perdaCaixas,
      caixasNecessarias, caixasComprar, saldoCaixas: estoqueCaixas - caixasNecessarias }
  }, [sabor, estoqueEmbalagens, estoqueCaixas, estoqueIngredientes, ingredientes])

  const salvarRodada = async () => {
    if (!calc || !sabor) return
    setSalvando(true)
    const numero = `ROD-${sabor.nome.substring(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}`
    const { data: rodada } = await supabase.from('producao_rodadas').insert({
      cliente_id: clienteId, sabor_id: saborId, numero,
      estoque_embalagens: estoqueEmbalagens, estoque_caixas: estoqueCaixas,
      responsavel, observacoes, data_producao: new Date().toISOString().split('T')[0],
      embalagens_perdidas: calc.perdaEmb, embalagens_liquidas: calc.embLiq,
      litros_liquidos: calc.litrosLiq, litros_totais: calc.litrosTotais,
      total_kg_formula: calc.totalKgFormula, total_kg_compras: calc.totalKgCompras,
      caixas_necessarias: calc.caixasNecessarias, caixas_comprar: calc.caixasComprar,
      status: 'CALCULADO',
    }).select().single()
    if (rodada) {
      await supabase.from('producao_compras_detalhe').insert(
        calc.insumos.map((i: any) => ({
          rodada_id: rodada.id, sabor_id: saborId, fornecedor: i.fornecedor,
          ingrediente: i.ingrediente, qtd_necessaria: i.qtdNecessaria,
          estoque_remanescente: i.estoqueRemanescente,
          qtd_comprar: i.qtdComprar, status_compra: i.statusCompra,
        }))
      )
      setRodadaSalva(rodada)
    }
    setSalvando(false)
  }

  const copiarResumo = () => {
    if (!calc || !sabor) return
    const txt = [
      `ORDEM DE PRODUÇÃO — ${sabor.nome.toUpperCase()}`,
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '', 'BLOCO 1 — PRODUÇÃO',
      `Embalagens: ${estoqueEmbalagens.toLocaleString('pt-BR')} un`,
      `Embalagens Líquidas: ${calc.embLiq.toFixed(0)} un`,
      `Litros a Fabricar: ${calc.litrosTotais.toFixed(2)} L`,
      '', 'BLOCO 2 — INSUMOS',
      ...calc.insumos.map((i: any) =>
        `  ${i.fornecedor} | ${i.ingrediente}: ${i.qtdNecessaria.toFixed(3)} kg  [Comprar: ${i.qtdComprar.toFixed(3)} kg]`),
      `TOTAL KG: ${calc.totalKgFormula.toFixed(3)} kg / COMPRAS: ${calc.totalKgCompras.toFixed(3)} kg`,
      '', 'BLOCO 3 — CAIXAS',
      `Caixas: ${calc.caixasNecessarias.toFixed(0)} necessárias / Comprar: ${calc.caixasComprar.toFixed(0)}`,
    ].join('\n')
    navigator.clipboard.writeText(txt)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="space-y-5">
      {rodadaSalva && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
          <CheckCircle size={18} style={{ color: '#2e7d32' }} />
          <p className="text-sm font-bold" style={{ color: '#2e7d32' }}>Rodada {rodadaSalva.numero} salva!</p>
          <button onClick={() => setRodadaSalva(null)} className="ml-auto text-xs" style={{ color: '#9aa0a6' }}>✕</button>
        </div>
      )}

      {/* Entradas */}
      <div className="card">
        <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>
          Controle Reverso — Base: Embalagens Primárias
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Produto / Sabor</label>
            <select value={saborId} onChange={e => setSaborId(e.target.value)} className="input" style={{ fontWeight: 700 }}>
              {sabores.map((s: any) => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Estoque de Embalagens (un)</label>
            <input type="number" min={0} step={100} value={estoqueEmbalagens || ''}
              onChange={e => setEstoqueEmbalagens(Number(e.target.value))}
              className="input" style={{ fontWeight: 700, fontSize: 15 }} placeholder="Ex: 67264" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Estoque de Caixas (un)</label>
            <input type="number" min={0} value={estoqueCaixas || ''}
              onChange={e => setEstoqueCaixas(Number(e.target.value))}
              className="input" placeholder="Ex: 22360" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Responsável</label>
            <input value={responsavel} onChange={e => setResponsavel(e.target.value)} className="input" placeholder="Nome" />
          </div>
        </div>
      </div>

      {!calc ? (
        <div className="card text-center py-12" style={{ color: '#9aa0a6' }}>
          <Beaker size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Informe o estoque de embalagens para calcular</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* BLOCO 1 */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ background: '#1a1d23', borderBottom: '1px solid #252931' }}>
              <span className="text-xs font-black text-white">BLOCO 1</span>
              <span className="text-xs" style={{ color: '#9aa0a6' }}>PRODUÇÃO REAL</span>
              <span className="ml-auto badge-orange">{sabor?.nome}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4">
              {[
                { label: 'Estoque Embalagens', value: estoqueEmbalagens.toLocaleString('pt-BR'), unit: 'un', color: '#1a1d23' },
                { label: `Perda ${(Number(sabor?.perda_embalagem_pct)*100).toFixed(0)}%`, value: calc.perdaEmb.toFixed(0), unit: 'un', color: '#f59e0b' },
                { label: 'Embalagens Líquidas', value: calc.embLiq.toFixed(0), unit: 'un', color: '#F97316' },
                { label: 'LITROS A FABRICAR', value: calc.litrosTotais.toFixed(2), unit: 'L', color: '#e65100', bold: true },
              ].map(c => (
                <div key={c.label} className="p-4" style={{ borderRight: '1px solid #f0f2f5' }}>
                  <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{c.label}</p>
                  <p className={`${c.bold ? 'text-xl' : 'text-base'} font-black`} style={{ color: c.color }}>
                    {c.value} <span className="text-xs font-normal" style={{ color: '#9aa0a6' }}>{c.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* BLOCO 2 */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3 flex items-center gap-2"
              style={{ background: '#1a1d23', borderBottom: '1px solid #252931' }}>
              <span className="text-xs font-black text-white">BLOCO 2</span>
              <span className="text-xs" style={{ color: '#9aa0a6' }}>FORMULAÇÃO E CONTROLE DE COMPRAS</span>
            </div>
            {/* Estoques remanescentes inline */}
            <div className="px-5 py-3 flex flex-wrap gap-3" style={{ background: '#fafafa', borderBottom: '1px solid #e8eaed' }}>
              {ingredientes.map((ing: any) => (
                <div key={ing.id} className="flex items-center gap-1.5">
                  <span className="text-xs font-medium truncate max-w-24" style={{ color: '#5f6368' }} title={ing.ingrediente}>
                    {ing.ingrediente.split(' ').slice(0,2).join(' ')}
                  </span>
                  <input type="number" step="0.01" min={0}
                    value={estoqueIngredientes[ing.id] ?? ing.estoque_atual ?? ''}
                    onChange={e => setEstoqueIngredientes(prev => ({ ...prev, [ing.id]: Number(e.target.value) }))}
                    className="input text-xs text-right" style={{ height: 26, padding: '2px 5px', width: 70 }} placeholder="0" />
                  <span className="text-xs" style={{ color: '#9aa0a6' }}>kg</span>
                </div>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="vtable">
                <thead><tr>
                  {['Fornecedor','Ingrediente','Categoria','g/L','Qtd Necessária','Estoque','Qtd Comprar','Status'].map(h=><th key={h}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {calc.insumos.map((i: any) => {
                    const cat = CAT_STYLE[i.categoria] ?? CAT_STYLE.outro
                    return (
                      <tr key={i.id}>
                        <td><span className="text-xs font-semibold" style={{ color: '#5f6368' }}>{i.fornecedor}</span></td>
                        <td><span className="font-semibold" style={{ color: '#1a1d23' }}>{i.ingrediente}</span></td>
                        <td><span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: cat.bg, color: cat.color }}>{i.categoria}</span></td>
                        <td style={{ color: '#5f6368' }}>{Number(i.g_por_litro).toFixed(3)}</td>
                        <td><span className="font-bold" style={{ color: '#1a1d23' }}>{i.qtdNecessaria.toFixed(3)} kg</span></td>
                        <td style={{ color: i.estoqueRemanescente > 0 ? '#2e7d32' : '#9aa0a6' }}>{i.estoqueRemanescente.toFixed(3)} kg</td>
                        <td><span className="font-black" style={{ color: i.qtdComprar > 0 ? '#c62828' : '#9aa0a6' }}>
                          {i.qtdComprar <= 0 ? '—' : `${i.qtdComprar.toFixed(3)} kg`}
                        </span></td>
                        <td><span className={i.statusCompra==='SUFICIENTE'?'badge-green':i.statusCompra==='PARCIAL'?'badge-yellow':'badge-red'}>
                          {i.statusCompra==='SUFICIENTE'?'✓':i.statusCompra==='PARCIAL'?'⚠ Parcial':'⚠ Comprar'}
                        </span></td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#fafafa', borderTop: '2px solid #e8eaed' }}>
                    <td colSpan={4} className="px-4 py-3"><span className="text-xs font-bold uppercase" style={{ color: '#9aa0a6' }}>TOTAL</span></td>
                    <td className="px-4 py-3"><span className="font-black" style={{ color: '#1a1d23' }}>{calc.totalKgFormula.toFixed(3)} kg</span></td>
                    <td></td>
                    <td className="px-4 py-3"><span className="font-black" style={{ color: '#c62828' }}>{calc.totalKgCompras.toFixed(3)} kg</span></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* BLOCO 3 — Caixas */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3" style={{ background: '#1a1d23', borderBottom: '1px solid #252931' }}>
              <span className="text-xs font-black text-white">BLOCO 3 — CAIXAS (5% perda)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: 'Un/Caixa', value: sabor?.unidades_por_caixa, color: '#1a1d23' },
                { label: 'Caixas Brutas', value: calc.caixasBrutas.toFixed(0), color: '#1a1d23' },
                { label: 'Perda 5%', value: calc.perdaCaixas.toFixed(0), color: '#f59e0b' },
                { label: 'Caixas Necessárias', value: calc.caixasNecessarias.toFixed(0), color: '#F97316', bold: true },
                { label: 'Em Estoque', value: estoqueCaixas.toLocaleString(), color: '#2e7d32' },
                { label: calc.caixasComprar > 0 ? '📦 Comprar' : '✓ Suficiente', value: calc.caixasComprar > 0 ? calc.caixasComprar.toFixed(0) : `+${Math.abs(calc.saldoCaixas).toFixed(0)}`, color: calc.caixasComprar > 0 ? '#c62828' : '#2e7d32', bold: true },
              ].map(c => (
                <div key={c.label} className="p-4" style={{ borderRight: '1px solid #f0f2f5' }}>
                  <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{c.label}</p>
                  <p className={`${c.bold?'text-lg':'text-base'} font-black`} style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            <button onClick={copiarResumo} className="btn-ghost text-xs">
              {copiado ? <><CheckCircle size={13} style={{ color: '#22c55e' }} /> Copiado!</> : <><Package size={13} /> Copiar Ordem</>}
            </button>
            <button onClick={salvarRodada} disabled={salvando} className="btn-primary text-xs">
              <Save size={13} /> {salvando ? 'Salvando...' : 'Salvar Rodada'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
