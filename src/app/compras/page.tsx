'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Plus, Truck } from 'lucide-react'

const STATUS: Record<string, { label: string; badge: string }> = {
  RASCUNHO:         { label: 'Rascunho',      badge: 'badge-gray' },
  ENVIADO:          { label: 'Enviado',        badge: 'badge-blue' },
  CONFIRMADO:       { label: 'Confirmado',     badge: 'badge-yellow' },
  RECEBIDO_PARCIAL: { label: 'Rec. Parcial',   badge: 'badge-orange' },
  RECEBIDO:         { label: 'Recebido',       badge: 'badge-green' },
  CANCELADO:        { label: 'Cancelado',      badge: 'badge-red' },
}

export default function ComprasPage() {
  const [pedidos, setPedidos] = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [modalForn, setModalForn] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState({ fornecedor_id: '', data_pedido: new Date().toISOString().split('T')[0], data_entrega_prevista: '', valor_total: '', observacoes: '' })
  const [formForn, setFormForn] = useState({ nome: '', cnpj_cpf: '', email: '', telefone: '', contato_responsavel: '', cidade: '', estado: '' })

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from('pedidos_compra').select('*, fornecedores(nome)').order('criado_em', { ascending: false })
    setPedidos(data ?? []); setLoading(false)
  }
  useEffect(() => {
    carregar()
    supabase.from('fornecedores').select('id, nome').eq('ativo', true).then(({ data }) => setFornecedores(data ?? []))
  }, [])

  async function salvarPedido() {
    if (!form.fornecedor_id) return
    setSalvando(true)
    const numero = `PC-${new Date().getFullYear()}-${String(pedidos.length + 1).padStart(3, '0')}`
    await supabase.from('pedidos_compra').insert({ ...form, numero, valor_total: Number(form.valor_total) || 0, status: 'RASCUNHO' })
    setModal(false); setForm({ fornecedor_id: '', data_pedido: new Date().toISOString().split('T')[0], data_entrega_prevista: '', valor_total: '', observacoes: '' })
    setSalvando(false); carregar()
  }
  async function salvarFornecedor() {
    if (!formForn.nome.trim()) return
    setSalvando(true)
    const { data } = await supabase.from('fornecedores').insert({ ...formForn, ativo: true }).select('id, nome').single()
    if (data) setFornecedores(prev => [...prev, data])
    setModalForn(false); setFormForn({ nome: '', cnpj_cpf: '', email: '', telefone: '', contato_responsavel: '', cidade: '', estado: '' })
    setSalvando(false)
  }
  async function atualizarStatus(id: string, status: string) {
    const up: any = { status }
    if (status === 'RECEBIDO') up.data_recebimento = new Date().toISOString().split('T')[0]
    await supabase.from('pedidos_compra').update(up).eq('id', id); carregar()
  }

  const totalAberto = pedidos.filter(p=>p.status!=='RECEBIDO'&&p.status!=='CANCELADO').reduce((s,p)=>s+(p.valor_total||0),0)

  return (
    <AppLayout>
      <Header title="Compras" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="card stat-accent-blue"><p className="text-2xl font-black text-white">{pedidos.filter(p=>p.status==='ENVIADO').length}</p><p className="text-xs mt-1" style={{color:'#3B82F6'}}>Aguardando Confirmação</p></div>
          <div className="card stat-accent-blue" style={{ borderLeftColor: '#F59E0B' }}><p className="text-2xl font-black text-white">{pedidos.filter(p=>p.status==='CONFIRMADO').length}</p><p className="text-xs mt-1" style={{color:'#F59E0B'}}>Aguardando Entrega</p></div>
          <div className="card stat-accent-orange"><p className="text-sm font-black text-white">R$ {totalAberto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p><p className="text-xs mt-1" style={{color:'#F97316'}}>Valor em Aberto</p></div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-bold text-white uppercase tracking-wide">Pedidos de Compra</h2>
          <div className="flex gap-2">
            <button onClick={() => setModalForn(true)} className="btn-ghost text-xs"><Truck size={13} /> Novo Fornecedor</button>
            <button onClick={() => setModal(true)} className="btn-primary text-xs"><Plus size={14} /> Novo Pedido</button>
          </div>
        </div>

        <div className="card overflow-hidden" style={{ padding: 0 }}>
          {loading ? (
            <div className="flex justify-center py-12"><div className="spinner" /></div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-16" style={{ color: '#444' }}>
              <ShoppingCart size={36} className="mx-auto mb-3" />
              <p className="text-sm">Nenhum pedido cadastrado</p>
            </div>
          ) : (
            <table className="vtable">
              <thead><tr>
                {['Número','Fornecedor','Data Pedido','Entrega Prevista','Valor Total','Status','Ação'].map(h=><th key={h}>{h}</th>)}
              </tr></thead>
              <tbody>
                {pedidos.map(p => {
                  const sc = STATUS[p.status] ?? { label: p.status, badge: 'badge-gray' }
                  return (
                    <tr key={p.id}>
                      <td><span className="font-mono text-xs font-bold" style={{ color: '#F97316' }}>{p.numero}</span></td>
                      <td className="font-semibold text-white">{p.fornecedores?.nome ?? '—'}</td>
                      <td style={{ color: '#9CA3AF' }}>{p.data_pedido ? new Date(p.data_pedido).toLocaleDateString('pt-BR') : '—'}</td>
                      <td style={{ color: '#9CA3AF' }}>{p.data_entrega_prevista ? new Date(p.data_entrega_prevista).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="font-bold text-white">R$ {Number(p.valor_total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                      <td><span className={sc.badge}>{sc.label}</span></td>
                      <td>
                        <select value={p.status} onChange={e => atualizarStatus(p.id, e.target.value)}
                          className="input text-xs" style={{ width: 'auto', padding: '4px 8px', height: 30 }}>
                          {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Pedido */}
        {modal && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="flex items-center gap-2 mb-5">
                <span style={{ width: 3, height: 18, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
                <h2 className="text-base font-black text-white">Novo Pedido de Compra</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Fornecedor *</label>
                  <select value={form.fornecedor_id} onChange={e => setForm(p=>({...p,fornecedor_id:e.target.value}))} className="input">
                    <option value="">Selecione o fornecedor</option>
                    {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                </div>
                {[
                  { key: 'data_pedido', label: 'Data do Pedido', type: 'date' },
                  { key: 'data_entrega_prevista', label: 'Entrega Prevista', type: 'date' },
                  { key: 'valor_total', label: 'Valor Total (R$)', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))} className="input" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm(p=>({...p,observacoes:e.target.value}))} rows={2} className="input resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={salvarPedido} disabled={salvando} className="btn-primary flex-1 justify-center" style={{ opacity: salvando ? .6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Criar Pedido'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Fornecedor */}
        {modalForn && (
          <div className="modal-bg">
            <div className="modal-box">
              <div className="flex items-center gap-2 mb-5">
                <span style={{ width: 3, height: 18, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
                <h2 className="text-base font-black text-white">Novo Fornecedor</h2>
              </div>
              <div className="space-y-3">
                {[
                  { key: 'nome', label: 'Nome / Razão Social *' },
                  { key: 'cnpj_cpf', label: 'CNPJ / CPF' },
                  { key: 'contato_responsavel', label: 'Responsável' },
                  { key: 'email', label: 'E-mail' },
                  { key: 'telefone', label: 'Telefone' },
                  { key: 'cidade', label: 'Cidade' },
                  { key: 'estado', label: 'Estado (UF)' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#9CA3AF' }}>{f.label}</label>
                    <input value={(formForn as any)[f.key]} onChange={e => setFormForn(p=>({...p,[f.key]:e.target.value}))} className="input" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModalForn(false)} className="btn-ghost flex-1 justify-center">Cancelar</button>
                <button onClick={salvarFornecedor} disabled={salvando} className="btn-primary flex-1 justify-center" style={{ opacity: salvando ? .6 : 1 }}>
                  {salvando ? 'Salvando...' : 'Salvar Fornecedor'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
