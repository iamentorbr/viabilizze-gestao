import ClienteSystem from '../components/ClienteSystem'

export default function ClientePage({ params }: { params: { id: string } }) {
  return <ClienteSystem clienteId={params.id} />
}
