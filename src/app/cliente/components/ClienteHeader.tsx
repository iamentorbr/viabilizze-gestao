'use client'
import { ArrowLeft, Building2, Beaker, Package, ShoppingCart, BarChart2 } from 'lucide-react'
import Link from 'next/link'

type Props = {
  cliente: { nome: string; observacoes?: string }
  abaAtiva: string
  onAba: (aba: string) => void
}

const ABAS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart2 },
  { id: 'calculadora', label: 'Calculadora de Produção', icon: Beaker },
  { id: 'consolidado', label: 'Consolidado de Compras', icon: ShoppingCart },
  { id: 'formulacoes', label: 'Formulações', icon: Package },
  { id: 'historico', label: 'Histórico', icon: BarChart2 },
]

export default function ClienteHeader({ cliente, abaAtiva, onAba }: Props) {
  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #e8eaed' }}>
      {/* Barra do cliente */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid #f0f2f5' }}>
        <Link href="/clientes"
          className="flex items-center gap-1.5 text-xs font-medium hover:underline"
          style={{ color: '#9aa0a6' }}>
          <ArrowLeft size={13} /> Clientes
        </Link>
        <span style={{ color: '#dadce0' }}>/</span>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ background: '#F97316' }}>
            {cliente.nome.charAt(0)}
          </div>
          <span className="text-sm font-bold" style={{ color: '#1a1d23' }}>{cliente.nome}</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#fff3e0', color: '#e65100' }}>
            Assessoria Industrial
          </span>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-0 px-6">
        {ABAS.map(aba => (
          <button key={aba.id} onClick={() => onAba(aba.id)}
            className="flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all"
            style={abaAtiva === aba.id
              ? { color: '#F97316', borderColor: '#F97316' }
              : { color: '#9aa0a6', borderColor: 'transparent' }}>
            <aba.icon size={13} />
            {aba.label}
          </button>
        ))}
      </div>
    </div>
  )
}
