import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret)
  } catch (err: any) {
    console.error('[webhook] assinatura inválida:', err.message)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { plano, email, nome, clienteId, meses, produto_slug } = session.metadata || {}

    const { data: produto } = await supabase
      .from('produtos_viabilizze')
      .select('id')
      .eq('slug', produto_slug)
      .single()

    if (produto) {
      const dataInicio = new Date()
      const dataExpiracao = new Date()
      dataExpiracao.setMonth(dataExpiracao.getMonth() + Number(meses || 6))

      await supabase.from('assinaturas_produtos').insert({
        cliente_id: clienteId || null,
        produto_id: produto.id,
        plano,
        status: 'ATIVA',
        valor_total: (session.amount_total || 0) / 100,
        email_comprador: email,
        nome_comprador: nome || null,
        stripe_customer_id: session.customer as string,
        stripe_session_id: session.id,
        data_inicio: dataInicio.toISOString(),
        data_expiracao: dataExpiracao.toISOString(),
      })
    }
  }

  return NextResponse.json({ received: true })
}
