'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users, Beaker, Package, TrendingUp, Lock, Eye, EyeOff,
  CheckCircle, AlertTriangle, ArrowRight, ShieldCheck, Star, Clock
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const SENHA_CORRETA = '123456'

export default function DashboardViabilizze() {
  const router = useRouter()
  const [autenticado, setAutenticado] = useState(false)
  const [modalSenha, setModalSenha] = useState(false)
  const [senha, setSenha] = useState('')
  const [senhaVisivel, setSenhaVisivel] = useState(false)
  const [erro, setErro] = useState('')
  const [tentativas, setTentativas] = useState(0)

  // Dados do dashboard
  const [dados, setDados] = useState({
    clientesAtivos: 0, clientesTotal: 0,
    totalSabores: 0, totalMPs: 0, mpsCriticas: 0,
    rodadasTotal: 0, movimentacoes: 0,
  })
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se já está autenticado na sessão
    const auth = sessionStorage.getItem('vip_dash_auth')
    if (auth === 'true') setAutenticado(true)
    else setModalSenha(true)
  }, [])

  useEffect(() => {
    if (!autenticado) return
    async function load() {
      const [
        { data: cli },
        { data: sabores },
        { data: mps },
        { data: rodadas },
        { data: movs },
      ] = await Promise.all([
        supabase.from('clientes').select('*, cliente_sabores(id, nome)').order('nome'),
        supabase.from('cliente_sabores').select('id'),
        supabase.from('cliente_materias_primas').select('estoque_atual, estoque_minimo'),
        supabase.from('producao_rodadas').select('id'),
        supabase.from('cliente_mp_movimentacoes').select('id'),
      ])
      setClientes(cli ?? [])
      setDados({
        clientesAtivos: cli?.filter(c => c.ativo).length ?? 0,
        clientesTotal: cli?.length ?? 0,
        totalSabores: sabores?.length ?? 0,
        totalMPs: mps?.length ?? 0,
        mpsCriticas: mps?.filter(m => Number(m.estoque_atual) <= Number(m.estoque_minimo)).length ?? 0,
        rodadasTotal: rodadas?.length ?? 0,
        movimentacoes: movs?.length ?? 0,
      })
      setLoading(false)
    }
    load()
  }, [autenticado])

  const tentarLogin = () => {
    if (senha === SENHA_CORRETA) {
      sessionStorage.setItem('vip_dash_auth', 'true')
      setAutenticado(true)
      setModalSenha(false)
      setSenha('')
      setErro('')
    } else {
      setTentativas(t => t + 1)
      setErro(`Senha incorreta. Tentativa ${tentativas + 1}/5.`)
      setSenha('')
      if (tentativas >= 4) {
        setErro('Muitas tentativas. Aguarde.')
        setTimeout(() => { setTentativas(0); setErro('') }, 30000)
      }
    }
  }

  // ── MODAL DE SENHA ────────────────────────────────────────────────────────
  if (modalSenha && !autenticado) return (
    <main className="flex-1 flex items-center justify-center p-6" style={{ background: '#f0f2f5', minHeight: '60vh' }}>
      <div className="w-full max-w-sm">

        {/* Card de boas-vindas */}
        <div className="card mb-4 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: '#1a1d23' }}>
            <span className="font-black text-2xl" style={{ color: '#F97316' }}>V</span>
          </div>
          <h2 className="text-lg font-black mb-1" style={{ color: '#1a1d23' }}>
            VIABILIZZE <span style={{ color: '#F97316' }}>|</span> Assessoria Industrial
          </h2>
          <p className="text-sm mb-2" style={{ color: '#9aa0a6' }}>Assessoria Industrial</p>

          {/* Mensagem especial */}
          <div className="mt-3 p-3 rounded-xl" style={{ background: 'linear-gradient(135deg, #fff3e0, #fff9f5)', border: '1px solid #ffe0b2' }}>
            <p className="text-sm font-bold" style={{ color: '#e65100' }}>
              👋 Você gostaria de acessar seu sistema?
            </p>
            <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>
              Este é o painel estratégico da VIABILIZZE. Insira sua senha para continuar.
            </p>
          </div>
        </div>

        {/* Formulário de senha */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="stat-icon" style={{ background: '#fff3e0', width: 32, height: 32, borderRadius: 8 }}>
              <Lock size={15} style={{ color: '#F97316' }} />
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#1a1d23' }}>Acesso Restrito</p>
              <p className="text-xs" style={{ color: '#9aa0a6' }}>Dashboard VIABILIZZE | Assessoria Industrial</p>
            </div>
          </div>

          <label className="block text-xs font-semibold mb-2" style={{ color: '#5f6368' }}>Senha</label>
          <div className="relative mb-3">
            <input
              type={senhaVisivel ? 'text' : 'password'}
              value={senha}
              onChange={e => { setSenha(e.target.value); setErro('') }}
              onKeyDown={e => e.key === 'Enter' && tentarLogin()}
              className="input pr-10"
              placeholder="Digite sua senha"
              autoFocus
              style={{ letterSpacing: senhaVisivel ? 'normal' : '0.2em' }}
            />
            <button onClick={() => setSenhaVisivel(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: '#9aa0a6' }}>
              {senhaVisivel ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {erro && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3"
              style={{ background: '#fce4ec', border: '1px solid #f48fb1' }}>
              <AlertTriangle size={13} style={{ color: '#c62828' }} />
              <p className="text-xs font-semibold" style={{ color: '#c62828' }}>{erro}</p>
            </div>
          )}

          <button onClick={tentarLogin} disabled={!senha || tentativas >= 5}
            className="btn-primary w-full justify-center"
            style={{ opacity: (!senha || tentativas >= 5) ? .6 : 1 }}>
            <ShieldCheck size={15} /> Acessar Dashboard
          </button>

          <p className="text-xs text-center mt-3" style={{ color: '#9aa0a6' }}>
            Para suporte, contate a equipe VIABILIZZE
          </p>
        </div>
      </div>
    </main>
  )

  // ── DASHBOARD AUTENTICADO ─────────────────────────────────────────────────
  if (loading) return (
    <main className="flex-1 flex justify-center py-16" style={{ background: '#f0f2f5' }}>
      <div className="spinner" />
    </main>
  )

  return (
    <main className="p-6 space-y-5" style={{ background: '#f0f2f5' }}>

      {/* Banner */}
      <div className="rounded-xl px-6 py-5 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1a1d23 0%, #252931 100%)', border: '1px solid #2a2d33' }}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={14} style={{ color: '#F97316' }} />
            <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#F97316' }}>
              Painel Estratégico
            </span>
          </div>
          <h1 className="text-xl font-black text-white">VIABILIZZE | Assessoria Industrial</h1>
          <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>
            Assessoria Industrial · Alimentos & Bebidas
          </p>
        </div>
        <button onClick={() => { sessionStorage.removeItem('vip_dash_auth'); setAutenticado(false); setModalSenha(true) }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.05)', color: '#9aa0a6', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Lock size={11} /> Bloquear
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Clientes Ativos',    value: dados.clientesAtivos, sub: `${dados.clientesTotal} total`, color: '#F97316', bg: '#fff3e0', icon: Users },
          { label: 'Produtos / Sabores', value: dados.totalSabores,   sub: 'formulações ativas', color: '#8e24aa', bg: '#f3e5f5', icon: Beaker },
          { label: 'Matérias-Primas',    value: dados.totalMPs,       sub: `${dados.mpsCriticas} críticas`, color: dados.mpsCriticas > 0 ? '#c62828' : '#2e7d32', bg: dados.mpsCriticas > 0 ? '#fce4ec' : '#e8f5e9', icon: Package },
          { label: 'Rodadas de Produção',value: dados.rodadasTotal,   sub: 'registradas', color: '#1565c0', bg: '#e3f2fd', icon: TrendingUp },
        ].map(k => (
          <div key={k.label} className="stat-card" style={{ borderTop: `3px solid ${k.color}` }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{k.label}</p>
                <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
                <p className="text-xs mt-0.5" style={{ color: k.color }}>{k.sub}</p>
              </div>
              <div className="stat-icon" style={{ background: k.bg }}>
                <k.icon size={18} style={{ color: k.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Clientes */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #e8eaed' }}>
          <div className="stat-icon" style={{ background: '#fff3e0', width: 28, height: 28, borderRadius: 7 }}>
            <Users size={14} style={{ color: '#F97316' }} />
          </div>
          <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>Clientes em Assessoria</h3>
          <button onClick={() => router.push('/clientes')}
            className="ml-auto flex items-center gap-1 text-xs font-semibold" style={{ color: '#F97316' }}>
            Gerenciar <ArrowRight size={12} />
          </button>
        </div>

        {clientes.length === 0 ? (
          <div className="text-center py-10 text-xs" style={{ color: '#9aa0a6' }}>
            Nenhum cliente cadastrado.
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: '#f0f2f5' }}>
            {clientes.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/cliente/${c.id}`)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white shrink-0"
                  style={{ background: '#F97316' }}>
                  {c.nome.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: '#1a1d23' }}>{c.nome}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {(c.cliente_sabores ?? []).map((s: any) => (
                      <span key={s.id} className="text-xs px-1.5 py-0.5 rounded"
                        style={{ background: '#fff3e0', color: '#e65100', fontWeight: 600 }}>{s.nome}</span>
                    ))}
                    {(c.cliente_sabores ?? []).length === 0 && (
                      <span className="text-xs" style={{ color: '#9aa0a6' }}>Sem formulações</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={c.ativo ? 'badge-green' : 'badge-gray'}>{c.ativo ? 'Ativo' : 'Inativo'}</span>
                  <ArrowRight size={14} style={{ color: '#dadce0' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prospectados / Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { icon: Star, color: '#F97316', bg: '#fff3e0', label: 'Clientes Ativos', value: dados.clientesAtivos, desc: 'Em assessoria industrial' },
          { icon: Clock, color: '#1565c0', bg: '#e3f2fd', label: 'Prospecções', value: Math.max(0, dados.clientesTotal - dados.clientesAtivos), desc: 'Em negociação / pipeline' },
          { icon: CheckCircle, color: '#2e7d32', bg: '#e8f5e9', label: 'Rodadas Realizadas', value: dados.rodadasTotal, desc: 'Produções calculadas' },
        ].map(k => (
          <div key={k.label} className="card flex items-center gap-4">
            <div className="stat-icon" style={{ background: k.bg, width: 44, height: 44, borderRadius: 12 }}>
              <k.icon size={22} style={{ color: k.color }} />
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: k.color }}>{k.value}</p>
              <p className="text-sm font-bold" style={{ color: '#1a1d23' }}>{k.label}</p>
              <p className="text-xs" style={{ color: '#9aa0a6' }}>{k.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
