'use client'
import { useState, useMemo, useCallback } from 'react'
import { calcularNutricional, type Ingrediente, type ConfigReceita } from '@/lib/nutricional'
import {
  Plus, Trash2, FlaskConical, Copy, CheckCircle,
  ChevronDown, ChevronUp, Info, Beaker, Target, FileText, Download
} from 'lucide-react'

const ID = () => Math.random().toString(36).slice(2, 9)

const ING_VAZIO = (): Ingrediente => ({
  id: ID(), nome: '', quantidade: 0, porcao100g: 100,
  carboidratos: 0, acucares_totais: 0, acucares_adicionados: 0,
  proteinas: 0, gorduras_totais: 0, gorduras_saturadas: 0, gorduras_trans: 0,
  fibras: 0, sodio: 0, poliol: false, fator_poliol: 0,
})

type Props = {
  titulo?: string
  nomeProdutoInicial?: string
  ingredientesIniciais?: Ingrediente[]
}

export default function CalculadoraFormulacao({
  titulo = 'Calculadora de Formulação',
  nomeProdutoInicial = '',
  ingredientesIniciais,
}: Props) {
  const [aba, setAba] = useState<'formulacao' | 'resultado' | 'tin'>('formulacao')
  const [copiado, setCopiado] = useState(false)
  const [gerandoPDF, setGerandoPDF] = useState(false)

  // ── GERAR PDF ─────────────────────────────────────────────────────────────
  const gerarPDF = () => {
    if (!resultado) return
    setGerandoPDF(true)

    const alertasFOP = [
      { nome: 'Açúcares Adicionados', val: resultado.por_porcao.acucares_adicionados, limite: 15, unidade: 'g' },
      { nome: 'Gorduras Saturadas',   val: resultado.por_porcao.gorduras_saturadas,   limite: 6,  unidade: 'g' },
      { nome: 'Sódio',                val: resultado.por_porcao.sodio,                limite: 600,unidade: 'mg' },
    ]

    const linhasTabela = [
      { nome: 'Valor Energético', v100: `${resultado.por_100.valor_energetico_kcal} kcal`, vP: `${resultado.por_porcao.valor_energetico_kcal} kcal`, vd: `${resultado.vd.valor_energetico}%`, bold: true, sub: false },
      { nome: 'Carboidratos',          v100: `${resultado.por_100.carboidratos} g`,           vP: `${resultado.por_porcao.carboidratos} g`,           vd: `${resultado.vd.carboidratos}%`,          bold: false, sub: false },
      { nome: 'Açúcares Totais',       v100: `${resultado.por_100.acucares_totais} g`,        vP: `${resultado.por_porcao.acucares_totais} g`,        vd: '—',                                       bold: false, sub: true  },
      { nome: 'Açúcares Adicionados',  v100: `${resultado.por_100.acucares_adicionados} g`,   vP: `${resultado.por_porcao.acucares_adicionados} g`,   vd: `${resultado.vd.acucares_adicionados}%`,   bold: false, sub: true  },
      { nome: 'Proteínas',             v100: `${resultado.por_100.proteinas} g`,              vP: `${resultado.por_porcao.proteinas} g`,              vd: `${resultado.vd.proteinas}%`,             bold: false, sub: false },
      { nome: 'Gorduras Totais',       v100: `${resultado.por_100.gorduras_totais} g`,        vP: `${resultado.por_porcao.gorduras_totais} g`,        vd: `${resultado.vd.gorduras_totais}%`,       bold: false, sub: false },
      { nome: 'Gorduras Saturadas',    v100: `${resultado.por_100.gorduras_saturadas} g`,     vP: `${resultado.por_porcao.gorduras_saturadas} g`,     vd: `${resultado.vd.gorduras_saturadas}%`,    bold: false, sub: true  },
      { nome: 'Gorduras Trans',        v100: `${resultado.por_100.gorduras_trans} g`,         vP: `${resultado.por_porcao.gorduras_trans} g`,         vd: '—',                                       bold: false, sub: true  },
      { nome: 'Fibras Alimentares',    v100: `${resultado.por_100.fibras} g`,                 vP: `${resultado.por_porcao.fibras} g`,                 vd: `${resultado.vd.fibras}%`,                bold: false, sub: false },
      { nome: 'Sódio',                 v100: `${resultado.por_100.sodio} mg`,                 vP: `${resultado.por_porcao.sodio} mg`,                 vd: `${resultado.vd.sodio}%`,                 bold: false, sub: false },
    ]

    const linhasHTML = linhasTabela.map((l, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}; border-bottom:1px solid #e8eaed;">
        <td style="padding:5px 8px; padding-left:${l.sub ? '20px' : '8px'}; font-weight:${l.bold ? 700 : l.sub ? 400 : 500}; font-size:${l.sub ? '10px' : '11px'}; color:#1a1d23;">${l.nome}</td>
        <td style="text-align:right; padding:5px 6px; font-size:10px; color:#5f6368;">${l.v100}</td>
        <td style="text-align:right; padding:5px 6px; font-size:11px; font-weight:${l.bold ? 700 : 500}; color:#1a1d23;">${l.vP}</td>
        <td style="text-align:right; padding:5px 6px; font-size:10px; color:#9aa0a6;">${l.vd}</td>
      </tr>`).join('')

    const alertasHTML = alertasFOP.map(a => `
      <div style="display:flex; align-items:center; gap:8px; padding:8px 12px; border-radius:8px; margin-bottom:6px;
        background:${a.val > a.limite ? '#fce4ec' : '#e8f5e9'}; border:1px solid ${a.val > a.limite ? '#f48fb1' : '#a5d6a7'};">
        <span style="font-size:14px;">${a.val > a.limite ? '⚠️' : '✅'}</span>
        <div>
          <p style="margin:0; font-size:11px; font-weight:700; color:${a.val > a.limite ? '#c62828' : '#2e7d32'};">${a.nome}</p>
          <p style="margin:0; font-size:10px; color:#5f6368;">${a.val} ${a.unidade}/porção — ${a.val > a.limite ? 'ALTO: Ícone de lupa obrigatório (RDC 429/2020)' : 'Dentro do limite'}</p>
        </div>
      </div>`).join('')

    // Formulação — ingredientes
    const linhasForm = ingredientes.filter(i => i.nome).map((ing, i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}; border-bottom:1px solid #f0f0f0;">
        <td style="padding:4px 6px; font-size:10px; color:#1a1d23;">${ing.nome}</td>
        <td style="text-align:right; padding:4px 6px; font-size:10px; color:#5f6368;">${ing.quantidade} ${config.unidade}</td>
        <td style="text-align:right; padding:4px 6px; font-size:10px; color:#5f6368;">${ing.carboidratos} g</td>
        <td style="text-align:right; padding:4px 6px; font-size:10px; color:#5f6368;">${ing.proteinas} g</td>
        <td style="text-align:right; padding:4px 6px; font-size:10px; color:#5f6368;">${ing.gorduras_totais} g</td>
        <td style="text-align:right; padding:4px 6px; font-size:10px; color:#5f6368;">${ing.sodio} mg</td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>TIN — ${config.nome_produto || 'Produto'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; color:#1a1d23; background:#fff; padding:32px; font-size:12px; }
    @media print {
      body { padding:16px; }
      .no-print { display:none !important; }
      @page { margin:16mm; size:A4; }
    }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:16px; border-bottom:3px solid #F97316; }
    .logo-block { display:flex; flex-direction:column; }
    .logo-title { font-size:22px; font-weight:900; color:#F97316; letter-spacing:-0.5px; }
    .logo-sub { font-size:10px; color:#9aa0a6; margin-top:2px; }
    .doc-info { text-align:right; }
    .doc-info p { font-size:10px; color:#9aa0a6; }
    .doc-info .produto { font-size:14px; font-weight:700; color:#1a1d23; }
    .section-title { font-size:13px; font-weight:700; color:#1a1d23; margin:20px 0 10px; padding-bottom:4px; border-bottom:1px solid #e8eaed; }
    .tin-wrapper { border:2px solid #1a1d23; border-radius:4px; overflow:hidden; max-width:400px; }
    .tin-header { background:#1a1d23; padding:8px 12px; text-align:center; }
    .tin-header p { color:#fff; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:1px; }
    .tin-header span { color:rgba(255,255,255,0.7); font-size:10px; display:block; margin-top:2px; }
    .tin-table { width:100%; border-collapse:collapse; }
    .tin-table th { background:#f8f8f8; padding:4px 6px; font-size:10px; font-weight:700; color:#1a1d23; border-bottom:1px solid #1a1d23; }
    .tin-table th:first-child { text-align:left; }
    .tin-table th:not(:first-child) { text-align:right; }
    .tin-footer { background:#f8f8f8; padding:6px 8px; font-size:9px; color:#5f6368; border-top:1px solid #1a1d23; }
    .linear-box { background:#f8f8f8; border:1px solid #e8eaed; border-radius:6px; padding:12px; font-size:10px; line-height:1.8; color:#1a1d23; }
    .form-table { width:100%; border-collapse:collapse; }
    .form-table th { background:#1a1d23; color:#fff; padding:5px 6px; font-size:10px; font-weight:700; text-align:right; }
    .form-table th:first-child { text-align:left; }
    .footer { margin-top:32px; padding-top:12px; border-top:1px solid #e8eaed; display:flex; justify-content:space-between; align-items:center; }
    .footer p { font-size:9px; color:#9aa0a6; }
    .footer .rodape-marca { font-size:9px; color:#9aa0a6; font-style:italic; }
    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
    .btn-print { display:inline-flex; align-items:center; gap:8px; background:#F97316; color:#fff; border:none; padding:10px 20px; border-radius:8px; font-size:12px; font-weight:700; cursor:pointer; margin-bottom:24px; }
    .badge-ok  { display:inline-block; padding:2px 7px; border-radius:99px; font-size:10px; font-weight:700; background:#e8f5e9; color:#2e7d32; }
    .badge-alt { display:inline-block; padding:2px 7px; border-radius:99px; font-size:10px; font-weight:700; background:#fce4ec; color:#c62828; }
  </style>
</head>
<body>
  <button class="no-print btn-print" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>

  <!-- Cabeçalho -->
  <div class="header">
    <div class="logo-block">
      <span class="logo-title">VIABILIZZE</span>
      <span class="logo-sub">ASSESSORIA INDUSTRIAL · Alimentos & Bebidas</span>
    </div>
    <div class="doc-info">
      <p class="produto">${config.nome_produto || 'Produto sem nome'}</p>
      <p>Tabela de Informação Nutricional</p>
      <p>Gerado em ${new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}</p>
      <p>Conformidade: IN 75/2020 ANVISA · RDC 429/2020</p>
    </div>
  </div>

  <!-- Dados da porção -->
  <div style="display:flex; gap:32px; margin-bottom:20px; padding:12px 16px; background:#fafafa; border-radius:8px; border:1px solid #e8eaed;">
    <div><p style="font-size:10px; color:#9aa0a6;">Porção</p><p style="font-weight:700;">${config.porcao_ml} ${config.unidade}</p></div>
    <div><p style="font-size:10px; color:#9aa0a6;">Medida Caseira</p><p style="font-weight:700;">${config.medida_caseira}</p></div>
    <div><p style="font-size:10px; color:#9aa0a6;">Rendimento Total</p><p style="font-weight:700;">${config.rendimento} ${config.unidade}</p></div>
    <div><p style="font-size:10px; color:#9aa0a6;">VE por Porção</p><p style="font-weight:700; color:#F97316;">${resultado.por_porcao.valor_energetico_kcal} kcal</p></div>
  </div>

  <div class="grid2">
    <!-- TIN padrão ANVISA -->
    <div>
      <p class="section-title">Tabela de Informação Nutricional — Padrão ANVISA</p>
      <div class="tin-wrapper">
        <div class="tin-header">
          <p>Informação Nutricional</p>
          <span>Porção ${config.porcao_ml} ${config.unidade} (${config.medida_caseira})</span>
        </div>
        <table class="tin-table">
          <thead>
            <tr>
              <th style="text-align:left;"></th>
              <th>100 ${config.unidade}</th>
              <th style="color:#F97316;">${config.porcao_ml} ${config.unidade}</th>
              <th>%VD*</th>
            </tr>
          </thead>
          <tbody>${linhasHTML}</tbody>
          <tfoot>
            <tr><td colspan="4" class="tin-footer">
              *% Valores Diários com base em uma dieta de 2.000 kcal ou 8.400 kJ. Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.
            </td></tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- FOP + Formato linear -->
    <div>
      <p class="section-title">Alertas FOP — Rotulagem Frontal (RDC 429/2020)</p>
      ${alertasHTML}

      <p class="section-title" style="margin-top:16px;">Formato Linear — Embalagens Pequenas</p>
      <div class="linear-box">
        <strong>INFORMAÇÃO NUTRICIONAL</strong> Porção ${config.porcao_ml} ${config.unidade} (${config.medida_caseira}): Por 100 ${config.unidade} (${config.porcao_ml} ${config.unidade}, %VD*): Valor energético ${resultado.por_100.valor_energetico_kcal} kcal (${resultado.por_porcao.valor_energetico_kcal} kcal, ${resultado.vd.valor_energetico}%) ▪ Carboidratos ${resultado.por_100.carboidratos} g (${resultado.por_porcao.carboidratos} g, ${resultado.vd.carboidratos}%), dos quais Açúcares totais ${resultado.por_100.acucares_totais} g (${resultado.por_porcao.acucares_totais} g), Açúcares adicionados ${resultado.por_100.acucares_adicionados} g (${resultado.por_porcao.acucares_adicionados} g, ${resultado.vd.acucares_adicionados}%) ▪ Proteínas ${resultado.por_100.proteinas} g (${resultado.por_porcao.proteinas} g, ${resultado.vd.proteinas}%) ▪ Gorduras totais ${resultado.por_100.gorduras_totais} g (${resultado.por_porcao.gorduras_totais} g, ${resultado.vd.gorduras_totais}%), das quais Gorduras saturadas ${resultado.por_100.gorduras_saturadas} g (${resultado.por_porcao.gorduras_saturadas} g, ${resultado.vd.gorduras_saturadas}%), Gorduras trans ${resultado.por_100.gorduras_trans} g (${resultado.por_porcao.gorduras_trans} g) ▪ Fibras alimentares ${resultado.por_100.fibras} g (${resultado.por_porcao.fibras} g, ${resultado.vd.fibras}%) ▪ Sódio ${resultado.por_100.sodio} mg (${resultado.por_porcao.sodio} mg, ${resultado.vd.sodio}%). *Percentual de valores diários fornecidos pela porção.
      </div>
    </div>
  </div>

  <!-- Formulação completa -->
  <p class="section-title">Formulação Completa — Composição Centesimal</p>
  <table class="form-table">
    <thead>
      <tr>
        <th style="text-align:left;">Ingrediente</th>
        <th>Qtd (${config.unidade})</th>
        <th>Carbo (g)</th>
        <th>Prot (g)</th>
        <th>Gord (g)</th>
        <th>Sódio (mg)</th>
      </tr>
    </thead>
    <tbody>${linhasForm}</tbody>
  </table>

  <!-- Rodapé -->
  <div class="footer">
    <p>Documento gerado pelo sistema VIABILIZZE CRM · viabilizzecrm.vercel.app</p>
    <p class="rodape-marca">Desenvolvido por VI.P &amp; NÔUS Consultoria</p>
  </div>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
    }
    setGerandoPDF(false)
  }

  // Config da receita
  const [config, setConfig] = useState<ConfigReceita>({
    nome_produto: nomeProdutoInicial,
    porcao_ml: 200,
    medida_caseira: '1 copo',
    rendimento: 1000,
    unidade: 'ml',
  })

  // Ingredientes
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>(
    ingredientesIniciais ?? [ING_VAZIO(), ING_VAZIO(), ING_VAZIO()]
  )

  // Expandidos
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) =>
    setExpandidos(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })

  const setIng = useCallback((id: string, campo: keyof Ingrediente, valor: any) => {
    setIngredientes(prev => prev.map(i => i.id === id ? { ...i, [campo]: valor } : i))
  }, [])

  const addIng = () => setIngredientes(prev => [...prev, ING_VAZIO()])
  const delIng = (id: string) => setIngredientes(prev => prev.filter(i => i.id !== id))

  // Rendimento automático = soma das quantidades
  const somaQtd = ingredientes.reduce((s, i) => s + (Number(i.quantidade) || 0), 0)

  // Resultado nutricional
  const resultado = useMemo(() => {
    if (!config.porcao_ml || !config.rendimento) return null
    try { return calcularNutricional(ingredientes, config) }
    catch { return null }
  }, [ingredientes, config])

  const copiarTIN = () => {
    if (!resultado) return
    const r = resultado
    const txt = [
      `INFORMAÇÃO NUTRICIONAL`,
      `Porção: ${config.porcao_ml} ${config.unidade} (${config.medida_caseira})`,
      '',
      `\t\tPor 100 ${config.unidade}\tPor Porção\t%VD*`,
      `Valor energético (kcal)\t${r.por_100.valor_energetico_kcal}\t${r.por_porcao.valor_energetico_kcal}\t${r.vd.valor_energetico}%`,
      `Carboidratos (g)\t${r.por_100.carboidratos}\t${r.por_porcao.carboidratos}\t${r.vd.carboidratos}%`,
      `  Açúcares totais (g)\t${r.por_100.acucares_totais}\t${r.por_porcao.acucares_totais}\t—`,
      `  Açúcares adicionados (g)\t${r.por_100.acucares_adicionados}\t${r.por_porcao.acucares_adicionados}\t${r.vd.acucares_adicionados}%`,
      `Proteínas (g)\t${r.por_100.proteinas}\t${r.por_porcao.proteinas}\t${r.vd.proteinas}%`,
      `Gorduras totais (g)\t${r.por_100.gorduras_totais}\t${r.por_porcao.gorduras_totais}\t${r.vd.gorduras_totais}%`,
      `  Gorduras saturadas (g)\t${r.por_100.gorduras_saturadas}\t${r.por_porcao.gorduras_saturadas}\t${r.vd.gorduras_saturadas}%`,
      `  Gorduras trans (g)\t${r.por_100.gorduras_trans}\t${r.por_porcao.gorduras_trans}\t—`,
      `Fibras alimentares (g)\t${r.por_100.fibras}\t${r.por_porcao.fibras}\t${r.vd.fibras}%`,
      `Sódio (mg)\t${r.por_100.sodio}\t${r.por_porcao.sodio}\t${r.vd.sodio}%`,
      `*Percentual de valores diários fornecidos pela porção.`,
    ].join('\n')
    navigator.clipboard.writeText(txt)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="space-y-4">

      {/* ── Abas ──────────────────────────────────────────────────────── */}
      <div className="flex gap-0 rounded-xl overflow-hidden"
        style={{ border: '1px solid #e8eaed', background: '#fff', width: 'fit-content' }}>
        {([
          { id: 'formulacao', label: 'Formulação', icon: Beaker },
          { id: 'resultado',  label: 'Resultado Nutricional', icon: Target },
          { id: 'tin',        label: 'Tabela de Informação', icon: FileText },
        ] as const).map(a => (
          <button key={a.id} onClick={() => setAba(a.id)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all"
            style={aba === a.id
              ? { background: '#F97316', color: '#fff' }
              : { color: '#5f6368' }}>
            <a.icon size={13} />
            {a.label}
          </button>
        ))}
      </div>

      {/* ══ ABA: FORMULAÇÃO ══════════════════════════════════════════════ */}
      {aba === 'formulacao' && (
        <div className="space-y-4">

          {/* Dados do produto */}
          <div className="card">
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1a1d23' }}>Dados do Produto</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Nome do Produto</label>
                <input value={config.nome_produto}
                  onChange={e => setConfig(c => ({ ...c, nome_produto: e.target.value }))}
                  className="input" placeholder="Ex: Néctar de Manga 250mL" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Porção ({config.unidade})</label>
                <input type="number" value={config.porcao_ml}
                  onChange={e => setConfig(c => ({ ...c, porcao_ml: Number(e.target.value) }))}
                  className="input" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Medida Caseira</label>
                <input value={config.medida_caseira}
                  onChange={e => setConfig(c => ({ ...c, medida_caseira: e.target.value }))}
                  className="input" placeholder="1 copo, 1 sachê..." />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Unidade</label>
                <select value={config.unidade} onChange={e => setConfig(c => ({ ...c, unidade: e.target.value as 'ml' | 'g' }))} className="input">
                  <option value="ml">mL (líquido)</option>
                  <option value="g">g (sólido)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                  Rendimento Total ({config.unidade})
                </label>
                <div className="flex gap-1.5">
                  <input type="number" value={config.rendimento}
                    onChange={e => setConfig(c => ({ ...c, rendimento: Number(e.target.value) }))}
                    className="input flex-1" />
                  <button onClick={() => setConfig(c => ({ ...c, rendimento: somaQtd }))}
                    className="px-2 py-1 rounded-lg text-xs font-semibold whitespace-nowrap"
                    style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2' }}
                    title="Usar soma dos ingredientes">
                    Auto
                  </button>
                </div>
                <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>
                  Soma: {somaQtd.toFixed(2)} {config.unidade}
                </p>
              </div>
            </div>
          </div>

          {/* Tabela de ingredientes */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
              <div className="stat-icon" style={{ background: '#fff3e0', width: 28, height: 28, borderRadius: 7 }}>
                <FlaskConical size={14} style={{ color: '#F97316' }} />
              </div>
              <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>
                Ingredientes e Composição Centesimal
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full ml-1"
                style={{ background: '#fff3e0', color: '#e65100', fontWeight: 700 }}>
                {ingredientes.filter(i => i.nome).length} ingredientes
              </span>
              <button onClick={addIng} className="btn-primary ml-auto" style={{ padding: '5px 12px', fontSize: 11 }}>
                <Plus size={13} /> Adicionar Ingrediente
              </button>
            </div>

            {/* Cabeçalho da tabela */}
            <div className="px-5 py-2 grid text-xs font-bold uppercase tracking-wide"
              style={{
                gridTemplateColumns: '28px 1fr 80px 70px 70px 70px 70px 70px 70px 70px 70px 70px 28px',
                gap: '6px', color: '#9aa0a6', background: '#fafafa', borderBottom: '1px solid #e8eaed',
              }}>
              <span>#</span>
              <span>Ingrediente</span>
              <span>Qtd ({config.unidade})</span>
              <span title="Por 100g/mL">Por 100</span>
              <span>Carbo (g)</span>
              <span>Açúcar T.</span>
              <span>Açúcar Ad.</span>
              <span>Prot. (g)</span>
              <span>Gord. T.</span>
              <span>Gord. Sat.</span>
              <span>Fibras</span>
              <span>Sódio (mg)</span>
              <span></span>
            </div>

            {/* Linhas de ingredientes */}
            {ingredientes.map((ing, idx) => (
              <div key={ing.id}>
                {/* Linha principal */}
                <div className="px-5 py-2 grid items-center"
                  style={{
                    gridTemplateColumns: '28px 1fr 80px 70px 70px 70px 70px 70px 70px 70px 70px 70px 28px',
                    gap: '6px', borderBottom: '1px solid #f5f5f5',
                    background: expandidos.has(ing.id) ? '#fffbf5' : idx % 2 === 0 ? '#fff' : '#fafafa',
                  }}>
                  <span className="text-xs font-mono text-center" style={{ color: '#ccc' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <input value={ing.nome}
                    onChange={e => setIng(ing.id, 'nome', e.target.value)}
                    className="input text-xs" style={{ height: 28, padding: '2px 8px' }}
                    placeholder="Nome do ingrediente" />
                  {/* Quantidade */}
                  <input type="number" step="0.01" value={ing.quantidade || ''}
                    onChange={e => setIng(ing.id, 'quantidade', parseFloat(e.target.value) || 0)}
                    className="input text-xs text-right" style={{ height: 28, padding: '2px 6px' }} />
                  {/* Porção referência */}
                  <input type="number" step="1" value={ing.porcao100g || ''}
                    onChange={e => setIng(ing.id, 'porcao100g', parseFloat(e.target.value) || 100)}
                    className="input text-xs text-center" style={{ height: 28, padding: '2px 4px',
                      background: '#f0f9ff', borderColor: '#bae6fd' }}
                    title="Porção de referência dos dados (normalmente 100)" />
                  {/* Nutrientes */}
                  {([
                    ['carboidratos', 0.1],
                    ['acucares_totais', 0.1],
                    ['acucares_adicionados', 0.1],
                    ['proteinas', 0.1],
                    ['gorduras_totais', 0.1],
                    ['gorduras_saturadas', 0.1],
                    ['fibras', 0.1],
                    ['sodio', 1],
                  ] as [keyof Ingrediente, number][]).map(([campo, step]) => (
                    <input key={campo} type="number" step={step}
                      value={(ing[campo] as number) || ''}
                      onChange={e => setIng(ing.id, campo, parseFloat(e.target.value) || 0)}
                      className="input text-xs text-right" style={{ height: 28, padding: '2px 4px' }} />
                  ))}
                  {/* Botão expandir (Gord. Trans + Poliol) */}
                  <div className="flex gap-0.5">
                    <button onClick={() => toggleExpand(ing.id)}
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ background: expandidos.has(ing.id) ? '#fff3e0' : '#f5f5f5',
                               color: expandidos.has(ing.id) ? '#F97316' : '#9aa0a6' }}>
                      {expandidos.has(ing.id) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button onClick={() => delIng(ing.id)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50"
                      style={{ color: '#9aa0a6' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Linha expandida: gorduras trans + poliol */}
                {expandidos.has(ing.id) && (
                  <div className="px-10 py-3 flex flex-wrap gap-4"
                    style={{ background: '#fffbf5', borderBottom: '1px solid #ffe0b2' }}>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold" style={{ color: '#5f6368' }}>
                        Gorduras Trans (g/100{config.unidade}):
                      </label>
                      <input type="number" step="0.01" value={ing.gorduras_trans || ''}
                        onChange={e => setIng(ing.id, 'gorduras_trans', parseFloat(e.target.value) || 0)}
                        className="input text-xs text-right" style={{ width: 80, height: 28, padding: '2px 6px' }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold" style={{ color: '#5f6368' }}>É Poliol?</label>
                      <button onClick={() => setIng(ing.id, 'poliol', !ing.poliol)}
                        className="px-3 py-1 rounded-lg text-xs font-bold"
                        style={ing.poliol
                          ? { background: '#e3f2fd', color: '#1565c0', border: '1px solid #90caf9' }
                          : { background: '#f5f5f5', color: '#9aa0a6', border: '1px solid #e0e0e0' }}>
                        {ing.poliol ? 'Sim' : 'Não'}
                      </button>
                    </div>
                    {ing.poliol && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold" style={{ color: '#5f6368' }}>
                          Fator conversão (kcal/g):
                        </label>
                        <input type="number" step="0.1" value={ing.fator_poliol || ''}
                          onChange={e => setIng(ing.id, 'fator_poliol', parseFloat(e.target.value) || 0)}
                          className="input text-xs text-right" style={{ width: 80, height: 28, padding: '2px 6px' }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Rodapé totais */}
            <div className="px-5 py-2.5 flex items-center justify-between"
              style={{ background: '#fafafa', borderTop: '2px solid #e8eaed' }}>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9aa0a6' }}>
                Total Formulação
              </span>
              <span className="text-sm font-black" style={{ color: '#F97316' }}>
                {somaQtd.toFixed(2)} {config.unidade}
              </span>
            </div>
          </div>

          {/* Info IN 75/2020 */}
          <div className="alert-info flex items-start gap-2">
            <Info size={14} style={{ color: '#1565c0' }} className="mt-0.5 shrink-0" />
            <p className="text-xs" style={{ color: '#1565c0' }}>
              Cálculos conforme <strong>IN 75/2020 ANVISA</strong> — Fatores de Atwater: Carboidratos 4 kcal/g · Proteínas 4 kcal/g · Gorduras 9 kcal/g · Fibras 2 kcal/g. %VD baseado na Tabela II, Anexo III.
              Clique em "Resultado Nutricional" para ver os valores calculados.
            </p>
          </div>
        </div>
      )}

      {/* ══ ABA: RESULTADO NUTRICIONAL ═══════════════════════════════════ */}
      {aba === 'resultado' && (
        <div className="space-y-4">
          {!resultado ? (
            <div className="card text-center py-12" style={{ color: '#9aa0a6' }}>
              <Target size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Preencha os ingredientes na aba Formulação para calcular.</p>
            </div>
          ) : (
            <>
              {/* Resumo do produto */}
              <div className="card" style={{ borderTop: '3px solid #F97316' }}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-black" style={{ color: '#1a1d23' }}>
                      {config.nome_produto || 'Produto sem nome'}
                    </h3>
                    <p className="text-xs" style={{ color: '#9aa0a6' }}>
                      Porção: {config.porcao_ml} {config.unidade} ({config.medida_caseira}) · Rendimento: {config.rendimento} {config.unidade}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAba('tin')} className="btn-ghost text-xs">
                      <FileText size={13} /> Ver Tabela
                    </button>
                    <button onClick={gerarPDF} disabled={!resultado}
                      className="btn-primary text-xs">
                      <Download size={13} /> Exportar PDF
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabela de resultados */}
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="vtable">
                  <thead>
                    <tr>
                      <th>Nutriente</th>
                      <th className="text-right">Por 100 {config.unidade}</th>
                      <th className="text-right" style={{ color: '#F97316' }}>
                        Por {config.porcao_ml} {config.unidade}
                      </th>
                      <th className="text-right">%VD*</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { nome: 'Valor Energético', p100: `${resultado.por_100.valor_energetico_kcal} kcal`, pPorcao: `${resultado.por_porcao.valor_energetico_kcal} kcal`, vd: resultado.vd.valor_energetico, destaque: true },
                      { nome: 'Carboidratos', p100: `${resultado.por_100.carboidratos} g`, pPorcao: `${resultado.por_porcao.carboidratos} g`, vd: resultado.vd.carboidratos },
                      { nome: '  Açúcares Totais', p100: `${resultado.por_100.acucares_totais} g`, pPorcao: `${resultado.por_porcao.acucares_totais} g`, vd: null, sub: true },
                      { nome: '  Açúcares Adicionados', p100: `${resultado.por_100.acucares_adicionados} g`, pPorcao: `${resultado.por_porcao.acucares_adicionados} g`, vd: resultado.vd.acucares_adicionados, sub: true },
                      { nome: 'Proteínas', p100: `${resultado.por_100.proteinas} g`, pPorcao: `${resultado.por_porcao.proteinas} g`, vd: resultado.vd.proteinas },
                      { nome: 'Gorduras Totais', p100: `${resultado.por_100.gorduras_totais} g`, pPorcao: `${resultado.por_porcao.gorduras_totais} g`, vd: resultado.vd.gorduras_totais },
                      { nome: '  Gorduras Saturadas', p100: `${resultado.por_100.gorduras_saturadas} g`, pPorcao: `${resultado.por_porcao.gorduras_saturadas} g`, vd: resultado.vd.gorduras_saturadas, sub: true },
                      { nome: '  Gorduras Trans', p100: `${resultado.por_100.gorduras_trans} g`, pPorcao: `${resultado.por_porcao.gorduras_trans} g`, vd: null, sub: true },
                      { nome: 'Fibras Alimentares', p100: `${resultado.por_100.fibras} g`, pPorcao: `${resultado.por_porcao.fibras} g`, vd: resultado.vd.fibras },
                      { nome: 'Sódio', p100: `${resultado.por_100.sodio} mg`, pPorcao: `${resultado.por_porcao.sodio} mg`, vd: resultado.vd.sodio },
                    ].map(row => (
                      <tr key={row.nome} style={row.destaque ? { background: '#fff9f0' } : row.sub ? { background: '#fdfdfd' } : {}}>
                        <td>
                          <span className={row.destaque ? 'font-bold' : ''} style={{
                            color: row.destaque ? '#e65100' : row.sub ? '#9aa0a6' : '#1a1d23',
                            paddingLeft: row.sub ? 16 : 0,
                          }}>
                            {row.nome}
                          </span>
                        </td>
                        <td className="text-right" style={{ color: '#5f6368' }}>{row.p100}</td>
                        <td className="text-right">
                          <span className={row.destaque ? 'font-black text-base' : 'font-semibold'}
                            style={{ color: row.destaque ? '#F97316' : '#1a1d23' }}>
                            {row.pPorcao}
                          </span>
                        </td>
                        <td className="text-right">
                          {row.vd !== null && row.vd !== undefined
                            ? <span className="font-bold" style={{ color: '#5f6368' }}>{row.vd}%</span>
                            : <span style={{ color: '#9aa0a6' }}>—</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: '#fafafa', borderTop: '2px solid #e8eaed' }}>
                      <td colSpan={4} className="px-4 py-2">
                        <span className="text-xs" style={{ color: '#9aa0a6' }}>
                          *Percentual de valores diários fornecidos pela porção.
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ ABA: TABELA DE INFORMAÇÃO NUTRICIONAL ════════════════════════ */}
      {aba === 'tin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {!resultado ? (
            <div className="card text-center py-12 lg:col-span-2" style={{ color: '#9aa0a6' }}>
              <FileText size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Preencha a formulação para gerar a tabela.</p>
            </div>
          ) : (
            <>
              {/* Preview da TIN — estilo ANVISA */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>
                    Preview — Padrão ANVISA RDC 429/2020
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={copiarTIN} className="btn-ghost text-xs">
                      {copiado ? <><CheckCircle size={13} style={{ color: '#22c55e' }} /> Copiado!</>
                        : <><Copy size={13} /> Copiar TIN</>}
                    </button>
                    <button onClick={gerarPDF} disabled={gerandoPDF || !resultado}
                      className="btn-primary text-xs"
                      style={{ opacity: (!resultado || gerandoPDF) ? .6 : 1 }}>
                      <Download size={13} />
                      {gerandoPDF ? 'Gerando...' : 'Exportar PDF'}
                    </button>
                  </div>
                </div>

                {/* Tabela no estilo visual da ANVISA */}
                <div style={{ border: '2px solid #1a1d23', borderRadius: 4, overflow: 'hidden', maxWidth: 360 }}>
                  <div style={{ background: '#1a1d23', padding: '8px 12px', textAlign: 'center' }}>
                    <p style={{ color: '#fff', fontWeight: 900, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                      Informação Nutricional
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 2 }}>
                      Porção {config.porcao_ml} {config.unidade} ({config.medida_caseira})
                    </p>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr style={{ background: '#f8f8f8', borderBottom: '1px solid #1a1d23' }}>
                        <th style={{ textAlign: 'left', padding: '4px 8px', color: '#1a1d23', fontWeight: 700 }}></th>
                        <th style={{ textAlign: 'right', padding: '4px 6px', color: '#1a1d23', fontWeight: 700 }}>
                          100 {config.unidade}
                        </th>
                        <th style={{ textAlign: 'right', padding: '4px 6px', color: '#F97316', fontWeight: 700 }}>
                          {config.porcao_ml} {config.unidade}
                        </th>
                        <th style={{ textAlign: 'right', padding: '4px 6px', color: '#1a1d23', fontWeight: 700 }}>%VD*</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { nome: 'Valor Energético', v100: `${resultado.por_100.valor_energetico_kcal} kcal`, vPorcao: `${resultado.por_porcao.valor_energetico_kcal} kcal`, vd: `${resultado.vd.valor_energetico}%`, bold: true },
                        { nome: 'Carboidratos', v100: `${resultado.por_100.carboidratos} g`, vPorcao: `${resultado.por_porcao.carboidratos} g`, vd: `${resultado.vd.carboidratos}%` },
                        { nome: 'Açúcares Totais', v100: `${resultado.por_100.acucares_totais} g`, vPorcao: `${resultado.por_porcao.acucares_totais} g`, vd: '—', sub: true },
                        { nome: 'Açúcares Adicionados', v100: `${resultado.por_100.acucares_adicionados} g`, vPorcao: `${resultado.por_porcao.acucares_adicionados} g`, vd: `${resultado.vd.acucares_adicionados}%`, sub: true },
                        { nome: 'Proteínas', v100: `${resultado.por_100.proteinas} g`, vPorcao: `${resultado.por_porcao.proteinas} g`, vd: `${resultado.vd.proteinas}%` },
                        { nome: 'Gorduras Totais', v100: `${resultado.por_100.gorduras_totais} g`, vPorcao: `${resultado.por_porcao.gorduras_totais} g`, vd: `${resultado.vd.gorduras_totais}%` },
                        { nome: 'Gorduras Saturadas', v100: `${resultado.por_100.gorduras_saturadas} g`, vPorcao: `${resultado.por_porcao.gorduras_saturadas} g`, vd: `${resultado.vd.gorduras_saturadas}%`, sub: true },
                        { nome: 'Gorduras Trans', v100: `${resultado.por_100.gorduras_trans} g`, vPorcao: `${resultado.por_porcao.gorduras_trans} g`, vd: '—', sub: true },
                        { nome: 'Fibras Alimentares', v100: `${resultado.por_100.fibras} g`, vPorcao: `${resultado.por_porcao.fibras} g`, vd: `${resultado.vd.fibras}%` },
                        { nome: 'Sódio', v100: `${resultado.por_100.sodio} mg`, vPorcao: `${resultado.por_porcao.sodio} mg`, vd: `${resultado.vd.sodio}%` },
                      ].map((row, i) => (
                        <tr key={row.nome} style={{ borderBottom: '1px solid #e8eaed', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '4px 8px', color: '#1a1d23', fontWeight: row.bold ? 700 : 400, paddingLeft: row.sub ? 20 : 8, fontSize: row.sub ? 10 : 11 }}>
                            {row.nome}
                          </td>
                          <td style={{ textAlign: 'right', padding: '4px 6px', color: '#5f6368' }}>{row.v100}</td>
                          <td style={{ textAlign: 'right', padding: '4px 6px', color: '#1a1d23', fontWeight: row.bold ? 700 : 400 }}>{row.vPorcao}</td>
                          <td style={{ textAlign: 'right', padding: '4px 6px', color: '#9aa0a6' }}>{row.vd}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: '#f8f8f8', borderTop: '1px solid #1a1d23' }}>
                        <td colSpan={4} style={{ padding: '5px 8px', fontSize: 10, color: '#5f6368' }}>
                          *% Valores Diários com base em uma dieta de 2.000 kcal ou 8.400 kJ. Seus valores diários podem ser maiores ou menores dependendo de suas necessidades energéticas.
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Formato linear (para embalagens pequenas) */}
              <div className="card">
                <h3 className="text-sm font-bold mb-3" style={{ color: '#1a1d23' }}>
                  Formato Linear — Embalagens Pequenas
                </h3>
                <div className="p-4 rounded-xl text-xs" style={{ background: '#f8f8f8', border: '1px solid #e8eaed', lineHeight: 1.7, color: '#1a1d23' }}>
                  <strong>INFORMAÇÃO NUTRICIONAL</strong> Porção {config.porcao_ml} {config.unidade} ({config.medida_caseira}): Por 100 {config.unidade} ({config.porcao_ml} {config.unidade}, %VD*): Valor energético {resultado.por_100.valor_energetico_kcal} kcal ({resultado.por_porcao.valor_energetico_kcal} kcal, {resultado.vd.valor_energetico}%) ▪ Carboidratos {resultado.por_100.carboidratos} g ({resultado.por_porcao.carboidratos} g, {resultado.vd.carboidratos}%), dos quais Açúcares totais {resultado.por_100.acucares_totais} g ({resultado.por_porcao.acucares_totais} g), Açúcares adicionados {resultado.por_100.acucares_adicionados} g ({resultado.por_porcao.acucares_adicionados} g, {resultado.vd.acucares_adicionados}%) ▪ Proteínas {resultado.por_100.proteinas} g ({resultado.por_porcao.proteinas} g, {resultado.vd.proteinas}%) ▪ Gorduras totais {resultado.por_100.gorduras_totais} g ({resultado.por_porcao.gorduras_totais} g, {resultado.vd.gorduras_totais}%), das quais Gorduras saturadas {resultado.por_100.gorduras_saturadas} g ({resultado.por_porcao.gorduras_saturadas} g, {resultado.vd.gorduras_saturadas}%), Gorduras trans {resultado.por_100.gorduras_trans} g ({resultado.por_porcao.gorduras_trans} g) ▪ Fibras alimentares {resultado.por_100.fibras} g ({resultado.por_porcao.fibras} g, {resultado.vd.fibras}%) ▪ Sódio {resultado.por_100.sodio} mg ({resultado.por_porcao.sodio} mg, {resultado.vd.sodio}%). *Percentual de valores diários fornecidos pela porção.
                </div>

                {/* Alertas nutricionais FOP */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold mb-2" style={{ color: '#5f6368' }}>
                    Rotulagem Nutricional Frontal (FOP) — IN 429/2020
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { nome: 'Açúcares Adicionados', val: resultado.por_porcao.acucares_adicionados, limite: 15, unidade: 'g' },
                      { nome: 'Gorduras Saturadas',   val: resultado.por_porcao.gorduras_saturadas,   limite: 6,  unidade: 'g' },
                      { nome: 'Sódio',                val: resultado.por_porcao.sodio,                limite: 600,unidade: 'mg' },
                    ].map(alerta => (
                      <div key={alerta.nome} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                        style={alerta.val > alerta.limite
                          ? { background: '#fce4ec', border: '1px solid #f48fb1' }
                          : { background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
                        {alerta.val > alerta.limite
                          ? <span style={{ fontSize: 14 }}>⚠️</span>
                          : <CheckCircle size={14} style={{ color: '#2e7d32' }} />}
                        <div>
                          <p className="text-xs font-bold" style={{ color: alerta.val > alerta.limite ? '#c62828' : '#2e7d32' }}>
                            {alerta.nome}
                          </p>
                          <p className="text-xs" style={{ color: '#5f6368' }}>
                            {alerta.val} {alerta.unidade} / porção
                            {alerta.val > alerta.limite
                              ? ' — ALTO: Ícone de lupa obrigatório'
                              : ' — Dentro do limite'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
