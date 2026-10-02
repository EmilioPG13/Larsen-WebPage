import { UnitStatus } from '@prisma/client';

/**
 * Monthly inventory report, computed from the units and their movement history.
 * Everything here is a pure function of its input so it can be tested without a database.
 *
 * Two kinds of numbers:
 *  - Of the month: arrivals, sales, reservations, stock at close and the sale -> system delay.
 *  - As of today: how long the stock has been sitting and the reservations that are going stale.
 */

/** A reservation older than this many days is flagged. */
export const STALE_RESERVATION_DAYS = 15;

const TIME_ZONE = 'America/Mexico_City';
// Mexico City has had no daylight saving time since 2022, so a fixed offset is exact for this system.
const MEXICO_OFFSET = '-06:00';
const DAY_MS = 86_400_000;
const OLDEST_LISTED = 5;

export interface ReportMovement {
  action: string;
  fromStatus: UnitStatus | null;
  toStatus: UnitStatus | null;
  createdAt: Date;
}

export interface ReportUnit {
  id: string;
  brand: string;
  model: string;
  gauge: string;
  serialNumber: string;
  status: UnitStatus;
  receivedAt: Date | null;
  soldAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  movements: ReportMovement[];
}

export interface UnitRef {
  id: string;
  brand: string;
  model: string;
  gauge: string;
  serialNumber: string;
}

export interface MonthlyReport {
  month: string;
  summary: {
    arrivals: number;
    sales: number;
    reservations: number;
    stockAtClose: { available: number; reserved: number; total: number };
  };
  sales: (UnitRef & { soldAt: string; daysInStock: number | null })[];
  /** How long it took to record each sale in the system, against the sale date. Goal: the same day. */
  responseTime: {
    measured: number;
    sameDay: number;
    averageDays: number | null;
    worstDays: number | null;
    /** Sales that came from the spreadsheet import, which says nothing about when they were recorded. */
    notMeasurable: number;
  };
  /** Units on hand today (available or reserved). */
  aging: {
    onHand: number;
    withReceivedDate: number;
    withoutReceivedDate: number;
    averageDays: number | null;
    oldest: (UnitRef & { receivedAt: string; days: number })[];
    /** Average days from arrival to sale for the sales of the month that have both dates. */
    averageDaysToSell: number | null;
  };
  staleAfterDays: number;
  staleReservations: (UnitRef & { since: string; days: number })[];
}

const dayFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** `YYYY-MM-DD` of a date-only column (stored at midnight UTC). */
const storedDay = (date: Date) => date.toISOString().slice(0, 10);

/** `YYYY-MM-DD` of a timestamp as the calendar day it was in Mexico City. */
const localDay = (date: Date) => dayFormat.format(date);

const dayNumber = (day: string) => Date.parse(`${day}T00:00:00Z`) / DAY_MS;
const daysBetween = (from: string, to: string) => Math.round(dayNumber(to) - dayNumber(from));

const round1 = (value: number) => Math.round(value * 10) / 10;
const average = (values: number[]) =>
  values.length ? round1(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

const ref = (unit: ReportUnit): UnitRef => ({
  id: unit.id,
  brand: unit.brand,
  model: unit.model,
  gauge: unit.gauge,
  serialNumber: unit.serialNumber,
});

export const isValidMonth = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);

/** The month `now` falls in, as Mexico City sees it. */
export const currentMonth = (now: Date = new Date()) => localDay(now).slice(0, 7);

/** The month before the given one (or before the current one). */
export const previousMonth = (month: string = currentMonth()) => {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, number - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

const nextMonthStart = (month: string) => {
  const [year, number] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, number, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
};

const inMonth = (day: string, month: string) => day.slice(0, 7) === month;

/** The status a unit had at an instant, or null if it was not in the system yet. */
const statusAt = (unit: ReportUnit, instant: Date): UnitStatus | null => {
  const history = unit.movements
    .filter((movement) => movement.toStatus && movement.createdAt <= instant)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (history.length) return history[history.length - 1].toStatus;
  // A unit with no status history at all still exists since it was created.
  if (!unit.movements.some((movement) => movement.toStatus)) return unit.createdAt <= instant ? unit.status : null;
  return null;
};

/** When the unit was last reserved, or null if it is not reserved. Falls back to its last update. */
export const reservedSince = (unit: Pick<ReportUnit, 'status' | 'updatedAt' | 'movements'>): Date | null => {
  if (unit.status !== UnitStatus.APARTADA) return null;
  const reserved = unit.movements
    .filter((movement) => movement.toStatus === UnitStatus.APARTADA)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return reserved[0]?.createdAt ?? unit.updatedAt;
};

export const buildMonthlyReport = (units: ReportUnit[], month: string, now: Date = new Date()): MonthlyReport => {
  const today = localDay(now);

  // Stock at close: end of the month, or right now while the month is still running.
  const monthEnd = new Date(`${nextMonthStart(month)}T00:00:00${MEXICO_OFFSET}`);
  const closeInstant = now < monthEnd ? now : monthEnd;
  const stock = { available: 0, reserved: 0, total: 0 };
  for (const unit of units) {
    const status = statusAt(unit, closeInstant);
    if (status === UnitStatus.DISPONIBLE) stock.available += 1;
    if (status === UnitStatus.APARTADA) stock.reserved += 1;
  }
  stock.total = stock.available + stock.reserved;

  const arrivals = units.filter((unit) => unit.receivedAt && inMonth(storedDay(unit.receivedAt), month)).length;

  const reservations = units.reduce(
    (total, unit) =>
      total +
      unit.movements.filter(
        (movement) =>
          movement.toStatus === UnitStatus.APARTADA &&
          movement.fromStatus !== UnitStatus.APARTADA &&
          inMonth(localDay(movement.createdAt), month)
      ).length,
    0
  );

  const soldInMonth = units
    .filter((unit) => unit.status === UnitStatus.VENDIDA && unit.soldAt && inMonth(storedDay(unit.soldAt), month))
    .sort((a, b) => a.soldAt!.getTime() - b.soldAt!.getTime());

  const sales = soldInMonth.map((unit) => ({
    ...ref(unit),
    soldAt: storedDay(unit.soldAt!),
    daysInStock: unit.receivedAt ? Math.max(0, daysBetween(storedDay(unit.receivedAt), storedDay(unit.soldAt!))) : null,
  }));

  // Sale -> system: the movement that made the unit VENDIDA, unless it came from the import.
  const delays: number[] = [];
  let notMeasurable = 0;
  for (const unit of soldInMonth) {
    const recorded = unit.movements
      .filter((movement) => movement.toStatus === UnitStatus.VENDIDA && movement.action !== 'IMPORT')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    if (!recorded) {
      notMeasurable += 1;
      continue;
    }
    delays.push(Math.max(0, daysBetween(storedDay(unit.soldAt!), localDay(recorded.createdAt))));
  }

  // Stock sitting in the warehouse today.
  const onHand = units.filter((unit) => unit.status !== UnitStatus.VENDIDA);
  const aged = onHand
    .filter((unit) => unit.receivedAt)
    .map((unit) => ({
      ...ref(unit),
      receivedAt: storedDay(unit.receivedAt!),
      days: Math.max(0, daysBetween(storedDay(unit.receivedAt!), today)),
    }))
    .sort((a, b) => b.days - a.days);

  const staleReservations = units
    .map((unit) => ({ unit, since: reservedSince(unit) }))
    .filter((entry): entry is { unit: ReportUnit; since: Date } => entry.since !== null)
    .map(({ unit, since }) => ({
      ...ref(unit),
      since: localDay(since),
      days: Math.max(0, daysBetween(localDay(since), today)),
    }))
    .filter((entry) => entry.days >= STALE_RESERVATION_DAYS)
    .sort((a, b) => b.days - a.days);

  return {
    month,
    summary: { arrivals, sales: sales.length, reservations, stockAtClose: stock },
    sales,
    responseTime: {
      measured: delays.length,
      sameDay: delays.filter((delay) => delay === 0).length,
      averageDays: average(delays),
      worstDays: delays.length ? Math.max(...delays) : null,
      notMeasurable,
    },
    aging: {
      onHand: onHand.length,
      withReceivedDate: aged.length,
      withoutReceivedDate: onHand.length - aged.length,
      averageDays: average(aged.map((unit) => unit.days)),
      oldest: aged.slice(0, OLDEST_LISTED),
      averageDaysToSell: average(sales.flatMap((sale) => (sale.daysInStock === null ? [] : [sale.daysInStock]))),
    },
    staleAfterDays: STALE_RESERVATION_DAYS,
    staleReservations,
  };
};
