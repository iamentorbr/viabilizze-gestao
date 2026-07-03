'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type StatusAcesso = {
  temAcesso: boolean
  motivo: 'LIBERADO_CLIENTE' | 'ASSINATURA_ATIVA' | 'SEM_ACESSO' | 'CARREGANDO'
  produtoId: string | null
  assinatura?: {
    plano: string
    dataExpiracao: string | null
  }
}

/**
 * Verifica se um cliente (ou visitante sem cliente) tem acesso a um produto premium.
 * Regras:
 *  1. Se cliente_id existe E está liberado em cliente_produtos_liberados → acesso gratuito
 *  2. Se existe assinatura ATIVA (por cliente_id ou e-mail) e não expirada → acesso pago
 *  3. Caso contrário → sem acesso (mostra paywall)
 */
export function useAcessoProduto(slug: string, clienteId?: string | null) {
  const [status, setStatus] = useState<StatusAcesso>({
    temAcesso: false, motivo: 'CARREGANDO', produtoId: null,
  })

  useEffect(() => {
    let ativo = true
    async function verificar() {
      const { data: produto } = await supabase
        .from('produtos_viabilizze')
        .select('id')
        .eq('slug', slug)
        .single()

      if (!produto) {
        if (ativo) setStatus({ temAcesso: false, motivo: 'SEM_ACESSO', produtoId: null })
        return
      }

      // 1. Liberação manual por cliente
      if (clienteId) {
        const { data: liberado } = await supabase
          .from('cliente_produtos_liberados')
          .select('id')
          .eq('cliente_id', clienteId)
          .eq('produto_id', produto.id)
          .maybeSingle()

        if (liberado) {
          if (ativo) setStatus({ temAcesso: true, motivo: 'LIBERADO_CLIENTE', produtoId: produto.id })
          return
        }
      }

      // 2. Assinatura paga ativa
      let query = supabase
        .from('assinaturas_produtos')
        .select('plano, status, data_expiracao')
        .eq('produto_id', produto.id)
        .eq('status', 'ATIVA')

      if (clienteId) {
        query = query.eq('cliente_id', clienteId)
      } else {
        // Sem cliente: verifica por sessão local (e-mail salvo após checkout)
        const emailLocal = typeof window !== 'undefined' ? localStorage.getItem('vip_email_assinante') : null
        if (!emailLocal) {
          if (ativo) setStatus({ temAcesso: false, motivo: 'SEM_ACESSO', produtoId: produto.id })
          return
        }
        query = query.eq('email_comprador', emailLocal)
      }

      const { data: assinaturas } = await query.order('data_expiracao', { ascending: false }).limit(1)
      const assinatura = assinaturas?.[0]

      const naoExpirou = assinatura?.data_expiracao
        ? new Date(assinatura.data_expiracao) > new Date()
        : false

      if (assinatura && naoExpirou) {
        if (ativo) setStatus({
          temAcesso: true, motivo: 'ASSINATURA_ATIVA', produtoId: produto.id,
          assinatura: { plano: assinatura.plano, dataExpiracao: assinatura.data_expiracao },
        })
        return
      }

      if (ativo) setStatus({ temAcesso: false, motivo: 'SEM_ACESSO', produtoId: produto.id })
    }

    verificar()
    return () => { ativo = false }
  }, [slug, clienteId])

  return status
}
