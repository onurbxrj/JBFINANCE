Visão Geral
===========

Sistema web para **gestão financeira simplificada da loja**, centralizando receitas, despesas e custos para gerar **fluxo de caixa e DRE por setor**.

Personas
========

Funcionário
-----------

Responsável por registrar:

*   receitas
    
*   custos operacionais
    
*   despesas simples
    

Objetivo: registrar dados rapidamente.

Gestor
------

Acompanha:

*   despesas
    
*   receitas
    
*   fluxo de caixa
    

Diretor
-------

Analisa:

*   DRE mensal
    
*   resultado por setor
    

User Stories
============

### Despesas

Como funcionário  
Quero registrar uma despesa  
Para que o sistema calcule o resultado financeiro.

### Receitas

Como funcionário  
Quero registrar receitas por categoria  
Para analisar vendas por setor.

### Custos

Como funcionário  
Quero registrar custos de gelo e peixe  
Para calcular corretamente o resultado.

### Dashboard

Como gestor  
Quero ver o resultado financeiro rapidamente  
Para acompanhar o desempenho da loja.

Requisitos Funcionais
=====================

Login
-----

Usuário pode:

*   criar conta
    
*   fazer login
    
*   acessar sistema
    

Perfis:

*   funcionário
    
*   gestor
    
*   diretor
    

Módulo Despesas
===============

Campos:

*   data
    
*   centro\_custo
    
*   plano\_contas
    
*   categoria
    
*   descricao
    
*   valor
    
*   observacao
    
*   tipo\_rateio (nenhum | igual | percentual)
    

Funções:

*   criar despesa
    
*   editar despesa
    
*   excluir despesa
    
*   listar despesas
    

Módulo Receitas
===============

Campos:

*   data
    
*   setor
    
*   origem\_receita
    
*   plano\_contas
    
*   categoria
    
*   valor
    

Categorias disponíveis:

**Açougue**

*   Mercearia
    
*   Bebidas
    
*   Frios e Laticínios
    
*   Condimentos
    
*   Carnes
    

**Peixaria**

*   Atacado Pescado
    
*   Pescados
    

Módulo Custos
=============

Gelo
----

Campos:

*   data
    
*   quantidade
    
*   custo\_unitario
    
*   custo\_total
    
*   valor\_venda
    

Peixe
-----

Campos:

*   data
    
*   produto
    
*   quantidade
    
*   custo\_unitario
    
*   custo\_total
    
*   valor\_venda
    
*   observacao
    

Dashboard
=========

Mostrar:

### Hoje

*   Receita total
    
*   Despesa total
    
*   Resultado
    

### Mês

*   Receita total
    
*   Despesas
    
*   Resultado
    

### DRE

Estrutura:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   ReceitaAçougue  Mercearia  Bebidas  Frios e Laticínios  Condimentos  CarnesPeixaria  Atacado Pescado  Pescados(-) Custos(-) Despesas= Resultado   `

Requisitos Não Funcionais
=========================

*   Interface simples
    
*   Inserção rápida de dados
    
*   Dashboard carregando em <2s
    
*   Segurança via Supabase Auth
    

Integrações Supabase
====================

Usos:

*   Auth (login)
    
*   Postgres database
    
*   Row Level Security
    
*   API automática
    

Edge Cases
==========

*   funcionário inserir valor negativo
    
*   categoria incorreta
    
*   duplicação de registro
    
*   data inválida
    

Critérios de Aceitação
======================

*   usuário consegue registrar despesa
    
*   usuário consegue registrar receita
    
*   dashboard mostra dados corretos
    
*   DRE calcula automaticamente

Módulo Rateio
=============

Despesas compartilhadas entre setores.

Tabela: rateio\_despesas

Campos:

*   despesa\_id
    
*   setor
    
*   percentual
    

Tipos de rateio:

*   nenhum — despesa pertence a um setor específico
    
*   igual — dividida igualmente entre setores
    
*   percentual — dividida por percentual definido
    

Módulo Configurações
====================

Contas (somente diretor)
------------------------

Gerenciamento de tabelas mestre:

*   plano\_contas (id, nome, ativo)
    
*   categorias (id, nome, ativo)
    

Funções:

*   criar registro
    
*   editar nome
    
*   ativar / desativar
    

Usuários (somente diretor)
--------------------------

*   listar usuários
    
*   alterar role (funcionário / gestor / diretor)