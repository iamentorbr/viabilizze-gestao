import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Gera senha aleatória legível: 2 grupos de 4 char separados por hífen (ex: A3kp-7Bnz) */
function gerarSenha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${seg(4)}-${seg(4)}`
}

/** Hash simples SHA-256 (sem bcrypt para não precisar de dep nativa na Vercel Edge) */
function hashSenha(senha: string): string {
  return createHash('sha256').update(senha + process.env.SENHA_SALT || 'viabilizze-salt-2026').digest('hex')
}

/** Token de sessão 48 chars */
function gerarToken(): string {
  return randomBytes(24).toString('hex')
}

/** Envia e-mail via Resend (configurável) */
async function enviarEmailAcesso(
  nome: string, email: string, senha: string, plano: string, meses: number
) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    console.warn('[webhook] RESEND_API_KEY não configurada — e-mail não enviado')
    return
  }

  const planLabel = plano === 'ANUAL' ? 'Anual (12 meses)' : 'Semestral (6 meses)'
  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head><meta charset="UTF-8"/></head>
    <body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px;">
      <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <div style="background:#1a1d23;padding:28px 32px;text-align:center;">
          <p style="color:#F97316;font-size:22px;font-weight:900;margin:0;letter-spacing:-0.5px;">VIABILIZZE</p>
          <p style="color:rgba(255,255,255,.6);font-size:11px;margin:4px 0 0;">ASSESSORIA INDUSTRIAL</p>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1a1d23;font-size:18px;margin:0 0 8px;">Seu acesso está pronto, ${nome.split(' ')[0]}! 🎉</h2>
          <p style="color:#5f6368;font-size:14px;line-height:1.6;margin:0 0 24px;">
            Pagamento confirmado — Plano <strong>${planLabel}</strong>. 
            Use os dados abaixo para acessar a <strong>Calculadora VIABILIZZE</strong>.
          </p>
          
          <div style="background:#fff9f5;border:1px solid #ffe0b2;border-radius:10px;padding:20px;margin-bottom:24px;">
            <p style="color:#e65100;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin:0 0 12px;">Seus dados de acesso</p>
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#9aa0a6;width:80px;">Acesso:</td>
                <td style="padding:6px 0;font-size:13px;color:#1a1d23;font-weight:700;">
                  <a href="https://viabilizzecrm.vercel.app/calculadora-viabilizze" style="color:#F97316;">viabilizzecrm.vercel.app/calculadora-viabilizze</a>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#9aa0a6;">E-mail:</td>
                <td style="padding:6px 0;font-size:13px;color:#1a1d23;font-weight:700;">${email}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:12px;color:#9aa0a6;">Senha:</td>
                <td style="padding:6px 0;font-size:16px;color:#F97316;font-weight:900;letter-spacing:1px;">${senha}</td>
              </tr>
            </table>
          </div>

          <a href="https://viabilizzecrm.vercel.app/calculadora-viabilizze"
            style="display:block;text-align:center;background:linear-gradient(135deg,#F97316,#ea6a00);color:#fff;text-decoration:none;padding:14px;border-radius:10px;font-weight:700;font-size:14px;margin-bottom:20px;">
            Acessar Calculadora VIABILIZZE →
          </a>

          <p style="color:#9aa0a6;font-size:11px;line-height:1.6;margin:0;">
            Guarde esta senha com segurança. Você pode alterá-la após o primeiro acesso.<br/>
            Dúvidas? Responda este e-mail ou acesse assessoriaviabilizze.com.br.
          </p>
        </div>
        <div style="background:#fafafa;padding:16px 32px;border-top:1px solid #e8eaed;text-align:center;">
          <p style="color:#9aa0a6;font-size:10px;margin:0;">
            VIABILIZZE Assessoria Industrial · Desenvolvido por VI.P & NÔUS Consultoria
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
    body: JSON.stringify({
      from: 'VIABILIZZE <noreply@assessoriaviabilizze.com.br>',
      to: email,
      subject: '🔑 Seu acesso à Calculadora VIABILIZZE está pronto!',
      html,
    }),
  })
}

// ─── HANDLER ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const stripeKey     = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret)
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 500 })

  const stripe    = new Stripe(stripeKey, { apiVersion: '2024-06-20' })
  const supabase  = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const body = await req.text()
  const sig  = req.headers.get('stripe-signature') || ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('[webhook] sig inválida:', err.message)
    return NextResponse.json({ error: 'Assinatura inválida' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed')
    return NextResponse.json({ received: true })

  const session  = event.data.object as Stripe.Checkout.Session
  const { plano, email, nome, meses, produto_slug } = session.metadata || {}

  if (!email || !plano || !produto_slug) {
    console.error('[webhook] metadata incompleta', session.metadata)
    return NextResponse.json({ error: 'metadata incompleta' }, { status: 400 })
  }

  // 1. Buscar produto
  const { data: produto } = await supabase
    .from('produtos_viabilizze').select('id').eq('slug', produto_slug).single()
  if (!produto) return NextResponse.json({ error: 'produto não encontrado' }, { status: 404 })

  // 2. Criar ou atualizar usuário externo
  const senha     = gerarSenha()
  const senhaHash = hashSenha(senha)

  const { data: usuarioExistente } = await supabase
    .from('usuarios_externos').select('id, ativo').eq('email', email).maybeSingle()

  let usuarioId: string

  if (usuarioExistente) {
    // Reativa usuário se estava inativo
    await supabase.from('usuarios_externos').update({
      senha_hash: senhaHash, senha_temporaria: senha, ativo: true, primeiro_acesso: true,
    }).eq('id', usuarioExistente.id)
    usuarioId = usuarioExistente.id
  } else {
    // Cria usuário novo
    const { data: novoUsuario } = await supabase.from('usuarios_externos').insert({
      nome:             nome || email.split('@')[0],
      email,
      senha_hash:       senhaHash,
      senha_temporaria: senha,
      ativo:            true,
      primeiro_acesso:  true,
    }).select('id').single()
    if (!novoUsuario) return NextResponse.json({ error: 'erro ao criar usuário' }, { status: 500 })
    usuarioId = novoUsuario.id
  }

  // 3. Criar assinatura ativa
  const dataInicio    = new Date()
  const dataExpiracao = new Date()
  dataExpiracao.setMonth(dataExpiracao.getMonth() + Number(meses || 6))

  await supabase.from('assinaturas_produtos').insert({
    usuario_externo_id: usuarioId,
    produto_id:         produto.id,
    plano,
    status:             'ATIVA',
    valor_total:        (session.amount_total || 0) / 100,
    email_comprador:    email,
    nome_comprador:     nome || null,
    stripe_customer_id: session.customer as string,
    stripe_session_id:  session.id,
    data_inicio:        dataInicio.toISOString(),
    data_expiracao:     dataExpiracao.toISOString(),
    email_enviado:      false,
  })

  // 4. Enviar e-mail com credenciais
  await enviarEmailAcesso(nome || email, email, senha, plano, Number(meses))

  // 5. Marcar e-mail enviado
  await supabase.from('assinaturas_produtos')
    .update({ email_enviado: true })
    .eq('stripe_session_id', session.id)

  console.log(`[webhook] ✓ Usuário criado: ${email} | Plano: ${plano}`)
  return NextResponse.json({ received: true })
}
