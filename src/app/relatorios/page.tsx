import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { BarChart3, Download, TrendingUp, Package, ShoppingCart, FlaskConical, FileText } from 'lucide-react'

const relatorios = [
  { titulo: 'Relatório de Produção Mensal',   desc: 'Volume produzido por produto, lote e período', icon: FlaskConical, cor: '#F97316' },
  { titulo: 'Relatório de Estoque',           desc: 'Posição atual, movimentações e alertas',        icon: Package,      cor: '#3B82F6' },
  { titulo: 'Relatório de Compras',           desc: 'Pedidos, fornecedores e valores gastos',        icon: ShoppingCart, cor: '#F59E0B' },
  { titulo: 'Custo de Produção',              desc: 'Custo por lote, produto e margem estimada',     icon: TrendingUp,   cor: '#10B981' },
  { titulo: 'Controle de Validades',          desc: 'Produtos com validade próxima ao vencimento',   icon: FileText,     cor: '#EF4444' },
  { titulo: 'Relatório Gerencial',            desc: 'Visão consolidada para tomada de decisão',      icon: BarChart3,    cor: '#8B5CF6' },
]

export default function RelatoriosPage() {
  return (
    <AppLayout>
      <Header title="Relatórios" />
      <div className="p-6 space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
          Selecione um relatório para gerar ou exportar
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {relatorios.map(r => (
            <div key={r.titulo} className="card card-hover cursor-pointer group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${r.cor}15` }}>
                <r.icon size={20} style={{ color: r.cor }} />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{r.titulo}</h3>
              <p className="text-xs mb-5 leading-relaxed" style={{ color: '#6B7280' }}>{r.desc}</p>
              <div className="flex items-center gap-1.5 pt-3" style={{ borderTop: '1px solid #222' }}>
                <Download size={12} style={{ color: '#F97316' }} />
                <span className="text-xs font-semibold" style={{ color: '#F97316' }}>Gerar Relatório</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
