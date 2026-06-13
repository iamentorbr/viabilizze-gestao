import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import ProducaoClient from './ProducaoClient'

export default function ProducaoPage() {
  return (
    <AppLayout>
      <Header title="Ordens de Produção" subtitle="Controle do processo produtivo" />
      <ProducaoClient />
    </AppLayout>
  )
}
