import type { jsPDF } from 'jspdf';
import type { CellHookData } from 'jspdf-autotable';
import type { InventoryUnit } from '../services/adminApi';
import {
  buildReportRows,
  buildSummary,
  COLORS,
  COMPANY,
  exportFileName,
  formatDay,
  generatedLabel,
  REPORT_TITLE,
  saveBlob,
  statusLabel,
  STATUS_COLORS,
} from './inventoryReport';

/**
 * The same report as the Excel, as a PDF: title band, totals, the unit table (status colors, repeated
 * header, page numbers) and a closing page with the counts by brand, by gauge and the sales by month.
 * Landscape Letter, since the table has nine columns.
 */

type Rgb = [number, number, number];
const rgb = (hex: string): Rgb => [
  parseInt(hex.slice(0, 2), 16),
  parseInt(hex.slice(2, 4), 16),
  parseInt(hex.slice(4, 6), 16),
];

const MARGIN = 40;
const BAND_HEIGHT = 64;
const FOOTER_SPACE = 44;

const TABLE_HEAD = [
  'MARCA',
  'GALGA',
  'MODELO',
  'NO. SERIE',
  'ESTADO',
  'LLEGADA',
  'VENTA',
  'OBSERVACIONES',
  'ACTUALIZADO',
];
const CENTERED_COLUMNS = new Set([1, 4, 5, 6, 8]);
const STATUS_COLUMN = 4;

const drawBand = (doc: jsPDF, title: string, now: Date) => {
  const width = doc.internal.pageSize.getWidth();
  doc.setFillColor(...rgb(COLORS.blue));
  doc.rect(0, 0, width, BAND_HEIGHT, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, MARGIN, 33);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${COMPANY}  ·  ${generatedLabel(now)}`, MARGIN, 51);
};

const drawTotals = (doc: jsPDF, totals: { label: string; value: number; color: string }[], y: number) => {
  const gap = 12;
  const height = 52;
  const width = (doc.internal.pageSize.getWidth() - MARGIN * 2 - gap * (totals.length - 1)) / totals.length;

  totals.forEach((total, index) => {
    const x = MARGIN + index * (width + gap);
    doc.setFillColor(...rgb(COLORS.zebra));
    doc.roundedRect(x, y, width, height, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...rgb(COLORS.muted));
    doc.text(total.label, x + width / 2, y + 17, { align: 'center' });
    doc.setFontSize(22);
    doc.setTextColor(...rgb(total.color));
    doc.text(String(total.value), x + width / 2, y + 40, { align: 'center' });
  });
};

/** Hairline under every body cell and a blue rule under the header, in place of full grid lines. */
const drawRules = (doc: jsPDF, data: CellHookData) => {
  const { x, y, width, height } = data.cell;
  if (data.section === 'head') {
    doc.setDrawColor(...rgb(COLORS.blue));
    doc.setLineWidth(1.2);
  } else {
    doc.setDrawColor(...rgb(COLORS.line));
    doc.setLineWidth(0.5);
  }
  doc.line(x, y + height, x + width, y + height);
};

/** Table look shared by the unit table and the summary tables. */
const tableLook = {
  theme: 'plain' as const,
  styles: {
    font: 'helvetica',
    fontSize: 9,
    cellPadding: { top: 4, bottom: 4, left: 6, right: 6 },
    textColor: rgb(COLORS.ink),
  },
  headStyles: { fillColor: rgb(COLORS.headFill), textColor: rgb(COLORS.blue), fontStyle: 'bold' as const, fontSize: 8 },
  alternateRowStyles: { fillColor: rgb(COLORS.zebra) },
};

/** jsPDF and its table plugin are loaded on demand: they are large and only the admin ever needs them. */
export const createInventoryPdf = async (units: InventoryUnit[], now: Date = new Date()) => {
  const [{ jsPDF: JsPdf }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new JsPdf({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  doc.setProperties({ title: REPORT_TITLE, author: COMPANY, creator: COMPANY });

  const rows = buildReportRows(units);
  const summary = buildSummary(units);

  // Page 1: band, totals and the unit table.
  drawBand(doc, REPORT_TITLE, now);
  drawTotals(
    doc,
    [
      { label: 'TOTAL', value: summary.total, color: COLORS.blue },
      { label: 'DISPONIBLES', value: summary.available, color: STATUS_COLORS.DISPONIBLE.text },
      { label: 'APARTADAS', value: summary.reserved, color: STATUS_COLORS.APARTADA.text },
      { label: 'VENDIDAS', value: summary.sold, color: STATUS_COLORS.VENDIDA.text },
    ],
    BAND_HEIGHT + 20,
  );

  autoTable(doc, {
    ...tableLook,
    startY: BAND_HEIGHT + 20 + 52 + 18,
    margin: { left: MARGIN, right: MARGIN, top: 40, bottom: FOOTER_SPACE },
    head: [TABLE_HEAD],
    body: rows.map((row) => [
      row.brand,
      String(row.gauge),
      row.model,
      String(row.serial),
      statusLabel(row.status),
      formatDay(row.receivedAt),
      formatDay(row.soldAt),
      row.notes,
      formatDay(row.updatedAt),
    ]),
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 40 },
      2: { cellWidth: 104 },
      3: { cellWidth: 84 },
      4: { cellWidth: 68 },
      5: { cellWidth: 62 },
      6: { cellWidth: 62 },
      7: { cellWidth: 'auto' },
      8: { cellWidth: 78 },
    },
    didParseCell: (data) => {
      if (CENTERED_COLUMNS.has(data.column.index)) data.cell.styles.halign = 'center';
      if (data.section !== 'body') return;

      const row = rows[data.row.index];
      if (row.status === 'VENDIDA') data.cell.styles.textColor = rgb(COLORS.muted);
      if (data.column.index === STATUS_COLUMN) {
        const palette = STATUS_COLORS[row.status];
        data.cell.styles.fillColor = rgb(palette.fill);
        data.cell.styles.textColor = rgb(palette.text);
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 8;
      }
    },
    didDrawCell: (data) => drawRules(doc, data),
  });

  // Last page: the same counts as the "Resumen" sheet.
  doc.addPage();
  drawBand(doc, 'RESUMEN DE INVENTARIO', now);

  let y = BAND_HEIGHT + 36;
  const summaryTable = (
    title: string,
    head: string[],
    body: string[][],
    options: { total?: boolean; centered: number[] },
  ) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...rgb(COLORS.blue));
    doc.text(title, MARGIN, y);

    autoTable(doc, {
      ...tableLook,
      startY: y + 8,
      margin: { left: MARGIN, right: MARGIN, top: 40, bottom: FOOTER_SPACE },
      head: [head],
      body,
      didParseCell: (data) => {
        if (options.centered.includes(data.column.index)) data.cell.styles.halign = 'center';
        if (data.section === 'body' && options.total && data.row.index === body.length - 1) {
          data.cell.styles.fontStyle = 'bold';
        }
      },
      didDrawCell: (data) => drawRules(doc, data),
      didDrawPage: (data) => {
        y = data.cursor?.y ?? y;
      },
    });
    y += 34;
  };

  summaryTable(
    'Por marca',
    ['MARCA', 'DISPONIBLES', 'APARTADAS', 'VENDIDAS', 'TOTAL'],
    [
      ...summary.byBrand.map((row) => [row.brand, row.available, row.reserved, row.sold, row.total].map(String)),
      ['Total', summary.available, summary.reserved, summary.sold, summary.total].map(String),
    ],
    { total: true, centered: [1, 2, 3, 4] },
  );

  summaryTable(
    'Disponibles por galga',
    ['GALGA', 'UNIDADES', 'MODELOS'],
    summary.availableByGauge.length
      ? summary.availableByGauge.map((row) => [String(row.gauge), String(row.count), row.models.join(', ')])
      : [['Sin unidades disponibles', '', '']],
    { centered: [1] },
  );

  const sales = summary.salesByMonth.map((row) => [row.label, String(row.count)]);
  if (summary.soldWithoutDate) sales.push(['Sin fecha registrada', String(summary.soldWithoutDate)]);
  summaryTable('Ventas por mes', ['MES', 'UNIDADES'], sales.length ? sales : [['Sin ventas registradas', '']], {
    centered: [1],
  });

  // Footer on every page, once the total is known.
  const pages = doc.getNumberOfPages();
  const { width, height } = doc.internal.pageSize;
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(...rgb(COLORS.line));
    doc.setLineWidth(0.5);
    doc.line(MARGIN, height - 30, width - MARGIN, height - 30);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...rgb(COLORS.muted));
    doc.text(`${COMPANY}  ·  ${REPORT_TITLE}`, MARGIN, height - 17);
    doc.text(`Página ${page} de ${pages}`, width - MARGIN, height - 17, { align: 'right' });
  }

  return doc;
};

/** Builds the PDF and downloads it from the browser. */
export const exportInventoryPdf = async (units: InventoryUnit[], now: Date = new Date()) => {
  const doc = await createInventoryPdf(units, now);
  saveBlob(doc.output('blob'), exportFileName('pdf', now));
};
