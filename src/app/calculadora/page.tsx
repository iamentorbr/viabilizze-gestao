'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import CalculadoraFormulacao from '@/components/CalculadoraFormulacao'
import { Users, Plus, Beaker, ArrowRight, FlaskConical } from 'lucide-react'

export default function CalculadoraGlobalPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modo, setModo] = useState<'hub' | 'formulacao'>('hub')

  useEffect(() => {
    supabase.from('clientes')
      .select('*, cliente_sabores(id, nome)')
      .eq('ativo', true).order('nome')
      .then(({ data }) => { setClientes(data ?? []); setLoading(false) })
  }, [])

  const comFormulas = clientes.filter(c => (c.cliente_sabores?.length ?? 0) > 0)

  return (
    <AppLayout>
      <Header title="Calculadora" subtitle="Formulação nutricional e cálculo de produção" />
      <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

        {/* Seletor de modo */}
        <div className="flex gap-0 rounded-xl overflow-hidden"
          style={{ border: '1px solid #e8eaed', background: '#fff', width: 'fit-content' }}>
          {([
            { id: 'hub',        label: 'Calculadora por Cliente',    icon: Users       },
            { id: 'formulacao', label: 'Calculadora Global (Livre)', icon: FlaskConical },
          ] as const).map(m => (
            <button key={m.id} onClick={() => setModo(m.id)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold transition-all"
              style={modo === m.id ? { background: '#F97316', color: '#fff' } : { color: '#5f6368' }}>
              <m.icon size={13} /> {m.label}
            </button>
          ))}
        </div>

        {/* ── MODO HUB: por cliente ─────────────────────────────────────── */}
        {modo === 'hub' && (
          <>
            {loading ? (
              <div className="flex justify-center py-16"><div className="spinner" /></div>
            ) : comFormulas.length === 0 ? (
              <div className="card text-center py-16">
                <Users size={40} className="mx-auto mb-3" style={{ color: '#dadce0' }} />
                <p className="text-sm font-semibold" style={{ color: '#1a1d23' }}>Nenhum cliente com formulações</p>
                <p className="text-xs mt-1 mb-4" style={{ color: '#9aa0a6' }}>Cadastre clientes e formulações para usar a calculadora por cliente.</p>
                <button onClick={() => router.push('/clientes')} className="btn-primary mx-auto">
                  <Users size={14} /> Ir para Clientes
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {comFormulas.map(c => (
                  <div key={c.id} className="card" style={{ borderTop: '3px solid #F97316' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white"
                        style={{ background: '#F97316' }}>
                        {c.nome.charAt(0)}
                      </div>
                      <span className="badge-orange">{c.cliente_sabores.length} sabor(es)</span>
                    </div>
                    <h3 className="font-bold text-sm mb-1" style={{ color: '#1a1d23' }}>{c.nome}</h3>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {c.cliente_sabores.map((s: any) => (
                        <span key={s.id} className="text-xs px-2 py-0.5 rounded"
                          style={{ background: '#f0f2f5', color: '#5f6368' }}>{s.nome}</span>
                      ))}
                    </div>
                    <button onClick={() => router.push(`/cliente/${c.id}?aba=calculadora`)}
                      className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-xs"
                      style={{ background: 'linear-gradient(135deg, #F97316 0%, #ea6a00 100%)', color: '#fff' }}>
                      <div className="flex items-center gap-2"><Beaker size={14} /><span>Abrir Sistema do Cliente</span></div>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── MODO GLOBAL: calculadora livre ───────────────────────────── */}
        {modo === 'formulacao' && (
          <CalculadoraFormulacao titulo="Calculadora Global de Formulação" />
        )}
      </main>
    </AppLayout>
  )
}
