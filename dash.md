    You are a senior frontend engineer specialized in financial dashboards.

Redesign the dashboard of this financial management system to look like a **modern financial SaaS product similar to Stripe or Ramp**.

Stack:

Next.js  
TypeScript  
TailwindCSS  
shadcn/ui

----------

DASHBOARD STRUCTURE

Top section: financial metric cards.

Row 1:

Receita Hoje  
Despesas Hoje  
Lucro Hoje

Row 2:

Receita do Mês  
Despesas do Mês  
Lucro do Mês

Each card must contain:

• icon  
• large value  
• small comparison text

Example:

Receita Hoje  
R$ 12.500  
+8% vs ontem

Cards should use:

rounded-2xl  
shadow-lg  
padding

----------

CHART SECTION

Add charts:

1.  Receita vs Despesas (bar chart)
    
2.  Receita por setor (pie chart)
    

Setores:

Açougue  
Peixaria

3.  Despesas por categoria
    

Charts should be minimal and modern.

----------

DRE SECTION

Add a visual DRE block.

Structure:

Receita Total

(-) Custos

(-) Despesas

= Resultado

Use colors:

Green → profit  
Red → costs

Also show **DRE by sector**.

----------

TABLE SECTION

Add a recent transactions table.

Columns:

Data  
Tipo  
Categoria  
Setor  
Valor

Include:

search  
pagination  
hover rows

----------

UX DETAILS

Use subtle animations:

transition-all  
duration-200

Cards should slightly elevate on hover.

----------

FINAL GOAL

The dashboard must look like a **premium financial SaaS interface similar to Stripe Dashboard**.

