import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ---- tipos principais ----
export type Cliente = {
  id: string; nome: string; cnpj_cpf?: string; email?: string
  telefone?: string; cidade?: string; estado?: string
  contato_responsavel?: string; ativo: boolean; observacoes?: string
  criado_em: string
}
export type OrdemProducao = {
  id: string; numero: string; produto_id: string; status: string
  quantidade_planejada: number; quantidade_produzida: number
  unidade_medida: string; data_planejada?: string; numero_lote?: string
  responsavel?: string; observacoes?: string; criado_em: string
  produtos?: { nome: string }
}
export type Ingrediente = {
  id: string; codigo: string; nome: string; unidade_medida: string
  estoque_atual: number; estoque_minimo: number; custo_unitario: number
  fornecedor_principal?: string; ativo: boolean
}
export type PedidoCompra = {
  id: string; numero: string; fornecedor_id: string; status: string
  data_pedido: string; data_entrega_prevista?: string
  data_recebimento?: string; valor_total: number; observacoes?: string
  fornecedores?: { nome: string }
}
export type Projeto = {
  id: string; nome: string; descricao?: string; status: string
  data_inicio?: string; data_prevista_fim?: string; criado_em: string
}
export type Tarefa = {
  id: string; projeto_id?: string; titulo: string; status: string
  prioridade: string; data_vencimento?: string; criado_em: string
}
