# JB Finance

Sistema web interno de gestão financeira para loja, centralizando receitas, despesas e custos operacionais para gerar **fluxo de caixa e DRE por setor**.

## Stack

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Backend/Auth**: Supabase (PostgreSQL + Auth + Row Level Security)
- **UI**: shadcn/ui + Tailwind CSS
- **Fonte**: Inter (Google Fonts)

## Como Rodar

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

## Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

## Estrutura de Pastas

```
src/
├── app/
│   ├── (app)/                    # Rotas autenticadas (com layout sidebar)
│   │   ├── dashboard/            # DRE Consolidado + Visão Hoje
│   │   ├── receitas/             # CRUD de receitas por setor
│   │   ├── despesas/             # CRUD de despesas com rateio
│   │   ├── custos/
│   │   │   ├── gelo/             # Custos operacionais de gelo
│   │   │   └── peixe/            # Custos operacionais de peixe
│   │   ├── relatorios/
│   │   │   ├── dre/              # DRE Consolidado (Loja)
│   │   │   ├── dre-acougue/      # DRE Setor Açougue
│   │   │   └── dre-peixaria/     # DRE Setor Peixaria
│   │   └── configuracoes/
│   │       ├── contas/           # Gestão de Planos de Contas e Categorias
│   │       └── usuarios/         # Gestão de Usuários e Roles
│   ├── login/                    # Tela de login (Supabase Auth)
│   └── page.tsx                  # Redirect para /login
├── components/
│   ├── layout/
│   │   └── sidebar.tsx           # Sidebar com RBAC
│   └── ui/                       # Componentes shadcn/ui
├── contexts/
│   └── AuthContext.tsx            # Contexto de autenticação + role
└── lib/
    ├── api.ts                    # Funções de acesso ao Supabase
    ├── supabase.ts               # Cliente Supabase (server)
    └── supabase/
        └── client.ts             # Cliente Supabase (browser)
```

## Roles (RBAC)

| Permissão | Funcionário | Gestor | Diretor |
|-----------|:-----------:|:------:|:-------:|
| Criar receitas/despesas/custos | ✅ | ✅ | ✅ |
| Editar registros | ❌ | ✅ | ✅ |
| Excluir registros | ❌ | ✅ | ✅ |
| Ver DRE e Relatórios | ❌ | ✅ | ✅ |
| Gerenciar Contas/Categorias | ❌ | ❌ | ✅ |
| Gerenciar Usuários | ❌ | ❌ | ✅ |

## Banco de Dados (Supabase)

Tabelas principais:

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Usuários do sistema (id, nome, email, role) |
| `receitas` | Registro de receitas por setor e categoria |
| `despesas` | Registro de despesas com tipo de rateio |
| `rateio_despesas` | Alocação percentual de despesas entre setores |
| `custo_gelo` | Custos operacionais de gelo |
| `custo_peixe` | Custos operacionais de peixe |
| `plano_contas` | Tabela mestre de planos de contas |
| `categorias` | Tabela mestre de categorias |
