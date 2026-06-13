import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { ShoppingCart, Plus, Truck, CheckCircle, Clock } from 'lucide-react'

const pedidos = [
  { numero: 'PC-2026-008', fornecedor: 'BioInsumos Ltda',      data: '2026-05-22', entrega: '2026-05-28', valor: 2840.00, status: 'CONFIRMADO' },
  { numero: 'PC-2026-007', fornecedor: 'Chás & Ervas Premium', data: '2026-05-20', entrega: '2026-05-26', valor: 1250.00, status: 'ENVIADO' },
  { numero: 'PC-2026-006', fornecedor: 'Cooperativa AgroBio',  data: '2026-05-15', entrega: '2026-05-20', valor: 3670.00, status: 'RECEBIDO' },
  { numero: 'PC-2026-005', fornecedor: 'Embalagens EcoPack',   data: '2026-05-10', entrega: '2026-05-18', valor: 890.00,  status: 'RECEBIDO' },
]

const statusConfig: Record<string, { label: string; badge: string }> = {
  RASCUNHO:         { label: 'Rascunho',          badge: 'badge-gray' },
  ENVIADO:          { label: 'Enviado',            badge: 'badge-blue' },
  CONFIRMADO:       { label: 'Confirmado',         badge: 'badge-yellow' },
  RECEBIDO_PARCIAL: { label: 'Recebido Parcial',   badge: 'badge-yellow' },
  RECEBIDO:         { label: 'Recebido',           badge: 'badge-green' },
  CANCELADO:        { label: 'Cancelado',          badge: 'badge-red' },
}

export default function ComprasPage() {
  const totalAberto = pedidos.filter(p=>p.status!=='RECEBIDO').reduce((s,p)=>s+p.valor,0)
  return (
    <AppLayout>
      <Header title="Compras" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="card border-l-4 border-blue-500">
            <p className="text-2xl font-bold text-blue-600">{pedidos.filter(p=>p.status==='ENVIADO').length}</p>
            <p className="text-xs text-gray-500">Aguardando Confirmação</p>
          </div>
          <div className="card border-l-4 border-yellow-400">
            <p className="text-2xl font-bold text-yellow-500">{pedidos.filter(p=>p.status==='CONFIRMADO').length}</p>
            <p className="text-xs text-gray-500">Confirmados — Aguardando Entrega</p>
          </div>
          <div className="card border-l-4 border-green-500">
            <p className="text-sm font-bold text-green-600">R$ {totalAberto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
            <p className="text-xs text-gray-500">Valor em Aberto</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Pedidos de Compra</h2>
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus size={15} />
            Novo Pedido
          </button>
        </div>

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Número','Fornecedor','Data Pedido','Entrega Prevista','Valor Total','Status'].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pedidos.map(p=>{
                const sc = statusConfig[p.status]
                return (
                  <tr key={p.numero} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-medium text-green-700">{p.numero}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.fornecedor}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.entrega).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">R$ {p.valor.toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                    <td className="px-4 py-3"><span className={sc.badge}>{sc.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  )
}
