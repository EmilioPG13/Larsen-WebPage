import { Request, Response, NextFunction } from 'express';
import { UnitModality, UnitStatus } from '@prisma/client';
import prisma from '../config/database';
import { normalizeBrand } from '../services/inventory';

interface CatalogGroup {
  brand: string;
  model: string;
  machineId: string | null;
  image: string | null;
  modality: UnitModality;
  gauges: string[];
  units: { id: string; gauge: string; serialNumber: string }[];
}

/**
 * Public catalog, grouped by model. Only available units and the models sold
 * to order are exposed, through an explicit select: notes, sale dates and
 * the ERP id never leave the server. The grouping lives here on purpose, so a
 * different source (Odoo in stage 2) only changes the backend.
 */
export const getCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [units, onOrderMachines] = await Promise.all([
      prisma.inventoryUnit.findMany({
        where: { status: UnitStatus.DISPONIBLE },
        select: {
          id: true,
          brand: true,
          model: true,
          gauge: true,
          serialNumber: true,
          modality: true,
          machineId: true,
          machine: { select: { image: true } },
        },
      }),
      prisma.machine.findMany({
        where: { onOrder: true },
        select: { id: true, name: true, brand: true, image: true },
      }),
    ]);

    const groups = new Map<string, CatalogGroup>();

    // Units of the same spec sheet share a group even if the sheet and the
    // spreadsheet spell the model differently.
    const keyFor = (brand: string, model: string, machineId: string | null) =>
      machineId ? `machine:${machineId}` : `${brand}|${model.toLowerCase()}`;

    // On-order groups are also findable by brand and name, so a unit that was
    // created before its spec sheet existed (no machineId) joins the same card
    // instead of producing a duplicate.
    const byName = new Map<string, CatalogGroup>();

    for (const machine of onOrderMachines) {
      const brand = normalizeBrand(machine.brand);
      const group: CatalogGroup = {
        brand,
        model: machine.name,
        machineId: machine.id,
        image: machine.image,
        modality: UnitModality.BAJO_PEDIDO,
        gauges: [],
        units: [],
      };
      groups.set(keyFor(brand, machine.name, machine.id), group);
      byName.set(`${brand}|${machine.name.toLowerCase()}`, group);
    }

    for (const unit of units) {
      const key = keyFor(unit.brand, unit.model, unit.machineId);
      let group = groups.get(key) ?? byName.get(`${unit.brand}|${unit.model.toLowerCase()}`);
      if (!group) {
        group = {
          brand: unit.brand,
          model: unit.model,
          machineId: unit.machineId,
          image: unit.machine?.image ?? null,
          modality: unit.modality,
          gauges: [],
          units: [],
        };
        groups.set(key, group);
      }
      group.units.push({ id: unit.id, gauge: unit.gauge, serialNumber: unit.serialNumber });
      // A model counts as in stock as soon as one unit is in the warehouse.
      if (unit.modality === UnitModality.EN_BODEGA) group.modality = UnitModality.EN_BODEGA;
    }

    const catalog = Array.from(groups.values()).map((group) => ({
      ...group,
      gauges: Array.from(new Set(group.units.map((unit) => unit.gauge))).sort(
        (a, b) => parseFloat(a) - parseFloat(b) || a.localeCompare(b)
      ),
    }));

    catalog.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));

    res.set('Cache-Control', 'no-store');
    res.json(catalog);
  } catch (error) {
    next(error);
  }
};
