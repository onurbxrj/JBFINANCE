import { supabase } from './supabase';

export type Profile = {
    id: string;
    nome: string;
    email: string;
    role: 'funcionario' | 'gestor' | 'diretor';
    created_at?: string;
}

export type PlanoConta = {
    id?: string;
    nome: string;
    ativo?: boolean;
    created_at?: string;
}

export type Categoria = {
    id?: string;
    nome: string;
    ativo?: boolean;
    created_at?: string;
}

export type Receita = {
    id?: string;
    data: string;
    origem_receita?: string;
    plano_contas?: string;
    categoria: string;
    setor: string;
    valor: number;
    created_by?: string;
    created_at?: string;
};

export type Despesa = {
    id?: string;
    data: string;
    centro_custo: string;
    plano_contas: string;
    categoria: string;
    descricao: string;
    valor: number;
    observacao: string;
    tipo_rateio?: string;
    created_by?: string;
    created_at?: string;
};

export type RateioDespesa = {
    id?: string;
    despesa_id: string;
    setor: string;
    percentual: number;
};

export type CustoGelo = {
    id?: string;
    data: string;
    quantidade: number;
    custo_unitario: number;
    custo_total?: number;
    valor_venda: number;
    created_by?: string;
    created_at?: string;
};

export type CustoPeixe = {
    id?: string;
    data: string;
    produto: string;
    quantidade: number;
    custo_unitario: number;
    custo_total?: number;
    valor_venda: number;
    observacao: string;
    created_by?: string;
    created_at?: string;
};

// Receitas
export const getReceitas = async () => {
    const { data, error } = await supabase.from('receitas').select('*').order('data', { ascending: false });
    if (error) throw error;
    return data as Receita[];
};

export const addReceita = async (receita: Omit<Receita, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('receitas').insert(receita).select().single();
    if (error) throw error;
    return data;
};

export const updateReceita = async (id: string, receita: Partial<Omit<Receita, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase.from('receitas').update(receita).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteReceita = async (id: string) => {
    const { error, count } = await supabase.from('receitas').delete({ count: 'exact' }).eq('id', id);
    if (error) throw error;
    if (count === 0) throw new Error("Permissão negada ou registro inexistente.");
    return true;
};

// Despesas
export const getDespesas = async () => {
    const { data, error } = await supabase.from('despesas').select('*').order('data', { ascending: false });
    if (error) throw error;
    return data as Despesa[];
};

export const addDespesa = async (despesa: Omit<Despesa, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('despesas').insert(despesa).select().single();
    if (error) throw error;
    return data;
};

export const addDespesasBulk = async (despesas: Omit<Despesa, 'id' | 'created_at'>[]) => {
    const { data, error } = await supabase.from('despesas').insert(despesas).select();
    if (error) throw error;
    return data;
};

export const updateDespesa = async (id: string, despesa: Partial<Omit<Despesa, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase.from('despesas').update(despesa).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteDespesa = async (id: string) => {
    const { error, count } = await supabase.from('despesas').delete({ count: 'exact' }).eq('id', id);
    if (error) throw error;
    if (count === 0) throw new Error("Permissão negada ou registro inexistente.");
    return true;
};

/** Deleta múltiplas despesas e seus rateios associados (para desfazer importação) */
export const deleteDespesasBulk = async (ids: string[]) => {
    if (ids.length === 0) return;
    // Rateios são deletados via cascade ou manualmente
    await supabase.from('rateio_despesas').delete().in('despesa_id', ids);
    const { error, count } = await supabase.from('despesas').delete({ count: 'exact' }).in('id', ids);
    if (error) throw error;
    return count;
};

export const getRateiosDespesa = async (despesaId: string) => {
    const { data, error } = await supabase.from('rateio_despesas').select('*').eq('despesa_id', despesaId);
    if (error) throw error;
    return data as RateioDespesa[];
};

export const getAllRateios = async () => {
    const { data, error } = await supabase.from('rateio_despesas').select('*');
    if (error) throw error;
    return data as RateioDespesa[];
};

export const saveRateiosDespesa = async (despesaId: string, rateios: Omit<RateioDespesa, 'id' | 'despesa_id'>[]) => {
    await supabase.from('rateio_despesas').delete().eq('despesa_id', despesaId);
    if (rateios.length > 0) {
        const payload = rateios.map(r => ({ ...r, despesa_id: despesaId }));
        const { error } = await supabase.from('rateio_despesas').insert(payload);
        if (error) throw error;
    }
};

export const addRateiosBulk = async (rateios: Omit<RateioDespesa, 'id'>[]) => {
    if (rateios.length === 0) return [];
    const { data, error } = await supabase.from('rateio_despesas').insert(rateios).select();
    if (error) throw error;
    return data;
};

// Custos Gelo
export const getCustosGelo = async () => {
    const { data, error } = await supabase.from('custo_gelo').select('*').order('data', { ascending: false });
    if (error) throw error;
    return data as CustoGelo[];
};

export const addCustoGelo = async (custo: Omit<CustoGelo, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('custo_gelo').insert(custo).select().single();
    if (error) throw error;
    return data;
};

export const updateCustoGelo = async (id: string, custo: Partial<Omit<CustoGelo, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase.from('custo_gelo').update(custo).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteCustoGelo = async (id: string) => {
    const { error, count } = await supabase.from('custo_gelo').delete({ count: 'exact' }).eq('id', id);
    if (error) throw error;
    if (count === 0) throw new Error("Permissão negada ou registro inexistente.");
    return true;
};

// Custos Peixe
export const getCustosPeixe = async () => {
    const { data, error } = await supabase.from('custo_peixe').select('*').order('data', { ascending: false });
    if (error) throw error;
    return data as CustoPeixe[];
};

export const addCustoPeixe = async (custo: Omit<CustoPeixe, 'id' | 'created_at'>) => {
    const { data, error } = await supabase.from('custo_peixe').insert(custo).select().single();
    if (error) throw error;
    return data;
};

export const updateCustoPeixe = async (id: string, custo: Partial<Omit<CustoPeixe, 'id' | 'created_at'>>) => {
    const { data, error } = await supabase.from('custo_peixe').update(custo).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const deleteCustoPeixe = async (id: string) => {
    const { error, count } = await supabase.from('custo_peixe').delete({ count: 'exact' }).eq('id', id);
    if (error) throw error;
    if (count === 0) throw new Error("Permissão negada ou registro inexistente.");
    return true;
};

// Profiles (Users)
export const getProfiles = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('nome', { ascending: true });
    if (error) throw error;
    return data as Profile[];
};

export const updateProfileRole = async (id: string, role: Profile['role']) => {
    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;
    return true;
};

// Planos de Contas & Categorias
export const getPlanosContas = async (all?: boolean) => {
    let query = supabase.from('plano_contas').select('*').order('nome', { ascending: true });
    if (!all) query = query.eq('ativo', true);
    const { data, error } = await query;
    if (error) throw error;
    return data as PlanoConta[];
};

export const addPlanoConta = async (nome: string) => {
    const { data, error } = await supabase.from('plano_contas').insert({ nome }).select().single();
    if (error) throw error;
    return data;
};

export const updatePlanoConta = async (id: string, updates: Partial<PlanoConta>) => {
    const { data, error } = await supabase.from('plano_contas').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

export const getCategorias = async (all?: boolean) => {
    let query = supabase.from('categorias').select('*').order('nome', { ascending: true });
    if (!all) query = query.eq('ativo', true);
    const { data, error } = await query;
    if (error) throw error;
    return data as Categoria[];
};

export const addCategoria = async (nome: string) => {
    const { data, error } = await supabase.from('categorias').insert({ nome }).select().single();
    if (error) throw error;
    return data;
};

export const updateCategoria = async (id: string, updates: Partial<Categoria>) => {
    const { data, error } = await supabase.from('categorias').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};

