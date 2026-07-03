import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  try {
    const { plano, email, nome, clienteId } = await req.json()

    if (!plano || !['SEMESTRAL', 'ANUAL'].includes(plano)) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json(
        { error: 'Stripe não configurado. Defina STRIPE_SECRET_KEY nas variáveis de ambiente da Vercel.' },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

    const PRECO_MENSAL = 249.00
    const meses = plano === 'ANUAL' ? 12 : 6
    const valorTotal = PRECO_MENSAL * meses // sem desconto, conforme regra de negócio

    const baseUrl = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://viabilizzecrm.vercel.app'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card', 'boleto'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'brl',
          unit_amount: Math.round(valorTotal * 100), // centavos
          product_data: {
            name: `Calculadora VIABILIZZE — Plano ${plano === 'ANUAL' ? 'Anual' : 'Semestral'}`,
            description: `Acesso à Calculadora VIABILIZZE por ${meses} meses · R$ ${PRECO_MENSAL.toFixed(2)}/mês`,
          },
        },
        quantity: 1,
      }],
      metadata: {
        plano, email, nome: nome || '', clienteId: clienteId || '', meses: String(meses),
        produto_slug: 'calculadora-viabilizze',
      },
      success_url: `${baseUrl}/produtos/calculadora-viabilizze?checkout=sucesso&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/produtos/calculadora-viabilizze?checkout=cancelado`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('[checkout] erro:', err.message)
    return NextResponse.json({ error: 'Erro ao iniciar pagamento. Tente novamente.' }, { status: 500 })
  }
}
