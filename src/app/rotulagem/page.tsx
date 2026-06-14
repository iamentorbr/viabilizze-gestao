'use client'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import CalculadoraFormulacao from '@/components/CalculadoraFormulacao'

export default function RotulagemPage() {
  return (
    <AppLayout>
      <Header
        title="Rotulagem — Tabela Nutricional"
        subtitle="Calculadora de formulação nutricional — IN 75/2020 ANVISA · RDC 429/2020"
      />
      <main className="flex-1 p-6" style={{ background: '#f0f2f5' }}>
        <CalculadoraFormulacao titulo="Rotulagem — Formulação Livre" />
      </main>
    </AppLayout>
  )
}
