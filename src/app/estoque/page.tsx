import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import EstoqueClient from './EstoqueClient'

export default function EstoquePage() {
  return (
    <AppLayout>
      <Header title="Gestão de Estoque" />
      <EstoqueClient />
    </AppLayout>
  )
}
