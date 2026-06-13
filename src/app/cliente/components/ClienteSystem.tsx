'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ClienteHeader from './ClienteHeader'
import ClienteDashboard from './ClienteDashboard'
import ClienteCalculadora from './ClienteCalculadora'
import ClienteConsolidado from './ClienteConsolidado'
import ClienteFormulacoes from './ClienteFormulacoes'
import ClienteHistorico from './ClienteHistorico'

export default function ClienteSystem({ clienteId }: { clienteId: string }) {
  const [cliente, setCliente] = useState<any>(null)
  const [sabores, setSabores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [aba, setAba] = useState('dashboard')

  useEffect(() => {
    async function load() {
      const [{ data: c }, { data: s }] = await Promise.all([
        supabase.from('clientes').select('*').eq('id', clienteId).single(),
        supabase.from('cliente_sabores')
          .select('*, sabor_ingredientes(*)')
          .eq('cliente_id', clienteId)
          .eq('ativo', true)
          .order('criado_em'),
      ])
      setCliente(c)
      setSabores(s ?? [])
      setLoading(false)
    }
    load()
  }, [clienteId])

  if (loading) return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#f0f2f5' }}>
      <div className="text-center">
        <div className="spinner mx-auto mb-3" />
        <p className="text-sm" style={{ color: '#9aa0a6' }}>Carregando dados do cliente...</p>
      </div>
    </div>
  )

  if (!cliente) return (
    <div className="flex-1 flex items-center justify-center">
      <p style={{ color: '#9aa0a6' }}>Cliente não encontrado.</p>
    </div>
  )

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <ClienteHeader cliente={cliente} abaAtiva={aba} onAba={setAba} />
      <div className="flex-1 overflow-auto" style={{ background: '#f0f2f5' }}>
        {aba === 'dashboard'    && <ClienteDashboard clienteId={clienteId} cliente={cliente} sabores={sabores} />}
        {aba === 'calculadora'  && <ClienteCalculadora clienteId={clienteId} sabores={sabores} onSaboresUpdate={setSabores} />}
        {aba === 'consolidado'  && <ClienteConsolidado clienteId={clienteId} sabores={sabores} />}
        {aba === 'formulacoes'  && <ClienteFormulacoes clienteId={clienteId} sabores={sabores} onUpdate={setSabores} />}
        {aba === 'historico'    && <ClienteHistorico clienteId={clienteId} />}
      </div>
    </div>
  )
}
