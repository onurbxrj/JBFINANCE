# Importação de Despesas via Excel

## Goal
Permitir que usuários façam upload de uma planilha (.xlsx) com múltiplas despesas, validando os dados no frontend e inserindo em lote no Supabase.

## Tasks
- [x] Task 1: Instalar biblioteca `xlsx` (`npm install xlsx`) → Verify: Verificar se consta no `package.json`
- [x] Task 2: Adicionar função `addDespesasBulk` em `src/lib/api.ts` → Verify: Verificar no Supabase se um array de despesas é inserido.
- [x] Task 3: Gerar arquivo `template-despesas.xlsx` na pasta `public` → Verify: Verificar se o arquivo existe e pode ser baixado.
- [x] Task 4: Criar na página de Despesas (`src/app/(app)/despesas/page.tsx`) botão e Modal de "Importar Planilha" → Verify: Modal abre e possui área de input de arquivo.
- [x] Task 5: Implementar a lógica de conversão do Excel: ler arquivo, converter datas seriais e mapear colunas (Data, Valor, Centro de Custo, etc) → Verify: Selecionar planilha e ver no console os dados formatados corretamente.
- [x] Task 6: Implementar lógica de Envio (Bulk Insert) e tratamento de erros visuais no Modal → Verify: Dados inseridos com sucesso refletem na tabela de despesas.

## Done When
- [x] O usuário consegue baixar o template.
- [x] O usuário consegue fazer o upload do template preenchido.
- [x] O sistema valida as colunas principais e notifica sucesso ou erro.
- [x] As despesas importadas aparecem corretamente estruturadas e formatadas na tabela.

## Notes
- Como o tipo primitivo para tratar datas do Excel em JS pode ser complicado, usaremos uma função utilitária dedicada para isso garantindo que seja string `YYYY-MM-DD`.
- Se houver rateio, na planilha será marcado como "nenhum" por padrão nas importações em lote para simplificar, exigindo a alocação num centro de custo.
