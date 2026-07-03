'use client'
import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useAcessoProduto } from '@/lib/useAcessoProduto'
import {
  calcularPercentualSuco, TABELA_FRUTAS, tipoLabel,
  type Fruta, type TipoBebida,
} from '@/lib/percentualSuco'
import {
  Beaker, Lock, CheckCircle, AlertTriangle, Crown,
  CreditCard, Loader2, ShieldCheck, Sparkles, Info, X
} from 'lucide-react'

const PRECO_MENSAL = 249.00

type Props = {
  clienteId?: string | null
}

export default function CalculadoraViabilizze({ clienteId = null }: Props) {
  const acesso = useAcessoProduto('calculadora-viabilizze', clienteId)

  if (acesso.motivo === 'CARREGANDO') {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" size={28} style={{ color: '#F97316' }} />
      </div>
    )
  }

  if (!acesso.temAcesso) {
    return <Paywall produtoId={acesso.produtoId} clienteId={clienteId} />
  }

  return <CalculadoraAtiva acesso={acesso} />
}

// ═══════════════════════════════════════════════════════════════════════════
// PAYWALL
// ═══════════════════════════════════════════════════════════════════════════
function Paywall({ produtoId, clienteId }: { produtoId: string | null; clienteId?: string | null }) {
  const [plano, setPlano] = useState<'SEMESTRAL' | 'ANUAL'>('ANUAL')
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')

  const meses = plano === 'ANUAL' ? 12 : 6
  const valorTotal = PRECO_MENSAL * meses

  async function iniciarCheckout() {
    if (!email.trim()) { setErro('Informe seu e-mail para continuar.'); return }
    setCarregando(true); setErro('')

    try {
      if (typeof window !== 'undefined') localStorage.setItem('vip_email_assinante', email.trim())

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plano, email: email.trim(), nome: nome.trim(), clienteId }),
      })
      const data = await res.json()

      if (data.url) {
        window.location.href = data.url
      } else {
        setErro(data.error || 'Não foi possível iniciar o pagamento.')
      }
    } catch (e) {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-8">

      {/* Banner produto */}
      <div className="rounded-2xl px-7 py-8 mb-6 text-center"
        style={{ background: 'linear-gradient(135deg, #1a1d23 0%, #2a2d33 100%)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)' }}>
          <Crown size={26} style={{ color: '#F97316' }} />
        </div>
        <p className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#F97316' }}>
          Produto Premium VIABILIZZE
        </p>
        <h1 className="text-2xl font-black text-white mb-2">Calculadora VIABILIZZE</h1>
        <p className="text-sm max-w-lg mx-auto" style={{ color: '#9aa0a6' }}>
          Calcule o percentual de polpa/suco conforme legislação MAPA (IN 49/2018) para
          Refresco, Suco Integral e Néctar — com validação automática de conformidade.
        </p>
      </div>

      {/* O que você ganha */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: Beaker, texto: 'Cálculo de % de polpa por Brix' },
          { icon: ShieldCheck, texto: 'Validação automática MAPA IN 49/2018' },
          { icon: Sparkles, texto: 'Acesso a todas as melhorias futuras' },
        ].map(f => (
          <div key={f.texto} className="card flex items-center gap-3" style={{ padding: 14 }}>
            <div className="stat-icon" style={{ background: '#fff3e0', width: 34, height: 34, borderRadius: 9 }}>
              <f.icon size={16} style={{ color: '#F97316' }} />
            </div>
            <p className="text-xs font-semibold" style={{ color: '#1a1d23' }}>{f.texto}</p>
          </div>
        ))}
      </div>

      {/* Aviso cliente VIABILIZZE */}
      <div className="alert-info flex items-start gap-2 mb-6">
        <Info size={14} style={{ color: '#1565c0' }} className="mt-0.5 shrink-0" />
        <p className="text-xs" style={{ color: '#1565c0' }}>
          <strong>Já é cliente VIABILIZZE?</strong> Você pode ter acesso gratuito a este produto.
          Solicite a liberação através da equipe VIABILIZZE — o acesso é ativado em Configurações
          do seu cadastro de cliente.
        </p>
      </div>

      {/* Card de planos */}
      <div className="card" style={{ borderTop: '3px solid #F97316' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>Escolha seu plano</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          {([
            { id: 'SEMESTRAL' as const, label: 'Semestral', meses: 6, destaque: false },
            { id: 'ANUAL' as const, label: 'Anual', meses: 12, destaque: true },
          ]).map(p => (
            <button key={p.id} onClick={() => setPlano(p.id)}
              className="text-left p-4 rounded-2xl transition-all relative"
              style={plano === p.id
                ? { border: '2px solid #F97316', background: '#fff9f5' }
                : { border: '2px solid #e8eaed', background: '#fff' }}>
              {p.destaque && (
                <span className="absolute -top-2.5 right-3 text-xs font-black px-2 py-0.5 rounded-full"
                  style={{ background: '#F97316', color: '#fff' }}>
                  MAIS COMPLETO
                </span>
              )}
              <p className="text-sm font-bold mb-1" style={{ color: '#1a1d23' }}>{p.label}</p>
              <p className="text-2xl font-black" style={{ color: '#F97316' }}>
                R$ {PRECO_MENSAL.toFixed(2).replace('.', ',')}
                <span className="text-xs font-normal" style={{ color: '#9aa0a6' }}>/mês</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#9aa0a6' }}>
                Total: R$ {(PRECO_MENSAL * p.meses).toFixed(2).replace('.', ',')} · {p.meses} meses · sem descontos
              </p>
            </button>
          ))}
        </div>

        {/* Dados do comprador */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Nome</label>
            <input value={nome} onChange={e => setNome(e.target.value)} className="input" placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>E-mail *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="voce@email.com" />
          </div>
        </div>

        {erro && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3" style={{ background: '#fce4ec', border: '1px solid #f48fb1' }}>
            <AlertTriangle size={13} style={{ color: '#c62828' }} />
            <p className="text-xs font-semibold" style={{ color: '#c62828' }}>{erro}</p>
          </div>
        )}

        {/* Resumo + botão */}
        <div className="flex items-center justify-between p-4 rounded-2xl mb-4" style={{ background: '#fafafa', border: '1px solid #e8eaed' }}>
          <div>
            <p className="text-xs" style={{ color: '#9aa0a6' }}>Total a pagar agora</p>
            <p className="text-xl font-black" style={{ color: '#1a1d23' }}>R$ {valorTotal.toFixed(2).replace('.', ',')}</p>
          </div>
          <p className="text-xs text-right" style={{ color: '#9aa0a6' }}>
            Plano {plano === 'ANUAL' ? 'Anual' : 'Semestral'}<br />{meses} meses de acesso
          </p>
        </div>

        <button onClick={iniciarCheckout} disabled={carregando}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #F97316 0%, #ea6a00 100%)', color: '#fff', opacity: carregando ? .7 : 1 }}>
          {carregando ? <><Loader2 size={16} className="animate-spin" /> Redirecionando...</> : <><CreditCard size={16} /> Pagar com Stripe</>}
        </button>
        <p className="text-xs text-center mt-3" style={{ color: '#9aa0a6' }}>
          Pagamento seguro processado pelo Stripe · Cartão ou Boleto
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// CALCULADORA ATIVA (usuário com acesso)
// ═══════════════════════════════════════════════════════════════════════════
function CalculadoraAtiva({ acesso }: { acesso: any }) {
  const [fruta, setFruta] = useState<Fruta>('LARANJA')
  const [tipoBebida, setTipoBebida] = useState<TipoBebida>('REFRESCO')
  const [brixSuco, setBrixSuco] = useState(68)
  const [brixLegislacao, setBrixLegislacao] = useState(14)
  const [volumeFinal, setVolumeFinal] = useState(1000)
  const [fatorCorrecao, setFatorCorrecao] = useState(1.032)

  const resultado = useMemo(() => calcularPercentualSuco({
    fruta, tipoBebida, brixSucoConcentrado: brixSuco,
    brixLegislacao, volumeFinalLitros: volumeFinal, fatorCorrecao,
  }), [fruta, tipoBebida, brixSuco, brixLegislacao, volumeFinal, fatorCorrecao])

  return (
    <div className="space-y-5">

      {/* Badge de acesso */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
        style={{ background: acesso.motivo === 'LIBERADO_CLIENTE' ? '#e8f5e9' : '#fff3e0',
                 border: `1px solid ${acesso.motivo === 'LIBERADO_CLIENTE' ? '#a5d6a7' : '#ffe0b2'}` }}>
        {acesso.motivo === 'LIBERADO_CLIENTE'
          ? <ShieldCheck size={15} style={{ color: '#2e7d32' }} />
          : <Crown size={15} style={{ color: '#F97316' }} />}
        <p className="text-xs font-bold" style={{ color: acesso.motivo === 'LIBERADO_CLIENTE' ? '#2e7d32' : '#e65100' }}>
          {acesso.motivo === 'LIBERADO_CLIENTE'
            ? 'Acesso liberado como cliente VIABILIZZE'
            : `Assinatura ativa — Plano ${acesso.assinatura?.plano === 'ANUAL' ? 'Anual' : 'Semestral'}`}
        </p>
        {acesso.assinatura?.dataExpiracao && (
          <span className="ml-auto text-xs" style={{ color: '#9aa0a6' }}>
            Válido até {new Date(acesso.assinatura.dataExpiracao).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>

      {/* Entradas */}
      <div className="card">
        <h3 className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>
          Cálculo de Percentual de Polpa/Suco — Legislação MAPA
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Fruta / Sabor</label>
            <select value={fruta} onChange={e => setFruta(e.target.value as Fruta)} className="input">
              {Object.entries(TABELA_FRUTAS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>Tipo de Bebida</label>
            <select value={tipoBebida} onChange={e => setTipoBebida(e.target.value as TipoBebida)} className="input">
              <option value="REFRESCO">Refresco</option>
              <option value="SUCO_INTEGRAL">Suco Integral</option>
              <option value="NECTAR">Néctar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
              Brix do Suco Concentrado
            </label>
            <input type="number" step="0.1" value={brixSuco} onChange={e => setBrixSuco(Number(e.target.value))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
              Brix Legislação (D)
            </label>
            <input type="number" step="0.1" value={brixLegislacao} onChange={e => setBrixLegislacao(Number(e.target.value))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
              Volume Final (L)
            </label>
            <input type="number" step="1" value={volumeFinal} onChange={e => setVolumeFinal(Number(e.target.value))} className="input" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: '#5f6368' }}>
              Fator de Correção
            </label>
            <input type="number" step="0.001" value={fatorCorrecao} onChange={e => setFatorCorrecao(Number(e.target.value))} className="input" />
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="px-5 py-3 flex items-center gap-2"
          style={{ background: '#1a1d23', borderBottom: '1px solid #252931' }}>
          <span className="text-xs font-black text-white">RESULTADO</span>
          <span className="text-xs" style={{ color: '#9aa0a6' }}>
            {TABELA_FRUTAS[fruta].label} · {tipoLabel(tipoBebida)}
          </span>
          <span className="ml-auto text-xs px-3 py-1 rounded-full font-bold"
            style={{ background: resultado.atendeLegislacao ? '#e8f5e9' : '#fce4ec',
                     color: resultado.atendeLegislacao ? '#2e7d32' : '#c62828' }}>
            {resultado.atendeLegislacao ? '✓ Conforme' : '⚠ Não Conforme'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4">
          {[
            { label: 'Brix Integral da Fruta', value: `${resultado.brixIntegralFruta}°`, color: '#1a1d23' },
            { label: '% Mínimo Exigido (MAPA)', value: `${resultado.pctPolpaMinimoLegal}%`, color: '#1565c0' },
            { label: '% Polpa Calculado', value: `${resultado.pctPolpaCalculado}%`, color: resultado.atendeLegislacao ? '#2e7d32' : '#c62828', bold: true },
            { label: 'Margem', value: `${resultado.margemPercentual > 0 ? '+' : ''}${resultado.margemPercentual} p.p.`, color: resultado.margemPercentual >= 0 ? '#2e7d32' : '#c62828' },
          ].map(c => (
            <div key={c.label} className="p-4" style={{ borderRight: '1px solid #f0f2f5', borderBottom: '1px solid #f0f2f5' }}>
              <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>{c.label}</p>
              <p className={`${c.bold ? 'text-xl' : 'text-base'} font-black`} style={{ color: c.color }}>{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-px" style={{ background: '#f0f2f5' }}>
          <div className="p-4" style={{ background: '#fff' }}>
            <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>Suco Concentrado Necessário</p>
            <p className="text-lg font-black" style={{ color: '#F97316' }}>
              {resultado.quantidadeSucoConcentradoKg.toLocaleString('pt-BR')} kg
            </p>
            <p className="text-xs" style={{ color: '#9aa0a6' }}>
              ≈ {resultado.quantidadeSucoConcentradoL.toLocaleString('pt-BR')} L
            </p>
          </div>
          <div className="p-4" style={{ background: '#fff' }}>
            <p className="text-xs mb-1" style={{ color: '#9aa0a6' }}>Volume Final da Formulação</p>
            <p className="text-lg font-black" style={{ color: '#1a1d23' }}>
              {volumeFinal.toLocaleString('pt-BR')} L
            </p>
          </div>
        </div>

        {/* Observação */}
        <div className="px-5 py-3.5" style={{ background: resultado.atendeLegislacao ? '#f1f8f4' : '#fdf2f4' }}>
          <div className="flex items-start gap-2">
            {resultado.atendeLegislacao
              ? <CheckCircle size={14} style={{ color: '#2e7d32' }} className="mt-0.5 shrink-0" />
              : <AlertTriangle size={14} style={{ color: '#c62828' }} className="mt-0.5 shrink-0" />}
            <p className="text-xs" style={{ color: resultado.atendeLegislacao ? '#2e7d32' : '#c62828' }}>
              {resultado.observacao}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-center" style={{ color: '#9aa0a6' }}>
        Cálculo conforme legislação MAPA — IN 49/2018. Fórmula: % Polpa = (Brix Legislação × Fator Correção / Brix Suco Concentrado) × 100
      </p>
    </div>
  )
}
