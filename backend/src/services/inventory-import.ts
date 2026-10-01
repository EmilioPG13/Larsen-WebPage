import { PrismaClient, UnitStatus } from '@prisma/client';
import {
  ExistingUnit,
  ImportPlan,
  findMachineId,
  parseInventoryRows,
  planImport,
  resolveBrandId,
} from './inventory';

export interface ImportOptions {
  /** Sheet rows as a plain matrix (see parseInventoryRows). */
  rows: unknown[][];
  /** false (the default of the CLI) only reads and reports; true writes. */
  apply: boolean;
  db: PrismaClient;
  log?: (message: string) => void;
}

/**
 * Plans an import of the inventory spreadsheet and, only when `apply` is true,
 * writes it. It creates and updates units (each with an IMPORT movement) and
 * never deletes: units that are in the database but not in the file are only
 * reported so someone can review them by hand.
 */
export const runImport = async ({ rows, apply, db, log = () => undefined }: ImportOptions): Promise<ImportPlan> => {
  const { units, skipped } = parseInventoryRows(rows);
  const existing: ExistingUnit[] = await db.inventoryUnit.findMany({
    select: { id: true, brand: true, serialNumber: true, model: true, gauge: true, status: true, notes: true },
  });
  const plan = planImport(units, existing);

  const count = (status: UnitStatus) => units.filter((unit) => unit.status === status).length;
  log(
    `File: ${units.length} units (${count(UnitStatus.DISPONIBLE)} available, ` +
      `${count(UnitStatus.APARTADA)} reserved, ${count(UnitStatus.VENDIDA)} sold)`
  );

  if (skipped.length > 0) {
    log(`\nSkipped rows (${skipped.length}):`);
    skipped.forEach((item) => log(`  row ${item.row}: ${item.reason}`));
  }

  log(`\nNew units: ${plan.create.length}`);
  plan.create.forEach((unit) =>
    log(`  + ${unit.brand} ${unit.model} gauge ${unit.gauge} serial ${unit.serialNumber} [${unit.status}]`)
  );

  log(`\nChanged units: ${plan.update.length}`);
  plan.update.forEach(({ unit, changes }) => {
    log(`  ~ ${unit.brand} serial ${unit.serialNumber}`);
    Object.entries(changes).forEach(([field, [before, after]]) =>
      log(`      ${field}: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`)
    );
  });

  log(`\nUnchanged units: ${plan.unchanged}`);
  log(`\nIn the database but not in the file (kept, review by hand): ${plan.missing.length}`);
  plan.missing.forEach((unit) => log(`  ? ${unit.brand} ${unit.model} serial ${unit.serialNumber} [${unit.status}]`));

  if (!apply) return plan;

  for (const unit of plan.create) {
    await db.$transaction(async (tx) => {
      const created = await tx.inventoryUnit.create({
        data: {
          brand: unit.brand,
          brandId: await resolveBrandId(tx, unit.brand),
          model: unit.model,
          gauge: unit.gauge,
          serialNumber: unit.serialNumber,
          status: unit.status,
          notes: unit.notes,
          machineId: await findMachineId(tx, unit.brand, unit.model),
        },
      });
      await tx.inventoryMovement.create({
        data: { unitId: created.id, userId: null, action: 'IMPORT', toStatus: unit.status },
      });
    });
  }

  for (const { id, unit, changes } of plan.update) {
    const current = existing.find((item) => item.id === id)!;
    await db.$transaction(async (tx) => {
      await tx.inventoryUnit.update({
        where: { id },
        data: {
          model: unit.model,
          gauge: unit.gauge,
          status: unit.status,
          notes: unit.notes,
          // The spreadsheet has no dates: a unit leaving VENDIDA loses its sale
          // date, but entering VENDIDA keeps it empty rather than inventing one.
          ...(current.status === UnitStatus.VENDIDA && unit.status !== UnitStatus.VENDIDA ? { soldAt: null } : {}),
        },
      });
      await tx.inventoryMovement.create({
        data: {
          unitId: id,
          userId: null,
          action: 'IMPORT',
          fromStatus: current.status,
          toStatus: unit.status,
          changes: changes as object,
        },
      });
    });
  }

  log(`\nDone: ${plan.create.length} created, ${plan.update.length} updated.`);
  return plan;
};
