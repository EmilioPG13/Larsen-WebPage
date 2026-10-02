import type { Border, Fill, Font, PaperSize, Row, Workbook, Worksheet } from 'exceljs';
import type { InventoryUnit } from '../services/adminApi';
import {
  buildReportRows,
  buildSummary,
  COLORS,
  COMPANY,
  exportFileName,
  generatedLabel,
  REPORT_TITLE,
  saveBlob,
  statusLabel,
  STATUS_COLORS,
} from './inventoryReport';

/**
 * The inventory workbook: a "Inventario" sheet with the units (title band, filters, status colors,
 * ready to print) and a "Resumen" sheet with the counts by brand, by gauge and the sales by month.
 * The columns keep the names of the company's own sheet (MARCA, GALGA, MODELO, NO. SERIE,
 * OBSERVACIONES), so the import still reads it by header.
 */

export const INVENTORY_SHEET = 'Inventario';
export const SUMMARY_SHEET = 'Resumen';
export const SHEET_HEADERS = [
  'MARCA',
  'GALGA',
  'MODELO',
  'NO. SERIE',
  'ESTADO',
  'FECHA DE LLEGADA',
  'FECHA DE VENTA',
  'OBSERVACIONES',
  'ACTUALIZADO',
] as const;

const argb = (hex: string) => `FF${hex}`;
const solid = (hex: string): Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) } });
const font = (options: Partial<Font> = {}): Partial<Font> => ({
  name: 'Calibri',
  size: 11,
  color: { argb: argb(COLORS.ink) },
  ...options,
});
const hairline: Partial<Border> = { style: 'thin', color: { argb: argb(COLORS.line) } };

const DATE_FORMAT = 'dd/mm/yyyy';
const CENTERED = new Set([2, 5, 6, 7, 9]);
const DATE_COLUMNS = new Set([6, 7, 9]);

const PRINT_MARGINS = { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 };

/** Title band and the "generated on" line shared by both sheets. */
const addBanner = (sheet: Worksheet, title: string, lastColumn: number, now: Date) => {
  sheet.mergeCells(1, 1, 1, lastColumn);
  const band = sheet.getCell(1, 1);
  band.value = title;
  band.font = font({ size: 18, bold: true, color: { argb: 'FFFFFFFF' } });
  band.fill = solid(COLORS.blue);
  band.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  sheet.getRow(1).height = 38;

  sheet.mergeCells(2, 1, 2, lastColumn);
  const subtitle = sheet.getCell(2, 1);
  subtitle.value = `${COMPANY}  ·  ${generatedLabel(now)}`;
  subtitle.font = font({ size: 10, italic: true, color: { argb: argb(COLORS.muted) } });
  subtitle.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  sheet.getRow(2).height = 22;

  sheet.getRow(3).height = 8;
};

const styleHeader = (row: Row, centered: (column: number) => boolean) => {
  row.height = 26;
  row.eachCell((cell, column) => {
    cell.font = font({ bold: true, size: 10, color: { argb: argb(COLORS.blue) } });
    cell.fill = solid(COLORS.headFill);
    cell.alignment = {
      horizontal: centered(column) ? 'center' : 'left',
      vertical: 'middle',
      indent: centered(column) ? 0 : 1,
    };
    cell.border = { bottom: { style: 'medium', color: { argb: argb(COLORS.blue) } } };
  });
};

const printSetup = (sheet: Worksheet, orientation: 'landscape' | 'portrait', titleRow?: number) => {
  sheet.pageSetup = {
    orientation,
    paperSize: 1 as PaperSize, // Letter
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: PRINT_MARGINS,
    ...(titleRow ? { printTitlesRow: `${titleRow}:${titleRow}` } : {}),
  };
  sheet.headerFooter.oddFooter = `&L&8${COMPANY}&C&8Página &P de &N&R&8&D`;
};

const addInventorySheet = (workbook: Workbook, units: InventoryUnit[], now: Date) => {
  const sheet = workbook.addWorksheet(INVENTORY_SHEET, {
    views: [{ state: 'frozen', ySplit: 4, showGridLines: false, zoomScale: 120 }],
  });
  const rows = buildReportRows(units);

  const longest = (pick: (row: (typeof rows)[number]) => string, minimum: number, maximum: number) =>
    Math.min(maximum, Math.max(minimum, ...rows.map((row) => pick(row).length + 4)));
  // Header columns leave room for the filter arrow Excel draws over their right edge.
  const widths = [
    longest((row) => row.brand, 13, 20),
    11,
    longest((row) => row.model, 18, 30),
    longest((row) => String(row.serial), 16, 24),
    15,
    24,
    22,
    longest((row) => row.notes, 34, 55),
    17,
  ];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });

  addBanner(sheet, REPORT_TITLE, SHEET_HEADERS.length, now);

  const header = sheet.addRow([...SHEET_HEADERS]); // row 4
  styleHeader(header, (column) => CENTERED.has(column));

  rows.forEach((values, index) => {
    const row = sheet.addRow([
      values.brand,
      values.gauge,
      values.model,
      values.serial,
      statusLabel(values.status),
      values.receivedAt ?? undefined,
      values.soldAt ?? undefined,
      values.notes,
      values.updatedAt,
    ]);
    row.height = 21;
    const sold = values.status === 'VENDIDA';

    row.eachCell({ includeEmpty: true }, (cell, column) => {
      cell.font = font(sold ? { color: { argb: argb(COLORS.muted) } } : {});
      cell.alignment = {
        horizontal: CENTERED.has(column) ? 'center' : 'left',
        vertical: 'middle',
        indent: CENTERED.has(column) ? 0 : 1,
        wrapText: column === 8,
      };
      cell.border = { bottom: hairline };
      if (index % 2 === 1) cell.fill = solid(COLORS.zebra);
      if (DATE_COLUMNS.has(column)) cell.numFmt = DATE_FORMAT;
      // A long numeric serial would otherwise show as 6.56151E+12.
      if (column === 4 && typeof values.serial === 'number') cell.numFmt = '0';
    });

    const palette = STATUS_COLORS[values.status];
    const status = row.getCell(5);
    status.fill = solid(palette.fill);
    status.font = font({ bold: true, size: 10, color: { argb: argb(palette.text) } });
  });

  sheet.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4 + rows.length, column: SHEET_HEADERS.length } };
  printSetup(sheet, 'landscape', 4);
};

const SUMMARY_COLUMNS = 5;

const addSummarySheet = (workbook: Workbook, units: InventoryUnit[], now: Date) => {
  const sheet = workbook.addWorksheet(SUMMARY_SHEET, { views: [{ showGridLines: false, zoomScale: 120 }] });
  const summary = buildSummary(units);
  for (let column = 1; column <= SUMMARY_COLUMNS; column++) sheet.getColumn(column).width = 19;

  addBanner(sheet, 'RESUMEN DE INVENTARIO', SUMMARY_COLUMNS, now);

  // Four figures: total and one per status.
  const cards = [
    { label: 'TOTAL', value: summary.total, color: COLORS.blue },
    { label: 'DISPONIBLES', value: summary.available, color: STATUS_COLORS.DISPONIBLE.text },
    { label: 'APARTADAS', value: summary.reserved, color: STATUS_COLORS.APARTADA.text },
    { label: 'VENDIDAS', value: summary.sold, color: STATUS_COLORS.VENDIDA.text },
  ];
  const gap: Partial<Border> = { style: 'thick', color: { argb: 'FFFFFFFF' } };
  const labels = sheet.addRow(cards.map((card) => card.label)); // row 4
  const figures = sheet.addRow(cards.map((card) => card.value)); // row 5
  labels.height = 22;
  figures.height = 46;
  cards.forEach((card, index) => {
    const label = labels.getCell(index + 1);
    label.font = font({ size: 9, bold: true, color: { argb: argb(COLORS.muted) } });
    label.fill = solid(COLORS.zebra);
    label.alignment = { horizontal: 'center', vertical: 'bottom' };
    label.border = { left: gap, right: gap };
    const figure = figures.getCell(index + 1);
    figure.font = font({ size: 26, bold: true, color: { argb: argb(card.color) } });
    figure.fill = solid(COLORS.zebra);
    figure.alignment = { horizontal: 'center', vertical: 'middle' };
    figure.border = { left: gap, right: gap };
  });

  const section = (title: string, head: string[], body: (string | number)[][], options: { total?: boolean } = {}) => {
    sheet.addRow([]).height = 16;
    const heading = sheet.addRow([title]);
    heading.height = 24;
    for (let column = 1; column <= SUMMARY_COLUMNS; column++) {
      const cell = heading.getCell(column);
      cell.border = { bottom: { style: 'thin', color: { argb: argb(COLORS.blue) } } };
    }
    heading.getCell(1).font = font({ size: 13, bold: true, color: { argb: argb(COLORS.blue) } });
    heading.getCell(1).alignment = { vertical: 'middle' };

    styleHeader(sheet.addRow(head), (column) => column > 1);

    body.forEach((values, index) => {
      const row = sheet.addRow(values);
      const isTotal = options.total && index === body.length - 1;
      row.height = 21;
      for (let column = 1; column <= SUMMARY_COLUMNS; column++) {
        const cell = row.getCell(column);
        cell.font = font(isTotal ? { bold: true } : {});
        cell.alignment = { horizontal: column > 1 ? 'center' : 'left', vertical: 'middle', indent: column > 1 ? 0 : 1 };
        cell.border = isTotal ? { top: { style: 'thin', color: { argb: argb(COLORS.blue) } } } : { bottom: hairline };
        if (!isTotal && index % 2 === 1) cell.fill = solid(COLORS.zebra);
      }
    });
    return body.length;
  };

  section(
    'Por marca',
    ['MARCA', 'DISPONIBLES', 'APARTADAS', 'VENDIDAS', 'TOTAL'],
    [
      ...summary.byBrand.map((row) => [row.brand, row.available, row.reserved, row.sold, row.total]),
      ['Total', summary.available, summary.reserved, summary.sold, summary.total],
    ],
    { total: true },
  );

  // The model list can be long, so it gets the last three columns merged.
  const gaugeStart = sheet.rowCount + 3;
  section(
    'Disponibles por galga',
    ['GALGA', 'UNIDADES', 'MODELOS', '', ''],
    summary.availableByGauge.length
      ? summary.availableByGauge.map((row) => [row.gauge, row.count, row.models.join(', '), '', ''])
      : [['Sin unidades disponibles', '', '', '', '']],
  );
  if (summary.availableByGauge.length) {
    for (let row = gaugeStart; row <= sheet.rowCount; row++) {
      sheet.mergeCells(row, 3, row, SUMMARY_COLUMNS);
      sheet.getCell(row, 3).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    }
  }

  const sales = summary.salesByMonth.map((row) => [row.label, row.count]);
  if (summary.soldWithoutDate) sales.push(['Sin fecha registrada', summary.soldWithoutDate]);
  section('Ventas por mes', ['MES', 'UNIDADES', '', '', ''], sales.length ? sales : [['Sin ventas registradas', '']]);

  printSetup(sheet, 'portrait');
};

/** exceljs is loaded on demand: it is large and only the admin ever needs it. */
export const createInventoryWorkbook = async (units: InventoryUnit[], now: Date = new Date()) => {
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = COMPANY;
  workbook.title = REPORT_TITLE;
  workbook.created = now;

  addInventorySheet(workbook, units, now);
  addSummarySheet(workbook, units, now);

  return workbook;
};

/** Builds the workbook and downloads it from the browser. */
export const exportInventoryXlsx = async (units: InventoryUnit[], now: Date = new Date()) => {
  const workbook = await createInventoryWorkbook(units, now);
  const buffer = await workbook.xlsx.writeBuffer();
  saveBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    exportFileName('xlsx', now),
  );
};
