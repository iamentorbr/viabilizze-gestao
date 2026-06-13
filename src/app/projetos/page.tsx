import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { FolderKanban, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

const projetos = [
  {
    nome: 'Lançamento Linha Verão 2026',
    status: 'ATIVO',
    inicio: '2026-04-01',
    fim: '2026-07-31',
    tarefas: [
      { titulo: 'Definir linha de produtos', status: 'CONCLUIDA', prioridade: 'ALTA' },
      { titulo: 'Desenvolver fichas técnicas', status: 'EM_ANDAMENTO', prioridade: 'ALTA' },
      { titulo: 'Criar rótulos linha verão', status: 'PENDENTE', prioridade: 'MEDIA' },
      { titulo: 'Testes de produção piloto', status: 'PENDENTE', prioridade: 'ALTA' },
    ]
  },
  {
    nome: 'Certificação Orgânica IBD',
    status: 'ATIVO',
    inicio: '2026-03-01',
    fim: '2026-09-30',
    tarefas: [
      { titulo: 'Levantamento documental', status: 'CONCLUIDA', prioridade: 'URGENTE' },
      { titulo: 'Adequação das instalações', status: 'EM_ANDAMENTO', prioridade: 'ALTA' },
      { titulo: 'Auditoria interna', status: 'PENDENTE', prioridade: 'ALTA' },
    ]
  },
]

const statusIcons: Record<string, React.ReactNode> = {
  CONCLUIDA:    <CheckCircle size={14} className="text-green-500" />,
  EM_ANDAMENTO: <Clock size={14} className="text-blue-500" />,
  PENDENTE:     <Clock size={14} className="text-gray-400" />,
  CANCELADA:    <AlertTriangle size={14} className="text-red-400" />,
}

const prioridadeBadge: Record<string, string> = {
  BAIXA: 'badge-gray', MEDIA: 'badge-blue', ALTA: 'badge-yellow', URGENTE: 'badge-red'
}

export default function ProjetosPage() {
  return (
    <AppLayout>
      <Header title="Projetos e Tarefas" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{projetos.length} projetos ativos</p>
          <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
            <Plus size={15} />
            Novo Projeto
          </button>
        </div>

        <div className="space-y-4">
          {projetos.map(p => {
            const concluidas = p.tarefas.filter(t=>t.status==='CONCLUIDA').length
            const pct = Math.round((concluidas/p.tarefas.length)*100)
            return (
              <div key={p.nome} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={18} className="text-green-600" />
                    <h3 className="font-semibold text-gray-800">{p.nome}</h3>
                  </div>
                  <span className="badge-green">Ativo</span>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 font-medium">{pct}% ({concluidas}/{p.tarefas.length})</span>
                </div>
                <div className="space-y-2">
                  {p.tarefas.map((t, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                      {statusIcons[t.status]}
                      <span className={`text-sm flex-1 ${t.status==='CONCLUIDA'?'line-through text-gray-400':'text-gray-700'}`}>{t.titulo}</span>
                      <span className={prioridadeBadge[t.prioridade]}>{t.prioridade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
