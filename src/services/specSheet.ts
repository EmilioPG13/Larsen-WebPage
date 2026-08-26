import type { Machine } from '../types';
import type { Lang } from '../i18n/dictionary';
import { dictionaries } from '../i18n/dictionary';

/**
 * Generates and downloads a one-page spec-sheet PDF for a machine.
 * `jspdf` is imported dynamically so it only loads when a user downloads,
 * keeping it out of the initial bundle.
 */
export async function downloadSpecSheet(machine: Machine, lang: Lang): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const t = dictionaries[lang];
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  const red: [number, number, number] = [216, 30, 42];
  const blue: [number, number, number] = [40, 50, 123];
  const ink: [number, number, number] = [27, 28, 32];
  const muted: [number, number, number] = [105, 108, 114];

  // Header band
  doc.setFillColor(...blue);
  doc.rect(0, 0, pageW, 8, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...red);
  doc.text('LARSEN ITALIANA', margin, y);
  y += 8;
  doc.setTextColor(...muted);
  doc.setFont('helvetica', 'normal');
  doc.text(t.detail.k.toUpperCase(), margin, y);
  y += 30;

  // Title
  doc.setTextColor(...muted);
  doc.setFontSize(10);
  doc.text(machine.brand, margin, y);
  y += 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...ink);
  doc.text(machine.name, margin, y);
  y += 24;

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...muted);
  const descLines = doc.splitTextToSize(machine.description || '', pageW - margin * 2);
  doc.text(descLines, margin, y);
  y += descLines.length * 14 + 16;

  // Specs table
  const rows = (
    [
      [t.mpage.specLabels.width, machine.width],
      [t.mpage.specLabels.speed, machine.speed],
      [t.mpage.specLabels.systems, machine.knittingSystems],
      [t.mpage.specLabels.gauge, machine.gauge],
      [t.mpage.specLabels.yarnGuides, machine.yarnGuides],
      [t.mpage.specLabels.software, machine.software],
      [t.mpage.specLabels.power, machine.power],
      [t.mpage.specLabels.type, machine.type],
    ] as [string, string][]
  ).filter(([, v]) => v);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.text(t.detail.specs.toUpperCase(), margin, y);
  y += 14;

  doc.setFontSize(10);
  rows.forEach(([label, value]) => {
    doc.setDrawColor(230, 230, 232);
    doc.line(margin, y + 4, pageW - margin, y + 4);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...muted);
    doc.text(label, margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...ink);
    doc.text(String(value), pageW - margin, y, { align: 'right' });
    y += 20;
  });
  y += 12;

  // What's included
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.text(t.detail.includedTitle, margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  t.detail.includedItems.forEach((item) => {
    doc.setTextColor(...red);
    doc.text('•', margin, y);
    doc.setTextColor(...muted);
    const lines = doc.splitTextToSize(item, pageW - margin * 2 - 14);
    doc.text(lines, margin + 14, y);
    y += lines.length * 13 + 5;
  });

  // Footer contact
  const footY = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(...blue);
  doc.line(margin, footY - 16, pageW - margin, footY - 16);
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text('admin@larsenitaliana.com  ·  +52 775 365 0376  ·  larsenitaliana.com', margin, footY);

  const safeName = machine.name.replace(/[^\w.-]+/g, '_');
  doc.save(`Larsen_${safeName}.pdf`);
}
