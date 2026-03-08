-- SCRIPT PARA RESETAR DADOS DE DESPESAS (CUIDADO AO EXECUTAR!)
-- Este script apaga permanentemente todas as despesas e seus respectivos rateios associados.
-- Só rode isso em ambientes de teste ou quando tiver certeza absoluta de querer zerar essas tabelas.

BEGIN;

-- 1. Primeiro apagamos as dependências (Rateios das Despesas) para não violar chaves estrangeiras
DELETE FROM rateio_despesas;

-- 2. Em seguida, limpamos a tabela principal de Despesas
DELETE FROM despesas;

COMMIT;

-- Obs: Se você quiser "zerar" a contagem dos IDs internos (autoincrement/identity),
-- você pode usar o comando TRUNCATE em vez de DELETE, assim:
-- TRUNCATE TABLE rateio_despesas, despesas RESTART IDENTITY CASCADE;
