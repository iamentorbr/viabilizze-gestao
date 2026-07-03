import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ valido: false }, { status: 401 })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: sessao } = await supabase
      .from('sessoes_externas')
      .select('*, usuarios_externos(nome, email, ativo)')
      .eq('token', token)
      .maybeSingle()

    if (!sessao) return NextResponse.json({ valido: false }, { status: 401 })
    if (new Date(sessao.expira_em) < new Date())
      return NextResponse.json({ valido: false, motivo: 'expirado' }, { status: 401 })
    if (!(sessao.usuarios_externos as any)?.ativo)
      return NextResponse.json({ valido: false, motivo: 'inativo' }, { status: 403 })

    // Verificar assinatura ainda ativa
    const { data: assinatura } = await supabase
      .from('assinaturas_produtos')
      .select('plano, data_expiracao')
      .eq('usuario_externo_id', sessao.usuario_id)
      .eq('status', 'ATIVA')
      .order('data_expiracao', { ascending: false })
      .limit(1)
      .maybeSingle()

    const semAssinatura = !assinatura || new Date(assinatura.data_expiracao) < new Date()
    if (semAssinatura)
      return NextResponse.json({ valido: false, motivo: 'sem_assinatura' }, { status: 403 })

    return NextResponse.json({
      valido: true,
      usuario: sessao.usuarios_externos,
      assinatura: { plano: assinatura.plano, dataExpiracao: assinatura.data_expiracao },
    })
  } catch (err: any) {
    return NextResponse.json({ valido: false }, { status: 500 })
  }
}
