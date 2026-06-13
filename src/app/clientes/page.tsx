'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { supabase, type Cliente } from '@/lib/supabase'
import { Users, Plus, Mail, MapPin, Phone, Search, Pencil, Trash2 } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', contato_responsavel: '', cidade: '', estado: '', cnpj_cpf: '', observacoes: '' })
  const [salvando, setSalvando] = useState(false)

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*').order('nome')
    setClientes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function salvar() {
    if (!form.nome.trim()) return
    setSalvando(true)
    await supabase.from('clientes').insert({ ...form, ativo: true })
    setForm({ nome: '', email: '', telefone: '', contato_responsavel: '', cidade: '', estado: '', cnpj_cpf: '', observacoes: '' })
    setModal(false)
    setSalvando(false)
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id)
    carregar()
  }

  const filtrados = clientes.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()) || (c.email ?? '').toLowerCase().includes(busca.toLowerCase()))
  const ativos = clientes.filter(c => c.ativo).length

  return (
    <AppLayout>
      <Header title="Clientes" />
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">{ativos} clientes ativos · {clientes.length} total</p>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..." className="pl-8 pr-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-48" />
            </div>
            <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              <Plus size={15} /> Novo Cliente
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : filtrados.length === 0 ? (
          <div className="card text-center py-16">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nenhum cliente encontrado</p>
            <p className="text-gray-400 text-sm mt-1">Clique em "Novo Cliente" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(c => (
              <div key={c.id} className={`card border-l-4 ${c.ativo ? 'border-green-500' : 'border-gray-300'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <span className="text-green-700 font-bold text-sm">{c.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={c.ativo ? 'badge-green' : 'badge-gray'}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                    <button onClick={() => excluir(c.id)} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600"><Trash2 size={13} /></button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm">{c.nome}</h3>
                {c.contato_responsavel && <p className="text-xs text-gray-500 mb-2">{c.contato_responsavel}</p>}
                <div className="space-y-1">
                  {c.email && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Mail size={11} /><span className="truncate">{c.email}</span></div>}
                  {c.telefone && <div className="flex items-center gap-1.5 text-xs text-gray-500"><Phone size={11} /><span>{c.telefone}</span></div>}
                  {c.cidade && <div className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin size={11} /><span>{c.cidade}{c.estado ? ` — ${c.estado}` : ''}</span></div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {modal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Cliente</h2>
              <div className="space-y-3">
                {[
                  { key: 'nome', label: 'Nome / Razão Social *', type: 'text' },
                  { key: 'cnpj_cpf', label: 'CNPJ / CPF', type: 'text' },
                  { key: 'contato_responsavel', label: 'Responsável', type: 'text' },
                  { key: 'email', label: 'E-mail', type: 'email' },
                  { key: 'telefone', label: 'Telefone / WhatsApp', type: 'text' },
                  { key: 'cidade', label: 'Cidade', type: 'text' },
                  { key: 'estado', label: 'Estado (UF)', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button onClick={salvar} disabled={salvando} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  {salvando ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
