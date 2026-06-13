'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { ShoppingCart, Plus, Truck } from 'lucide-react'

const statusConfig: Record<string, { label: string; badge: string }> = {
  RASCUNHO:         { label: 'Rascunho',        badge: 'badge-gray' },
  ENVIADO:          { label: 'Enviado',          badge: 'badge-blue' },
  CONFIRMADO:       { label: 'Confirmado',       badge: 'badge-yellow' },
  RECEBIDO_PARCIAL: { label: 'Rec. Parcial',     badge: 'badge-yellow' },
  RECEBIDO:         { label: 'Recebido',         badge: 'badge-green' },
  CANCELADO:        { label: 'Cancelado',        badge: 'badge-red' },
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
    setPedidos(data ?? [])
    setLoading(false)
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
    setModal(false)
    setForm({ fornecedor_id: '', data_pedido: new Date().toISOString().split('T')[0], data_entrega_prevista: '', valor_total: '', observacoes: '' })
    setSalvando(false)
    carregar()
  }

  async function salvarFornecedor() {
    if (!formForn.nome.trim()) return
    setSalvando(true)
    const { data } = await supabase.from('fornecedores').insert({ ...formForn, ativo: true }).select('id, nome').single()
    if (data) setFornecedores(prev => [...prev, data])
    setModalForn(false)
    setFormForn({ nome: '', cnpj_cpf: '', email: '', telefone: '', contato_responsavel: '', cidade: '', estado: '' })
    setSalvando(false)
  }

  async function atualizarStatus(id: string, status: string) {
    const updates: any = { status }
    if (status === 'RECEBIDO') updates.data_recebimento = new Date().toISOString().split('T')[0]
    await supabase.from('pedidos_compra').update(updates).eq('id', id)
    carregar()
  }

  const totalAberto = pedidos.filter(p=>p.status!=='RECEBIDO'&&p.status!=='CANCELADO').reduce((s,p)=>s+(p.valor_total||0),0)

  return (
    <AppLayout>
      <Header title="Compras" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="card border-l-4 border-blue-500">
            <p className="text-2xl font-bold text-blue-600">{pedidos.filter(p=>p.status==='ENVIADO').length}</p>
            <p className="text-xs text-gray-500">Aguardando Confirmação</p>
          </div>
          <div className="card border-l-4 border-yellow-400">
            <p className="text-2xl font-bold text-yellow-500">{pedidos.filter(p=>p.status==='CONFIRMADO').length}</p>
            <p className="text-xs text-gray-500">Aguardando Entrega</p>
          </div>
          <div className="card border-l-4 border-green-500">
            <p className="text-sm font-bold text-green-600">R$ {totalAberto.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
            <p className="text-xs text-gray-500">Valor em Aberto</p>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold text-gray-700">Pedidos de Compra</h2>
          <div className="flex gap-2">
            <button onClick={() => setModalForn(true)} className="flex items-center gap-2 border border-gray-200 text-gray-600 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
              <Truck size={14} /> Novo Fornecedor
            </button>
            <button onClick={() => setModal(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
              <Plus size={15} /> Novo Pedido
            </button>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Nenhum pedido de compra cadastrado</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>{['Número','Fornecedor','Data Pedido','Entrega Prevista','Valor Total','Status','Ação'].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pedidos.map(p => {
                  const sc = statusConfig[p.status] ?? { label: p.status, badge: 'badge-gray' }
                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-green-700">{p.numero}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{p.fornecedores?.nome ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.data_pedido ? new Date(p.data_pedido).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{p.data_entrega_prevista ? new Date(p.data_entrega_prevista).toLocaleDateString('pt-BR') : '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">R$ {Number(p.valor_total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
                      <td className="px-4 py-3"><span className={sc.badge}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <select value={p.status} onChange={e => atualizarStatus(p.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                          {Object.entries(statusConfig).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
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
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Pedido de Compra</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Fornecedor *</label>
                  <select value={form.fornecedor_id} onChange={e => setForm(p=>({...p,fornecedor_id:e.target.value}))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
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
                    <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                    <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1">Observações</label>
                  <textarea value={form.observacoes} onChange={e => setForm(p=>({...p,observacoes:e.target.value}))} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                <button onClick={salvarPedido} disabled={salvando} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
                  {salvando ? 'Salvando...' : 'Criar Pedido'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Fornecedor */}
        {modalForn && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Novo Fornecedor</h2>
              <div className="space-y-3">
                {[
                  { key: 'nome', label: 'Nome / Razão Social *', type: 'text' },
                  { key: 'cnpj_cpf', label: 'CNPJ / CPF', type: 'text' },
                  { key: 'contato_responsavel', label: 'Responsável', type: 'text' },
                  { key: 'email', label: 'E-mail', type: 'email' },
                  { key: 'telefone', label: 'Telefone', type: 'text' },
                  { key: 'cidade', label: 'Cidade', type: 'text' },
                  { key: 'estado', label: 'Estado (UF)', type: 'text' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-gray-600 block mb-1">{f.label}</label>
                    <input type={f.type} value={(formForn as any)[f.key]} onChange={e => setFormForn(p=>({...p,[f.key]:e.target.value}))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-5">
                <button onClick={() => setModalForn(false)} className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                <button onClick={salvarFornecedor} disabled={salvando} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60">
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
