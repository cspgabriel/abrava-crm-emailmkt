import fs from 'fs';
import path from 'path';
import { Workbook } from 'exceljs';
import admin from 'firebase-admin';

function usage() {
  console.log('Usage: node scripts/import-letters.mjs --file <path-to-xlsx-or-xls> [--sheet <sheetName>]');
  process.exit(1);
}

const args = process.argv.slice(2);
const fileIndex = args.indexOf('--file');
if (fileIndex === -1 || !args[fileIndex + 1]) usage();
const filePath = path.resolve(process.cwd(), args[fileIndex + 1]);
const sheetIndex = args.indexOf('--sheet');
const sheetName = sheetIndex !== -1 ? args[sheetIndex + 1] : undefined;

if (!fs.existsSync(filePath)) {
  console.error('File not found:', filePath);
  process.exit(2);
}

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.SERVICE_ACCOUNT;
if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
  console.error('Service account JSON not found. Set GOOGLE_APPLICATION_CREDENTIALS or SERVICE_ACCOUNT to a valid path.');
  process.exit(3);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

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
    transferFee: toNumber(map('transferFee') || map('taxaTransferencia') || map('taxa transferência (r$)') || map('transfer_fee')),
    saldoDevedor: toNumber(map('saldoDevedor') || map('saldo devedor (r$)') || map('saldo devedor') || map('saldo_devedor')),
    fundoComum: toNumber(map('fundoComum') || map('fundo comum')),
    refGarantia: toNumber(map('refGarantia') || map('ref. garantia')),
    group: map('group') || map('grupo') || '',
    administrator: map('administrator') || map('administradora') || '',
    status: (map('status') || 'available').toLowerCase(),
    reajusteIndex: map('reajusteIndex') || map('índice reajuste') || map('reajuste') || '',
    contactPhone: map('contactPhone') || map('telefone contato') || map('telefone') || '',
    contactEmail: map('contactEmail') || map('email contato') || map('email') || '',
    observations: map('observations') || map('observacoes') || map('observações') || '',
    insurance: map('insurance') || map('seguro') || '',
  };

  // remove undefined id to let Firestore generate one if not provided
  if (!letter.id) delete letter.id;
  return letter;
}

async function clearCollection(collectionPath) {
  const colRef = db.collection(collectionPath);
  const snapshot = await colRef.get();
  if (snapshot.empty) return;
  const batchSize = 500;
  let docs = snapshot.docs;
  while (docs.length) {
    const batch = db.batch();
    docs.slice(0, batchSize).forEach(d => batch.delete(d.ref));
    await batch.commit();
    // fetch next batch
    const next = await colRef.get();
    docs = next.docs.filter(d => !d._deleted);
    if (docs.length === 0) break;
  }
}

async function run() {
  console.log('Reading file:', filePath);
  const rows = await readSheet(filePath);
  console.log(`Parsed ${rows.length} rows`);
  const letters = rows.map(r => normalizeRow(r));

  const collectionPath = 'contemplated_letters';
  console.log('Clearing existing documents in collection:', collectionPath);
  // delete existing
  const existing = await db.collection(collectionPath).get();
  if (!existing.empty) {
    const batch = db.batch();
    existing.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    console.log('Deleted', existing.size, 'documents');
  } else {
    console.log('No existing documents');
  }

  // add new
  for (const l of letters) {
    if (l.id) {
      await db.collection(collectionPath).doc(String(l.id)).set(l);
    } else {
      await db.collection(collectionPath).add(l);
    }
  }

  console.log('Imported', letters.length, 'letters into', collectionPath);
}

run().catch(err => { console.error(err); process.exit(9); });
