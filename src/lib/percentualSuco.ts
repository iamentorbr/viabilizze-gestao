// ─── ENGINE DE CÁLCULO — PERCENTUAL DE POLPA/SUCO (MAPA IN 49/2018) ──────────
// Baseado na planilha "CALCULO DE PERCENTUAL DE SUCO" — VIABILIZZE

export type Fruta =
  | 'ACEROLA' | 'ABACAXI' | 'CAJU' | 'GOIABA' | 'LIMAO' | 'LARANJA'
  | 'MANGA' | 'MORANGO' | 'PESSEGO' | 'TANGERINA' | 'MACA' | 'UVA' | 'MISTO'

export type TipoBebida = 'REFRESCO' | 'SUCO_INTEGRAL' | 'NECTAR'

// Tabela MAPA: Brix mínimo do suco integral da fruta + % mínimo de polpa exigido para Refresco
export const TABELA_FRUTAS: Record<Fruta, { label: string; brixIntegral: number; pctRefresco: number }> = {
  ACEROLA:   { label: 'Acerola',   brixIntegral: 5.5,  pctRefresco: 10 },
  ABACAXI:   { label: 'Abacaxi',   brixIntegral: 11,   pctRefresco: 30 },
  CAJU:      { label: 'Caju',      brixIntegral: 10,   pctRefresco: 10 },
  GOIABA:    { label: 'Goiaba',    brixIntegral: 7,    pctRefresco: 15 },
  LIMAO:     { label: 'Limão',     brixIntegral: 10,   pctRefresco: 5  },
  LARANJA:   { label: 'Laranja',   brixIntegral: 10,   pctRefresco: 30 },
  MANGA:     { label: 'Manga',     brixIntegral: 11,   pctRefresco: 20 },
  MORANGO:   { label: 'Morango',   brixIntegral: 6.5,  pctRefresco: 5  },
  PESSEGO:   { label: 'Pêssego',   brixIntegral: 10.5, pctRefresco: 30 },
  TANGERINA: { label: 'Tangerina', brixIntegral: 10,   pctRefresco: 30 },
  MACA:      { label: 'Maçã',      brixIntegral: 10,   pctRefresco: 20 },
  UVA:       { label: 'Uva',       brixIntegral: 14,   pctRefresco: 30 },
  MISTO:     { label: 'Misto (multifrutas)', brixIntegral: 10, pctRefresco: 20 },
}

// % mínimo de polpa exigido por tipo de bebida (legislação MAPA/ANVISA)
// Refresco usa o valor específico da fruta (TABELA_FRUTAS.pctRefresco)
// Suco Integral = 100% / Néctar = mínimo legal varia, padrão usado: 50%
export const PCT_MINIMO_LEGAL: Record<TipoBebida, number | 'POR_FRUTA'> = {
  REFRESCO: 'POR_FRUTA',
  SUCO_INTEGRAL: 100,
  NECTAR: 50,
}

export type EntradaCalculo = {
  fruta: Fruta
  tipoBebida: TipoBebida
  brixSucoConcentrado: number   // °Brix do suco concentrado usado na formulação
  brixLegislacao: number        // °Brix de referência da legislação (D)
  volumeFinalLitros: number     // volume total da formulação (L)
  fatorCorrecao?: number        // fator de correção (densidade), padrão 1.032
}

export type ResultadoCalculo = {
  brixIntegralFruta: number
  pctPolpaMinimoLegal: number          // % mínimo exigido pela legislação
  pctPolpaCalculado: number            // % de polpa realmente alcançado na formulação
  quantidadeSucoConcentradoKg: number  // kg de suco concentrado necessários
  quantidadeSucoConcentradoL: number   // convertido para litros (aprox., densidade ~1)
  atendeLegislacao: boolean
  margemPercentual: number             // diferença entre calculado e mínimo
  observacao: string
}

/**
 * Fórmula da planilha original:
 *   % Polpa = (Brix Legislação × Fator de Correção) / Brix Suco Concentrado × 100
 *   Quantidade Suco Concentrado = (% Polpa / 100) × Volume Final × 1000 (g/L → kg)
 */
export function calcularPercentualSuco(entrada: EntradaCalculo): ResultadoCalculo {
  const {
    fruta, tipoBebida, brixSucoConcentrado, brixLegislacao,
    volumeFinalLitros, fatorCorrecao = 1.032,
  } = entrada

  const dadosFruta = TABELA_FRUTAS[fruta]
  const brixIntegralFruta = dadosFruta.brixIntegral

  // % mínimo legal conforme tipo de bebida
  const pctMinimo = PCT_MINIMO_LEGAL[tipoBebida]
  const pctPolpaMinimoLegal = pctMinimo === 'POR_FRUTA' ? dadosFruta.pctRefresco : pctMinimo

  // % de polpa calculado pela fórmula de Brix
  const pctPolpaCalculado = brixSucoConcentrado > 0
    ? (brixLegislacao * fatorCorrecao / brixSucoConcentrado) * 100
    : 0

  // Quantidade de suco concentrado necessária (kg) para o volume final
  const quantidadeSucoConcentradoKg = (pctPolpaCalculado / 100) * volumeFinalLitros * 1 // densidade ~1kg/L aprox
  const quantidadeSucoConcentradoL = quantidadeSucoConcentradoKg // aproximação 1:1

  const atendeLegislacao = pctPolpaCalculado >= pctPolpaMinimoLegal
  const margemPercentual = pctPolpaCalculado - pctPolpaMinimoLegal

  let observacao = ''
  if (atendeLegislacao) {
    observacao = `Formulação CONFORME — ${pctPolpaCalculado.toFixed(2)}% de polpa, ${margemPercentual.toFixed(2)} p.p. acima do mínimo exigido (${pctPolpaMinimoLegal}%).`
  } else {
    observacao = `Formulação NÃO CONFORME — ${pctPolpaCalculado.toFixed(2)}% de polpa está ${Math.abs(margemPercentual).toFixed(2)} p.p. ABAIXO do mínimo exigido (${pctPolpaMinimoLegal}%) pela legislação MAPA para ${tipoLabel(tipoBebida)}.`
  }

  return {
    brixIntegralFruta,
    pctPolpaMinimoLegal,
    pctPolpaCalculado: round2(pctPolpaCalculado),
    quantidadeSucoConcentradoKg: round2(quantidadeSucoConcentradoKg),
    quantidadeSucoConcentradoL: round2(quantidadeSucoConcentradoL),
    atendeLegislacao,
    margemPercentual: round2(margemPercentual),
    observacao,
  }
}

export function tipoLabel(t: TipoBebida): string {
  return { REFRESCO: 'Refresco', SUCO_INTEGRAL: 'Suco Integral', NECTAR: 'Néctar' }[t]
}

const round2 = (v: number) => Math.round(v * 100) / 100
