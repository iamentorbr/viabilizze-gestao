import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const PRECO_MENSAL = 249.00

export async function POST(req: NextRequest) {
  try {
    const { plano, email, nome } = await req.json()

    if (!plano || !['SEMESTRAL', 'ANUAL'].includes(plano))
      return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 })

    if (!email?.trim())
      return NextResponse.json({ error: 'E-mail é obrigatório.' }, { status: 400 })

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey)
      return NextResponse.json({ error: 'Pagamento não configurado. Entre em contato com a VIABILIZZE.' }, { status: 500 })

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
    const meses = plano === 'ANUAL' ? 12 : 6
    const valorTotal = PRECO_MENSAL * meses

    const baseUrl = req.headers.get('origin') || 'https://viabilizzecrm.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'boleto'],
      customer_email: email.trim(),
      locale: 'pt-BR',
      line_items: [{
        price_data: {
          currency: 'brl',
          unit_amount: Math.round(valorTotal * 100),
          product_data: {
            name: `Calculadora VIABILIZZE — Plano ${plano === 'ANUAL' ? 'Anual (12 meses)' : 'Semestral (6 meses)'}`,
            description: `Acesso à Calculadora VIABILIZZE · R$ ${PRECO_MENSAL.toFixed(2).replace('.', ',')}/mês · Sem descontos`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        plano,
        email: email.trim(),
        nome: nome?.trim() || '',
        meses: String(meses),
        produto_slug: 'calculadora-viabilizze',
        origem: 'site-viabilizze',
      },
      success_url: `${baseUrl}/calculadora-viabilizze?status=sucesso&session={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/calculadora-viabilizze?status=cancelado`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[checkout]', err.message)
    return NextResponse.json({ error: 'Erro ao iniciar pagamento. Tente novamente.' }, { status: 500 })
  }
}
