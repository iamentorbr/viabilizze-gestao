'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import { supabase } from '@/lib/supabase'
import { Beaker, ArrowRight, Users, Calculator, Building2 } from 'lucide-react'

export default function CalculadoraPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Buscar clientes que têm sabores cadastrados
    supabase.from('clientes')
      .select('*, cliente_sabores(id, nome)')
      .eq('ativo', true)
      .order('nome')
      .then(({ data }) => { setClientes(data ?? []); setLoading(false) })
  }, [])

  const clientesComFormulas = clientes.filter(c => (c.cliente_sabores?.length ?? 0) > 0)
  const clientesSemFormulas = clientes.filter(c => (c.cliente_sabores?.length ?? 0) === 0)

  return (
    <AppLayout>
      <Header title="Calculadora de Produção" subtitle="Selecione o cliente para acessar as fórmulas" />
      <main className="flex-1 p-6 space-y-5" style={{ background: '#f0f2f5' }}>

        <div className="alert-info flex items-start gap-3">
          <Calculator size={16} style={{ color: '#1565c0' }} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold" style={{ color: '#1565c0' }}>Calculadora Multi-Cliente</p>
            <p className="text-xs mt-0.5" style={{ color: '#5f6368' }}>
              Cada cliente tem seu próprio ambiente isolado com formulações, parâmetros e histórico.
              Selecione um cliente abaixo para acessar o sistema completo de produção.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="spinner" /></div>
        ) : (
          <>
            {clientesComFormulas.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9aa0a6' }}>
                  Clientes com Formulações Cadastradas
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientesComFormulas.map(c => (
                    <div key={c.id} className="card" style={{ borderTop: '3px solid #F97316' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white"
                          style={{ background: '#F97316' }}>
                          {c.nome.charAt(0)}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#fff3e0', color: '#e65100' }}>
                          {c.cliente_sabores.length} sabor(es)
                        </span>
                      </div>
                      <h3 className="font-bold text-sm mb-1" style={{ color: '#1a1d23' }}>{c.nome}</h3>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {c.cliente_sabores.map((s: any) => (
                          <span key={s.id} className="text-xs px-2 py-0.5 rounded"
                            style={{ background: '#f0f2f5', color: '#5f6368' }}>{s.nome}</span>
                        ))}
                      </div>
                      <button
                        onClick={() => router.push(`/cliente/${c.id}?aba=calculadora`)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-semibold text-xs transition-all"
                        style={{ background: 'linear-gradient(135deg, #F97316 0%, #ea6a00 100%)', color: '#fff' }}
                      >
                        <div className="flex items-center gap-2">
                          <Beaker size={14} />
                          <span>Abrir Calculadora</span>
                        </div>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clientesSemFormulas.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: '#9aa0a6' }}>
                  Clientes sem Formulações — Acesse para Cadastrar
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientesSemFormulas.map(c => (
                    <div key={c.id} className="card cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => router.push(`/cliente/${c.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm"
                          style={{ background: '#f5f5f5', color: '#9aa0a6' }}>
                          {c.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: '#1a1d23' }}>{c.nome}</p>
                          <p className="text-xs" style={{ color: '#9aa0a6' }}>Sem formulações — clique para cadastrar</p>
                        </div>
                        <ArrowRight size={15} className="ml-auto" style={{ color: '#9aa0a6' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {clientes.length === 0 && (
              <div className="card text-center py-16">
                <Users size={40} className="mx-auto mb-3" style={{ color: '#dadce0' }} />
                <p className="text-sm font-semibold" style={{ color: '#1a1d23' }}>Nenhum cliente cadastrado</p>
                <p className="text-xs mt-1 mb-4" style={{ color: '#9aa0a6' }}>Cadastre clientes na seção Clientes para acessar a calculadora.</p>
                <button onClick={() => router.push('/clientes')} className="btn-primary mx-auto">
                  <Users size={14} /> Ir para Clientes
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </AppLayout>
  )
}
