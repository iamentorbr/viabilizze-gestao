'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, Factory, LayoutDashboard, Sparkles } from 'lucide-react'

const SENHA_MESTRE = process.env.NEXT_PUBLIC_SENHA_MESTRE || '123456'

const AMBIENTES = [
  {
    id: 'crm',
    href: '/crm',
    icon: LayoutDashboard,
    titulo: 'CRM Global',
    subtitulo: 'Viabilizze',
    desc: 'Clientes, projetos, relatórios e gestão estratégica da consultoria.',
    cor: '#534AB7',
    bg: '#EEEDFE',
    borda: '#AFA9EC',
  },
  {
    id: 'industrial',
    href: '/industrial',
    icon: Factory,
    titulo: 'Gestão',
    subtitulo: 'Industrial',
    desc: 'Produção, formulações, matérias-primas, rotulagem e compras por cliente.',
    cor: '#0F6E56',
    bg: '#E1F5EE',
    borda: '#5DCAA5',
  },
  {
    id: 'digital',
    href: '/digital',
    icon: Sparkles,
    titulo: 'Produtos Digitais',
    subtitulo: 'Viabilizze',
    desc: 'Painel de vendas, assinaturas, usuários e receita dos microSaaS.',
    cor: '#993C1D',
    bg: '#FAECE7',
    borda: '#F0997B',
  },
]

export default function HomePage() {
  const router = useRouter()
  const [senha, setSenha] = useState('')
  const [visivel, setVisivel] = useState(false)
  const [erro, setErro] = useState('')
  const [autenticado, setAutenticado] = useState(false)

  function autenticar() {
    if (senha === SENHA_MESTRE) {
      setAutenticado(true)
      setErro('')
    } else {
      setErro('Senha incorreta.')
      setSenha('')
    }
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1a1d23 0%, #252931 100%)' }}>
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <Lock size={28} style={{ color: '#F97316' }} />
            </div>
            <h1 className="text-2xl font-black text-white">VIABILIZZE</h1>
            <p className="text-xs mt-1" style={{ color: '#5f6875' }}>Sistema de Gestão · Acesso Restrito</p>
          </div>

          <div className="rounded-2xl p-6" style={{ background: '#fff', boxShadow: '0 24px 64px rgba(0,0,0,.5)' }}>
            <p className="text-sm font-bold mb-4" style={{ color: '#1a1d23' }}>Digite a senha de acesso</p>

            <div className="relative mb-3">
              <input
                type={visivel ? 'text' : 'password'}
                value={senha}
                onChange={e => setSenha(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && autenticar()}
                className="input pr-10 text-center text-xl tracking-widest"
                placeholder="••••••"
                maxLength={20}
                autoFocus
              />
              <button onClick={() => setVisivel(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#9aa0a6' }}>
                {visivel ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {erro && (
              <p className="text-xs text-center font-semibold mb-3" style={{ color: '#c62828' }}>{erro}</p>
            )}

            <button onClick={autenticar}
              className="w-full py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #F97316, #ea6a00)' }}>
              Acessar Sistema
            </button>
          </div>

          <p className="text-xs text-center mt-5" style={{ color: '#3a3f47' }}>
            VI.P & NÔUS Consultoria · uso exclusivo da equipe
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#f0f2f5' }}>
      <div className="w-full max-w-3xl">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4"
            style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
            <span className="text-xs font-bold" style={{ color: '#F97316' }}>Sistema Ativo</span>
          </div>
          <h1 className="text-3xl font-black" style={{ color: '#1a1d23' }}>
            VIABILIZZE <span style={{ color: '#F97316' }}>ASSESSORIA</span>
          </h1>
          <p className="text-sm mt-2" style={{ color: '#9aa0a6' }}>Selecione o ambiente que deseja acessar</p>
        </div>

        {/* Cards dos 3 ambientes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {AMBIENTES.map(a => (
            <button key={a.id} onClick={() => router.push(a.href)}
              className="group text-left p-6 rounded-2xl transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{
                background: '#fff',
                border: `2px solid ${a.borda}`,
                boxShadow: '0 2px 8px rgba(0,0,0,.06)',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = a.cor)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = a.borda)}>

              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: a.bg }}>
                <a.icon size={22} style={{ color: a.cor }} />
              </div>

              <p className="font-black text-base leading-tight" style={{ color: '#1a1d23' }}>
                {a.titulo}
              </p>
              <p className="text-xs font-bold mb-3" style={{ color: a.cor }}>
                {a.subtitulo}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#5f6368' }}>
                {a.desc}
              </p>

              <div className="mt-4 flex items-center gap-1 text-xs font-bold"
                style={{ color: a.cor }}>
                Acessar →
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-center" style={{ color: '#c8cdd3' }}>
          VI.P & NÔUS Consultoria · viabilizzecrm.vercel.app
        </p>
      </div>
    </div>
  )
}
