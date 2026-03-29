import fs from 'fs';
import path from 'path';

const src = path.resolve(process.cwd(), 'data/planilha_pasted.txt');
const out = path.resolve(process.cwd(), 'data/contemplated_letters.ts');

if (!fs.existsSync(src)) {
  console.error('Source pasted file not found:', src);
  process.exit(1);
}

function parseCurrency(s) {
  if (!s) return 0;
  const t = String(s).replace(/R\$/g, '').replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  const n = Number(t);
  return Number.isNaN(n) ? 0 : n;
}

const text = fs.readFileSync(src, 'utf8');
const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
if (lines.length <= 1) {
  console.error('No data lines found in pasted file');
  process.exit(1);
}

const header = lines[0].split(/\t+/).map(h => h.trim());
const rows = lines.slice(1).map(line => line.split(/\t+/));

const mapped = rows.map(cols => {
  const obj = {};
  for (let i = 0; i < header.length; i++) {
    obj[header[i]] = cols[i] ?? '';
  }
  const id = (obj['Cód. Cota'] || obj['Cód. Cota'] === 0) ? String(obj['Cód. Cota']) : '';
  const category = (obj['Categoria'] || '').trim();
  const credit = parseCurrency(obj['Crédito']);
  const entry = parseCurrency(obj['Entrada']);
  const installmentsCount = Number((obj['Nº Parcelas'] || obj['Nº Parcelas']).toString().replace(/[^0-9]/g, '')) || 0;
  const installmentValue = parseCurrency(obj['Vlr Parcela']);
  const saldoDevedor = parseCurrency(obj['Saldo devedor']);
  const fundoComum = parseCurrency(obj['Fundo comum']);
  const refGarantia = parseCurrency(obj['Ref. garantia']);
  const administrator = (obj['Administradora'] || '').trim();
  const statusRaw = (obj['Status'] || '').toLowerCase();
  let status = 'available';
  if (statusRaw.includes('reserv')) status = 'reserved';
  if (statusRaw.includes('vend')) status = 'sold';

  return {
    id,
    code: id,
    category,
    credit,
    entry,
    installmentsCount,
    installmentValue,
    transferFee: 0,
    group: '',
    administrator,
    status,
    observations: '',
    name: '',
    saldoDevedor,
    fundoComum,
    refGarantia,
  };
});

const content = `// Auto-generated from data/planilha_pasted.txt
const letters = ${JSON.stringify(mapped, null, 2)};
export default letters;
`;

fs.writeFileSync(out, content, 'utf8');
console.log('Wrote', out, 'with', mapped.length, 'letters');
