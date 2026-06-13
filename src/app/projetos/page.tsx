'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { FolderKanban, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

const prioridadeBadge: Record<string, string> = { BAIXA: 'badge-gray', MEDIA: 'badge-blue', ALTA: 'badge-yellow', URGENTE: 'badge-red' }
const statusIcone = (s: string) => {
  if (s === 'CONCLUIDA') return <CheckCircle size={14} className="text-green-500" />
  if (s === 'EM_ANDAMENTO') return <Clock size={14} className="text-blue-500" />
  return <Clock size={14} className="text-gray-400" />
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<any[]>([])
  const [tarefas, setTarefas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalP, setModalP] = useState(false)
  const [modalT, setModalT] = useState(false)
  const [projetoSel, setProjetoSel] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [formP, setFormP] = useState({ nome: '', descricao: '', data_inicio: '', data_prevista_fim: '' })
  const [formT, setFormT] = useState({ titulo: '', projeto_id: '', prioridade: 'MEDIA', data_vencimento: '' })

  async function carregar() {
    setLoading(true)
    const [{ data: p }, { data: t }] = await Promise.all([
      supabase.from('projetos').select('*').eq('status', 'ATIVO').order('criado_em', { ascending: false }),
      supabase.from('tarefas').select('*').order('criado_em', { ascending: false }),
    ])
    setProjetos(p ?? [])
    setTarefas(t ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function salvarProjeto() {
    if (!formP.nome.trim()) return
    setSalvando(true)
    await supabase.from('projetos').insert({ ...formP, status: 'ATIVO' })
    setModalP(false)
    setFormP({ nome: '', descricao: '', data_inicio: '', data_prevista_fim: '' })
    setSalvando(false)
    carregar()
  }

  async function salvarTarefa() {
    if (!formT.titulo.trim()) return
    setSalvando(true)
    await supabase.from('tarefas').insert({ ...formT, projeto_id: formT.projeto_id || null, status: 'PENDENTE' })
    setModalT(false)
    setFormT({ titulo: '', projeto_id: '', prioridade: 'MEDIA', data_vencimento: '' })
    setSalvando(false)
    carregar()
  }

  async function atualizarTarefa(id: string, status: string) {
    const updates: any = { status }
    if (status === 'CONCLUIDA') updates.data_conclusao = new Date().toISOString()
    await supabase.from('tarefas').update(updates).eq('id', id)
    setTarefas(prev => prev.map(t => t.id === id ? { ...t, status } : t))
  }

  return (
    <AppLayout>
      <Header title="Projetos e Tarefas" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-gray-500">{projetos.length} projetos · {tarefas.filter(t=>t.status!=='CONCLUIDA').length} tarefas pendentes</p>
          <div className="flex gap-2">
            <button onClick={() => setModalT(true)} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
              <Plus size={14} /> Nova Tarefa
            </button>
            <button onClick={() => setModalP(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              <Plus size={15} /> Novo Projeto
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {/* Tarefas sem projeto */}
            {tarefas.filter(t => !t.projeto_id).length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-purple-500" /> Tarefas Avulsas
                </h3>
                <div className="space-y-2">
                  {tarefas.filter(t => !t.projeto_id).map(t => (
                    <div key={t.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                      <button onClick={() => atualizarTarefa(t.id, t.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA')}>
                        {statusIcone(t.status)}
                      </button>
                      <span className={`text-sm flex-1 ${t.status==='CONCLUIDA'?'line-through text-gray-400':'text-gray-700'}`}>{t.titulo}</span>
                      {t.data_vencimento && <span className="text-xs text-gray-400">{new Date(t.data_vencimento).toLocaleDateString('pt-BR')}</span>}
                      <span className={prioridadeBadge[t.prioridade] ?? 'badge-gray'}>{t.prioridade}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projetos.length === 0 && tarefas.filter(t => !t.projeto_id).length === 0 && (
              <div className="card text-center py-16">
                <FolderKanban size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Nenhum projeto cadastrado</p>
              </div>
            )}

            {projetos.map(p => {
              const tProj = tarefas.filter(t => t.projeto_id === p.id)
              const concluidas = tProj.filter(t => t.status === 'CONCLUIDA').length
              const pct = tProj.length > 0 ? Math.round((concluidas / tProj.length) * 100) : 0
              return (
                <div key={p.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FolderKanban size={18} className="text-green-600" />
                      <h3 className="font-semibold text-gray-800">{p.nome}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setFormT(f=>({...f, projeto_id: p.id})); setModalT(true) }}
                        className="text-xs text-green-600 font-medium hover:underline flex items-center gap-1">
                        <Plus size={12} /> Tarefa
                      </button>
                      <span className="badge-green">Ativo</span>
                    </div>
                  </div>
                  {tProj.length > 0 && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{pct}% ({concluidas}/{tProj.length})</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {tProj.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">Nenhuma tarefa neste projeto</p>
                    ) : tProj.map(t => (
                      <div key={t.id} className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                        <button onClick={() => atualizarTarefa(t.id, t.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA')}>
                          {statusIcone(t.status)}
                        </button>
                        <span className={`text-sm flex-1 ${t.status==='CONCLUIDA'?'line-through text-gray-400':'text-gray-700'}`}>{t.titulo}</span>
                        <span className={prioridadeBadge[t.prioridade] ?? 'badge-gray'}>{t.prioridade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {modalP && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Projeto</h2>
              <div className="space-y-3">
                {[
                  { key: 'nome', label: 'Nome do Projeto *', type: 'text' },
                  { key: 'descricao', label: 'Descrição', type: 'text' },
                  { key: 'data_inicio', label: 'Data de Início', type: 'date' },
                  { key: 'data_prevista_fim', label: 'Previsão de Conclusão', type: 'date' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                    <input type={f.type} value={(formP as any)[f.key]} onChange={e => setFormP(p=>({...p,[f.key]:e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModalP(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                <button onClick={salvarProjeto} disabled={salvando} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  {salvando ? 'Salvando...' : 'Criar Projeto'}
                </button>
              </div>
            </div>
          </div>
        )}

        {modalT && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Nova Tarefa</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Título *</label>
                  <input type="text" value={formT.titulo} onChange={e => setFormT(p=>({...p,titulo:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Projeto (opcional)</label>
                  <select value={formT.projeto_id} onChange={e => setFormT(p=>({...p,projeto_id:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">Sem projeto</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Prioridade</label>
                  <select value={formT.prioridade} onChange={e => setFormT(p=>({...p,prioridade:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                    {['BAIXA','MEDIA','ALTA','URGENTE'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Data de Vencimento</label>
                  <input type="date" value={formT.data_vencimento} onChange={e => setFormT(p=>({...p,data_vencimento:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => { setModalT(false); setFormT(f=>({...f,projeto_id:''})) }} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                <button onClick={salvarTarefa} disabled={salvando} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  {salvando ? 'Salvando...' : 'Criar Tarefa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
