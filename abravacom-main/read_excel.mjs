import { Workbook } from 'exceljs';
import path from 'path';

async function run() {
  const wb = new Workbook();
  await wb.xlsx.readFile(path.resolve(process.cwd(), 'planilha7.xlsx'));
  const ws = wb.worksheets[0];
  const rows = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber <= 3) rows.push(row.values);
  });
  console.log(JSON.stringify(rows));
}

run().catch(console.error);
