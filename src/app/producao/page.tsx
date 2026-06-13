import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import ProducaoClient from './ProducaoClient'

export default function ProducaoPage() {
  return (
    <AppLayout>
      <Header title="Produção de Bebidas" />
      <ProducaoClient />
    </AppLayout>
  )
}
