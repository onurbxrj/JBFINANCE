import fs from 'fs';
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length > 0) {
    env[key.trim()] = values.join('=').trim().replace(/['"'\r]/g, '');
  }
});
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
console.log('URL defined:', !!url);
console.log('KEY defined:', !!key);

async function deleteDespesas() {
    console.log('Fetching...');
    const headers = {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
    };
    
    // Fetch rateios primeiro
    const resRateio = await fetch(url + '/rest/v1/rateio_despesas?id=not.eq.00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
        headers
    });
    console.log('Rateios response:', resRateio.status, resRateio.statusText);

    // Fetch despesas
    const res = await fetch(url + '/rest/v1/despesas?id=not.eq.00000000-0000-0000-0000-000000000000', {
        method: 'DELETE',
        headers
    });
    console.log('Despesas response:', res.status, res.statusText);
}
deleteDespesas();
