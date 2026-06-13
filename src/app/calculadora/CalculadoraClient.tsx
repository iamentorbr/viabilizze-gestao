'use client'
import { useState, useCallback, useMemo } from 'react'
import {
  FlaskConical, Plus, Trash2, Download, Save, RefreshCw,
  AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp,
  Beaker, Calculator, Target, ClipboardList, Copy
} from 'lucide-react'

// ─── TIPOS ───────────────────────────────────────────────────────────────────
type Ingrediente = {
  id: string
  nome: string
  formulacaoPor1000L: number | 'QSP'
  unidade: string
  categoria: 'polpa' | 'acucar' | 'acido' | 'conservante' | 'espessante' | 'corante' | 'aroma' | 'agua' | 'outro'
  custo?: number
}

type Parametro = {
  nome: string
  unidade: string
  minimo: number
  maximo: number
  ideal: number
  medido?: number
}

type Formula = {
  id: string
  nome: string
  sabor: string
  volumeBase: number
  rendimento: number
  ingredientes: Ingrediente[]
  parametros: Parametro[]
  observacoes?: string
}

// ─── DADOS INICIAIS (da planilha VIABILIZZE) ──────────────────────────────────
const FORMULAS_INICIAIS: Formula[] = [
  {
    id: 'goiaba',
    nome: 'Néctar de Goiaba',
    sabor: 'GOIABA',
    volumeBase: 1000,
    rendimento: 80,
    ingredientes: [
      { id: '1', nome: 'Suco Concentrado de Goiaba 15°Brix', formulacaoPor1000L: 214, unidade: 'kg', categoria: 'polpa' },
      { id: '2', nome: 'Açúcar Líquido 76°Brix', formulacaoPor1000L: 112.8, unidade: 'kg', categoria: 'acucar' },
      { id: '3', nome: 'Aroma Natural de Goiaba (Dolher)', formulacaoPor1000L: 0.6, unidade: 'kg', categoria: 'aroma' },
      { id: '4', nome: 'Ácido Cítrico', formulacaoPor1000L: 1.6, unidade: 'kg', categoria: 'acido' },
      { id: '5', nome: 'Goma Xantana', formulacaoPor1000L: 0.5, unidade: 'kg', categoria: 'espessante' },
      { id: '6', nome: 'Corante Carmim 3%', formulacaoPor1000L: 0.02, unidade: 'kg', categoria: 'corante' },
      { id: '7', nome: 'Ácido Ascórbico', formulacaoPor1000L: 0.2, unidade: 'kg', categoria: 'conservante' },
      { id: '8', nome: 'Água Carbonatada', formulacaoPor1000L: 'QSP', unidade: 'L', categoria: 'agua' },
    ],
    parametros: [
      { nome: 'Brix', unidade: '°Brix', minimo: 12.1, maximo: 12.4, ideal: 12.32 },
      { nome: 'Acidez', unidade: '%', minimo: 0.32, maximo: 0.35, ideal: 0.31 },
      { nome: 'pH', unidade: '', minimo: 3.2, maximo: 3.8, ideal: 3.52 },
    ],
    observacoes: 'Formulação base 1000L — VIABILIZZE. Verificar Brix antes do fechamento.',
  },
  {
    id: 'manga',
    nome: 'Néctar de Manga',
    sabor: 'MANGA',
    volumeBase: 1000,
    rendimento: 80,
    ingredientes: [
      { id: '1', nome: 'Suco Concentrado de Manga 28°Brix', formulacaoPor1000L: 157, unidade: 'kg', categoria: 'polpa' },
      { id: '2', nome: 'Açúcar Líquido 76°Brix', formulacaoPor1000L: 127, unidade: 'kg', categoria: 'acucar' },
      { id: '3', nome: 'Aroma Natural de Manga (Dolher)', formulacaoPor1000L: 1, unidade: 'kg', categoria: 'aroma' },
      { id: '4', nome: 'Ácido Cítrico', formulacaoPor1000L: 1.75, unidade: 'kg', categoria: 'acido' },
      { id: '5', nome: 'Goma Xantana', formulacaoPor1000L: 1, unidade: 'kg', categoria: 'espessante' },
      { id: '6', nome: 'Corante Betacaroteno 10%', formulacaoPor1000L: 0.04, unidade: 'kg', categoria: 'corante' },
      { id: '7', nome: 'Ácido Ascórbico', formulacaoPor1000L: 0.15, unidade: 'kg', categoria: 'conservante' },
      { id: '8', nome: 'Água Carbonatada', formulacaoPor1000L: 'QSP', unidade: 'L', categoria: 'agua' },
    ],
    parametros: [
      { nome: 'Brix', unidade: '°Brix', minimo: 13.1, maximo: 13.3, ideal: 13.26 },
      { nome: 'Acidez', unidade: '%', minimo: 0.30, maximo: 0.35, ideal: 0.29 },
      { nome: 'pH', unidade: '', minimo: 3.4, maximo: 3.55, ideal: 3.52 },
    ],
    observacoes: 'Formulação base 1000L — VIABILIZZE.',
  },
  {
    id: 'caju',
    nome: 'Néctar de Caju',
    sabor: 'CAJU',
    volumeBase: 1000,
    rendimento: 80,
    ingredientes: [
      { id: '1', nome: 'Suco Concentrado de Caju 28°Brix', formulacaoPor1000L: 78.6, unidade: 'kg', categoria: 'polpa' },
      { id: '2', nome: 'Açúcar Líquido 76°Brix', formulacaoPor1000L: 122, unidade: 'kg', categoria: 'acucar' },
      { id: '3', nome: 'Aroma Natural de Caju (Robertet)', formulacaoPor1000L: 0.5, unidade: 'kg', categoria: 'aroma' },
      { id: '4', nome: 'Ácido Cítrico', formulacaoPor1000L: 1.16, unidade: 'kg', categoria: 'acido' },
      { id: '5', nome: 'Goma Xantana', formulacaoPor1000L: 0.2, unidade: 'kg', categoria: 'espessante' },
      { id: '6', nome: 'Ácido Ascórbico', formulacaoPor1000L: 0.15, unidade: 'kg', categoria: 'conservante' },
      { id: '7', nome: 'Água Carbonatada', formulacaoPor1000L: 'QSP', unidade: 'L', categoria: 'agua' },
    ],
    parametros: [
      { nome: 'Brix', unidade: '°Brix', minimo: 11.45, maximo: 11.65, ideal: 11.55 },
      { nome: 'Acidez', unidade: '%', minimo: 0.24, maximo: 0.28, ideal: 0.26 },
      { nome: 'pH', unidade: '', minimo: 3.1, maximo: 3.45, ideal: 3.28 },
    ],
    observacoes: 'Formulação base 1000L — VIABILIZZE.',
  },
  {
    id: 'laranja',
    nome: 'Néctar de Laranja',
    sabor: 'LARANJA',
    volumeBase: 1000,
    rendimento: 80,
    ingredientes: [
      { id: '1', nome: 'Suco Concentrado de Laranja 28°Brix', formulacaoPor1000L: 78.6, unidade: 'kg', categoria: 'polpa' },
      { id: '2', nome: 'Açúcar Líquido 76°Brix', formulacaoPor1000L: 122, unidade: 'kg', categoria: 'acucar' },
      { id: '3', nome: 'Aroma Natural de Laranja', formulacaoPor1000L: 0.5, unidade: 'kg', categoria: 'aroma' },
      { id: '4', nome: 'Ácido Cítrico', formulacaoPor1000L: 1.16, unidade: 'kg', categoria: 'acido' },
      { id: '5', nome: 'Goma Xantana', formulacaoPor1000L: 0.2, unidade: 'kg', categoria: 'espessante' },
      { id: '6', nome: 'Ácido Ascórbico', formulacaoPor1000L: 0.15, unidade: 'kg', categoria: 'conservante' },
      { id: '7', nome: 'Água Carbonatada', formulacaoPor1000L: 'QSP', unidade: 'L', categoria: 'agua' },
    ],
    parametros: [
      { nome: 'Brix', unidade: '°Brix', minimo: 11.45, maximo: 11.65, ideal: 11.55 },
      { nome: 'Acidez', unidade: '%', minimo: 0.24, maximo: 0.28, ideal: 0.26 },
      { nome: 'pH', unidade: '', minimo: 3.1, maximo: 3.45, ideal: 3.28 },
    ],
  },
]

// ─── CORES POR CATEGORIA ──────────────────────────────────────────────────────
const CAT_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  polpa:       { bg: '#fff3e0', color: '#e65100', label: 'Polpa/Suco' },
  acucar:      { bg: '#fce4ec', color: '#c62828', label: 'Açúcar' },
  acido:       { bg: '#e8f5e9', color: '#2e7d32', label: 'Ácido' },
  conservante: { bg: '#e3f2fd', color: '#1565c0', label: 'Conservante' },
  espessante:  { bg: '#f3e5f5', color: '#6a1b9a', label: 'Espessante' },
  corante:     { bg: '#fce4ec', color: '#880e4f', label: 'Corante' },
  aroma:       { bg: '#e0f2f1', color: '#004d40', label: 'Aroma' },
  agua:        { bg: '#e3f2fd', color: '#0d47a1', label: 'Água/Veículo' },
  outro:       { bg: '#f5f5f5', color: '#424242', label: 'Outro' },
}

const ID = () => Math.random().toString(36).slice(2, 9)

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function CalculadoraClient() {
  const [formulas, setFormulas] = useState<Formula[]>(FORMULAS_INICIAIS)
  const [formulaSelecionada, setFormulaSelecionada] = useState<string>('goiaba')
  const [volumeProduzir, setVolumeProduzir] = useState<number>(12000)
  const [usarRendimento, setUsarRendimento] = useState<boolean>(true)
  const [medidos, setMedidos] = useState<Record<string, number>>({})
  const [abaAtiva, setAbaAtiva] = useState<'calculo' | 'parametros' | 'formula'>('calculo')
  const [expandido, setExpandido] = useState<boolean>(true)
  const [copiado, setCopiado] = useState(false)

  const formula = formulas.find(f => f.id === formulaSelecionada)!

  // ─── CÁLCULOS CORE ────────────────────────────────────────────────────────
  const calcular = useCallback((ing: Ingrediente, volume: number, rendimento: number, usarRend: boolean) => {
    if (ing.formulacaoPor1000L === 'QSP') return null
    const fator = volume / 1000
    const qtdTotal = ing.formulacaoPor1000L * fator
    const qtdRendimento = usarRend ? qtdTotal * (rendimento / 100) : qtdTotal
    return { qtdTotal, qtdRendimento, fator }
  }, [])

  const resultados = useMemo(() => {
    if (!formula) return []
    return formula.ingredientes.map(ing => ({
      ...ing,
      calc: calcular(ing, volumeProduzir, formula.rendimento, usarRendimento),
    }))
  }, [formula, volumeProduzir, usarRendimento, calcular])

  const custosTotal = useMemo(() => {
    return resultados.reduce((sum, r) => {
      if (!r.calc || !r.custo) return sum
      const qty = usarRendimento ? r.calc.qtdRendimento : r.calc.qtdTotal
      return sum + qty * r.custo
    }, 0)
  }, [resultados, usarRendimento])

  // ─── STATUS DOS PARÂMETROS ────────────────────────────────────────────────
  const getParamStatus = (p: Parametro, valor?: number) => {
    if (valor === undefined) return 'sem-medicao'
    if (valor < p.minimo || valor > p.maximo) return 'fora'
    if (Math.abs(valor - p.ideal) <= (p.maximo - p.minimo) * 0.15) return 'ideal'
    return 'ok'
  }

  // ─── GERAR TEXTO PARA COPIAR ──────────────────────────────────────────────
  const gerarTextoOrdem = () => {
    if (!formula) return ''
    const linhas = [
      `ORDEM DE PRODUÇÃO — ${formula.nome.toUpperCase()}`,
      `Volume: ${volumeProduzir.toLocaleString('pt-BR')} L`,
      usarRendimento ? `Rendimento: ${formula.rendimento}% → ${(volumeProduzir * formula.rendimento / 100).toLocaleString('pt-BR')} L úteis` : '',
      `Data: ${new Date().toLocaleDateString('pt-BR')}`,
      '─'.repeat(40),
      'INSUMOS:',
      ...resultados.map(r => {
        if (!r.calc) return `  ${r.nome}: QSP`
        const qty = usarRendimento ? r.calc.qtdRendimento : r.calc.qtdTotal
        return `  ${r.nome}: ${qty.toFixed(3)} ${r.unidade}`
      }),
      '─'.repeat(40),
      'PARÂMETROS DE CONTROLE:',
      ...formula.parametros.map(p =>
        `  ${p.nome}: Min ${p.minimo} | Ideal ${p.ideal} | Max ${p.maximo} ${p.unidade}`
      ),
      formula.observacoes ? `\nObs: ${formula.observacoes}` : '',
    ].filter(Boolean)
    return linhas.join('\n')
  }

  const copiarOrdem = () => {
    navigator.clipboard.writeText(gerarTextoOrdem())
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // ─── EDITAR INGREDIENTE ────────────────────────────────────────────────────
  const editarIngrediente = (formulaId: string, ingId: string, campo: keyof Ingrediente, valor: any) => {
    setFormulas(prev => prev.map(f => f.id === formulaId ? {
      ...f,
      ingredientes: f.ingredientes.map(i => i.id === ingId ? { ...i, [campo]: valor } : i)
    } : f))
  }

  const adicionarIngrediente = (formulaId: string) => {
    const novo: Ingrediente = {
      id: ID(), nome: 'Novo Ingrediente', formulacaoPor1000L: 0,
      unidade: 'kg', categoria: 'outro',
    }
    setFormulas(prev => prev.map(f => f.id === formulaId ? {
      ...f, ingredientes: [...f.ingredientes, novo]
    } : f))
  }

  const removerIngrediente = (formulaId: string, ingId: string) => {
    setFormulas(prev => prev.map(f => f.id === formulaId ? {
      ...f, ingredientes: f.ingredientes.filter(i => i.id !== ingId)
    } : f))
  }

  const adicionarFormula = () => {
    const nova: Formula = {
      id: ID(),
      nome: 'Nova Fórmula',
      sabor: 'NOVO',
      volumeBase: 1000,
      rendimento: 80,
      ingredientes: [
        { id: ID(), nome: 'Ingrediente 1', formulacaoPor1000L: 0, unidade: 'kg', categoria: 'polpa' },
        { id: ID(), nome: 'Água Carbonatada', formulacaoPor1000L: 'QSP', unidade: 'L', categoria: 'agua' },
      ],
      parametros: [
        { nome: 'Brix', unidade: '°Brix', minimo: 10, maximo: 14, ideal: 12 },
        { nome: 'Acidez', unidade: '%', minimo: 0.2, maximo: 0.4, ideal: 0.3 },
        { nome: 'pH', unidade: '', minimo: 3.0, maximo: 4.0, ideal: 3.5 },
      ],
    }
    setFormulas(prev => [...prev, nova])
    setFormulaSelecionada(nova.id)
  }

  if (!formula) return null

  const volumeUtil = volumeProduzir * (formula.rendimento / 100)

  return (
    <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* ─── SELETOR DE FÓRMULA + VOLUME ─────────────────────────────────── */}
      <div className="card">
        <div className="flex flex-wrap items-end gap-4">

          {/* Seletor */}
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
              Fórmula / Sabor
            </label>
            <div className="flex gap-2">
              <select
                value={formulaSelecionada}
                onChange={e => setFormulaSelecionada(e.target.value)}
                className="input flex-1"
                style={{ fontWeight: 600 }}
              >
                {formulas.map(f => (
                  <option key={f.id} value={f.id}>{f.nome}</option>
                ))}
              </select>
              <button onClick={adicionarFormula}
                className="btn-ghost px-3" title="Nova fórmula" style={{ flexShrink: 0 }}>
                <Plus size={15} />
              </button>
            </div>
          </div>

          {/* Volume a produzir */}
          <div style={{ minWidth: 180 }}>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
              Volume a Produzir (L)
            </label>
            <input
              type="number"
              value={volumeProduzir}
              min={1}
              step={100}
              onChange={e => setVolumeProduzir(Math.max(1, Number(e.target.value)))}
              className="input"
              style={{ fontWeight: 700, fontSize: 16 }}
            />
          </div>

          {/* Toggle rendimento */}
          <div style={{ minWidth: 200 }}>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
              Margem de Rendimento
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUsarRendimento(r => !r)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: usarRendimento ? '#fff3e0' : '#f5f5f5',
                  border: `1px solid ${usarRendimento ? '#F97316' : '#dadce0'}`,
                  color: usarRendimento ? '#F97316' : '#757575',
                }}
              >
                <span className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  style={{ borderColor: usarRendimento ? '#F97316' : '#bbb' }}>
                  {usarRendimento && <span className="w-2 h-2 rounded-full" style={{ background: '#F97316' }} />}
                </span>
                {formula.rendimento}% de segurança
              </button>
              {usarRendimento && (
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: '#fff3e0', color: '#e65100' }}>
                  → {volumeUtil.toLocaleString('pt-BR')} L úteis
                </span>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 ml-auto">
            <button onClick={copiarOrdem} className="btn-ghost text-xs">
              {copiado ? <><CheckCircle size={13} style={{ color: '#22c55e' }} /> Copiado!</> : <><Copy size={13} /> Copiar Ordem</>}
            </button>
            <button className="btn-primary text-xs">
              <Save size={13} /> Salvar Fórmula
            </button>
          </div>
        </div>
      </div>

      {/* ─── ABAS ────────────────────────────────────────────────────────── */}
      <div className="flex gap-0 rounded-xl overflow-hidden" style={{ border: '1px solid #e8eaed', background: '#fff', width: 'fit-content' }}>
        {([
          { id: 'calculo', label: 'Cálculo de Insumos', icon: Calculator },
          { id: 'parametros', label: 'Parâmetros de Controle', icon: Target },
          { id: 'formula', label: 'Editar Fórmula', icon: FlaskConical },
        ] as const).map(aba => (
          <button key={aba.id} onClick={() => setAbaAtiva(aba.id)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all"
            style={abaAtiva === aba.id
              ? { background: '#F97316', color: '#fff' }
              : { color: '#5f6368', background: 'transparent' }}>
            <aba.icon size={14} />
            {aba.label}
          </button>
        ))}
      </div>

      {/* ─── ABA: CÁLCULO DE INSUMOS ─────────────────────────────────────── */}
      {abaAtiva === 'calculo' && (
        <div className="space-y-4">

          {/* Cards de resumo rápido */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: 'Volume Total',
                value: `${volumeProduzir.toLocaleString('pt-BR')} L`,
                sub: 'a produzir',
                bg: '#fff3e0', color: '#F97316',
              },
              {
                label: 'Volume Útil',
                value: `${(usarRendimento ? volumeUtil : volumeProduzir).toLocaleString('pt-BR')} L`,
                sub: usarRendimento ? `${formula.rendimento}% rendimento` : '100% (sem margem)',
                bg: '#e8f5e9', color: '#2e7d32',
              },
              {
                label: 'Ingredientes',
                value: `${formula.ingredientes.filter(i => i.formulacaoPor1000L !== 'QSP').length}`,
                sub: `+ ${formula.ingredientes.filter(i => i.formulacaoPor1000L === 'QSP').length} QSP`,
                bg: '#e3f2fd', color: '#1565c0',
              },
              {
                label: 'Fator de Escala',
                value: `${(volumeProduzir / formula.volumeBase).toFixed(2)}×`,
                sub: `base ${formula.volumeBase.toLocaleString('pt-BR')} L`,
                bg: '#f3e5f5', color: '#6a1b9a',
              },
            ].map(c => (
              <div key={c.label} className="card card-sm" style={{ borderTop: `3px solid ${c.color}` }}>
                <p className="text-xs font-medium mb-1" style={{ color: '#9aa0a6' }}>{c.label}</p>
                <p className="text-xl font-black" style={{ color: c.color }}>{c.value}</p>
                <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Tabela principal de cálculo */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3.5 flex items-center gap-3" style={{ borderBottom: '2px solid #e8eaed' }}>
              <div className="stat-icon" style={{ background: '#fff3e0', width: 30, height: 30, borderRadius: 8 }}>
                <Beaker size={15} style={{ color: '#F97316' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>{formula.nome}</h3>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Formulação base {formula.volumeBase.toLocaleString('pt-BR')} L</p>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{ background: '#fff3e0', color: '#e65100' }}>
                  Escala: {(volumeProduzir / formula.volumeBase).toFixed(2)}×
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="vtable">
                <thead>
                  <tr>
                    <th style={{ width: 28 }}>#</th>
                    <th>Ingrediente</th>
                    <th>Categoria</th>
                    <th className="text-right">Base / 1000 L</th>
                    <th className="text-right" style={{ color: '#1a1d23' }}>
                      Qtd. Total ({volumeProduzir.toLocaleString('pt-BR')} L)
                    </th>
                    <th className="text-right" style={{ color: '#F97316' }}>
                      Qtd. {formula.rendimento}% ({usarRendimento ? volumeUtil.toLocaleString('pt-BR') : volumeProduzir.toLocaleString('pt-BR')} L)
                    </th>
                    <th>Unid.</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map((r, idx) => {
                    const cat = CAT_STYLE[r.categoria]
                    const isQSP = r.formulacaoPor1000L === 'QSP'
                    return (
                      <tr key={r.id} style={isQSP ? { background: '#fafafa' } : {}}>
                        <td>
                          <span className="text-xs font-mono" style={{ color: '#bbb' }}>{String(idx + 1).padStart(2, '0')}</span>
                        </td>
                        <td>
                          <span className="font-semibold text-sm" style={{ color: '#1a1d23' }}>{r.nome}</span>
                        </td>
                        <td>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: cat.bg, color: cat.color }}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="text-right">
                          {isQSP
                            ? <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: '#e3f2fd', color: '#1565c0' }}>QSP</span>
                            : <span style={{ color: '#5f6368' }}>{r.formulacaoPor1000L} {r.unidade}</span>
                          }
                        </td>
                        <td className="text-right">
                          {r.calc
                            ? <span className="font-bold" style={{ color: '#1a1d23' }}>
                                {r.calc.qtdTotal.toFixed(3)}
                              </span>
                            : <span style={{ color: '#9aa0a6' }}>—</span>
                          }
                        </td>
                        <td className="text-right">
                          {r.calc
                            ? (
                              <div className="flex items-center justify-end gap-2">
                                <span className="font-black text-base" style={{ color: '#F97316' }}>
                                  {(usarRendimento ? r.calc.qtdRendimento : r.calc.qtdTotal).toFixed(3)}
                                </span>
                              </div>
                            )
                            : <span className="text-xs font-semibold" style={{ color: '#0d47a1' }}>QSP</span>
                          }
                        </td>
                        <td>
                          <span className="text-xs font-semibold" style={{ color: '#9aa0a6' }}>{r.unidade}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                {/* Totalizador por categoria */}
                <tfoot>
                  <tr style={{ borderTop: '2px solid #e8eaed', background: '#fafafa' }}>
                    <td colSpan={4} className="py-3 px-4">
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#9aa0a6' }}>
                        Totais por categoria
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-sm font-black" style={{ color: '#1a1d23' }}>
                        {resultados.reduce((s, r) => s + (r.calc?.qtdTotal ?? 0), 0).toFixed(2)} kg
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      <span className="text-sm font-black" style={{ color: '#F97316' }}>
                        {resultados.reduce((s, r) => s + ((usarRendimento ? r.calc?.qtdRendimento : r.calc?.qtdTotal) ?? 0), 0).toFixed(2)} kg
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Resumo por categoria */}
          <div className="card">
            <h3 className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#9aa0a6' }}>
              Distribuição por Categoria
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                resultados.filter(r => r.calc).reduce((acc, r) => {
                  const k = r.categoria
                  if (!acc[k]) acc[k] = 0
                  acc[k] += (usarRendimento ? r.calc!.qtdRendimento : r.calc!.qtdTotal)
                  return acc
                }, {} as Record<string, number>)
              ).sort((a, b) => b[1] - a[1]).map(([cat, total]) => {
                const c = CAT_STYLE[cat]
                return (
                  <div key={cat} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: c.bg, border: `1px solid ${c.color}30` }}>
                    <span className="text-xs font-semibold" style={{ color: c.color }}>{c.label}</span>
                    <span className="text-xs font-black" style={{ color: '#1a1d23' }}>{total.toFixed(2)} kg</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Observações */}
          {formula.observacoes && (
            <div className="alert-info flex items-start gap-3">
              <Info size={15} style={{ color: '#1565c0' }} className="mt-0.5 shrink-0" />
              <p className="text-sm" style={{ color: '#1565c0' }}>{formula.observacoes}</p>
            </div>
          )}
        </div>
      )}

      {/* ─── ABA: PARÂMETROS DE CONTROLE ────────────────────────────────── */}
      {abaAtiva === 'parametros' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon" style={{ background: '#e8f5e9', width: 30, height: 30, borderRadius: 8 }}>
                <Target size={15} style={{ color: '#2e7d32' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Parâmetros de Controle de Qualidade</h3>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Insira os valores medidos para verificar conformidade — {formula.nome}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formula.parametros.map((p, idx) => {
                const valor = medidos[`${formulaSelecionada}-${idx}`]
                const status = getParamStatus(p, valor)
                const pct = valor !== undefined
                  ? Math.max(0, Math.min(100, ((valor - p.minimo) / (p.maximo - p.minimo)) * 100))
                  : null

                const statusStyle = {
                  'sem-medicao': { bg: '#f5f5f5', border: '#e0e0e0', color: '#757575', icon: null, label: 'Aguardando medição' },
                  'fora':  { bg: '#fce4ec', border: '#f48fb1', color: '#c62828', icon: <AlertTriangle size={14} />, label: 'Fora da especificação' },
                  'ok':    { bg: '#e8f5e9', border: '#a5d6a7', color: '#2e7d32', icon: <CheckCircle size={14} />, label: 'Dentro do padrão' },
                  'ideal': { bg: '#fff3e0', border: '#F97316', color: '#e65100', icon: <CheckCircle size={14} />, label: '⭐ Ponto ideal!' },
                }[status]

                return (
                  <div key={p.nome} className="rounded-xl p-4" style={{
                    background: statusStyle.bg,
                    border: `1.5px solid ${statusStyle.border}`,
                  }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold" style={{ color: '#1a1d23' }}>{p.nome}</h4>
                      {statusStyle.icon && (
                        <span style={{ color: statusStyle.color }}>{statusStyle.icon}</span>
                      )}
                    </div>

                    {/* Faixa visual */}
                    <div className="mb-3">
                      <div className="relative h-3 rounded-full" style={{ background: '#e8eaed' }}>
                        {/* Zona OK */}
                        <div className="absolute h-3 rounded-full" style={{
                          background: '#bbf7d0',
                          left: '10%', right: '10%',
                        }} />
                        {/* Marcador ideal */}
                        <div className="absolute h-5 w-0.5 -top-1 rounded-full" style={{
                          background: '#F97316',
                          left: `${((p.ideal - p.minimo) / (p.maximo - p.minimo) * 80 + 10)}%`,
                        }} />
                        {/* Marcador medido */}
                        {pct !== null && (
                          <div className="absolute w-4 h-4 rounded-full -top-0.5 border-2 border-white shadow"
                            style={{
                              background: statusStyle.color,
                              left: `calc(${Math.max(5, Math.min(95, pct * 0.8 + 10))}% - 8px)`,
                              transition: 'left 0.3s ease',
                            }} />
                        )}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs" style={{ color: '#9aa0a6' }}>Mín: {p.minimo}</span>
                        <span className="text-xs font-semibold" style={{ color: '#F97316' }}>Ideal: {p.ideal}</span>
                        <span className="text-xs" style={{ color: '#9aa0a6' }}>Máx: {p.maximo}</span>
                      </div>
                    </div>

                    {/* Input de medição */}
                    <div>
                      <label className="text-xs font-semibold block mb-1" style={{ color: '#5f6368' }}>
                        Valor Medido {p.unidade && `(${p.unidade})`}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder={`Ex: ${p.ideal}`}
                        value={valor ?? ''}
                        onChange={e => setMedidos(prev => ({
                          ...prev,
                          [`${formulaSelecionada}-${idx}`]: parseFloat(e.target.value),
                        }))}
                        className="input"
                        style={{
                          background: 'rgba(255,255,255,0.8)',
                          borderColor: statusStyle.border,
                          fontWeight: 700,
                          fontSize: 15,
                        }}
                      />
                    </div>

                    {valor !== undefined && (
                      <p className="text-xs font-semibold mt-2 flex items-center gap-1" style={{ color: statusStyle.color }}>
                        {statusStyle.label}
                        {status === 'fora' && (
                          <span className="ml-1">
                            ({valor < p.minimo ? `abaixo em ${(p.minimo - valor).toFixed(2)}` : `acima em ${(valor - p.maximo).toFixed(2)}`})
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4" style={{ borderTop: '1px solid #e8eaed' }}>
              {[
                { color: '#bbf7d0', label: 'Zona de aprovação' },
                { color: '#F97316', label: 'Ponto ideal' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <span className="w-4 h-2.5 rounded" style={{ background: l.color }} />
                  <span className="text-xs" style={{ color: '#9aa0a6' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist de aprovação */}
          <div className="card">
            <h3 className="text-sm font-bold mb-3" style={{ color: '#1a1d23' }}>
              Status de Aprovação do Lote
            </h3>
            <div className="space-y-2">
              {formula.parametros.map((p, idx) => {
                const valor = medidos[`${formulaSelecionada}-${idx}`]
                const status = getParamStatus(p, valor)
                return (
                  <div key={p.nome} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: '#fafafa', border: '1px solid #f0f2f5' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: status === 'sem-medicao' ? '#e8eaed' :
                          status === 'fora' ? '#fce4ec' : '#e8f5e9',
                      }}>
                      {status === 'sem-medicao' && <span className="w-2 h-2 rounded-full" style={{ background: '#bbb' }} />}
                      {status === 'fora' && <AlertTriangle size={12} style={{ color: '#c62828' }} />}
                      {(status === 'ok' || status === 'ideal') && <CheckCircle size={12} style={{ color: '#2e7d32' }} />}
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: '#1a1d23' }}>
                      {p.nome} {p.unidade && `(${p.unidade})`}
                    </span>
                    <span className="text-sm font-bold" style={{ color: '#1a1d23' }}>
                      {valor !== undefined ? `${valor} ${p.unidade}` : '—'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: status === 'sem-medicao' ? '#f5f5f5' :
                          status === 'fora' ? '#fce4ec' :
                          status === 'ideal' ? '#fff3e0' : '#e8f5e9',
                        color: status === 'sem-medicao' ? '#757575' :
                          status === 'fora' ? '#c62828' :
                          status === 'ideal' ? '#e65100' : '#2e7d32',
                        fontWeight: 600,
                      }}>
                      {status === 'sem-medicao' ? 'Não medido' :
                        status === 'fora' ? 'Reprovado' :
                        status === 'ideal' ? '⭐ Ideal' : 'Aprovado'}
                    </span>
                  </div>
                )
              })}

              {/* Veredito final */}
              {formula.parametros.every((_, idx) => medidos[`${formulaSelecionada}-${idx}`] !== undefined) && (
                <div className={`mt-3 p-4 rounded-xl flex items-center gap-3 ${
                  formula.parametros.every((p, idx) => getParamStatus(p, medidos[`${formulaSelecionada}-${idx}`]) !== 'fora')
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  {formula.parametros.every((p, idx) => getParamStatus(p, medidos[`${formulaSelecionada}-${idx}`]) !== 'fora')
                    ? <><CheckCircle size={20} style={{ color: '#2e7d32' }} /><div><p className="text-sm font-bold" style={{ color: '#2e7d32' }}>LOTE APROVADO ✓</p><p className="text-xs" style={{ color: '#5f6368' }}>Todos os parâmetros dentro da especificação.</p></div></>
                    : <><AlertTriangle size={20} style={{ color: '#c62828' }} /><div><p className="text-sm font-bold" style={{ color: '#c62828' }}>LOTE REPROVADO ✗</p><p className="text-xs" style={{ color: '#5f6368' }}>Um ou mais parâmetros fora da especificação. Verificar processo.</p></div></>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── ABA: EDITAR FÓRMULA ────────────────────────────────────────── */}
      {abaAtiva === 'formula' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="stat-icon" style={{ background: '#f3e5f5', width: 30, height: 30, borderRadius: 8 }}>
                  <FlaskConical size={15} style={{ color: '#6a1b9a' }} />
                </div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Editar Ingredientes — {formula.nome}</h3>
              </div>
              <button onClick={() => adicionarIngrediente(formula.id)} className="btn-primary text-xs">
                <Plus size={13} /> Adicionar Ingrediente
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="vtable">
                <thead>
                  <tr>
                    <th>Nome do Ingrediente</th>
                    <th>Categoria</th>
                    <th className="text-right">Qtd / 1000 L</th>
                    <th>Unidade</th>
                    <th>QSP</th>
                    <th style={{ width: 50 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {formula.ingredientes.map(ing => (
                    <tr key={ing.id}>
                      <td>
                        <input
                          value={ing.nome}
                          onChange={e => editarIngrediente(formula.id, ing.id, 'nome', e.target.value)}
                          className="input text-xs" style={{ minWidth: 200 }}
                        />
                      </td>
                      <td>
                        <select
                          value={ing.categoria}
                          onChange={e => editarIngrediente(formula.id, ing.id, 'categoria', e.target.value)}
                          className="input text-xs" style={{ width: 130 }}
                        >
                          {Object.entries(CAT_STYLE).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.001"
                          disabled={ing.formulacaoPor1000L === 'QSP'}
                          value={ing.formulacaoPor1000L === 'QSP' ? '' : ing.formulacaoPor1000L}
                          onChange={e => editarIngrediente(formula.id, ing.id, 'formulacaoPor1000L', parseFloat(e.target.value) || 0)}
                          className="input text-xs text-right" style={{ width: 90 }}
                          placeholder={ing.formulacaoPor1000L === 'QSP' ? 'QSP' : ''}
                        />
                      </td>
                      <td>
                        <select
                          value={ing.unidade}
                          onChange={e => editarIngrediente(formula.id, ing.id, 'unidade', e.target.value)}
                          className="input text-xs" style={{ width: 70 }}
                        >
                          {['kg', 'g', 'L', 'mL', 'un'].map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => editarIngrediente(formula.id, ing.id, 'formulacaoPor1000L',
                            ing.formulacaoPor1000L === 'QSP' ? 0 : 'QSP'
                          )}
                          className="w-8 h-6 rounded text-xs font-bold transition-all"
                          style={{
                            background: ing.formulacaoPor1000L === 'QSP' ? '#0d47a1' : '#f5f5f5',
                            color: ing.formulacaoPor1000L === 'QSP' ? '#fff' : '#9aa0a6',
                            border: '1px solid #dadce0',
                          }}
                        >
                          QSP
                        </button>
                      </td>
                      <td>
                        <button onClick={() => removerIngrediente(formula.id, ing.id)}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-red-50 transition-colors"
                          style={{ color: '#9aa0a6' }}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Editar parâmetros */}
          <div className="card">
            <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>Parâmetros de Especificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formula.parametros.map((p, idx) => (
                <div key={p.nome} className="p-4 rounded-xl" style={{ background: '#fafafa', border: '1px solid #e8eaed' }}>
                  <h4 className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: '#5f6368' }}>
                    {p.nome} {p.unidade && `(${p.unidade})`}
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {(['minimo', 'ideal', 'maximo'] as const).map(campo => (
                      <div key={campo}>
                        <label className="text-xs block mb-1" style={{ color: '#9aa0a6' }}>
                          {campo === 'minimo' ? 'Mín' : campo === 'ideal' ? 'Ideal' : 'Máx'}
                        </label>
                        <input
                          type="number" step="0.01"
                          value={p[campo]}
                          onChange={e => {
                            const newParams = [...formula.parametros]
                            newParams[idx] = { ...newParams[idx], [campo]: parseFloat(e.target.value) || 0 }
                            setFormulas(prev => prev.map(f => f.id === formula.id ? { ...f, parametros: newParams } : f))
                          }}
                          className="input text-xs text-center"
                          style={{
                            borderColor: campo === 'ideal' ? '#F97316' : '#dadce0',
                            fontWeight: campo === 'ideal' ? 700 : 400,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Observações */}
            <div className="mt-4">
              <label className="text-xs font-semibold block mb-1.5" style={{ color: '#5f6368' }}>
                Observações Técnicas
              </label>
              <textarea
                rows={3}
                value={formula.observacoes ?? ''}
                onChange={e => setFormulas(prev => prev.map(f => f.id === formula.id ? { ...f, observacoes: e.target.value } : f))}
                className="input resize-none"
                placeholder="Notas sobre a fórmula, fornecedores preferenciais, condições de processo..."
              />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid #e8eaed' }}>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold" style={{ color: '#5f6368' }}>
                  Rendimento padrão (%):
                </label>
                <input
                  type="number" min={1} max={100} step={1}
                  value={formula.rendimento}
                  onChange={e => setFormulas(prev => prev.map(f => f.id === formula.id
                    ? { ...f, rendimento: Math.min(100, Math.max(1, Number(e.target.value))) } : f))}
                  className="input text-center"
                  style={{ width: 70, height: 32 }}
                />
              </div>
              <button className="btn-primary text-xs">
                <Save size={13} /> Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  )
}
