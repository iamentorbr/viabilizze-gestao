import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { BarChart3, Download, TrendingUp, Package, ShoppingCart, FlaskConical } from 'lucide-react'

const relatorios = [
  { titulo: 'Relatório de Produção Mensal',    desc: 'Volume produzido por produto, lote e período',       icon: FlaskConical, cor: 'bg-green-50 text-green-600' },
  { titulo: 'Relatório de Estoque',            desc: 'Posição atual, movimentações e alertas de ruptura',   icon: Package,      cor: 'bg-blue-50 text-blue-600' },
  { titulo: 'Relatório de Compras',            desc: 'Pedidos realizados, fornecedores e valores gastos',   icon: ShoppingCart, cor: 'bg-amber-50 text-amber-600' },
  { titulo: 'Relatório de Custo de Produção',  desc: 'Custo por lote, produto e margem estimada',           icon: TrendingUp,   cor: 'bg-purple-50 text-purple-600' },
  { titulo: 'Relatório de Validades',          desc: 'Produtos com validade próxima ao vencimento',         icon: Package,      cor: 'bg-red-50 text-red-600' },
  { titulo: 'Relatório Gerencial',             desc: 'Visão consolidada para tomada de decisão',            icon: BarChart3,    cor: 'bg-gray-50 text-gray-600' },
]

export default function RelatoriosPage() {
  return (
    <AppLayout>
      <Header title="Relatórios" />
      <div className="p-6 space-y-5">
        <p className="text-sm text-gray-500">Selecione um relatório para gerar ou exportar em PDF/Excel.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatorios.map(r => (
            <div key={r.titulo} className="card hover:shadow-md transition-shadow cursor-pointer group">
              <div className={`w-10 h-10 rounded-lg ${r.cor} flex items-center justify-center mb-3`}>
                <r.icon size={20} />
              </div>
              <h3 className="font-semibold text-gray-800 mb-1 group-hover:text-green-700 transition-colors">{r.titulo}</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{r.desc}</p>
              <button className="flex items-center gap-1.5 text-xs text-green-700 font-medium hover:underline">
                <Download size={13} />
                Gerar Relatório
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
