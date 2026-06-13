import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import CalculadoraClient from './CalculadoraClient'

export default function CalculadoraPage() {
  return (
    <AppLayout>
      <Header title="Calculadora de Produção" subtitle="Formulação técnica de bebidas — Alimentos & Bebidas" />
      <CalculadoraClient />
    </AppLayout>
  )
}
