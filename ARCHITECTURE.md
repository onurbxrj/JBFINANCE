# ARCHITECTURE.md — Fonte Única da Verdade

> Última atualização: 06/03/2026
>
> Este arquivo documenta a arquitetura completa do JB Finance.
> Toda informação de estrutura, banco, rotas e regras de negócio está centralizada aqui.

---

## 1. Visão Geral

Sistema web interno de **gestão financeira** para loja, que centraliza receitas, despesas e custos operacionais para gerar **DRE gerencial**, por setor e consolidado.

**Público**: Funcionários, Gestores e Diretores da loja.

**Diferencial**: Sistema simples, focado em registro rápido, categorias padronizadas e DRE automático. Sem complexidade de ERP.

---

## 2. Stack Tecnológica

| Camada        | Tecnologia                           |
|---------------|--------------------------------------|
| Framework     | Next.js 15 (App Router)              |
| Linguagem     | TypeScript                           |
| Backend / DB  | Supabase (PostgreSQL)                |
| Autenticação  | Supabase Auth                        |
| Segurança     | Row Level Security (RLS)             |
| UI Components | shadcn/ui                            |
| CSS           | Tailwind CSS                         |
| Fonte         | Inter (Google Fonts)                 |
| Arquitetura   | Client-side first                    |

---

## 3. Design System

### Tema (Premium SaaS Dark)

Estilo inspirado em Stripe, Linear, Ramp e Vercel, focado numa interface limpa, calma e ultra-profissional.

| Token        | Hex / Valor                          | Uso                                       |
|--------------|--------------------------------------|-------------------------------------------|
| `primary`    | `#3B82F6`                            | Botões principais, ícones de destaque     |
| `background` | `#0F172A`                            | Fundo principal (App, Layout)             |
| `card`       | `#1E293B`                            | Fundo de modais, tabelas e painéis        |
| `secondary`  | `#111827`                            | Elementos secundários ou de fundo Sidebar |
| `foreground` | `#E2E8F0`                            | Texto primário                            |
| `muted`      | `#94A3B8`                            | Texto secundário, bordas sutis            |
| `success`    | `#22C55E`                            | Valores positivos (Receitas, Lucro)       |
| `danger`     | `#EF4444`                            | Valores negativos (Despesas, Custos)      |
| `border`     | `rgba(148, 163, 184, 0.12)`          | Bordas suaves de containers               |

### Tipografia & Efeitos

- **Fonte**: `Inter` (Google Fonts) para consistência e legibilidade corporativa.
- **Valores Financeiros**: Classe utilitária `.financial-value` com font tabular (tabular-nums) e tracking estreito.
- **Micro-interações**: Fades graduais (`animate-in fade-in`), animação `pulse` para notificações, hover effects com background transparente.
- **Glassmorphism**: Topbar com `backdrop-filter: blur()`.
- **Bordas arredondadas**: Layouts mais orgânicos com `rounded-2xl` e `rounded-xl`.

### Componentes shadcn/ui customizados

Input, Select, Textarea, Button, Card, Dialog, Table, Label (Todos adaptados para consumir as variáveis CSS do dark theme base).

---

## 4. Estrutura de Pastas

```
src/
├── app/
│   ├── page.tsx                        # Redirect → /login
│   ├── login/page.tsx                  # Tela de login
│   └── (app)/                          # Layout autenticado (Sidebar + Content)
│       ├── layout.tsx                  # Layout com Sidebar
│       ├── dashboard/page.tsx          # DRE Consolidado + Visão Hoje
│       ├── receitas/page.tsx           # CRUD receitas por setor
│       ├── despesas/page.tsx           # CRUD despesas com rateio
│       ├── custos/
│       │   ├── gelo/page.tsx           # CRUD custos de gelo
│       │   └── peixe/page.tsx          # CRUD custos de peixe
│       ├── relatorios/
│       │   ├── dre/page.tsx            # DRE Consolidado (Loja)
│       │   ├── dre-acougue/page.tsx    # DRE Setor Açougue
│       │   └── dre-peixaria/page.tsx   # DRE Setor Peixaria
│       └── configuracoes/
│           ├── contas/page.tsx         # Gestão de Planos de Contas e Categorias
│           └── usuarios/page.tsx       # Gestão de Usuários e Roles
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx                 # Menu lateral com RBAC
│   │   └── topbar.tsx                  # Header superior fixo (Page Title, Relógio, etc)
│   └── ui/                             # Componentes shadcn/ui
├── contexts/
│   └── AuthContext.tsx                  # Provider de auth + role
└── lib/
    ├── api.ts                          # Funções de acesso ao Supabase
    ├── supabase.ts                     # Cliente Supabase (server)
    └── supabase/
        └── client.ts                   # Cliente Supabase (browser)
```

---

## 5. Sidebar e Navegação

```
📊 Dashboard                    [funcionario, gestor, diretor]
📈 Receitas                     [funcionario, gestor, diretor]
📉 Despesas                     [funcionario, gestor, diretor]
📦 Custos                       [funcionario, gestor, diretor]
   ├── ❄️ Gelo
   └── 🐟 Peixe
📄 Relatórios                   [gestor, diretor]
   ├── DRE Consolidado
   ├── DRE Açougue
   └── DRE Peixaria
⚙️ Configurações                [diretor]
   ├── Contas
   └── Usuários
```

---

## 6. Banco de Dados (Supabase PostgreSQL)

### 6.1 Tabela `profiles`

| Coluna     | Tipo        | Notas                                    |
|------------|-------------|------------------------------------------|
| id         | uuid (PK)   | FK → auth.users.id                       |
| nome       | text         |                                          |
| email      | text         |                                          |
| role       | text         | Default: `'funcionario'`                 |
| created_at | timestamp    | Default: `now()`                         |

RLS: ❌ (desabilitado — acesso via service_role e auth)

### 6.2 Tabela `receitas`

| Coluna         | Tipo        | Notas                              |
|----------------|-------------|------------------------------------|
| id             | uuid (PK)   | Default: `uuid_generate_v4()`      |
| data           | date         |                                    |
| setor          | text         | `'ACOUQUE'` ou `'PEIXARIA'`       |
| origem_receita | text         | Nullable                           |
| plano_contas   | text         | Nullable                           |
| categoria      | text         | Selecionada conforme setor         |
| valor          | numeric      |                                    |
| created_by     | uuid         | FK → profiles.id                   |
| created_at     | timestamp    | Default: `now()`                   |

RLS: ✅

**Categorias por setor (hardcoded no frontend):**

| Setor     | Categorias                                            |
|-----------|-------------------------------------------------------|
| ACOUQUE   | Mercearia, Bebidas, Frios e Laticínios, Condimentos, Carnes |
| PEIXARIA  | Atacado Pescado, Pescados                             |

### 6.3 Tabela `despesas`

| Coluna       | Tipo        | Notas                              |
|--------------|-------------|------------------------------------|
| id           | uuid (PK)   | Default: `uuid_generate_v4()`      |
| data         | date         |                                    |
| centro_custo | text         | `'Açougue'`, `'Peixaria'`, etc.   |
| plano_contas | text         | Select → tabela `plano_contas`     |
| categoria    | text         | Select → tabela `categorias`       |
| descricao    | text         | Nullable                           |
| valor        | numeric      |                                    |
| observacao   | text         | Nullable                           |
| tipo_rateio  | varchar      | Default: `'nenhum'`. Valores: `nenhum`, `igual`, `percentual` |
| created_by   | uuid         | FK → profiles.id                   |
| created_at   | timestamp    | Default: `now()`                   |

RLS: ✅

### 6.4 Tabela `rateio_despesas`

| Coluna     | Tipo        | Notas                              |
|------------|-------------|------------------------------------|
| id         | uuid (PK)   | Default: `gen_random_uuid()`       |
| despesa_id | uuid         | FK → despesas.id                   |
| setor      | varchar      | `'Açougue'` ou `'Peixaria'`       |
| percentual | numeric      | Ex: 60 para 60%                    |
| created_at | timestamptz  |                                    |

RLS: ✅

### 6.5 Tabela `custo_gelo`

| Coluna        | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| id            | uuid (PK)   | Default: `uuid_generate_v4()`      |
| data          | date         |                                    |
| quantidade    | numeric      |                                    |
| custo_unitario| numeric      |                                    |
| custo_total   | numeric      | Nullable (calculado)               |
| valor_venda   | numeric      |                                    |
| created_by    | uuid         | FK → profiles.id                   |
| created_at    | timestamp    | Default: `now()`                   |

RLS: ✅. Pertence ao setor **Peixaria** no DRE.

### 6.6 Tabela `custo_peixe`

| Coluna        | Tipo        | Notas                              |
|---------------|-------------|------------------------------------|
| id            | uuid (PK)   | Default: `uuid_generate_v4()`      |
| data          | date         |                                    |
| produto       | text         |                                    |
| quantidade    | numeric      |                                    |
| custo_unitario| numeric      |                                    |
| custo_total   | numeric      | Nullable (calculado)               |
| valor_venda   | numeric      |                                    |
| observacao    | text         | Nullable                           |
| created_by    | uuid         | FK → profiles.id                   |
| created_at    | timestamp    | Default: `now()`                   |

RLS: ✅. Pertence ao setor **Peixaria** no DRE.

### 6.7 Tabela `plano_contas`

| Coluna     | Tipo        | Notas                              |
|------------|-------------|------------------------------------|
| id         | uuid (PK)   | Default: `gen_random_uuid()`       |
| nome       | varchar      | Unique                             |
| ativo      | boolean      | Default: `true`                    |
| created_at | timestamptz  |                                    |

RLS: ✅ (leitura pública, escrita para diretor)

### 6.8 Tabela `categorias`

| Coluna     | Tipo        | Notas                              |
|------------|-------------|------------------------------------|
| id         | uuid (PK)   | Default: `gen_random_uuid()`       |
| nome       | varchar      | Unique                             |
| ativo      | boolean      | Default: `true`                    |
| created_at | timestamptz  |                                    |

RLS: ✅ (leitura pública, escrita para diretor)

### 6.9 Tabela `audit_logs`

| Coluna     | Tipo        | Notas                              |
|------------|-------------|------------------------------------|
| id         | uuid (PK)   | Default: `uuid_generate_v4()`      |
| user_id    | uuid         |                                    |
| action     | text         |                                    |
| entity     | text         |                                    |
| entity_id  | uuid         |                                    |
| created_at | timestamp    | Default: `now()`                   |

RLS: ✅

### Função auxiliar

```sql
CREATE FUNCTION public.user_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$ SELECT role FROM profiles WHERE id = auth.uid(); $$;
```

Usada pelas políticas RLS para checar a role do usuário autenticado.

---

## 7. Regras de Negócio

### 7.1 Setores

A loja opera com dois setores:

- **Açougue**: Mercearia, Bebidas, Frios e Laticínios, Condimentos, Carnes
- **Peixaria**: Atacado Pescado, Pescados

### 7.2 Rateio de Despesas

Despesas compartilhadas (ex: Energia, Aluguel, Internet) são rateadas entre setores.

| Tipo         | Comportamento                                      |
|--------------|-----------------------------------------------------|
| `nenhum`     | Despesa pertence a um setor específico (via `centro_custo`) |
| `igual`      | Dividida 50% Açougue / 50% Peixaria               |
| `percentual` | Dividida conforme registros em `rateio_despesas`    |

### 7.3 DRE (Demonstração do Resultado)

Estrutura do cálculo (idêntica para consolidado e por setor):

```
  Receita Bruta
  (-) Custos Diretos (Gelo + Peixe → só Peixaria)
  = Lucro Bruto
  (-) Despesas (diretas + rateadas)
  = Resultado Operacional
  Margem %
```

**Três visões**:
- DRE Consolidado (Loja) — soma de todos os setores
- DRE Açougue — receitas ACOUQUE, despesas diretas + rateadas
- DRE Peixaria — receitas PEIXARIA, custos gelo/peixe, despesas diretas + rateadas

**Dashboard** mostra o DRE Consolidado do mês atual + cards de "Visão Hoje".

**Cálculo**: feito inteiramente no frontend via JavaScript (`useMemo`). Dados carregados via Supabase REST API.

---

## 8. RBAC (Controle de Acesso)

| Permissão                           | Funcionário | Gestor | Diretor |
|-------------------------------------|:-----------:|:------:|:-------:|
| Criar receitas / despesas / custos  | ✅          | ✅     | ✅      |
| Editar registros                    | ❌          | ✅     | ✅      |
| Excluir registros                   | ❌          | ✅     | ✅      |
| Ver DRE e Relatórios                | ❌          | ✅     | ✅      |
| Criar planos de contas / categorias | ❌          | ❌     | ✅      |
| Editar/desativar contas             | ❌          | ❌     | ✅      |
| Gerenciar Usuários e Roles          | ❌          | ❌     | ✅      |

**Implementação**:
- Frontend: `useAuth()` → `role` condiciona visibilidade de menus e botões
- Backend: Políticas RLS na tabela usam `user_role()` para validar permissões

---

## 9. API (lib/api.ts)

| Função                | Tabela           | Operação            |
|-----------------------|------------------|---------------------|
| `getReceitas()`       | receitas         | SELECT *            |
| `addReceita()`        | receitas         | INSERT              |
| `updateReceita()`     | receitas         | UPDATE              |
| `deleteReceita()`     | receitas         | DELETE              |
| `getDespesas()`       | despesas         | SELECT *            |
| `addDespesa()`        | despesas         | INSERT              |
| `updateDespesa()`     | despesas         | UPDATE              |
| `deleteDespesa()`     | despesas         | DELETE              |
| `getRateiosDespesa()` | rateio_despesas  | SELECT by despesa_id |
| `getAllRateios()`      | rateio_despesas  | SELECT *            |
| `saveRateiosDespesa()`| rateio_despesas  | DELETE + INSERT      |
| `getCustosGelo()`     | custo_gelo       | SELECT *            |
| `addCustoGelo()`      | custo_gelo       | INSERT              |
| `updateCustoGelo()`   | custo_gelo       | UPDATE              |
| `deleteCustoGelo()`   | custo_gelo       | DELETE              |
| `getCustosPeixe()`    | custo_peixe      | SELECT *            |
| `addCustoPeixe()`     | custo_peixe      | INSERT              |
| `updateCustoPeixe()`  | custo_peixe      | UPDATE              |
| `deleteCustoPeixe()`  | custo_peixe      | DELETE              |
| `getProfiles()`       | profiles         | SELECT *            |
| `updateProfileRole()` | profiles         | UPDATE role         |
| `getPlanosContas()`   | plano_contas     | SELECT (all=true retorna inativos) |
| `addPlanoConta()`     | plano_contas     | INSERT              |
| `updatePlanoConta()`  | plano_contas     | UPDATE              |
| `getCategorias()`     | categorias       | SELECT (all=true retorna inativos) |
| `addCategoria()`      | categorias       | INSERT              |
| `updateCategoria()`   | categorias       | UPDATE              |

---

## 10. Funcionalidades Futuras (Não Implementadas)

- [ ] Filtros por período no DRE
- [ ] Gráfico receita vs despesa no Dashboard
- [ ] Exportação CSV / PDF
- [ ] Padronizar categorias de receitas via tabela mestre (como despesas)
- [ ] Importação automática do sistema da loja
- [ ] Metas de vendas
- [ ] Controle de estoque (fora do escopo)
- [ ] Multi-empresa (fora do escopo)
- [ ] Integração fiscal / emissão de notas (fora do escopo)
