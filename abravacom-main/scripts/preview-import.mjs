import fs from 'fs';
import path from 'path';
import { Workbook } from 'exceljs';

function usage() {
  console.log('Usage: node scripts/preview-import.mjs --file <path-to-xlsx-or-xls> [--sheet <sheetName>] [--limit N]');
  process.exit(1);
}

const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
if (fileIndex === -1 || !args[fileIndex + 1]) usage();
const filePath = path.resolve(process.cwd(), args[fileIndex + 1]);
const sheetIndex = args.indexOf('--sheet');
const sheetName = sheetIndex !== -1 ? args[sheetIndex + 1] : undefined;
const limitIndex = args.indexOf('--limit');
const limit = limitIndex !== -1 ? Number(args[limitIndex + 1]) : 10;

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(2);
}

async function readSheet(file) {
  const wb = new Workbook();
  await wb.xlsx.readFile(file);
  let ws;
  if (sheetName) ws = wb.getWorksheet(sheetName);
  else ws = wb.worksheets[0];
  if (!ws) throw new Error('Worksheet not found');

  const rows = [];
  const headerRow = ws.getRow(1);
  const headers = headerRow.values.slice(1).map(h => String(h).trim());

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowVals = row.values.slice(1);
    const obj = {};
    for (let i = 0; i < headers.length; i++) {
      const key = headers[i];
      let val = rowVals[i];
      if (typeof val === 'string') val = val.trim();
      obj[key] = val;
    }
    rows.push(obj);
  });
  return rows;
}

function normalizeRow(raw) {
  const map = (k) => raw[k] ?? raw[k.toLowerCase()] ?? raw[k.toUpperCase()];
  const toNumber = (v) => {
    if (v === null || v === undefined || v === '') return 0;
    if (typeof v === 'number') return v;
    const s = String(v).replace(/[R$\.\s]/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isNaN(n) ? 0 : n;
  };

  const letter = {
    id: map('id') ? String(map('id')) : undefined,
    code: map('code') || map('codigo') || map('código') || '',
    name: map('name') || map('nome') || '',
    category: map('category') || map('categoria') || '',
    credit: toNumber(map('credit') || map('credito') || map('crédito')),
    entry: toNumber(map('entry') || map('entrada')),
    installmentsCount: Math.round(toNumber(map('installmentsCount') || map('parcelas') || map('installments'))),
    installmentValue: toNumber(map('installmentValue') || map('valorParcela') || map('valor_parcela')),
    transferFee: toNumber(map('transferFee') || map('taxaTransferencia') || map('transfer_fee')),
    saldoDevedor: toNumber(map('saldoDevedor') || map('saldo_devedor')),
    group: map('group') || map('grupo') || '',
    administrator: map('administrator') || map('administradora') || '',
    status: (map('status') || 'available').toLowerCase(),
    reajusteIndex: map('reajusteIndex') || map('reajuste') || '',
    contactPhone: map('contactPhone') || map('telefone') || '',
    contactEmail: map('contactEmail') || map('email') || '',
    observations: map('observations') || map('observacoes') || map('observações') || '',
    insurance: map('insurance') || '',
  };
  if (!letter.id) delete letter.id;
  return letter;
}

(async function main(){
  try {
    console.log('Previewing file:', filePath);
    const rows = await readSheet(filePath);
    console.log('Parsed rows:', rows.length);
    const normalized = rows.map(r => normalizeRow(r)).slice(0, limit);
    console.log(JSON.stringify(normalized, null, 2));
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exit(1);
  }
})();
