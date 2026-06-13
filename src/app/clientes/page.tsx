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
    setClientes(data ?? []); setLoading(false)
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

  const iconColors = ['#F97316','#1e88e5','#43a047','#8e24aa','#f44336','#00acc1']

  return (
    <AppLayout>
      <Header title="Clientes" subtitle="Gestão de relacionamentos" />
      <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="stat-card card-sm flex items-center gap-2" style={{ padding: '10px 16px' }}>
              <div className="stat-icon" style={{ background: '#fff3e0', width: 28, height: 28, borderRadius: 7 }}>
                <Users size={14} style={{ color: '#F97316' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Ativos</p>
                <p className="text-base font-black" style={{ color: '#F97316' }}>{clientes.filter(c=>c.ativo).length}</p>
              </div>
            </div>
            <div className="stat-card card-sm flex items-center gap-2" style={{ padding: '10px 16px' }}>
              <div className="stat-icon" style={{ background: '#f5f5f5', width: 28, height: 28, borderRadius: 7 }}>
                <Building2 size={14} style={{ color: '#757575' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>Total</p>
                <p className="text-base font-black" style={{ color: '#1a1d23' }}>{clientes.length}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9aa0a6' }} />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente..."
                className="input pl-8 text-xs" style={{ height: 34, width: 200 }} />
            </div>
            <button onClick={() => setModal(true)} className="btn-primary"><Plus size={14} /> Novo Cliente</button>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : filtrados.length === 0 ? (
          <div className="card text-center py-16">
            <Users size={40} className="mx-auto mb-3" style={{ color: '#dadce0' }} />
            <p className="text-sm font-semibold" style={{ color: '#1a1d23' }}>Nenhum cliente encontrado</p>
            <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>Clique em "Novo Cliente" para começar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map((c, idx) => {
              const cor = iconColors[idx % iconColors.length]
              return (
                <div key={c.id} className="card" style={{ borderTop: `3px solid ${c.ativo ? cor : '#e8eaed'}` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white"
                      style={{ background: c.ativo ? cor : '#e8eaed', color: c.ativo ? '#fff' : '#9aa0a6' }}>
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={c.ativo ? 'badge-green' : 'badge-gray'}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                      <button onClick={() => excluir(c.id)}
                        className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-50 transition-colors"
                        style={{ color: '#9aa0a6' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm mb-0.5" style={{ color: '#1a1d23' }}>{c.nome}</h3>
                  {c.contato_responsavel && <p className="text-xs mb-3" style={{ color: '#9aa0a6' }}>{c.contato_responsavel}</p>}
                  <div className="space-y-1.5 pt-3" style={{ borderTop: '1px solid #f0f2f5' }}>
                    {c.email && <div className="flex items-center gap-2 text-xs" style={{ color: '#5f6368' }}>
                      <Mail size={11} style={{ color: '#F97316' }} />{c.email}
                    </div>}
                    {c.telefone && <div className="flex items-center gap-2 text-xs" style={{ color: '#5f6368' }}>
                      <Phone size={11} style={{ color: '#F97316' }} />{c.telefone}
                    </div>}
                    {c.cidade && <div className="flex items-center gap-2 text-xs" style={{ color: '#5f6368' }}>
                      <MapPin size={11} style={{ color: '#F97316' }} />{c.cidade}{c.estado ? ` — ${c.estado}` : ''}
                    </div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {modal && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="flex items-center gap-2 mb-5">
                <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                  <Users size={15} style={{ color: '#F97316' }} />
                </div>
                <div>
                  <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>Novo Cliente</h2>
                  <p className="text-xs" style={{ color: '#9aa0a6' }}>Preencha os dados do cliente</p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'nome', label: 'Nome / Razão Social *' },
                  { key: 'cnpj_cpf', label: 'CNPJ / CPF' },
                  { key: 'contato_responsavel', label: 'Responsável' },
                  { key: 'email', label: 'E-mail' },
                  { key: 'telefone', label: 'Telefone / WhatsApp' },
                  { key: 'cidade', label: 'Cidade' },
                  { key: 'estado', label: 'Estado (UF)' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>{f.label}</label>
                    <input value={(form as any)[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} className="input" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 justify-center">
                  {salvando ? 'Salvando...' : 'Salvar Cliente'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppLayout>
  )
}
