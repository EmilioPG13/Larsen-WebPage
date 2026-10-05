/**
 * Loads the company's inventory spreadsheet into the database.
 *
 *   npx tsx prisma/import-inventory.ts <file.xlsx>           # preview only (default)
 *   npx tsx prisma/import-inventory.ts <file.xlsx> --apply   # write the changes
 *
 * The preview prints what would be created and changed, and which units are in
 * the database but not in the file. It never deletes anything: missing units
 * are only reported so someone can review them by hand. The logic lives in
 * src/services/inventory-import.ts; this file only reads the workbook.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import { runImport } from '../src/services/inventory-import';

const prisma = new PrismaClient();

const readRows = async (file: string): Promise<unknown[][]> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error('The workbook has no sheets');

  const rows: unknown[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    // row.values is 1-based (index 0 is empty), the parser expects 0-based cells.
    rows[rowNumber - 1] = (row.values as unknown[]).slice(1);
  });
  return Array.from(rows, (row) => row ?? []);
};

/** Host of the target database, so the person running this sees where it points. No credentials. */
const targetHost = (): string => {
  try {
    return new URL(process.env.DATABASE_URL ?? '').host || 'unknown';
  } catch {
    return 'unknown';
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const file = args.find((arg) => !arg.startsWith('--'));

  if (!file) {
    console.error('Usage: tsx prisma/import-inventory.ts <file.xlsx> [--apply]');
    process.exit(1);
  }

  console.log(`Database host: ${targetHost()}`);
  console.log(apply ? 'Mode: APPLY (writes to the database)\n' : 'Mode: preview (dry run, nothing is written)\n');

  await runImport({ rows: await readRows(file), apply, db: prisma, log: console.log });

  if (!apply) console.log('\nPreview only. Re-run with --apply to write these changes.');
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
