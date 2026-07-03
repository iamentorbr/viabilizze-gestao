'use client'
import { useEffect, useState } from 'react'
import AppLayout from '@/components/layout/AppLayout'
import Header from '@/components/layout/Header'
import CalculadoraViabilizze from '@/components/CalculadoraViabilizze'
import { CheckCircle, X } from 'lucide-react'

export default function CalculadoraViabilizzePage() {
  const [aviso, setAviso] = useState<'sucesso' | 'cancelado' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const checkout = params.get('checkout')
    if (checkout === 'sucesso' || checkout === 'cancelado') {
      setAviso(checkout)
      // limpar query string
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  return (
    <AppLayout>
      <Header title="Calculadora VIABILIZZE" subtitle="Produtos VIABILIZZE · Percentual de Polpa/Suco" />
      <main className="flex-1 p-6" style={{ background: '#f0f2f5' }}>

        {aviso === 'sucesso' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 max-w-3xl mx-auto"
            style={{ background: '#e8f5e9', border: '1px solid #a5d6a7' }}>
            <CheckCircle size={18} style={{ color: '#2e7d32' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#2e7d32' }}>Pagamento confirmado!</p>
              <p className="text-xs" style={{ color: '#5f6368' }}>
                Seu acesso pode levar até 1 minuto para ser ativado. Atualize a página se necessário.
              </p>
            </div>
            <button onClick={() => setAviso(null)} className="ml-auto" style={{ color: '#9aa0a6' }}><X size={15} /></button>
          </div>
        )}
        {aviso === 'cancelado' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 max-w-3xl mx-auto"
            style={{ background: '#fff8e1', border: '1px solid #ffe082' }}>
            <X size={18} style={{ color: '#f57f17' }} />
            <p className="text-sm font-bold" style={{ color: '#f57f17' }}>Pagamento cancelado. Você pode tentar novamente quando quiser.</p>
            <button onClick={() => setAviso(null)} className="ml-auto" style={{ color: '#9aa0a6' }}><X size={15} /></button>
          </div>
        )}

        <CalculadoraViabilizze clienteId={null} />
      </main>
    </AppLayout>
  )
}
