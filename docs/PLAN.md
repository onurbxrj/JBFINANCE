# Plano de Orquestração: Corrigir Métrica "Receita vs Despesas" Vazia

## 1. Descrição do Problema
O usuário relatou um erro na métrica "Receita vs Despesas" do gráfico de barras no Dashboard Principal. O gráfico está sendo renderizado com estado vazio (sem barras), mesmo havendo dados no sistema. O eixo X (tempo) apresenta os últimos 7 dias corretamente, mas os valores do eixo Y (receitas e despesas) indicam "0" de forma incorreta.

## 2. Hipótese da Causa do Erro (Root Cause)
O problema provavelmente está no arquivo `src/app/actions/dashboard.ts`, especificamente na lógica que constrói a variável `barChartData`. Possíveis problemas:
- **Falha de Busca por Data (String):** A comparação `r.data.startsWith(dateStr)` pode estar falhando devido a formatos de string inesperados (ex: offset de fuso horário não computado ou zero à esquerda na formatação ISO).
- **Distúrbio de Fuso Horário (Timezone Skew):** O `new Date()` renderizado do lado do servidor pode estar avaliando dias baseando-se em um fuso horário diferente do fuso que armazenou o dado original no Supabase.
- **Divergência de Data-Referência:** O gráfico tenta extrair "últimos 7 dias" baseando-se agressivamente do horário estático de renderização (`new Date()`), ao invés de respeitar a data selecionada atual do calendário (`currentDate`) ou aplicar "limites absolutos e fixos" corretos para o cálculo estatístico.

## 3. Estratégia de Orquestração (Fase 2 - Execução)
Seguindo o rigoroso Protocolo de Orquestração Múltipla, nós iremos invocar os seguintes agentes ultra-especializados **em paralelo** assim que você relatar a aprovação deste plano.

### Agente 1: `debugger` 
**Ação Operacional:** Analisar profundamente a extração estrutural da Server Action `getDashboardData`.
- Avaliar formatos de log das datas geradas pelo Supabase.
- Confirmar cientificamente onde o laço ou array falha no mapeamento das "receitas.forEach" que resulta constantemente em 0.

### Agente 2: `backend-specialist`
**Ação Operacional:** Codificar a correção escalável no Backend.
- Refatorar completamente o bloco lendo dates usando as tipagens nativas do `date-fns` (como `isSameDay` e comparação de dias) em vez da frágil validação baseada em texto string (`startsWith`).
- Parametrizar corretamente que o cálculo dos "7 dias" garanta dados válidos e coerentes de acordo com a meta original definida na arquitetura.

### Agente 3: `frontend-specialist`
**Ação Operacional:** Polir os Módulos Visuais.
- Assegurar que o `BarChart` em `src/app/(app)/dashboard/page.tsx` lide perfeitamente com valores vazios caso realmente ocorram no futuro, evitando falhas com esmagamento de eixos "Y$ 0" esquisitos na UI.
- Garantir "UX MAX" reportando subtilmente que não ocorreram dados.

### Agente 4: `test-engineer`
**Ação Operacional:** Validar Performance e Qualidade.
- Rodar o Script Master de validação `checklist.py .` validando e atestando que a tipagem e segurança ainda passam.
- Confirmar estruturalmente o output visual finalizado para liberar a plataforma em ambiente saudável.

## 4. Critérios de Confirmação e Validação Final
- [ ] O array serializado `barChartData` reflete perfeitamente as informações reais.
- [ ] Visualização das barras (BarChart) renderiza dinamicamente e corretamente no Dashboard.
- [ ] Validação é firmada pelo controle severo de datas de precisão (date-fns) do TypeScript, e não leitura de strings primitivas.
- [ ] Validações sistêmicas (scripts de check python) finalizam sem falhas ou regressões.

---
**Status:** ⏳ **Aguardando aprovação via Resposta Simples do Usuário para iniciar o Processo de Orquestração na Prática (Fase 2).**
