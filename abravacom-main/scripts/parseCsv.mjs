import fs from 'fs';
const text = fs.readFileSync('planilha (7) - planilha (7).xls.csv', 'utf-8');
const lines = text.trim().split('\n');
const headers = lines[0].split(',').map(h => h.trim());

const parseCurrency = (val) => {
  if (!val) return 0;
  const clean = val.replace(/\"/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
  return parseFloat(clean) || 0;
};

const letters = [];
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  // Regex to split by comma skipping commas inside quotes
  const parts = line.split(/,(?=(?:(?:[^\"]*\"){2})*[^\"]*$)/);
  if (parts.length < 5) continue;
  
  const letter = {
    id: 'csv-demo-' + i,
    code: (parts[0] || '').replace(/\"/g, '').trim(),
    category: 'Imóvel',
    credit: parseCurrency(parts[2]),
    entry: parseCurrency(parts[3]),
    installmentsCount: parseInt(parts[4]) || 0,
    installmentValue: parseCurrency(parts[5]),
    saldoDevedor: parseCurrency(parts[6]),
    fundoComum: parseCurrency(parts[7]),
    refGarantia: parseCurrency(parts[8]),
    administrator: (parts[9] || '').replace(/\"/g, '').trim(),
    status: (parts[10] || '').replace(/\"/g, '').trim().toLowerCase() === 'reservada' ? 'reserved' :
            (parts[10] || '').replace(/\"/g, '').trim().toLowerCase() === 'vendida' ? 'sold' : 'available'
  };
  letters.push(letter);
}

if (!fs.existsSync('src/data')) {
  fs.mkdirSync('src/data', { recursive: true });
}
fs.writeFileSync('src/data/defaultLetters.json', JSON.stringify(letters, null, 2));
console.log('Successfully created src/data/defaultLetters.json with ' + letters.length + ' letters');
