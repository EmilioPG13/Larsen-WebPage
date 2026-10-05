import type { CatalogModel, CatalogUnit } from '../types';

/** Link to the quote form prefilled for one physical unit of the catalog. */
export function unitQuoteHref(model: CatalogModel, unit: CatalogUnit): string {
  const params = new URLSearchParams({
    machine: model.model,
    brand: model.brand,
    gauge: unit.gauge,
    serial: unit.serialNumber,
    unit: unit.id,
  });
  return `/cotizacion?${params.toString()}`;
}

/** Link to the quote form for a made-to-order model, which has no unit yet. */
export function modelQuoteHref(model: CatalogModel): string {
  return `/cotizacion?${new URLSearchParams({ machine: model.model, brand: model.brand }).toString()}`;
}
