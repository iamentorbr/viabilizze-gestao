// ─── ENGINE NUTRICIONAL — IN 75/2020 (ANVISA) ────────────────────────────────
// Baseado no FacilitaSafer — Safer Food Consultoria

export type Ingrediente = {
  id: string
  nome: string
  quantidade: number          // g ou mL na receita
  porcao100g: number          // porção de referência (normalmente 100)
  carboidratos: number        // g / porcao100g
  acucares_totais: number
  acucares_adicionados: number
  proteinas: number
  gorduras_totais: number
  gorduras_saturadas: number
  gorduras_trans: number
  fibras: number
  sodio: number               // mg / porcao100g
  poliol: boolean
  fator_poliol: number        // kcal/g (só para polióis)
}

export type ConfigReceita = {
  nome_produto: string
  porcao_ml: number           // porção em mL ou g
  medida_caseira: string      // ex: "1 copo"
  rendimento: number          // total da receita em g ou mL
  unidade: 'ml' | 'g'
}

export type ResultadoPorcao = {
  valor_energetico_kcal: number
  valor_energetico_kj: number
  carboidratos: number
  acucares_totais: number
  acucares_adicionados: number
  proteinas: number
  gorduras_totais: number
  gorduras_saturadas: number
  gorduras_trans: number
  fibras: number
  sodio: number
}

export type ResultadoNutricional = {
  por_100: ResultadoPorcao
  por_porcao: ResultadoPorcao
  vd: {
    valor_energetico: number
    carboidratos: number
    acucares_adicionados: number
    proteinas: number
    gorduras_totais: number
    gorduras_saturadas: number
    gorduras_trans: string
    fibras: number
    sodio: number
  }
}

// %VD conforme IN 75/2020 (Tabela II do Anexo III)
const VD = {
  energia_kcal: 2000,
  carboidratos: 300,      // g
  proteinas: 50,           // g
  gorduras_totais: 65,     // g
  gorduras_saturadas: 20,  // g
  fibras: 25,              // g
  sodio: 2400,             // mg
  acucares_adicionados: 50,// g
}

// Fatores de Atwater (kcal/g) — IN 75/2020
const FA_CARBO = 4    // kcal/g
const FA_PROT  = 4    // kcal/g
const FA_GORD  = 9    // kcal/g
const FA_FIBRA = 2    // kcal/g

export function calcularNutricional(
  ingredientes: Ingrediente[],
  config: ConfigReceita
): ResultadoNutricional {
  const R = config.rendimento || 1

  // 1. Somar cada nutriente na formulação total (g ou mg na receita)
  let somaCarbo   = 0, somaAcTot = 0, somaAcAd = 0
  let somaProt    = 0, somaGordTot = 0, somaGordSat = 0, somaGordTrans = 0
  let somaFibra   = 0, somaSodio = 0
  let somaVECarbo = 0 // carboidratos para VE (excluindo polióis)

  for (const ing of ingredientes) {
    if (!ing.nome || ing.quantidade <= 0) continue
    const fator = ing.quantidade / (ing.porcao100g || 100)
    somaCarbo      += ing.carboidratos         * fator
    somaAcTot      += ing.acucares_totais      * fator
    somaAcAd       += ing.acucares_adicionados * fator
    somaProt       += ing.proteinas            * fator
    somaGordTot    += ing.gorduras_totais      * fator
    somaGordSat    += ing.gorduras_saturadas   * fator
    somaGordTrans  += ing.gorduras_trans       * fator
    somaFibra      += ing.fibras               * fator
    somaSodio      += ing.sodio                * fator
    // VE: polióis usam fator próprio
    if (ing.poliol && ing.fator_poliol > 0) {
      somaVECarbo += ing.carboidratos * fator * ing.fator_poliol
    } else {
      somaVECarbo += ing.carboidratos * fator * FA_CARBO
    }
  }

  // 2. Calcular por 100g/ml (dividir pelo rendimento, multiplicar por 100)
  const fatorPor100 = 100 / R
  const p100: ResultadoPorcao = {
    valor_energetico_kcal: arred(
      (somaVECarbo + somaProt * FA_PROT + somaGordTot * FA_GORD + somaFibra * FA_FIBRA) * fatorPor100
    ),
    valor_energetico_kj: arred(
      (somaVECarbo + somaProt * FA_PROT + somaGordTot * FA_GORD + somaFibra * FA_FIBRA) * fatorPor100 * 4.184
    ),
    carboidratos:           arred1(somaCarbo   * fatorPor100),
    acucares_totais:        arred1(somaAcTot   * fatorPor100),
    acucares_adicionados:   arred1(somaAcAd    * fatorPor100),
    proteinas:              arred1(somaProt    * fatorPor100),
    gorduras_totais:        arred1(somaGordTot * fatorPor100),
    gorduras_saturadas:     arred1(somaGordSat * fatorPor100),
    gorduras_trans:         arred1(somaGordTrans * fatorPor100),
    fibras:                 arred1(somaFibra   * fatorPor100),
    sodio:                  arred1(somaSodio   * fatorPor100),
  }

  // 3. Por porção
  const fP = config.porcao_ml / 100
  const pPorcao: ResultadoPorcao = {
    valor_energetico_kcal: arred(p100.valor_energetico_kcal * fP),
    valor_energetico_kj:   arred(p100.valor_energetico_kj * fP),
    carboidratos:           arred1(p100.carboidratos          * fP),
    acucares_totais:        arred1(p100.acucares_totais        * fP),
    acucares_adicionados:   arred1(p100.acucares_adicionados   * fP),
    proteinas:              arred1(p100.proteinas              * fP),
    gorduras_totais:        arred1(p100.gorduras_totais        * fP),
    gorduras_saturadas:     arred1(p100.gorduras_saturadas     * fP),
    gorduras_trans:         arred1(p100.gorduras_trans         * fP),
    fibras:                 arred1(p100.fibras                 * fP),
    sodio:                  arred1(p100.sodio                  * fP),
  }

  // 4. %VD
  const vd = {
    valor_energetico:    pctVD(pPorcao.valor_energetico_kcal, VD.energia_kcal),
    carboidratos:         pctVD(pPorcao.carboidratos,          VD.carboidratos),
    acucares_adicionados: pctVD(pPorcao.acucares_adicionados,  VD.acucares_adicionados),
    proteinas:            pctVD(pPorcao.proteinas,             VD.proteinas),
    gorduras_totais:      pctVD(pPorcao.gorduras_totais,       VD.gorduras_totais),
    gorduras_saturadas:   pctVD(pPorcao.gorduras_saturadas,    VD.gorduras_saturadas),
    gorduras_trans:       '0 g*' as string, // sempre 0 g* conforme IN 75/2020
    fibras:               pctVD(pPorcao.fibras,                VD.fibras),
    sodio:                pctVD(pPorcao.sodio,                 VD.sodio),
  }

  return { por_100: p100, por_porcao: pPorcao, vd }
}

// Helpers
const arred  = (v: number) => Math.round(v)
const arred1 = (v: number) => Math.round(v * 10) / 10
const pctVD  = (v: number, ref: number) => Math.round((v / ref) * 100)
