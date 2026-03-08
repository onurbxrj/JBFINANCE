const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://mmgzreucmnutcmreifls.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tZ3pyZXVjbW51dGNtcmVpZmxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMjY5NTYsImV4cCI6MjA4NzgwMjk1Nn0.Ndlz3eU1EZsPV95Cb80mvJDMUur2ZwZe-i90L8j172k');
(async () => {
    try {
        const { data: despesas, error: dErr } = await supabase.from('despesas').select('*');
        const { data: rateios, error: rErr } = await supabase.from('rateio_despesas').select('*');
        if (dErr) console.error(dErr);
        if (rErr) console.error(rErr);

        let despesaMes = 0;
        let rateioAcougue = 0;
        let rateioPeixaria = 0;

        for (const dp of despesas) {
            // Filter to March 2026
            if (!dp.data.startsWith('2026-03')) continue;

            despesaMes += dp.valor;
            if (dp.tipo_rateio === 'nenhum' || !dp.tipo_rateio) {
                if (dp.centro_custo === 'Açougue') rateioAcougue += dp.valor;
                if (dp.centro_custo === 'Peixaria') rateioPeixaria += dp.valor;
            } else if (dp.tipo_rateio === 'igual') {
                rateioAcougue += dp.valor / 2;
                rateioPeixaria += dp.valor / 2;
            } else if (dp.tipo_rateio === 'percentual') {
                const rs = rateios.filter(r => r.despesa_id === dp.id);
                let sumP = 0;
                for (const rt of rs) {
                    const pct = Number(rt.percentual) || 0;
                    sumP += pct;
                    const val = (dp.valor * pct) / 100;
                    if (rt.setor === 'Açougue') rateioAcougue += val;
                    if (rt.setor === 'Peixaria') rateioPeixaria += val;
                }
                if (sumP !== 100) {
                    console.log(`Despesa ${dp.id} (${dp.descricao}) tem rateio sum = ${sumP}%. Valor: ${dp.valor}`);
                    console.log(`Rateios:`, rs.map(r => `${r.setor}: ${r.percentual}%`));
                }
            }
        }

        console.log('--- DADOS MARÇO 2026 ---');
        console.log('Total despesaMes:', despesaMes);
        console.log('Total rateio Acougue:', rateioAcougue);
        console.log('Total rateio Peixaria:', rateioPeixaria);
        console.log('Soma rateios:', rateioAcougue + rateioPeixaria);

    } catch (e) { console.error(e) }
})();
