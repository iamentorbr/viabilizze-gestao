import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'

function hashSenha(senha: string): string {
  return createHash('sha256').update(senha + (process.env.SENHA_SALT || 'viabilizze-salt-2026')).digest('hex')
}

export async function POST(req: NextRequest) {
  try {
    const { email, senha } = await req.json()
    if (!email || !senha)
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Buscar usuário
    const { data: usuario } = await supabase
      .from('usuarios_externos').select('*').eq('email', email.trim().toLowerCase()).maybeSingle()

    if (!usuario)
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })

    if (!usuario.ativo)
      return NextResponse.json({ error: 'Conta inativa. Entre em contato com a VIABILIZZE.' }, { status: 403 })

    // Verificar senha
    if (usuario.senha_hash !== hashSenha(senha))
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })

    // Verificar assinatura ativa
    const { data: assinatura } = await supabase
      .from('assinaturas_produtos')
      .select('plano, data_expiracao, status')
      .eq('usuario_externo_id', usuario.id)
      .eq('status', 'ATIVA')
      .order('data_expiracao', { ascending: false })
      .limit(1)
      .maybeSingle()

    const temAssinatura = assinatura && new Date(assinatura.data_expiracao) > new Date()
    if (!temAssinatura)
      return NextResponse.json({ error: 'Sem assinatura ativa. Renove seu plano em assessoriaviabilizze.com.br.' }, { status: 403 })

    // Criar token de sessão (30 dias)
    const token   = randomBytes(32).toString('hex')
    const expira  = new Date()
    expira.setDate(expira.getDate() + 30)

    await supabase.from('sessoes_externas').insert({
      usuario_id: usuario.id,
      token,
      expira_em:  expira.toISOString(),
      ip:         req.headers.get('x-forwarded-for') || '',
    })

    // Marcar último acesso e remover primeiro_acesso
    await supabase.from('usuarios_externos').update({
      ultimo_acesso:   new Date().toISOString(),
      primeiro_acesso: false,
    }).eq('id', usuario.id)

    return NextResponse.json({
      token,
      usuario: { nome: usuario.nome, email: usuario.email },
      assinatura: {
        plano: assinatura.plano,
        dataExpiracao: assinatura.data_expiracao,
      },
      expira: expira.toISOString(),
    })
  } catch (err: any) {
    console.error('[auth/login]', err.message)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
