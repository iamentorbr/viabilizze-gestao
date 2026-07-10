'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  Sparkles, ArrowLeft, TrendingUp, Users, CreditCard,
  XCircle, Crown, Calendar, Mail, CheckCircle, Clock,
  AlertTriangle, RefreshCw
} from 'lucide-react'

type Assinatura = {
  id: string
  nome_comprador: string
  email_comprador: string
  plano: string
  status: string
  valor_total: number
  data_inicio: string
  data_expiracao: string
  criado_em: string
  produtos_viabilizze: { nome: string }
}

type Resumo = {
  total: number
  ativas: number
  expiradas: number
  canceladas: number
  mrr: number
  arr: number
  totalRecebido: number
}

export default function DigitalPage() {
  const router = useRouter()
  const [assinaturas, setAssinaturas] = useState<Assinatura[]>([])
  const [usuarios, setUsuarios]       = useState<any[]>([])
  const [produtos, setProdutos]       = useState<any[]>([])
  const [loading, setLoading]         = useState(true)
  const [filtro, setFiltro]           = useState('TODOS')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    setLoading(true)
    const [{ data: ass }, { data: usr }, { data: prod }] = await Promise.all([
      supabase.from('assinaturas_produtos')
        .select('*, produtos_viabilizze(nome)')
        .order('criado_em', { ascending: false }),
      supabase.from('usuarios_externos')
        .select('*').order('criado_em', { ascending: false }),
      supabase.from('produtos_viabilizze')
        .select('*').eq('ativo', true).order('nome'),
    ])
    setAssinaturas(ass ?? [])
    setUsuarios(usr ?? [])
    setProdutos(prod ?? [])
    setLoading(false)
  }

  const resumo: Resumo = {
    total:         assinaturas.length,
    ativas:        assinaturas.filter(a => a.status === 'ATIVA').length,
    expiradas:     assinaturas.filter(a => a.status === 'EXPIRADA').length,
    canceladas:    assinaturas.filter(a => a.status === 'CANCELADA').length,
    mrr: assinaturas.filter(a => a.status === 'ATIVA').reduce((s, a) => {
      const meses = a.plano === 'ANUAL' ? 12 : 6
      return s + (Number(a.valor_total) / meses)
    }, 0),
    arr: assinaturas.filter(a => a.status === 'ATIVA').reduce((s, a) => {
      const meses = a.plano === 'ANUAL' ? 12 : 6
      return s + (Number(a.valor_total) / meses) * 12
    }, 0),
    totalRecebido: assinaturas
      .filter(a => a.status !== 'CANCELADA')
      .reduce((s, a) => s + Number(a.valor_total), 0),
  }

  const listagem = filtro === 'TODOS'
    ? assinaturas
    : assinaturas.filter(a => a.status === filtro)

  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const dataFmt = (d: string) => new Date(d).toLocaleDateString('pt-BR')

  const STATUS_STYLE: Record<string, { label: string; badge: string; color: string }> = {
    ATIVA:       { label: 'Ativa',       badge: 'badge-green',  color: '#2e7d32' },
    EXPIRADA:    { label: 'Expirada',    badge: 'badge-gray',   color: '#757575' },
    CANCELADA:   { label: 'Cancelada',   badge: 'badge-red',    color: '#c62828' },
    INADIMPLENTE:{ label: 'Inadimp.',    badge: 'badge-yellow', color: '#f57f17' },
    PENDENTE:    { label: 'Pendente',    badge: 'badge-blue',   color: '#1565c0' },
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f0f2f5' }}>

      {/* Sidebar Digital */}
      <aside className="fixed inset-y-0 left-0 w-56 flex flex-col z-30"
        style={{ background: '#1a1d23' }}>
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid #252931' }}>
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-xs mb-3"
            style={{ color: '#5f6875' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#F97316')}
            onMouseLeave={e => (e.currentTarget.style.color = '#5f6875')}>
            <ArrowLeft size={12} /> Trocar ambiente
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#993C1D' }}>
              <Sparkles size={15} color="#fff" />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-tight">Produtos</p>
              <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>Digitais VIABILIZZE</p>
            </div>
          </div>
        </div>

        {/* Produtos cadastrados */}
        <div className="px-4 py-3" style={{ borderBottom: '1px solid #252931' }}>
          <p className="text-xs font-bold mb-2" style={{ color: '#5f6875' }}>PRODUTOS ATIVOS</p>
          {produtos.map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1.5">
              <Crown size={12} style={{ color: '#F97316' }} />
              <p className="text-xs text-white truncate">{p.nome}</p>
            </div>
          ))}
          {produtos.length === 0 && (
            <p className="text-xs" style={{ color: '#5f6875' }}>Nenhum produto</p>
          )}
        </div>

        <nav className="flex-1 py-3 px-4 space-y-1">
          {[
            { id: 'TODOS', label: `Todas (${resumo.total})` },
            { id: 'ATIVA', label: `Ativas (${resumo.ativas})` },
            { id: 'EXPIRADA', label: `Expiradas (${resumo.expiradas})` },
            { id: 'CANCELADA', label: `Canceladas (${resumo.canceladas})` },
          ].map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              className="w-full text-left px-3 py-2 rounded-lg text-xs transition-all"
              style={filtro === f.id
                ? { background: 'rgba(153,60,29,0.2)', color: '#F0997B', fontWeight: 700 }
                : { color: '#8b9199' }}>
              {f.label}
            </button>
          ))}
        </nav>

        <div className="px-3 mb-4">
          <div className="px-3 py-2.5 rounded-xl" style={{ background: '#252931' }}>
            <p className="text-xs font-bold" style={{ color: '#993C1D' }}>PRODUTOS DIGITAIS</p>
            <p className="text-xs mt-0.5" style={{ color: '#5f6875' }}>Painel interno</p>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1" style={{ marginLeft: 224 }}>
        <header className="sticky top-0 z-20 flex items-center justify-between px-6"
          style={{ background: '#f0f2f5', borderBottom: '1px solid #e8eaed', height: 54 }}>
          <div className="flex items-center gap-2">
            <span style={{ width: 3, height: 16, background: '#F97316', borderRadius: 2, display: 'inline-block' }} />
            <h1 className="text-sm font-black uppercase tracking-wide" style={{ color: '#1a1d23' }}>
              Produtos Digitais
            </h1>
          </div>
          <button onClick={carregar}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
            style={{ background: '#fff', border: '1px solid #e8eaed', color: '#5f6368' }}>
            <RefreshCw size={12} /> Atualizar
          </button>
        </header>

        <main className="p-6 space-y-5">

          {/* KPIs financeiros */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'MRR',            value: brl(resumo.mrr),           color: '#2e7d32', bg: '#e8f5e9', icon: TrendingUp,  tip: 'Receita mensal recorrente' },
              { label: 'ARR',            value: brl(resumo.arr),           color: '#1565c0', bg: '#e3f2fd', icon: Calendar,    tip: 'Receita anual recorrente' },
              { label: 'Total recebido', value: brl(resumo.totalRecebido), color: '#F97316', bg: '#fff3e0', icon: CreditCard,  tip: 'Acumulado histórico' },
              { label: 'Assinantes ativos', value: resumo.ativas,          color: '#8e24aa', bg: '#f3e5f5', icon: Users,       tip: 'Usuários com acesso ativo' },
            ].map(k => (
              <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{k.label}</p>
                    <p className="text-xl font-black" style={{ color: k.color }}>{k.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#9aa0a6' }}>{k.tip}</p>
                  </div>
                  <div className="stat-icon" style={{ background: k.bg }}>
                    <k.icon size={16} style={{ color: k.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Usuários externos */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
              <Mail size={14} style={{ color: '#F97316' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Usuários Externos</h3>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#fff3e0', color: '#F97316' }}>
                {usuarios.length} cadastrados
              </span>
            </div>
            {usuarios.length === 0 ? (
              <div className="text-center py-10" style={{ color: '#9aa0a6' }}>
                <Users size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum usuário externo ainda.</p>
                <p className="text-xs mt-1">Serão criados automaticamente após o primeiro pagamento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="vtable">
                  <thead><tr>
                    <th>Nome</th><th>E-mail</th><th>Status</th>
                    <th>Cadastro</th><th>Último acesso</th>
                  </tr></thead>
                  <tbody>
                    {usuarios.map(u => (
                      <tr key={u.id}>
                        <td className="font-semibold" style={{ color: '#1a1d23' }}>{u.nome}</td>
                        <td style={{ color: '#5f6368', fontSize: 12 }}>{u.email}</td>
                        <td>
                          {u.ativo
                            ? <span className="badge-green flex items-center gap-1 w-fit"><CheckCircle size={11} /> Ativo</span>
                            : <span className="badge-red flex items-center gap-1 w-fit"><XCircle size={11} /> Inativo</span>}
                        </td>
                        <td style={{ color: '#9aa0a6', fontSize: 12 }}>{dataFmt(u.criado_em)}</td>
                        <td style={{ color: '#9aa0a6', fontSize: 12 }}>
                          {u.ultimo_acesso ? dataFmt(u.ultimo_acesso) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Assinaturas */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
              <Crown size={14} style={{ color: '#F97316' }} />
              <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Assinaturas</h3>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: '#fff3e0', color: '#F97316' }}>
                {listagem.length} registros
              </span>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><div className="spinner" /></div>
            ) : listagem.length === 0 ? (
              <div className="text-center py-10" style={{ color: '#9aa0a6' }}>
                <Clock size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhuma assinatura encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="vtable">
                  <thead><tr>
                    <th>Comprador</th><th>Produto</th><th>Plano</th>
                    <th className="text-right">Valor</th><th>Status</th>
                    <th>Início</th><th>Expira</th>
                  </tr></thead>
                  <tbody>
                    {listagem.map(a => {
                      const ss = STATUS_STYLE[a.status] ?? STATUS_STYLE.PENDENTE
                      const expirando = a.status === 'ATIVA' &&
                        new Date(a.data_expiracao) < new Date(Date.now() + 15 * 86400000)
                      return (
                        <tr key={a.id}>
                          <td>
                            <p className="font-semibold text-sm" style={{ color: '#1a1d23' }}>
                              {a.nome_comprador || '—'}
                            </p>
                            <p className="text-xs" style={{ color: '#9aa0a6' }}>{a.email_comprador}</p>
                          </td>
                          <td style={{ color: '#5f6368', fontSize: 12 }}>
                            {a.produtos_viabilizze?.nome ?? '—'}
                          </td>
                          <td>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                              style={a.plano === 'ANUAL'
                                ? { background: '#e3f2fd', color: '#1565c0' }
                                : { background: '#f3e5f5', color: '#6a1b9a' }}>
                              {a.plano === 'ANUAL' ? 'Anual' : 'Semestral'}
                            </span>
                          </td>
                          <td className="text-right font-bold" style={{ color: '#1a1d23' }}>
                            {brl(Number(a.valor_total))}
                          </td>
                          <td><span className={ss.badge}>{ss.label}</span></td>
                          <td style={{ color: '#9aa0a6', fontSize: 12 }}>
                            {a.data_inicio ? dataFmt(a.data_inicio) : '—'}
                          </td>
                          <td>
                            <p style={{ color: expirando ? '#c62828' : '#9aa0a6', fontSize: 12, fontWeight: expirando ? 700 : 400 }}>
                              {a.data_expiracao ? dataFmt(a.data_expiracao) : '—'}
                            </p>
                            {expirando && (
                              <p className="flex items-center gap-1 text-xs font-bold" style={{ color: '#c62828' }}>
                                <AlertTriangle size={10} /> Expira em breve
                              </p>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
