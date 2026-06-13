# VIABILIZZE — Sistema de Gestão

Sistema web integrado de gestão para **VIABILIZZE Consultoria** (setor alimentício / produção de bebidas).

Desenvolvido por **VI.P & NÔUS Consultoria**.

---

## Módulos

| Módulo | Descrição |
|---|---|
| **Dashboard** | KPIs, gráficos de produção e compras, status do estoque |
| **Clientes** | CRM básico com cadastro e gestão de clientes |
| **Produção** | Ordens de produção, fichas técnicas, controle de lotes |
| **Estoque** | Ingredientes, matérias-primas, alertas de ruptura |
| **Compras** | Pedidos de compra, fornecedores, recebimento |
| **Rotulagem** | Informações nutricionais, registro MAPA/ANVISA |
| **Projetos** | Projetos e tarefas com acompanhamento de progresso |
| **Relatórios** | Relatórios gerenciais, produção, estoque e custo |

---

## Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Deploy**: Vercel
- **Gráficos**: Recharts

---

## Configuração

1. Copie `.env.example` para `.env.local`
2. Preencha as variáveis do Supabase:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://ktmexoivtrphkvzrqeie.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
   ```
3. Instale dependências: `npm install`
4. Rode localmente: `npm run dev`

---

## Banco de Dados (Supabase)

Projeto: `viabilizze-gestao` — Região: `sa-east-1` (São Paulo)

Tabelas criadas:
- `clientes` — CRM
- `categorias_produto` — Categorias
- `produtos` — Catálogo de bebidas
- `ingredientes` — Matérias-primas
- `fichas_tecnicas` + `ficha_tecnica_itens` — Receitas
- `ordens_producao` + `producao_consumo_ingredientes` — Produção
- `estoque_produtos` + `movimentacoes_estoque` — Estoque
- `fornecedores` — Cadastro de fornecedores
- `pedidos_compra` + `pedido_compra_itens` — Compras
- `rotulagem` — Informações de rótulo
- `projetos` + `tarefas` — Gestão de projetos

---

*VI.P & NÔUS Consultoria — 2026*
