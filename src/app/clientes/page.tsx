'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { supabase, type Cliente } from '@/lib/supabase'
import { Users, Plus, Mail, MapPin, Phone, Search, Trash2, Building2 } from 'lucide-react'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [modal, setModal] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', contato_responsavel: '', cidade: '', estado: '', cnpj_cpf: '', observacoes: '' })

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
    setModal(false); setSalvando(false); carregar()
  }
  async function excluir(id: string) {
    if (!confirm('Excluir este cliente?')) return
    await supabase.from('clientes').delete().eq('id', id); carregar()
  }

  const filtrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (c.email ?? '').toLowerCase().includes(busca.toLowerCase())
  )

  const fields = [
    { key: 'nome', label: 'Nome / Razão Social *' },
    { key: 'cnpj_cpf', label: 'CNPJ / CPF' },
    { key: 'contato_responsavel', label: 'Responsável' },
    { key: 'email', label: 'E-mail' },
    { key: 'telefone', label: 'Telefone / WhatsApp' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'estado', label: 'Estado (UF)' },
  ]

  return (
    <AppLayout>
      <Header title="Clientes" />
      <div className="p-6 space-y-5">

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="card px-4 py-2.5 flex items-center gap-2" style={{ padding: '10px 16px' }}>
              <Users size={14} style={{ color: '#F97316' }} />
              <span className="text-xs font-bold text-white">{clientes.filter(c=>c.ativo).length}</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>ativos</span>
            </div>
            <div className="card px-4 py-2.5 flex items-center gap-2" style={{ padding: '10px 16px' }}>
              <Building2 size={14} style={{ color: '#9CA3AF' }} />
              <span className="text-xs font-bold text-white">{clientes.length}</span>
              <span className="text-xs" style={{ color: '#6B7280' }}>total</span>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#6B7280' }} />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..."
                className="input pl-8 h-8 text-xs w-48" />
            </div>
            <button onClick={() => setModal(true)} className="btn-primary text-xs">
              <Plus size={14} /> Novo Cliente
            </button>
          </div>
        </div>

        {/* Grid de cards */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : filtrados.length === 0 ? (
          <div className="card text-center py-16">
            <Users size={40} className="mx-auto mb-3" style={{ color: '#333' }} />
            <p className="text-sm font-semibold text-white">Nenhum cliente encontrado</p>
            <p className="text-xs mt-1" style={{ color: '#6B7280' }}>Clique em "Novo Cliente" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(c => (
              <div key={c.id} className="card card-hover" style={{ borderLeft: `3px solid ${c.ativo ? '#F97316' : '#333'}` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm"
                    style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={c.ativo ? 'badge-orange' : 'badge-gray'}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                    <button onClick={() => excluir(c.id)}
                      className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                      style={{ color: '#6B7280' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-white text-sm mb-0.5">{c.nome}</h3>
                {c.contato_responsavel && <p className="text-xs mb-2" style={{ color: '#9CA3AF' }}>{c.contato_responsavel}</p>}
                <div className="space-y-1.5 mt-3 pt-3" style={{ borderTop: '1px solid #222' }}>
                  {c.email && <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}><Mail size={11} style={{ color: '#F97316' }} />{c.email}</div>}
                  {c.telefone && <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}><Phone size={11} style={{ color: '#F97316' }} />{c.telefone}</div>}
                  {c.cidade && <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}><MapPin size={11} style={{ color: '#F97316' }} />{c.cidade}{c.estado ? ` — ${c.estado}` : ''}</div>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {modal && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="flex items-center gap-2 mb-5">
                <span style={{ width: 3, height: 18, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
                <h2 className="text-base font-black text-white">Novo Cliente</h2>
              </div>
              <div className="space-y-3">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} className="input" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2}
                    className="input resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center" style={{ opacity: salvando ? .6 : 1 }}>
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
