import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { Users, Plus, Phone, Mail, MapPin } from 'lucide-react'

const clientes = [
  { nome: 'Empório Natural Verde', contato: 'Maria Silva', email: 'maria@emporio.com', cidade: 'São Paulo', estado: 'SP', ativo: true },
  { nome: 'Mercado Orgânico Central', contato: 'João Lima', email: 'joao@mercado.com', cidade: 'Campinas', estado: 'SP', ativo: true },
  { nome: 'Restaurante Raízes', contato: 'Carla Mendes', email: 'carla@raizes.com', cidade: 'Santos', estado: 'SP', ativo: true },
  { nome: 'Loja Vida Saudável', contato: 'Pedro Costa', email: 'pedro@vidasaudavel.com', cidade: 'Ribeirão Preto', estado: 'SP', ativo: false },
]

export default function ClientesPage() {
  return (
    <AppLayout>
      <Header title="Clientes" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{clientes.filter(c=>c.ativo).length} clientes ativos</p>
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus size={15} />
            Novo Cliente
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientes.map((c) => (
            <div key={c.nome} className={`card border-l-4 ${c.ativo ? 'border-green-500' : 'border-gray-300 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users size={18} className="text-green-600" />
                </div>
                <span className={c.ativo ? 'badge-green' : 'badge-gray'}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{c.nome}</h3>
              <p className="text-sm text-gray-500 mb-3">{c.contato}</p>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Mail size={12} />
                  <span>{c.email}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={12} />
                  <span>{c.cidade} — {c.estado}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
