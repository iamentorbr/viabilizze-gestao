'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  Beaker, Lock, Eye, EyeOff, LogOut, Crown, ShieldCheck,
  AlertTriangle, CheckCircle, Loader2, Calculator, Info
} from 'lucide-react'
import {
  calcularPercentualSuco, TABELA_FRUTAS, tipoLabel,
  type Fruta, type TipoBebida,
} from '@/lib/percentualSuco'

const TOKEN_KEY = 'vip_calc_token'

// ─────────────────────────────────────────────────────────────────────────────
// TELA DE LOGIN
// ─────────────────────────────────────────────────────────────────────────────
function TelaLogin({ onLogin }: { onLogin: (data: any) => void }) {
  const [email, setEmail]       = useState('')
  const [senha, setSenha]       = useState('')
  const [visivel, setVisivel]   = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro]         = useState('')

  async function entrar() {
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setCarregando(true); setErro('')
    try {
      const res  = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.error || 'Erro ao entrar.'); return }
      localStorage.setItem(TOKEN_KEY, data.token)
      onLogin(data)
    } catch { setErro('Erro de conexão. Tente novamente.') }
    finally  { setCarregando(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1a1d23 0%, #252931 100%)' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
            <Calculator size={30} style={{ color: '#F97316' }} />
          </div>
          <h1 className="text-2xl font-black text-white">VIABILIZZE</h1>
          <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>Calculadora de Percentual de Polpa</p>
        </div>

        {/* Card de login */}
        <div className="rounded-2xl p-6" style={{ background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.4)' }}>
          <h2 className="text-base font-bold mb-1" style={{ color: '#1a1d23' }}>Acesso à Calculadora</h2>
          <p className="text-xs mb-5" style={{ color: '#9aa0a6' }}>
            Use as credenciais enviadas por e-mail após sua compra.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>E-mail</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && entrar()}
                className="input" placeholder="seu@email.com" autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Senha</label>
              <div className="relative">
                <input type={visivel ? 'text' : 'password'} value={senha}
                  onChange={e => setSenha(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && entrar()}
                  className="input pr-10" placeholder="••••••••"
                  style={{ letterSpacing: visivel ? 'normal' : '0.15em' }} />
                <button onClick={() => setVisivel(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9aa0a6' }}>
                  {visivel ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          {erro && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl mt-3"
              style={{ background: '#fce4ec', border: '1px solid #f48fb1' }}>
              <AlertTriangle size={13} style={{ color: '#c62828' }} />
              <p className="text-xs font-semibold" style={{ color: '#c62828' }}>{erro}</p>
            </div>
          )}

          <button onClick={entrar} disabled={carregando}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm mt-4"
            style={{ background: 'linear-gradient(135deg,#F97316,#ea6a00)', color: '#fff',
                     opacity: carregando ? .7 : 1 }}>
            {carregando ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : <><Lock size={15} /> Entrar</>}
          </button>

          <p className="text-xs text-center mt-4" style={{ color: '#9aa0a6' }}>
            Não tem acesso?{' '}
            <a href="https://www.assessoriaviabilizze.com.br/calculadora"
              target="_blank" rel="noopener"
              style={{ color: '#F97316', fontWeight: 700 }}>
              Assine aqui
            </a>
          </p>
        </div>

        <p className="text-xs text-center mt-4" style={{ color: '#5f6875' }}>
          VIABILIZZE Assessoria Industrial<br />
          <span style={{ fontSize: 10 }}>Desenvolvido por VI.P & NÔUS Consultoria</span>
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CALCULADORA ATIVA
// ─────────────────────────────────────────────────────────────────────────────
function CalculadoraAtiva({
  usuario, assinatura, onLogout,
}: { usuario: any; assinatura: any; onLogout: () => void }) {
  const [fruta, setFruta]           = useState<Fruta>('LARANJA')
  const [tipoBebida, setTipoBebida] = useState<TipoBebida>('REFRESCO')
  const [brixSuco, setBrixSuco]     = useState(68)
  const [brixLeg, setBrixLeg]       = useState(14)
  const [volume, setVolume]         = useState(1000)
  const [fator, setFator]           = useState(1.032)

  const resultado = useMemo(() => calcularPercentualSuco({
    fruta, tipoBebida, brixSucoConcentrado: brixSuco,
    brixLegislacao: brixLeg, volumeFinalLitros: volume, fatorCorrecao: fator,
  }), [fruta, tipoBebida, brixSuco, brixLeg, volume, fator])

  const expira = assinatura?.dataExpiracao
    ? new Date(assinatura.dataExpiracao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="min-h-screen" style={{ background: '#f0f2f5' }}>

      {/* Header limpo */}
      <header className="sticky top-0 z-20"
        style={{ background: '#1a1d23', borderBottom: '1px solid #252931' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <Calculator size={14} style={{ color: '#F97316' }} />
            </div>
            <div>
              <p className="font-black text-white text-sm leading-none">Calculadora VIABILIZZE</p>
              <p className="text-xs leading-none mt-0.5" style={{ color: '#5f6875' }}>
                Percentual de Polpa/Suco · MAPA IN 49/2018
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(249,115,22,0.1)' }}>
              <Crown size={12} style={{ color: '#F97316' }} />
              <span className="text-xs font-bold" style={{ color: '#F97316' }}>
                {assinatura?.plano === 'ANUAL' ? 'Plano Anual' : 'Plano Semestral'}
              </span>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-white">{usuario.nome}</p>
              {expira && <p className="text-xs" style={{ color: '#5f6875' }}>Válido até {expira}</p>}
            </div>
            <button onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ color: '#5f6875', border: '1px solid #252931' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F97316')}
              onMouseLeave={e => (e.currentTarget.style.color = '#5f6875')}>
              <LogOut size={13} /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Banner legislação */}
        <div className="alert-info flex items-start gap-2">
          <Info size={14} style={{ color: '#1565c0' }} className="mt-0.5 shrink-0" />
          <p className="text-xs" style={{ color: '#1565c0' }}>
            <strong>Legislação:</strong> Cálculo baseado na Instrução Normativa MAPA nº 49/2018 para
            Refresco, Suco Integral e Néctar. Os percentuais mínimos variam conforme a fruta.
          </p>
        </div>

        {/* Entradas */}
        <div className="card">
          <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>
            Dados da Formulação
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                Fruta / Sabor
              </label>
              <select value={fruta} onChange={e => setFruta(e.target.value as Fruta)} className="input">
                {Object.entries(TABELA_FRUTAS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                Tipo de Bebida
              </label>
              <select value={tipoBebida} onChange={e => setTipoBebida(e.target.value as TipoBebida)} className="input">
                <option value="REFRESCO">Refresco</option>
                <option value="SUCO_INTEGRAL">Suco Integral</option>
                <option value="NECTAR">Néctar</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                Brix do Suco Concentrado (°Bx)
              </label>
              <input type="number" step="0.1" min="1" value={brixSuco}
                onChange={e => setBrixSuco(Number(e.target.value))} className="input"
                placeholder="Ex: 68" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                Brix Legislação — D (°Bx)
              </label>
              <input type="number" step="0.1" min="1" value={brixLeg}
                onChange={e => setBrixLeg(Number(e.target.value))} className="input"
                placeholder="Ex: 14" />
              <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>
                Brix integral: {TABELA_FRUTAS[fruta].brixIntegral}°
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                Volume Final da Formulação (L)
              </label>
              <input type="number" step="1" min="1" value={volume}
                onChange={e => setVolume(Number(e.target.value))} className="input"
                placeholder="Ex: 1000" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
                Fator de Correção (Densidade)
              </label>
              <input type="number" step="0.001" value={fator}
                onChange={e => setFator(Number(e.target.value))} className="input" />
              <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>Padrão: 1,032</p>
            </div>
          </div>
        </div>

        {/* Resultado */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-3 flex items-center gap-3"
            style={{ background: '#1a1d23', borderBottom: '1px solid #252931' }}>
            <Beaker size={15} style={{ color: '#F97316' }} />
            <span className="text-xs font-black text-white">RESULTADO DO CÁLCULO</span>
            <span className="text-xs" style={{ color: '#9aa0a6' }}>
              {TABELA_FRUTAS[fruta].label} · {tipoLabel(tipoBebida)}
            </span>
            <span className="ml-auto text-xs px-3 py-1.5 rounded-full font-bold"
              style={{
                background: resultado.atendeLegislacao ? '#e8f5e9' : '#fce4ec',
                color:      resultado.atendeLegislacao ? '#2e7d32' : '#c62828',
              }}>
              {resultado.atendeLegislacao ? '✓ CONFORME' : '⚠ NÃO CONFORME'}
            </span>
          </div>

          {/* Grid de valores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y"
            style={{ borderColor: '#f0f2f5' }}>
            {[
              { label: 'Brix Integral da Fruta',   value: `${resultado.brixIntegralFruta}°`,    color: '#1a1d23' },
              { label: '% Mínimo Exigido (MAPA)',  value: `${resultado.pctPolpaMinimoLegal}%`,  color: '#1565c0' },
              { label: '% Polpa Calculado',        value: `${resultado.pctPolpaCalculado}%`,    color: resultado.atendeLegislacao ? '#2e7d32' : '#c62828', bold: true },
              { label: 'Margem (p.p.)',             value: `${resultado.margemPercentual > 0 ? '+' : ''}${resultado.margemPercentual}`, color: resultado.margemPercentual >= 0 ? '#2e7d32' : '#c62828' },
              { label: 'Suco Concentrado (kg)',    value: `${resultado.quantidadeSucoConcentradoKg.toLocaleString('pt-BR')} kg`, color: '#F97316', bold: true },
              { label: 'Suco Concentrado (L aprox.)', value: `${resultado.quantidadeSucoConcentradoL.toLocaleString('pt-BR')} L`, color: '#5f6368' },
              { label: 'Volume Final',             value: `${volume.toLocaleString('pt-BR')} L`, color: '#1a1d23' },
              { label: 'Fórmula Utilizada',        value: `(${brixLeg} × ${fator}) ÷ ${brixSuco} × 100`, color: '#9aa0a6' },
            ].map(c => (
              <div key={c.label} className="p-4">
                <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{c.label}</p>
                <p className={`${c.bold ? 'text-xl' : 'text-sm'} font-black`} style={{ color: c.color }}>
                  {c.value}
                </p>
              </div>
            ))}
          </div>

          {/* Observação / laudo */}
          <div className="px-5 py-4"
            style={{ background: resultado.atendeLegislacao ? '#f1f8f4' : '#fdf2f4' }}>
            <div className="flex items-start gap-2">
              {resultado.atendeLegislacao
                ? <CheckCircle size={15} style={{ color: '#2e7d32' }} className="mt-0.5 shrink-0" />
                : <AlertTriangle size={15} style={{ color: '#c62828' }} className="mt-0.5 shrink-0" />}
              <p className="text-sm font-semibold" style={{
                color: resultado.atendeLegislacao ? '#2e7d32' : '#c62828',
              }}>
                {resultado.observacao}
              </p>
            </div>
          </div>
        </div>

        {/* Tabela referência MAPA */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-3" style={{ borderBottom: '1px solid #e8eaed' }}>
            <h3 className="text-sm font-bold" style={{ color: '#1a1d23' }}>
              Referência — Brix Integral e % Mínimo de Polpa por Fruta (MAPA IN 49/2018)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="vtable">
              <thead><tr>
                <th>Fruta</th>
                <th className="text-right">Brix Integral</th>
                <th className="text-right">% Mínimo Refresco</th>
                <th>Selecionada</th>
              </tr></thead>
              <tbody>
                {Object.entries(TABELA_FRUTAS).map(([k, v]) => (
                  <tr key={k} style={k === fruta ? { background: '#fff9f5' } : {}}>
                    <td className={k === fruta ? 'font-bold' : ''} style={{ color: '#1a1d23' }}>{v.label}</td>
                    <td className="text-right font-mono" style={{ color: '#5f6368' }}>{v.brixIntegral}°</td>
                    <td className="text-right font-mono" style={{ color: '#1565c0' }}>{v.pctRefresco}%</td>
                    <td>{k === fruta && <span className="badge-orange text-xs">✓ Ativa</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-center pb-4" style={{ color: '#9aa0a6' }}>
          Calculadora VIABILIZZE · viabilizzecrm.vercel.app · VI.P & NÔUS Consultoria
        </p>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PÁGINA PRINCIPAL — orquestra login/calculadora
// ─────────────────────────────────────────────────────────────────────────────
export default function CalculadoraViabilizzePage() {
  const [sessao, setSessao]       = useState<any>(null)
  const [verificando, setVerif]   = useState(true)
  const [statusUrl, setStatusUrl] = useState<string | null>(null)

  useEffect(() => {
    // Checar parâmetro de status de checkout
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status) {
      setStatusUrl(status)
      window.history.replaceState({}, '', window.location.pathname)
    }

    // Verificar token salvo
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setVerif(false); return }

    fetch('/api/auth/verificar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.valido) setSessao({ usuario: data.usuario, assinatura: data.assinatura, token })
        else localStorage.removeItem(TOKEN_KEY)
      })
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setVerif(false))
  }, [])

  function handleLogin(data: any) {
    setSessao({ usuario: data.usuario, assinatura: data.assinatura, token: data.token })
  }

  async function handleLogout() {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      localStorage.removeItem(TOKEN_KEY)
    }
    setSessao(null)
  }

  if (verificando) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1a1d23 0%, #252931 100%)' }}>
      <Loader2 size={32} className="animate-spin" style={{ color: '#F97316' }} />
    </div>
  )

  return (
    <>
      {/* Avisos de checkout */}
      {statusUrl && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg"
            style={statusUrl === 'sucesso'
              ? { background: '#e8f5e9', border: '1px solid #a5d6a7' }
              : { background: '#fff8e1', border: '1px solid #ffe082' }}>
            {statusUrl === 'sucesso'
              ? <CheckCircle size={18} style={{ color: '#2e7d32' }} />
              : <AlertTriangle size={18} style={{ color: '#f57f17' }} />}
            <div>
              <p className="text-sm font-bold" style={{ color: statusUrl === 'sucesso' ? '#2e7d32' : '#f57f17' }}>
                {statusUrl === 'sucesso'
                  ? 'Pagamento confirmado! Verifique seu e-mail para acessar.'
                  : 'Pagamento cancelado. Você pode tentar novamente.'}
              </p>
            </div>
            <button onClick={() => setStatusUrl(null)} className="ml-auto text-sm" style={{ color: '#9aa0a6' }}>✕</button>
          </div>
        </div>
      )}

      {!sessao
        ? <TelaLogin onLogin={handleLogin} />
        : <CalculadoraAtiva usuario={sessao.usuario} assinatura={sessao.assinatura} onLogout={handleLogout} />
      }
    </>
  )
}
