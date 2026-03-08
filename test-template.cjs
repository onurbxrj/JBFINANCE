const xlsx = require('xlsx');
const workbook = xlsx.readFile('public/template-despesas.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = xlsx.utils.sheet_to_json(sheet);

let errors = [];
let despesasParaSalvar = [];

jsonData.forEach((row, index) => {
    const linha = index + 2; 
    const valData = row['Data'];
    const valValor = row['Valor'];
    const valCentroCusto = row['Centro de Custo'];
    const valPlano = row['Plano de Contas'];
    const valCat = row['Categoria'];
    const valDesc = row['Descrição'];
    const valObs = row['Observação'] || '';

    if (!valData || !valValor || !valCentroCusto || !valPlano || !valCat || !valDesc) {
        errors.push(`Linha ${linha}: Campos obrigatórios em falta.`);
        return;
    }
    
    let dataFormatada = '';
    if (typeof valData === 'number') {
        const dateObj = new Date((valData - (25567 + 1)) * 86400 * 1000); 
        dataFormatada = dateObj.toISOString().split('T')[0];
    } else {
        const strData = String(valData);
        if (strData.includes('/')) {
            const partes = strData.split('/');
            if (partes.length === 3) {
                dataFormatada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
            } else {
                dataFormatada = strData;
            }
        } else {
            dataFormatada = strData;
        }
    }

    let valorTratado = 0;
    if (typeof valValor === 'string') {
         valorTratado = parseFloat(valValor.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
    } else if (typeof valValor === 'number') {
         valorTratado = valValor;
    }
    
    if (isNaN(valorTratado) || valorTratado < 0) {
         errors.push(`Linha ${linha}: Valor financeiro inválido.`);
         return;
    }

    despesasParaSalvar.push({
        data: dataFormatada,
        valor: valorTratado,
        centro_custo: String(valCentroCusto).trim(),
        plano_contas: 'MOCK',
        categoria: 'MOCK',
        descricao: String(valDesc).trim(),
        observacao: String(valObs).trim(),
        tipo_rateio: 'nenhum'
    });
});

console.log('Erros:', errors);
console.log('Resultades:', despesasParaSalvar);
