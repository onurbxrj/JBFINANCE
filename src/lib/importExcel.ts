/**
 * Módulo de importação de despesas via Excel.
 * Responsável por parsing, validação, normalização e detecção de duplicatas.
 */
import * as xlsx from "xlsx";
import { PlanoConta, Categoria, Despesa } from "./api";

// --- Tipos ---

export interface ColumnMap {
    data: string;
    valor: string;
    ccust: string;
    plano: string;
    cat: string;
    desc: string;
    obs: string;
}

export interface ParsedDespesa {
    data: string;
    valor: number;
    centro_custo: string;
    plano_contas: string;
    categoria: string;
    descricao: string;
    observacao: string;
    tipo_rateio: string;
    created_by?: string;
}

export interface ParseResult {
    despesas: ParsedDespesa[];
    errors: string[];
    newPlanos: string[];
    newCategorias: string[];
}

export interface RateioParaSalvar {
    despesa_id: string;
    setor: string;
    percentual: number;
}

// --- Constantes ---

/** Percentuais de rateio padrão para despesas "Geral / Loja" na importação */
const RATEIO_ACOUGUE_PERCENT = 66.66;
const RATEIO_PEIXARIA_PERCENT = 33.34;

/** Valor padronizado do centro de custo geral */
export const CENTRO_CUSTO_GERAL = "Geral / Loja";

// --- Funções de Normalização ---

/** Normaliza strings removendo espaços e convertendo para minúsculas para comparação */
function normalizeForComparison(str: string): string {
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

/** Converte data serial do Excel para YYYY-MM-DD usando UTC para evitar shift de timezone */
export function excelSerialToDate(serial: number): string {
    const utcDays = serial - 25569; // Excel epoch (01/01/1900) → Unix epoch, considerando bug Lotus 1-2-3
    const utcMs = utcDays * 86400 * 1000;
    const d = new Date(utcMs);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/** Converte string de data BR (dd/mm/yyyy) para YYYY-MM-DD */
export function parseDateString(strData: string): string {
    if (strData.includes("/")) {
        const partes = strData.split("/");
        if (partes.length === 3) {
            return `${partes[2]}-${partes[1].padStart(2, "0")}-${partes[0].padStart(2, "0")}`;
        }
    }
    return strData;
}

/** Trata valor monetário de diferentes formatos para número */
export function parseMonetaryValue(val: unknown): number {
    if (typeof val === "number") return val;
    if (typeof val === "string") {
        return parseFloat(
            val
                .replace("R$", "")
                .replace(/\./g, "")
                .replace(",", ".")
                .trim()
        );
    }
    return NaN;
}

/** Normaliza centro de custo para valores válidos do sistema */
export function normalizeCentroCusto(raw: string): string {
    const normalized = normalizeForComparison(raw);
    if (normalized.includes("acougue") || normalized.includes("açougue")) {
        return "Açougue";
    }
    if (normalized.includes("peix")) {
        return "Peixaria";
    }
    return CENTRO_CUSTO_GERAL;
}

/** Valida se a data não é futura */
export function isDataFutura(dataStr: string): boolean {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);
    const data = new Date(dataStr + "T12:00:00");
    return data > hoje;
}

// --- Função Principal de Parsing ---

/** Detecta a linha de cabeçalho e mapeia as colunas */
export function detectHeaders(rawData: unknown[][]): { headerRowIndex: number; colMap: ColumnMap } | null {
    for (let i = 0; i < rawData.length; i++) {
        const row = rawData[i];
        if (!Array.isArray(row)) continue;
        const concatRow = row.map((c) => String(c).toLowerCase().trim()).join("|");
        if (concatRow.includes("data") && concatRow.includes("valor")) {
            const colMap: ColumnMap = { data: "", valor: "", ccust: "", plano: "", cat: "", desc: "", obs: "" };
            row.forEach((cell: unknown, cIdx: number) => {
                const cName = normalizeForComparison(String(cell));
                if (cName.includes("data")) colMap.data = cIdx.toString();
                else if (cName === "valor") colMap.valor = cIdx.toString();
                else if (cName.includes("centro") || cName.includes("setor")) colMap.ccust = cIdx.toString();
                else if (cName.includes("plano")) colMap.plano = cIdx.toString();
                else if (cName.includes("cat")) colMap.cat = cIdx.toString();
                else if (cName.includes("desc")) colMap.desc = cIdx.toString();
                else if (cName.includes("obs")) colMap.obs = cIdx.toString();
            });
            return { headerRowIndex: i, colMap };
        }
    }
    return null;
}

/**
 * Faz o parsing completo de arquivo Excel ou CSV e retorna as despesas validadas.
 * NÃO faz insert — apenas prepara os dados para pré-visualização.
 * @param fileType - extensão do arquivo (ex: 'xlsx', 'csv', 'xls')
 */
export function parseSpreadsheetFile(
    buffer: ArrayBuffer,
    planosContas: PlanoConta[],
    categorias: Categoria[],
    userId?: string,
    fileType?: string
): ParseResult {
    const readOpts: xlsx.ParsingOptions = {};
    if (fileType === 'csv') {
        readOpts.type = 'array';
    }
    const workbook = xlsx.read(buffer, readOpts);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

    const headerResult = detectHeaders(rawData);
    if (!headerResult) {
        return {
            despesas: [],
            errors: ["Não foi possível identificar os Cabeçalhos reais (Data, Valor, etc) na planilha."],
            newPlanos: [],
            newCategorias: [],
        };
    }

    const { headerRowIndex, colMap } = headerResult;
    const errors: string[] = [];
    const despesas: ParsedDespesa[] = [];
    const newPlanos: Set<string> = new Set();
    const newCategorias: Set<string> = new Set();

    let lastData = "";
    let lastCat = "Indefinido";
    let lastCcust = CENTRO_CUSTO_GERAL;
    let lastPlano = "Geral";

    for (let index = headerRowIndex + 1; index < rawData.length; index++) {
        const row = rawData[index];
        const linha = index + 1;

        if (!row || !Array.isArray(row) || row.length === 0 || row.join("").trim() === "") continue;

        let valData = row[Number(colMap.data)];
        const valValor = row[Number(colMap.valor)];
        let valCentroCusto = row[Number(colMap.ccust)] || lastCcust;
        let valPlano = row[Number(colMap.plano)] || lastPlano;
        let valCat = row[Number(colMap.cat)] || lastCat;
        const valDesc = row[Number(colMap.desc)];
        const valObs = colMap.obs ? row[Number(colMap.obs)] : "";

        // Pular linhas sem valor
        if (valValor === undefined || valValor === null || valValor === "") continue;

        // Herança de data
        if (valData === undefined || valData === null || valData === "") {
            if (lastData) {
                valData = lastData;
            } else {
                errors.push(`Linha ${linha}: Data não definida e sem data anterior para herdar.`);
                continue;
            }
        }

        // Normalizar Plano de Contas
        const planoStr = String(valPlano).trim() || "Geral";
        const planoMatch = planosContas.find(
            (p) => normalizeForComparison(p.nome) === normalizeForComparison(planoStr)
        );
        let planoOficial: string;
        if (planoMatch) {
            planoOficial = planoMatch.nome;
        } else {
            newPlanos.add(planoStr);
            planoOficial = planoStr;
        }

        // Normalizar Categoria
        const catStr = String(valCat).trim() || "Geral";
        const catMatch = categorias.find(
            (c) => normalizeForComparison(c.nome) === normalizeForComparison(catStr)
        );
        let catOficial: string;
        if (catMatch) {
            catOficial = catMatch.nome;
        } else {
            newCategorias.add(catStr);
            catOficial = catStr;
        }

        // Tratar data
        let dataFormatada: string;
        if (typeof valData === "number") {
            dataFormatada = excelSerialToDate(valData);
        } else {
            dataFormatada = parseDateString(String(valData));
        }

        // Validar data não-futura
        if (isDataFutura(dataFormatada)) {
            errors.push(`Linha ${linha}: Data '${dataFormatada}' é futura. Verifique o valor.`);
            continue;
        }

        // Tratar valor
        const valorTratado = parseMonetaryValue(valValor);
        if (isNaN(valorTratado) || valorTratado <= 0) {
            errors.push(`Linha ${linha}: Valor financeiro inválido ou zero '${valValor}'.`);
            continue;
        }

        // Normalizar centro de custo
        const ccustNormalizado = normalizeCentroCusto(String(valCentroCusto));

        // Atualizar memórias
        lastData = valData as string;
        lastPlano = planoStr;
        lastCat = catStr;
        lastCcust = ccustNormalizado;

        const tipoRateio = ccustNormalizado === CENTRO_CUSTO_GERAL ? "percentual" : "nenhum";

        despesas.push({
            data: dataFormatada,
            valor: valorTratado,
            centro_custo: ccustNormalizado,
            plano_contas: planoOficial,
            categoria: catOficial,
            descricao: String(valDesc || "").trim() || "Despesa não especificada",
            observacao: String(valObs || "").trim(),
            tipo_rateio: tipoRateio,
            created_by: userId || undefined,
        });
    }

    return {
        despesas,
        errors,
        newPlanos: Array.from(newPlanos),
        newCategorias: Array.from(newCategorias),
    };
}

/**
 * Gera rateios para despesas salvas que são do tipo "Geral / Loja".
 * Usa os percentuais da regra de negócio: 66.66% Açougue / 33.34% Peixaria.
 */
export function generateRateios(savedDespesas: Despesa[]): RateioParaSalvar[] {
    const rateios: RateioParaSalvar[] = [];
    for (const d of savedDespesas) {
        if (d.tipo_rateio === "percentual" && d.centro_custo === CENTRO_CUSTO_GERAL && d.id) {
            rateios.push({ despesa_id: d.id, setor: "Açougue", percentual: RATEIO_ACOUGUE_PERCENT });
            rateios.push({ despesa_id: d.id, setor: "Peixaria", percentual: RATEIO_PEIXARIA_PERCENT });
        }
    }
    return rateios;
}

/**
 * Verifica duplicatas comparando com despesas existentes no banco.
 * Critério: data + descrição + valor + centro_custo.
 */
export function findDuplicates(
    novasDespesas: ParsedDespesa[],
    existentes: Despesa[]
): { duplicates: number[]; unique: ParsedDespesa[] } {
    const duplicates: number[] = [];
    const unique: ParsedDespesa[] = [];

    for (let i = 0; i < novasDespesas.length; i++) {
        const nova = novasDespesas[i];
        const isDuplicate = existentes.some(
            (e) =>
                e.data.split("T")[0] === nova.data &&
                normalizeForComparison(e.descricao) === normalizeForComparison(nova.descricao) &&
                e.valor === nova.valor &&
                normalizeForComparison(e.centro_custo) === normalizeForComparison(nova.centro_custo)
        );
        if (isDuplicate) {
            duplicates.push(i + 1);
        } else {
            unique.push(nova);
        }
    }

    return { duplicates, unique };
}
