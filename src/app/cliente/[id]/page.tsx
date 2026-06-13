import AppLayout from '@/components/layout/AppLayout'
import ClienteHeader from '../components/ClienteHeader'
import ClienteSystem from '../components/ClienteSystem'

export default function ClientePage({ params }: { params: { id: string } }) {
  return (
    <AppLayout>
      <ClienteSystem clienteId={params.id} />
    </AppLayout>
  )
}
