'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Save, Lock, CheckCircle, AlertTriangle, Building2,
  Mail, Phone, MapPin, User, FileText, Power,
  Edit3, Info, X, Upload, Trash2
} from 'lucide-react'

type ClienteConfig = {
  id: string
  nome: string
  cnpj_cpf: string | null
  email: string | null
  telefone: string | null
  endereco: string | null
  cidade: string | null
  estado: string | null
  cep: string | null
  contato_responsavel: string | null
  ativo: boolean
  observacoes: string | null
  criado_em: string
  atualizado_em: string | null
}

type Sabor = {
  id: string
  nome: string
  volume_embalagem_ml: number
  perda_embalagem_pct: number
  perda_formulacao_pct: number
  unidades_por_caixa: number
  ativo: boolean
}

const UF_LIST = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO',
  'MA','MG','MS','MT','PA','PB','PE','PI','PR',
  'RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]

export default function ClienteConfiguracoes({
  clienteId,
  onClienteUpdate,
}: {
  clienteId: string
  onClienteUpdate?: (nome: string) => void
}) {
  const [cliente, setCliente] = useState<ClienteConfig | null>(null)
  const [sabores, setSabores] = useState<Sabor[]>([])
  const [form, setForm] = useState<Partial<ClienteConfig>>({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erro, setErro] = useState('')
  const [subAba, setSubAba] = useState<'dados' | 'sabores' | 'status'>('dados')
  const [modalSabor, setModalSabor] = useState(false)
  const [saborEdit, setSaborEdit] = useState<Sabor | null>(null)
  const [formSabor, setFormSabor] = useState({
    nome: '', volume_embalagem_ml: 250,
    perda_embalagem_pct: 5, perda_formulacao_pct: 5,
    unidades_por_caixa: 12,
  })
  const [salvandoSabor, setSalvandoSabor] = useState(false)
  const [confirmDesativar, setConfirmDesativar] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', clienteId).single(),
        supabase.from('cliente_sabores')
          .select('*').eq('cliente_id', clienteId).order('criado_em'),
      ])
      if (c) { setCliente(c); setForm(c) }
      setSabores(s ?? [])
      setLoading(false)
    }
    load()
  }, [clienteId])

  // ── SALVAR DADOS DO CLIENTE ───────────────────────────────────────────────
  const salvarDados = async () => {
    if (!form.email?.trim() && !form.telefone?.trim()) {
      setErro('Informe ao menos e-mail ou telefone.')
      return
    }
    setSalvando(true); setErro('')

    const payload: any = {
      email:               form.email               ?? null,
      telefone:            form.telefone             ?? null,
      endereco:            form.endereco             ?? null,
      cidade:              form.cidade               ?? null,
      estado:              form.estado               ?? null,
      cep:                 form.cep                  ?? null,
      contato_responsavel: form.contato_responsavel  ?? null,
      observacoes:         form.observacoes          ?? null,
    }

    const { error } = await supabase.from('clientes').update(payload).eq('id', clienteId)
    if (error) {
      setErro('Erro ao salvar. Tente novamente.')
    } else {
      setCliente(prev => prev ? { ...prev, ...payload } : prev)
      setSaved(true)
      if (onClienteUpdate && form.nome) onClienteUpdate(form.nome)
      setTimeout(() => setSaved(false), 2500)
    }
    setSalvando(false)
  }

  // ── SALVAR / EDITAR SABOR ─────────────────────────────────────────────────
  const abrirModalSabor = (sabor?: Sabor) => {
    if (sabor) {
      setSaborEdit(sabor)
      setFormSabor({
        nome:                    sabor.nome,
        volume_embalagem_ml:     sabor.volume_embalagem_ml,
        perda_embalagem_pct:     sabor.perda_embalagem_pct * 100,
        perda_formulacao_pct:    sabor.perda_formulacao_pct * 100,
        unidades_por_caixa:      sabor.unidades_por_caixa,
      })
    } else {
      setSaborEdit(null)
      setFormSabor({ nome: '', volume_embalagem_ml: 250, perda_embalagem_pct: 5, perda_formulacao_pct: 5, unidades_por_caixa: 12 })
    }
    setModalSabor(true)
  }

  const salvarSabor = async () => {
    if (!formSabor.nome.trim()) return
    setSalvandoSabor(true)
    const payload = {
      nome:                 formSabor.nome,
      volume_embalagem_ml:  formSabor.volume_embalagem_ml,
      perda_embalagem_pct:  formSabor.perda_embalagem_pct / 100,
      perda_formulacao_pct: formSabor.perda_formulacao_pct / 100,
      unidades_por_caixa:   formSabor.unidades_por_caixa,
    }

    if (saborEdit) {
      await supabase.from('cliente_sabores').update(payload).eq('id', saborEdit.id)
      setSabores(prev => prev.map(s => s.id === saborEdit.id ? { ...s, ...payload } : s))
    } else {
      const { data } = await supabase.from('cliente_sabores')
        .insert({ ...payload, cliente_id: clienteId, ativo: true })
        .select().single()
      if (data) setSabores(prev => [...prev, data])
    }

    setModalSabor(false)
    setSalvandoSabor(false)
  }

  const toggleSaborAtivo = async (id: string, ativo: boolean) => {
    await supabase.from('cliente_sabores').update({ ativo: !ativo }).eq('id', id)
    setSabores(prev => prev.map(s => s.id === id ? { ...s, ativo: !ativo } : s))
  }

  const desativarCliente = async () => {
    await supabase.from('clientes').update({ ativo: false }).eq('id', clienteId)
    setCliente(prev => prev ? { ...prev, ativo: false } : prev)
    setConfirmDesativar(false)
  }

  const reativarCliente = async () => {
    await supabase.from('clientes').update({ ativo: true }).eq('id', clienteId)
    setCliente(prev => prev ? { ...prev, ativo: true } : prev)
  }

  if (loading) return (
    <main className="p-6 flex justify-center py-16" style={{ background: '#f0f2f5' }}>
      <div className="spinner" />
    </main>
  )

  if (!cliente) return (
    <main className="p-6" style={{ background: '#f0f2f5' }}>
      <p style={{ color: '#9aa0a6' }}>Erro ao carregar configurações.</p>
    </main>
  )

  return (
    <main className="p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* Sub-abas */}
      <div className="flex gap-0 rounded-xl overflow-hidden"
        style={{ border: '1px solid #e8eaed', background: '#fff', width: 'fit-content' }}>
        {([
          { id: 'dados',   label: 'Dados Cadastrais', icon: Building2 },
          { id: 'sabores', label: 'Sabores / Produtos', icon: FileText },
          { id: 'status',  label: 'Status da Conta',  icon: Power },
        ] as const).map(sub => (
          <button key={sub.id} onClick={() => setSubAba(sub.id)}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all"
            style={subAba === sub.id
              ? { background: '#F97316', color: '#fff' }
              : { color: '#5f6368' }}>
            <sub.icon size={13} />
            {sub.label}
          </button>
        ))}
      </div>

      {/* ══ ABA: DADOS CADASTRAIS ════════════════════════════════════════════ */}
      {subAba === 'dados' && (
        <div className="space-y-4">

          {/* Campos BLOQUEADOS */}
          <div className="card" style={{ borderLeft: '4px solid #e8eaed' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="stat-icon" style={{ background: '#f5f5f5', width: 30, height: 30, borderRadius: 8 }}>
                <Lock size={14} style={{ color: '#9aa0a6' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>
                  Dados Protegidos
                </h3>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>
                  Não editáveis — para alteração, contate a VI.P & NÔUS
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#9aa0a6' }}>
                  <Lock size={11} /> Nome / Razão Social
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: '#fafafa', border: '1px solid #e8eaed' }}>
                  <Building2 size={14} style={{ color: '#dadce0' }} />
                  <span className="text-sm font-bold" style={{ color: '#3c4043' }}>
                    {cliente.nome}
                  </span>
                  <Lock size={11} className="ml-auto" style={{ color: '#dadce0' }} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#9aa0a6' }}>
                  <Lock size={11} /> CNPJ / CPF
                </label>
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: '#fafafa', border: '1px solid #e8eaed' }}>
                  <FileText size={14} style={{ color: '#dadce0' }} />
                  <span className="text-sm" style={{ color: '#9aa0a6' }}>
                    {cliente.cnpj_cpf || 'Não informado'}
                  </span>
                  <Lock size={11} className="ml-auto" style={{ color: '#dadce0' }} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-lg"
              style={{ background: '#f5f5f5' }}>
              <Info size={12} style={{ color: '#9aa0a6' }} className="mt-0.5 shrink-0" />
              <p className="text-xs" style={{ color: '#9aa0a6' }}>
                Nome e CNPJ são dados legais imutáveis pelo sistema. Para solicitar correção, entre em contato com a equipe VIABILIZZE.
              </p>
            </div>
          </div>

          {/* Campos EDITÁVEIS */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="stat-icon" style={{ background: '#fff3e0', width: 30, height: 30, borderRadius: 8 }}>
                  <Edit3 size={14} style={{ color: '#F97316' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Informações de Contato e Endereço</h3>
                  <p className="text-xs" style={{ color: '#9aa0a6' }}>Editáveis — alterações salvas imediatamente</p>
                </div>
              </div>
              {cliente.atualizado_em && (
                <p className="text-xs hidden sm:block" style={{ color: '#9aa0a6' }}>
                  Atualizado: {new Date(cliente.atualizado_em).toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Responsável */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#5f6368' }}>
                  <User size={11} style={{ color: '#F97316' }} /> Responsável / Contato Principal
                </label>
                <input
                  value={form.contato_responsavel ?? ''}
                  onChange={e => setForm(p => ({ ...p, contato_responsavel: e.target.value }))}
                  className="input"
                  placeholder="Nome do responsável"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#5f6368' }}>
                  <Mail size={11} style={{ color: '#F97316' }} /> E-mail
                </label>
                <input
                  type="email"
                  value={form.email ?? ''}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input"
                  placeholder="contato@empresa.com.br"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#5f6368' }}>
                  <Phone size={11} style={{ color: '#F97316' }} /> Telefone / WhatsApp
                </label>
                <input
                  value={form.telefone ?? ''}
                  onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))}
                  className="input"
                  placeholder="(11) 99999-9999"
                />
              </div>

              {/* CEP */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#5f6368' }}>
                  <MapPin size={11} style={{ color: '#F97316' }} /> CEP
                </label>
                <input
                  value={form.cep ?? ''}
                  onChange={e => setForm(p => ({ ...p, cep: e.target.value }))}
                  className="input"
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>

              {/* Endereço */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: '#5f6368' }}>
                  <MapPin size={11} style={{ color: '#F97316' }} /> Endereço
                </label>
                <input
                  value={form.endereco ?? ''}
                  onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))}
                  className="input"
                  placeholder="Rua, Nº, Complemento, Bairro"
                />
              </div>

              {/* Cidade */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Cidade</label>
                <input
                  value={form.cidade ?? ''}
                  onChange={e => setForm(p => ({ ...p, cidade: e.target.value }))}
                  className="input"
                  placeholder="São Paulo"
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Estado (UF)</label>
                <select
                  value={form.estado ?? ''}
                  onChange={e => setForm(p => ({ ...p, estado: e.target.value }))}
                  className="input"
                >
                  <option value="">Selecione</option>
                  {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>

              {/* Observações */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                  Observações / Notas Internas
                </label>
                <textarea
                  value={form.observacoes ?? ''}
                  onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  rows={3}
                  className="input resize-none"
                  placeholder="Notas sobre o cliente, setor, particularidades do contrato..."
                />
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div className="flex items-center gap-2 mt-4 px-3 py-2.5 rounded-xl"
                style={{ background: '#fce4ec', border: '1px solid #f48fb1' }}>
                <AlertTriangle size={14} style={{ color: '#c62828' }} />
                <p className="text-xs font-semibold" style={{ color: '#c62828' }}>{erro}</p>
              </div>
            )}

            {/* Botão salvar */}
            <div className="flex items-center justify-between mt-5 pt-4"
              style={{ borderTop: '1px solid #e8eaed' }}>
              <p className="text-xs" style={{ color: '#9aa0a6' }}>
                Campos com <span style={{ color: '#F97316' }}>●</span> são obrigatórios
              </p>
              <button
                onClick={salvarDados}
                disabled={salvando}
                className="btn-primary"
                style={{ opacity: salvando ? .6 : 1 }}
              >
                {saved
                  ? <><CheckCircle size={14} style={{ color: '#fff' }} /> Salvo!</>
                  : salvando
                  ? 'Salvando...'
                  : <><Save size={14} /> Salvar Alterações</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ ABA: SABORES / PRODUTOS ══════════════════════════════════════════ */}
      {subAba === 'sabores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Sabores e Produtos</h3>
              <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>
                Configurações de embalagem, perda e caixas por produto
              </p>
            </div>
            <button onClick={() => abrirModalSabor()} className="btn-primary text-xs">
              <FileText size={13} /> Novo Sabor
            </button>
          </div>

          {sabores.length === 0 ? (
            <div className="card text-center py-12" style={{ color: '#9aa0a6' }}>
              <FileText size={36} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhum sabor cadastrado.</p>
              <p className="text-xs mt-1">Clique em "Novo Sabor" para adicionar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sabores.map(s => (
                <div key={s.id} className="card"
                  style={{ borderTop: `3px solid ${s.ativo ? '#F97316' : '#e8eaed'}`, opacity: s.ativo ? 1 : 0.6 }}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-black" style={{ color: s.ativo ? '#1a1d23' : '#9aa0a6' }}>
                      {s.nome}
                    </h3>
                    <span className={s.ativo ? 'badge-orange' : 'badge-gray'}>
                      {s.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {[
                      { label: 'Volume Embalagem', value: `${s.volume_embalagem_ml} mL` },
                      { label: 'Unidades / Caixa', value: `${s.unidades_por_caixa} un` },
                      { label: 'Perda Embalagem', value: `${(s.perda_embalagem_pct * 100).toFixed(0)}%` },
                      { label: 'Perda Formulação', value: `${(s.perda_formulacao_pct * 100).toFixed(0)}%` },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: '#9aa0a6' }}>{item.label}</span>
                        <span className="text-xs font-bold" style={{ color: '#1a1d23' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-3" style={{ borderTop: '1px solid #f0f2f5' }}>
                    <button onClick={() => abrirModalSabor(s)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: '#fff3e0', color: '#e65100', border: '1px solid #ffe0b2' }}>
                      <Edit3 size={12} /> Editar
                    </button>
                    <button onClick={() => toggleSaborAtivo(s.id, s.ativo)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: s.ativo ? '#fce4ec' : '#e8f5e9',
                        color: s.ativo ? '#c62828' : '#2e7d32',
                        border: `1px solid ${s.ativo ? '#f48fb1' : '#a5d6a7'}`,
                      }}>
                      <Power size={12} /> {s.ativo ? 'Desativar' : 'Reativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="alert-info flex items-start gap-2">
            <Info size={13} style={{ color: '#1565c0' }} className="mt-0.5 shrink-0" />
            <p className="text-xs" style={{ color: '#1565c0' }}>
              Desativar um sabor não exclui seus dados. As rodadas e histórico são mantidos. Para excluir permanentemente, entre em contato com a VI.P & NÔUS.
            </p>
          </div>
        </div>
      )}

      {/* ══ ABA: STATUS DA CONTA ════════════════════════════════════════════ */}
      {subAba === 'status' && (
        <div className="space-y-4">

          {/* Status atual */}
          <div className="card" style={{ borderLeft: `4px solid ${cliente.ativo ? '#22c55e' : '#9aa0a6'}` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="stat-icon" style={{
                background: cliente.ativo ? '#e8f5e9' : '#f5f5f5',
                width: 36, height: 36, borderRadius: 10
              }}>
                <Power size={18} style={{ color: cliente.ativo ? '#2e7d32' : '#9aa0a6' }} />
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Status da Conta do Cliente</h3>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>
                  Conta criada em {new Date(cliente.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className={`ml-auto ${cliente.ativo ? 'badge-green' : 'badge-gray'}`}>
                {cliente.ativo ? 'Conta Ativa' : 'Conta Inativa'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Sabores Ativos', value: sabores.filter(s => s.ativo).length },
                { label: 'Total de Sabores', value: sabores.length },
                { label: 'Data de Criação', value: new Date(cliente.criado_em).toLocaleDateString('pt-BR') },
                { label: 'Última Atualização', value: cliente.atualizado_em ? new Date(cliente.atualizado_em).toLocaleDateString('pt-BR') : '—' },
              ].map(k => (
                <div key={k.label} className="p-3 rounded-xl" style={{ background: '#fafafa', border: '1px solid #f0f2f5' }}>
                  <p className="text-xs mb-0.5" style={{ color: '#9aa0a6' }}>{k.label}</p>
                  <p className="text-base font-black" style={{ color: '#1a1d23' }}>{k.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ações de status */}
          {cliente.ativo ? (
            <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="stat-icon" style={{ background: '#fce4ec', width: 32, height: 32, borderRadius: 8 }}>
                  <Power size={14} style={{ color: '#c62828' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Desativar Cliente</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>
                    O cliente será marcado como inativo. Todos os dados são preservados. A conta pode ser reativada a qualquer momento.
                  </p>
                </div>
              </div>

              {!confirmDesativar ? (
                <button
                  onClick={() => setConfirmDesativar(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                  style={{ background: '#fce4ec', color: '#c62828', border: '1px solid #f48fb1' }}>
                  <Power size={13} /> Desativar Este Cliente
                </button>
              ) : (
                <div className="p-4 rounded-xl space-y-3"
                  style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} style={{ color: '#f57f17' }} />
                    <p className="text-sm font-bold" style={{ color: '#e65100' }}>
                      Confirmar desativação de {cliente.nome}?
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: '#5f6368' }}>
                    Esta ação marcará a conta como inativa. Nenhum dado será perdido.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDesativar(false)} className="btn-ghost text-xs">
                      Cancelar
                    </button>
                    <button onClick={desativarCliente}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                      style={{ background: '#c62828', color: '#fff' }}>
                      <Power size={13} /> Sim, desativar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="stat-icon" style={{ background: '#e8f5e9', width: 32, height: 32, borderRadius: 8 }}>
                  <CheckCircle size={14} style={{ color: '#2e7d32' }} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Reativar Cliente</h3>
                  <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>
                    Esta conta está inativa. Clique para reativar e restaurar o acesso completo.
                  </p>
                </div>
              </div>
              <button onClick={reativarCliente}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold"
                style={{ background: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }}>
                <CheckCircle size={13} /> Reativar Cliente
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ MODAL SABOR ══════════════════════════════════════════════════════ */}
      {modalSabor && (
        <div className="modal-bg">
          <div className="modal-box">
            <div className="flex items-center gap-2 mb-5">
              <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
                <FileText size={14} style={{ color: '#F97316' }} />
              </div>
              <div>
                <h2 className="text-base font-bold" style={{ color: '#1a1d23' }}>
                  {saborEdit ? 'Editar Sabor' : 'Novo Sabor / Produto'}
                </h2>
                <p className="text-xs" style={{ color: '#9aa0a6' }}>
                  {saborEdit ? `Editando: ${saborEdit.nome}` : 'Adicione ao portfólio do cliente'}
                </p>
              </div>
              <button onClick={() => setModalSabor(false)} className="ml-auto" style={{ color: '#9aa0a6' }}>
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                  Nome do Produto / Sabor *
                </label>
                <input
                  value={formSabor.nome}
                  onChange={e => setFormSabor(p => ({ ...p, nome: e.target.value }))}
                  className="input"
                  placeholder="Ex: Pink Lemonade, Tropical, Manga..."
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    Volume da Embalagem (mL)
                  </label>
                  <input type="number" min={1} step={50}
                    value={formSabor.volume_embalagem_ml}
                    onChange={e => setFormSabor(p => ({ ...p, volume_embalagem_ml: Number(e.target.value) }))}
                    className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    Unidades por Caixa
                  </label>
                  <input type="number" min={1}
                    value={formSabor.unidades_por_caixa}
                    onChange={e => setFormSabor(p => ({ ...p, unidades_por_caixa: Number(e.target.value) }))}
                    className="input" />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    % Perda de Embalagem
                  </label>
                  <div className="relative">
                    <input type="number" min={0} max={50} step={0.5}
                      value={formSabor.perda_embalagem_pct}
                      onChange={e => setFormSabor(p => ({ ...p, perda_embalagem_pct: Number(e.target.value) }))}
                      className="input pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9aa0a6' }}>%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                    % Perda de Formulação
                  </label>
                  <div className="relative">
                    <input type="number" min={0} max={50} step={0.5}
                      value={formSabor.perda_formulacao_pct}
                      onChange={e => setFormSabor(p => ({ ...p, perda_formulacao_pct: Number(e.target.value) }))}
                      className="input pr-8" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#9aa0a6' }}>%</span>
                  </div>
                </div>
              </div>

              {/* Preview do cálculo */}
              {formSabor.volume_embalagem_ml > 0 && formSabor.unidades_por_caixa > 0 && (
                <div className="p-3 rounded-xl" style={{ background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                  <p className="text-xs font-bold mb-1" style={{ color: '#1565c0' }}>Preview do Cálculo</p>
                  <p className="text-xs" style={{ color: '#5f6368' }}>
                    Por caixa: {formSabor.unidades_por_caixa} × {formSabor.volume_embalagem_ml}mL
                    = {(formSabor.unidades_por_caixa * formSabor.volume_embalagem_ml / 1000).toFixed(2)} L
                  </p>
                  <p className="text-xs" style={{ color: '#5f6368' }}>
                    Perdas totais: {(formSabor.perda_embalagem_pct + formSabor.perda_formulacao_pct).toFixed(0)}%
                    ({formSabor.perda_embalagem_pct}% embalagem + {formSabor.perda_formulacao_pct}% formulação)
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalSabor(false)} className="btn-ghost flex-1 justify-center">
                Cancelar
              </button>
              <button onClick={salvarSabor} disabled={salvandoSabor || !formSabor.nome.trim()}
                className="btn-primary flex-1 justify-center"
                style={{ opacity: (salvandoSabor || !formSabor.nome.trim()) ? .6 : 1 }}>
                {salvandoSabor ? 'Salvando...' : saborEdit ? 'Salvar Edição' : 'Criar Sabor'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
