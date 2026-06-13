import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { Tag, CheckCircle, AlertCircle, Plus, Edit } from 'lucide-react'

const rotulos = [
  { produto: 'Kombucha Gengibre 500ml',  marca: 'VIABILIZZE', registro: 'MAPA/2024-001', aprovado: true,  revisao: '2026-03-10' },
  { produto: 'Kefir Natural 1L',          marca: 'VIABILIZZE', registro: 'MAPA/2024-002', aprovado: true,  revisao: '2026-04-15' },
  { produto: 'Vinagre de Maçã 250ml',     marca: 'VIABILIZZE', registro: 'MAPA/2024-003', aprovado: false, revisao: '2026-05-20' },
  { produto: 'Fermentado de Beterraba',   marca: 'VIABILIZZE', registro: '— Pendente —',  aprovado: false, revisao: '—' },
]

export default function RotulagemPage() {
  return (
    <AppLayout>
      <Header title="Rotulagem" />
      <div className="p-6 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">Atenção: Conformidade com ANVISA e MAPA</p>
            <p className="text-xs text-amber-700 mt-0.5">Certifique-se de que todos os rótulos estejam em conformidade com a RDC 727/2022 e legislação vigente para bebidas fermentadas.</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{rotulos.filter(r=>r.aprovado).length} de {rotulos.length} rótulos aprovados</p>
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus size={15} />
            Novo Rótulo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rotulos.map(r => (
            <div key={r.produto} className={`card border-l-4 ${r.aprovado ? 'border-green-500' : 'border-yellow-400'}`}>
              <div className="flex items-start justify-between mb-3">
                <Tag size={20} className={r.aprovado ? 'text-green-600' : 'text-yellow-500'} />
                <span className={r.aprovado ? 'badge-green' : 'badge-yellow'}>
                  {r.aprovado ? 'Aprovado' : 'Em Revisão'}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 mb-1">{r.produto}</h3>
              <p className="text-sm text-gray-500 mb-1">Marca: <span className="font-medium text-gray-700">{r.marca}</span></p>
              <p className="text-xs text-gray-400 mb-1">Registro: {r.registro}</p>
              <p className="text-xs text-gray-400 mb-3">Última revisão: {r.revisao !== '—' ? new Date(r.revisao).toLocaleDateString('pt-BR') : '—'}</p>
              <button className="flex items-center gap-1.5 text-xs text-green-700 font-medium hover:underline">
                <Edit size={12} />
                Editar informações nutricionais
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
