'use client'
import { useState, useMemo } from 'react'
import { Tag, ChevronDown } from 'lucide-react'
import CalculadoraFormulacao from '@/components/CalculadoraFormulacao'
import type { Ingrediente } from '@/lib/nutricional'

// Mapeamento de categorias → campos nutricionais padrão TACO/IBGE
// Valores são estimativas por g de ingrediente — usuário ajusta na calculadora
const DEFAULTS_POR_CATEGORIA: Record<string, Partial<Ingrediente>> = {
  funcional:   { carboidratos: 0,    proteinas: 85,  gorduras_totais: 0,   sodio: 300,  fibras: 0    },
  polpa:       { carboidratos: 12,   proteinas: 0.5, gorduras_totais: 0.1, sodio: 5,    fibras: 0.3  },
  acido:       { carboidratos: 8,    proteinas: 0.5, gorduras_totais: 0,   sodio: 2,    fibras: 0    },
  aroma:       { carboidratos: 0,    proteinas: 0,   gorduras_totais: 0,   sodio: 0,    fibras: 0    },
  conservante: { carboidratos: 0,    proteinas: 0,   gorduras_totais: 0,   sodio: 0,    fibras: 0    },
  adocante:    { carboidratos: 0,    proteinas: 0,   gorduras_totais: 0,   sodio: 0,    fibras: 0    },
  outro:       { carboidratos: 0,    proteinas: 0,   gorduras_totais: 0,   sodio: 0,    fibras: 0    },
}

function buildIngredientes(sabor: any): Ingrediente[] {
  const ings = sabor.sabor_ingredientes ?? []
  return ings.map((ing: any, idx: number) => {
    const cat = ing.categoria ?? 'outro'
    const defaults = DEFAULTS_POR_CATEGORIA[cat] ?? DEFAULTS_POR_CATEGORIA.outro
    return {
      id: ing.id ?? String(idx),
      nome: `${ing.ingrediente}${ing.fornecedor ? ` (${ing.fornecedor})` : ''}`,
      // quantidade = g/L convertida para a porção de referência de 1L
      quantidade: Number(ing.g_por_litro ?? 0),
      porcao100g: 1000, // referência: 1000 g (1L de formulação)
      carboidratos:          defaults.carboidratos          ?? 0,
      acucares_totais:       (defaults.carboidratos ?? 0) * 0.8,
      acucares_adicionados:  cat === 'adocante' ? 0 : (defaults.carboidratos ?? 0) * 0.5,
      proteinas:             defaults.proteinas             ?? 0,
      gorduras_totais:       defaults.gorduras_totais       ?? 0,
      gorduras_saturadas:    (defaults.gorduras_totais ?? 0) * 0.3,
      gorduras_trans:        0,
      fibras:                defaults.fibras                ?? 0,
      sodio:                 defaults.sodio                 ?? 0,
      poliol:                cat === 'adocante',
      fator_poliol:          cat === 'adocante' ? 2.4 : 0,
    }
  })
}

type Props = {
  clienteId: string
  sabores: any[]
}

export default function ClienteRotulagem({ clienteId, sabores }: Props) {
  const [saborSel, setSaborSel] = useState<string>(sabores[0]?.id ?? '__livre__')

  const sabor = sabores.find(s => s.id === saborSel)

  const ingredientesPreenchidos = useMemo(() => {
    if (!sabor) return undefined
    return buildIngredientes(sabor)
  }, [saborSel, sabores])

  const nomeProduto = sabor?.nome ?? ''

  const porcaoMl = sabor?.volume_embalagem_ml
    ? Number(sabor.volume_embalagem_ml)
    : 250

  return (
    <main className="p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* Seletor de sabor */}
      <div className="card">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <div className="stat-icon" style={{ background: '#fff3e0', width: 30, height: 30, borderRadius: 8 }}>
              <Tag size={14} style={{ color: '#F97316' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#1a1d23' }}>Produto para Rotulagem</p>
              <p className="text-xs" style={{ color: '#9aa0a6' }}>
                Selecione um sabor para pré-carregar os ingredientes, ou use o modo livre
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap ml-auto">
            {/* Botões dos sabores do cliente */}
            {sabores.map(s => (
              <button key={s.id} onClick={() => setSaborSel(s.id)}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={saborSel === s.id
                  ? { background: '#F97316', color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,.3)' }
                  : { background: '#fff', color: '#5f6368', border: '1px solid #dadce0' }}>
                {s.nome}
              </button>
            ))}
            {/* Modo livre */}
            <button onClick={() => setSaborSel('__livre__')}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={saborSel === '__livre__'
                ? { background: '#1a1d23', color: '#fff' }
                : { background: '#fff', color: '#5f6368', border: '1px solid #dadce0' }}>
              ✏️ Formulação Livre
            </button>
          </div>
        </div>

        {/* Aviso quando sabor selecionado */}
        {sabor && (
          <div className="mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2"
            style={{ background: '#fff9f0', border: '1px solid #ffe0b2' }}>
            <span style={{ fontSize: 14 }}>💡</span>
            <p className="text-xs" style={{ color: '#e65100' }}>
              Os ingredientes do sabor <strong>{sabor.nome}</strong> foram pré-carregados com base na
              formulação cadastrada (g/L). <strong>Os valores nutricionais são estimativas</strong> — revise
              e ajuste cada ingrediente com os dados reais da ficha técnica do fornecedor antes de exportar.
            </p>
          </div>
        )}
      </div>

      {/* Calculadora — passando ingredientes pré-preenchidos e porção do sabor */}
      <CalculadoraFormulacao
        key={saborSel} // força remontagem ao trocar sabor
        titulo={sabor ? `Rotulagem — ${sabor.nome}` : 'Rotulagem — Formulação Livre'}
        nomeProdutoInicial={nomeProduto}
        ingredientesIniciais={saborSel !== '__livre__' ? ingredientesPreenchidos : undefined}
        porcaoInicial={porcaoMl}
      />
    </main>
  )
}
