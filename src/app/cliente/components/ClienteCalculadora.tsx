'use client'
import { useState } from 'react'
import { Calculator, FlaskConical } from 'lucide-react'
import ClienteCalculadoraProducao from './ClienteCalculadoraProducao'
import CalculadoraFormulacao from '@/components/CalculadoraFormulacao'

export default function ClienteCalculadora({ clienteId, sabores, onSaboresUpdate }: any) {
  const [modo, setModo] = useState<'producao' | 'formulacao'>('producao')

  return (
    <main className="p-6 space-y-5" style={{ background: '#f0f2f5' }}>
      {/* Seletor de modo */}
      <div className="flex gap-0 rounded-xl overflow-hidden"
        style={{ border: '1px solid #e8eaed', background: '#fff', width: 'fit-content' }}>
        {([
          { id: 'producao',   label: 'Cálculo de Produção',   icon: Calculator,    sub: 'Controle reverso por embalagens' },
          { id: 'formulacao', label: 'Calculadora de Formulação', icon: FlaskConical, sub: 'Nutrição — IN 75/2020' },
        ] as const).map(m => (
          <button key={m.id} onClick={() => setModo(m.id)}
            className="flex items-center gap-2.5 px-5 py-3 text-xs font-semibold transition-all"
            style={modo === m.id
              ? { background: '#F97316', color: '#fff' }
              : { color: '#5f6368' }}>
            <m.icon size={14} />
            <div className="text-left">
              <p className="font-bold">{m.label}</p>
              <p className="font-normal opacity-80 text-xs">{m.sub}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Conteúdo */}
      {modo === 'producao' && (
        <ClienteCalculadoraProducao
          clienteId={clienteId} sabores={sabores} onSaboresUpdate={onSaboresUpdate} />
      )}
      {modo === 'formulacao' && (
        <CalculadoraFormulacao titulo={`Formulação — ${sabores[0]?.nome ?? ''}`} />
      )}
    </main>
  )
}
