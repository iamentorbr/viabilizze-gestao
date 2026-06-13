import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { Tag, AlertCircle, Plus, Edit, CheckCircle, Clock } from 'lucide-react'

const rotulos = [
  { produto: 'Kombucha Gengibre 500ml',  marca: 'VIABILIZZE', registro: 'MAPA/2024-001', aprovado: true,  revisao: '2026-03-10' },
  { produto: 'Kefir Natural 1L',          marca: 'VIABILIZZE', registro: 'MAPA/2024-002', aprovado: true,  revisao: '2026-04-15' },
  { produto: 'Vinagre de Maçã 250ml',     marca: 'VIABILIZZE', registro: 'MAPA/2024-003', aprovado: false, revisao: '2026-05-20' },
  { produto: 'Fermentado de Beterraba',   marca: 'VIABILIZZE', registro: '— Pendente —',  aprovado: false, revisao: '' },
]

export default function RotulagemPage() {
  return (
    <AppLayout>
      <Header title="Rotulagem" />
      <div className="p-6 space-y-5">
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
          <AlertCircle size={16} style={{ color: '#F59E0B' }} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold" style={{ color: '#F59E0B' }}>Conformidade ANVISA e MAPA</p>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>Certifique-se de que todos os rótulos estejam em conformidade com a RDC 727/2022 e legislação vigente para bebidas fermentadas.</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6B7280' }}>
            {rotulos.filter(r=>r.aprovado).length} de {rotulos.length} rótulos aprovados
          </p>
          <button className="btn-primary text-xs"><Plus size={14} /> Novo Rótulo</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rotulos.map(r => (
            <div key={r.produto} className="card card-hover" style={{ borderLeft: `3px solid ${r.aprovado ? '#F97316' : '#333'}` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: r.aprovado ? 'rgba(249,115,22,0.1)' : 'rgba(255,255,255,0.04)' }}>
                  <Tag size={16} style={{ color: r.aprovado ? '#F97316' : '#6B7280' }} />
                </div>
                <span className={r.aprovado ? 'badge-green' : 'badge-yellow'}>
                  {r.aprovado ? 'Aprovado' : 'Em Revisão'}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{r.produto}</h3>
              <p className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Marca: <span className="text-white font-semibold">{r.marca}</span></p>
              <p className="text-xs mb-1" style={{ color: '#6B7280' }}>Registro: {r.registro}</p>
              {r.revisao && <p className="text-xs mb-3" style={{ color: '#6B7280' }}>Última revisão: {new Date(r.revisao).toLocaleDateString('pt-BR')}</p>}
              <div className="flex items-center gap-1.5 mt-2 pt-2" style={{ borderTop: '1px solid #222' }}>
                <button className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#F97316' }}>
                  <Edit size={11} /> Editar informações
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
