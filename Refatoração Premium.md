    You are a senior frontend engineer and product designer.

Refactor the UI of this financial management system to look like a **premium SaaS dashboard**.

Stack used:

Next.js (App Router)  
TypeScript  
TailwindCSS  
shadcn/ui  
Supabase

The system manages financial operations for a retail store:

• receitas  
• despesas  
• custos  
• DRE

The current interface works but looks basic.  
Transform it into a **modern premium dashboard similar to Stripe, Linear or Vercel**.

----------

DESIGN STYLE

Use a **soft dark theme** (not pure black).

Colors:

Background: #0F172A  
Secondary background: #111827  
Card background: #1E293B  
Primary: #3B82F6  
Success: #22C55E  
Danger: #EF4444  
Text: #E2E8F0  
Muted text: #94A3B8

----------

LAYOUT

Create a SaaS layout:

Sidebar | Topbar  
|  
| Main Content

Sidebar width: 240px

Sidebar menu:

Dashboard  
Receitas  
Despesas  
Custos  
Relatórios  
Configurações

Each menu item must include an icon (lucide-react).

Active menu item should have:

• subtle background highlight  
• colored left border indicator

----------

TABLE DESIGN

Improve tables:

• hover rows  
• zebra stripes  
• rounded containers  
• pagination  
• search

Columns example:

Data  
Categoria  
Setor  
Valor  
Ações

Use shadcn table components.

----------

FORM DESIGN

Refactor modal forms.

Expense modal layout:

Row 1  
Data | Valor

Row 2  
Setor | Tipo de Rateio

Row 3  
Plano de Contas

Row 4  
Categoria

Row 5  
Descrição

Row 6  
Observação

Use:

Dialog  
Input  
Select  
Textarea  
Button

----------

TYPOGRAPHY

Font:

Inter or Geist

Hierarchy:

H1 → 28px  
H2 → 22px  
H3 → 18px  
Body → 14px

Financial numbers must be large and bold.

----------

UX GOAL

Employees must be able to register an expense in **less than 5 seconds**.

The interface must feel:

• clean  
• calm  
• professional  
• premium

----------

FINAL RESULT

The UI should look like a **professional SaaS financial dashboard**, not a simple admin panel.

