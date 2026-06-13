'use client'
import { useState, useMemo } from 'react'
import { ShoppingCart, AlertTriangle, CheckCircle, Package } from 'lucide-react'

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  funcional:   { bg: '#f3e5f5', color: '#8e24aa' },
  polpa:       { bg: '#fff3e0', color: '#e65100' },
  acido:       { bg: '#e8f5e9', color: '#2e7d32' },
  conservante: { bg: '#e3f2fd', color: '#1565c0' },
  aroma:       { bg: '#e0f2f1', color: '#004d40' },
  adocante:    { bg: '#fff8e1', color: '#f57f17' },
  outro:       { bg: '#f5f5f5', color: '#616161' },
}

export default function ClienteConsolidado({ clienteId, sabores }: any) {
  // Estado dos estoques de embalagens por sabor (para calcular ao vivo)
  const [estoques, setEstoques] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {}
    sabores.forEach((s: any) => { init[s.id] = 0 })
    return init
  })

  // Calcular necessidades de cada sabor
  const calcSabor = (sabor: any, estEmb: number) => {
    if (estEmb <= 0) return null
    const embLiq = estEmb * (1 - sabor.perda_embalagem_pct)
    const litrosLiq = embLiq * (sabor.volume_embalagem_ml / 1000)
    const litrosTotais = litrosLiq * (1 + sabor.perda_formulacao_pct)
    return { litrosTotais }
  }

  // Consolidar todos os ingredientes
  const consolidado = useMemo(() => {
    const mapa: Record<string, any> = {}

    sabores.forEach((sabor: any) => {
      const estEmb = estoques[sabor.id] ?? 0
      const c = calcSabor(sabor, estEmb)
      if (!c) return

      const ings = sabor.sabor_ingredientes ?? []
      ings.forEach((ing: any) => {
        const key = `${ing.fornecedor}|${ing.ingrediente}`
        const qtdNec = (Number(ing.g_por_litro) / 1000) * c.litrosTotais
        const estoque = Number(ing.estoque_atual ?? 0)

        if (!mapa[key]) {
          mapa[key] = {
            fornecedor: ing.fornecedor,
            ingrediente: ing.ingrediente,
            categoria: ing.categoria,
            necessidadeTotal: 0,
            estoqueTotal: estoque,
            sabores: [],
          }
        }
        mapa[key].necessidadeTotal += qtdNec
        if (!mapa[key].sabores.includes(sabor.nome)) mapa[key].sabores.push(sabor.nome)
      })
    })

    return Object.values(mapa).map(item => ({
      ...item,
      totalCompra: Math.max(0, item.necessidadeTotal - item.estoqueTotal),
      status: item.necessidadeTotal <= item.estoqueTotal ? 'SUFICIENTE' :
        item.estoqueTotal > 0 ? 'PARCIAL' : 'INTEGRAL',
    })).sort((a, b) => b.totalCompra - a.totalCompra)
  }, [sabores, estoques])

  const totalNecessidade = consolidado.reduce((s, i) => s + i.necessidadeTotal, 0)
  const totalEstoque = consolidado.reduce((s, i) => s + i.estoqueTotal, 0)
  const totalCompra = consolidado.reduce((s, i) => s + i.totalCompra, 0)
  const qtdFornecedores = new Set(consolidado.map(i => i.fornecedor)).size

  const precisaComprar = consolidado.filter(i => i.status !== 'SUFICIENTE').length

  return (
    <main className="p-6 space-y-5">

      {/* Entradas de embalagens por sabor */}
      <div className="card">
        <h3 className="text-sm font-bold mb-3" style={{ color: '#1a1d23' }}>
          Informe o Estoque de Embalagens por Sabor para Consolidar
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
                placeholder={`Ex: ${s.nome === 'Pink Lemonade' ? '67264' : s.nome === 'Piña Colada' ? '34917' : '27917'}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Resumo executivo */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3 flex items-center gap-2"
          style={{ background: '#1a1d23', borderBottom: '1px solid #252931' }}>
          <span className="text-xs font-black text-white">CONSOLIDADO DE COMPRAS</span>
          <span className="text-xs" style={{ color: '#9aa0a6' }}>Consolidação automática de insumos das produções</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded font-bold"
            style={{ background: precisaComprar > 0 ? '#fce4ec' : '#e8f5e9', color: precisaComprar > 0 ? '#c62828' : '#2e7d32' }}>
            {precisaComprar > 0 ? `⚠ ${precisaComprar} itens p/ comprar` : '✓ Estoque OK'}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-6 divide-x">
          {[
            { label: 'Total de Itens', value: consolidado.length, color: '#1a1d23' },
            { label: 'Necessidade Total', value: `${totalNecessidade.toFixed(2)} kg`, color: '#8e24aa' },
            { label: 'Estoque Total', value: `${totalEstoque.toFixed(2)} kg`, color: '#2e7d32' },
            { label: 'Total de Compra', value: `${totalCompra.toFixed(2)} kg`, color: '#c62828' },
            { label: 'Fornecedores', value: qtdFornecedores, color: '#1565c0' },
            { label: 'Status', value: precisaComprar > 0 ? '⚠ COMPRAR' : '✓ OK', color: precisaComprar > 0 ? '#c62828' : '#2e7d32' },
          ].map(c => (
            <div key={c.label} className="p-4">
              <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{c.label}</p>
              <p className="text-base font-black" style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela consolidada */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
          <div className="stat-icon" style={{ background: '#fce4ec', width: 28, height: 28, borderRadius: 7 }}>
            <ShoppingCart size={13} style={{ color: '#c62828' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Bloco Único — Consolidação de Insumos</h3>
        </div>
        {consolidado.length === 0 ? (
          <div className="text-center py-12" style={{ color: '#9aa0a6' }}>
            <Package size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Informe o estoque de embalagens acima para consolidar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="vtable">
              <thead><tr>
                {['Fornecedor','Ingrediente','Categoria','Sabores','Necessidade Total (kg)','Estoque (kg)','Total de Compra (kg)','Observação'].map(h=>(
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
                          style={{ background: cat.bg, color: cat.color }}>{item.categoria}</span>
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
                      <td style={{ color: item.estoqueTotal > 0 ? '#2e7d32' : '#9aa0a6' }}>
                        {item.estoqueTotal.toFixed(3)}
                      </td>
                      <td>
                        <span className="font-black" style={{
                          color: item.totalCompra <= 0 ? '#9aa0a6' : '#c62828',
                          fontSize: item.totalCompra > 0 ? 14 : 12,
                        }}>
                          {item.totalCompra <= 0 ? '—' : item.totalCompra.toFixed(3)}
                        </span>
                      </td>
                      <td>
                        <span className={item.status==='SUFICIENTE'?'badge-green':item.status==='PARCIAL'?'badge-yellow':'badge-red'}>
                          {item.status==='SUFICIENTE' ? '✓ Estoque suficiente' :
                           item.status==='PARCIAL'    ? '⚠ Comprar parcial' : '⚠ Comprar integral'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: '#fafafa', borderTop: '2px solid #e8eaed' }}>
                  <td colSpan={4} className="px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9aa0a6' }}>TOTAL GERAL</span>
                  </td>
                  <td className="px-4 py-3"><span className="font-black" style={{ color: '#1a1d23' }}>{totalNecessidade.toFixed(3)} kg</span></td>
                  <td className="px-4 py-3"><span className="font-black" style={{ color: '#2e7d32' }}>{totalEstoque.toFixed(3)} kg</span></td>
                  <td className="px-4 py-3"><span className="font-black" style={{ color: '#c62828' }}>{totalCompra.toFixed(3)} kg</span></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-center" style={{ color: '#9aa0a6' }}>
        ✓ Consolidação automática baseada nas abas: {sabores.map((s:any)=>s.nome).join(' • ')}
      </p>
    </main>
  )
}
