import * as xlsx from 'xlsx';

const data = [
  {
    "Data": "2026-03-01",
    "Valor": 150.50,
    "Centro de Custo": "Açougue",
    "Plano de Contas": "Despesas Operacionais",
    "Categoria": "Materiais de Limpeza",
    "Descrição": "Compra de sabão e água sanitária",
    "Observação": "Comprado no atacadão"
  },
  {
    "Data": "2026-03-02",
    "Valor": 300.00,
    "Centro de Custo": "Loja",
    "Plano de Contas": "Despesas Administrativas",
    "Categoria": "Material de Escritório",
    "Descrição": "Papel A4 e canetas",
    "Observação": ""
  }
];

const worksheet = xlsx.utils.json_to_sheet(data);
const workbook = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(workbook, worksheet, "Despesas");

const colWidths = [
  { wch: 15 }, // Data
  { wch: 15 }, // Valor
  { wch: 20 }, // Centro de Custo
  { wch: 30 }, // Plano de Contas
  { wch: 30 }, // Categoria
  { wch: 40 }, // Descrição
  { wch: 40 }, // Observação
];
worksheet['!cols'] = colWidths;

xlsx.writeFile(workbook, "public/template-despesas.xlsx");
console.log("Template criado na pasta public!");
