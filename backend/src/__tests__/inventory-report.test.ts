import { UnitStatus } from '@prisma/client';
import {
  buildMonthlyReport,
  currentMonth,
  isValidMonth,
  previousMonth,
  reservedSince,
  ReportMovement,
  ReportUnit,
  STALE_RESERVATION_DAYS,
} from '../services/inventory-report';

const { DISPONIBLE, APARTADA, VENDIDA } = UnitStatus;

// 12:00 in Mexico City on 20 October 2026.
const NOW = new Date('2026-10-20T18:00:00Z');

const at = (iso: string) => new Date(iso);

const move = (
  action: string,
  fromStatus: UnitStatus | null,
  toStatus: UnitStatus | null,
  createdAt: string
): ReportMovement => ({ action, fromStatus, toStatus, createdAt: at(createdAt) });

let counter = 0;
const unit = (overrides: Partial<ReportUnit> = {}): ReportUnit => {
  counter += 1;
  return {
    id: `u${counter}`,
    brand: 'Steiger',
    model: 'Vesta 130E',
    gauge: '7',
    serialNumber: `S${counter}`,
    status: DISPONIBLE,
    receivedAt: null,
    soldAt: null,
    createdAt: at('2026-09-01T12:00:00Z'),
    updatedAt: at('2026-09-01T12:00:00Z'),
    movements: [move('CREATE', null, DISPONIBLE, '2026-09-01T12:00:00Z')],
    ...overrides,
  };
};

describe('month helpers', () => {
  it('accepts only YYYY-MM with a real month', () => {
    expect(isValidMonth('2026-10')).toBe(true);
    expect(isValidMonth('2026-00')).toBe(false);
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth('2026-1')).toBe(false);
    expect(isValidMonth('octubre')).toBe(false);
    expect(isValidMonth(undefined)).toBe(false);
  });

  it('finds the current month as Mexico City sees it, not in UTC', () => {
    expect(currentMonth(at('2026-10-20T18:00:00Z'))).toBe('2026-10');
    // 21:00 on 31 October in Mexico City is already 1 November in UTC.
    expect(currentMonth(at('2026-11-01T03:00:00Z'))).toBe('2026-10');
    expect(currentMonth(at('2026-11-01T06:00:00Z'))).toBe('2026-11');
  });

  it('steps back one month across a year boundary', () => {
    expect(previousMonth('2026-10')).toBe('2026-09');
    expect(previousMonth('2026-01')).toBe('2025-12');
  });
});

describe('buildMonthlyReport', () => {
  describe('arrivals', () => {
    it('counts the units whose arrival date falls in the month, and ignores those with no date', () => {
      const report = buildMonthlyReport(
        [
          unit({ receivedAt: at('2026-10-01T00:00:00Z') }),
          unit({ receivedAt: at('2026-10-31T00:00:00Z') }),
          unit({ receivedAt: at('2026-09-30T00:00:00Z') }),
          unit({ receivedAt: null }),
        ],
        '2026-10',
        NOW
      );

      expect(report.summary.arrivals).toBe(2);
    });
  });

  describe('sales', () => {
    it('lists the units sold in the month by sale date, with the days they sat in stock', () => {
      const report = buildMonthlyReport(
        [
          unit({
            model: 'Gemini',
            status: VENDIDA,
            receivedAt: at('2026-09-10T00:00:00Z'),
            soldAt: at('2026-10-15T00:00:00Z'),
          }),
          unit({ model: 'Vesta 2X3', status: VENDIDA, soldAt: at('2026-10-03T00:00:00Z') }),
          unit({ status: VENDIDA, soldAt: at('2026-09-28T00:00:00Z') }),
          unit({ status: DISPONIBLE, soldAt: null }),
        ],
        '2026-10',
        NOW
      );

      expect(report.summary.sales).toBe(2);
      expect(report.sales.map((sale) => [sale.model, sale.soldAt, sale.daysInStock])).toEqual([
        ['Vesta 2X3', '2026-10-03', null],
        ['Gemini', '2026-10-15', 35],
      ]);
    });

    it('does not count a unit that was sold and then put back on sale', () => {
      const report = buildMonthlyReport([unit({ status: DISPONIBLE, soldAt: null })], '2026-10', NOW);

      expect(report.summary.sales).toBe(0);
    });
  });

  describe('reservations', () => {
    it('counts each time a unit was reserved in the month, by the Mexico City day', () => {
      const reservedTwice = unit({
        status: APARTADA,
        movements: [
          move('CREATE', null, DISPONIBLE, '2026-09-01T12:00:00Z'),
          move('STATUS', DISPONIBLE, APARTADA, '2026-10-03T16:00:00Z'),
          move('STATUS', APARTADA, DISPONIBLE, '2026-10-05T16:00:00Z'),
          move('STATUS', DISPONIBLE, APARTADA, '2026-10-08T16:00:00Z'),
        ],
      });
      // 21:00 on 30 September in Mexico City: still September although it is October in UTC.
      const lateSeptember = unit({
        status: APARTADA,
        movements: [
          move('CREATE', null, DISPONIBLE, '2026-09-01T12:00:00Z'),
          move('STATUS', DISPONIBLE, APARTADA, '2026-10-01T03:00:00Z'),
        ],
      });
      const noteEdit = unit({
        status: APARTADA,
        movements: [
          move('STATUS', DISPONIBLE, APARTADA, '2026-09-20T12:00:00Z'),
          move('UPDATE', null, null, '2026-10-04T12:00:00Z'),
        ],
      });

      const october = buildMonthlyReport([reservedTwice, lateSeptember, noteEdit], '2026-10', NOW);
      const september = buildMonthlyReport([reservedTwice, lateSeptember, noteEdit], '2026-09', NOW);

      expect(october.summary.reservations).toBe(2);
      expect(september.summary.reservations).toBe(2);
    });
  });

  describe('stock at close', () => {
    // Available from 5 September, reserved on 3 October, sold on 15 October.
    const journey = unit({
      status: VENDIDA,
      soldAt: at('2026-10-15T00:00:00Z'),
      movements: [
        move('CREATE', null, DISPONIBLE, '2026-09-05T12:00:00Z'),
        move('STATUS', DISPONIBLE, APARTADA, '2026-10-03T16:00:00Z'),
        move('STATUS', APARTADA, VENDIDA, '2026-10-15T16:00:00Z'),
      ],
    });
    const stillReserved = unit({
      status: APARTADA,
      movements: [
        move('CREATE', null, DISPONIBLE, '2026-09-20T12:00:00Z'),
        move('STATUS', DISPONIBLE, APARTADA, '2026-10-10T16:00:00Z'),
      ],
    });
    const arrivedLater = unit({
      createdAt: at('2026-10-02T12:00:00Z'),
      movements: [move('IMPORT', null, DISPONIBLE, '2026-10-02T12:00:00Z')],
    });

    it('rebuilds a past month from the history', () => {
      const report = buildMonthlyReport([journey, stillReserved, arrivedLater], '2026-09', NOW);

      // At the end of September: the journey unit and the second one were available; the third did not exist yet.
      expect(report.summary.stockAtClose).toEqual({ available: 2, reserved: 0, total: 2 });
    });

    it('uses the state right now while the month is still running', () => {
      const report = buildMonthlyReport([journey, stillReserved, arrivedLater], '2026-10', NOW);

      expect(report.summary.stockAtClose).toEqual({ available: 1, reserved: 1, total: 2 });
    });

    it('reconstructs the middle of a month for a closed month', () => {
      const november = new Date('2026-11-05T18:00:00Z');
      const report = buildMonthlyReport([journey, stillReserved, arrivedLater], '2026-10', november);

      expect(report.summary.stockAtClose).toEqual({ available: 1, reserved: 1, total: 2 });
    });

    it('treats a unit with no status history as existing since it was created', () => {
      const legacy = unit({ status: APARTADA, createdAt: at('2026-08-01T12:00:00Z'), movements: [] });

      expect(buildMonthlyReport([legacy], '2026-09', NOW).summary.stockAtClose.reserved).toBe(1);
      expect(buildMonthlyReport([legacy], '2026-07', NOW).summary.stockAtClose.total).toBe(0);
    });
  });

  describe('response time (sale -> recorded in the system)', () => {
    const sold = (soldAt: string, movements: ReportMovement[]) =>
      unit({ status: VENDIDA, soldAt: at(soldAt), movements });

    it('measures the days between the sale date and the day it was recorded', () => {
      const report = buildMonthlyReport(
        [
          sold('2026-10-05T00:00:00Z', [move('STATUS', DISPONIBLE, VENDIDA, '2026-10-05T20:00:00Z')]),
          sold('2026-10-03T00:00:00Z', [move('STATUS', APARTADA, VENDIDA, '2026-10-06T16:00:00Z')]),
          sold('2026-10-01T00:00:00Z', [move('STATUS', DISPONIBLE, VENDIDA, '2026-10-02T16:00:00Z')]),
        ],
        '2026-10',
        NOW
      );

      expect(report.responseTime).toEqual({
        measured: 3,
        sameDay: 1,
        averageDays: 1.3, // (0 + 3 + 1) / 3
        worstDays: 3,
        notMeasurable: 0,
      });
    });

    it('counts the recording day in Mexico City, not in UTC', () => {
      // 21:00 on 5 October in Mexico City is already 6 October in UTC: still the same day as the sale.
      const report = buildMonthlyReport(
        [sold('2026-10-05T00:00:00Z', [move('STATUS', DISPONIBLE, VENDIDA, '2026-10-06T03:00:00Z')])],
        '2026-10',
        NOW
      );

      expect(report.responseTime.sameDay).toBe(1);
      expect(report.responseTime.worstDays).toBe(0);
    });

    it('leaves out the sales that came from the spreadsheet import', () => {
      const report = buildMonthlyReport(
        [sold('2026-10-05T00:00:00Z', [move('IMPORT', null, VENDIDA, '2026-10-02T12:00:00Z')])],
        '2026-10',
        NOW
      );

      expect(report.responseTime).toEqual({
        measured: 0,
        sameDay: 0,
        averageDays: null,
        worstDays: null,
        notMeasurable: 1,
      });
    });

    it('never reports a negative delay when a sale is dated after it was recorded', () => {
      const report = buildMonthlyReport(
        [sold('2026-10-10T00:00:00Z', [move('STATUS', DISPONIBLE, VENDIDA, '2026-10-08T16:00:00Z')])],
        '2026-10',
        NOW
      );

      expect(report.responseTime.worstDays).toBe(0);
    });

    it('uses the latest time the unit became sold', () => {
      const report = buildMonthlyReport(
        [
          sold('2026-10-05T00:00:00Z', [
            move('STATUS', DISPONIBLE, VENDIDA, '2026-10-05T16:00:00Z'),
            move('STATUS', VENDIDA, DISPONIBLE, '2026-10-06T16:00:00Z'),
            move('STATUS', DISPONIBLE, VENDIDA, '2026-10-09T16:00:00Z'),
          ]),
        ],
        '2026-10',
        NOW
      );

      expect(report.responseTime.worstDays).toBe(4);
    });
  });

  describe('aging', () => {
    it('measures how long the units on hand have been in the warehouse, oldest first', () => {
      const report = buildMonthlyReport(
        [
          unit({ model: 'A', receivedAt: at('2026-10-10T00:00:00Z') }),
          unit({ model: 'B', receivedAt: at('2026-07-22T00:00:00Z') }),
          unit({ model: 'C', status: APARTADA, receivedAt: at('2026-09-20T00:00:00Z') }),
          unit({ model: 'D', receivedAt: null }),
          unit({ model: 'E', status: VENDIDA, receivedAt: at('2026-01-01T00:00:00Z'), soldAt: at('2026-10-02T00:00:00Z') }),
        ],
        '2026-10',
        NOW
      );

      expect(report.aging.onHand).toBe(4);
      expect(report.aging.withReceivedDate).toBe(3);
      expect(report.aging.withoutReceivedDate).toBe(1);
      expect(report.aging.oldest.map((entry) => [entry.model, entry.days])).toEqual([
        ['B', 90],
        ['C', 30],
        ['A', 10],
      ]);
      expect(report.aging.averageDays).toBe(43.3);
    });

    it('lists at most the five oldest', () => {
      const many = Array.from({ length: 8 }, (_, index) =>
        unit({ receivedAt: at(`2026-09-${String(index + 1).padStart(2, '0')}T00:00:00Z`) })
      );

      expect(buildMonthlyReport(many, '2026-10', NOW).aging.oldest).toHaveLength(5);
    });

    it('averages the days from arrival to sale for the sales of the month', () => {
      const report = buildMonthlyReport(
        [
          unit({ status: VENDIDA, receivedAt: at('2026-10-01T00:00:00Z'), soldAt: at('2026-10-11T00:00:00Z') }),
          unit({ status: VENDIDA, receivedAt: at('2026-09-01T00:00:00Z'), soldAt: at('2026-10-05T00:00:00Z') }),
          unit({ status: VENDIDA, receivedAt: null, soldAt: at('2026-10-06T00:00:00Z') }),
        ],
        '2026-10',
        NOW
      );

      expect(report.aging.averageDaysToSell).toBe(22); // (10 + 34) / 2
    });
  });

  describe('stale reservations', () => {
    const reservedAgo = (days: number, extra: Partial<ReportUnit> = {}) => {
      // Reserved at noon Mexico City, `days` days before NOW.
      const when = new Date(NOW.getTime() - days * 86_400_000).toISOString();
      return unit({
        status: APARTADA,
        movements: [move('CREATE', null, DISPONIBLE, '2026-09-01T12:00:00Z'), move('STATUS', DISPONIBLE, APARTADA, when)],
        ...extra,
      });
    };

    it('flags the reservations at or past the limit, longest first', () => {
      const report = buildMonthlyReport(
        [
          reservedAgo(STALE_RESERVATION_DAYS - 1),
          reservedAgo(STALE_RESERVATION_DAYS, { model: 'Fifteen' }),
          reservedAgo(40, { model: 'Forty' }),
        ],
        '2026-10',
        NOW
      );

      expect(report.staleAfterDays).toBe(15);
      expect(report.staleReservations.map((entry) => [entry.model, entry.days])).toEqual([
        ['Forty', 40],
        ['Fifteen', 15],
      ]);
    });

    it('ignores units that are not reserved', () => {
      const report = buildMonthlyReport([unit({ status: DISPONIBLE }), unit({ status: VENDIDA })], '2026-10', NOW);

      expect(report.staleReservations).toEqual([]);
    });

    it('falls back to the last update when there is no reservation in the history', () => {
      const report = buildMonthlyReport(
        [unit({ status: APARTADA, movements: [], updatedAt: at('2026-09-01T18:00:00Z') })],
        '2026-10',
        NOW
      );

      expect(report.staleReservations.map((entry) => [entry.since, entry.days])).toEqual([['2026-09-01', 49]]);
    });
  });

  it('copes with an empty inventory', () => {
    const report = buildMonthlyReport([], '2026-10', NOW);

    expect(report.summary).toEqual({
      arrivals: 0,
      sales: 0,
      reservations: 0,
      stockAtClose: { available: 0, reserved: 0, total: 0 },
    });
    expect(report.aging.averageDays).toBeNull();
    expect(report.aging.averageDaysToSell).toBeNull();
    expect(report.responseTime.averageDays).toBeNull();
    expect(report.sales).toEqual([]);
  });
});

describe('reservedSince', () => {
  it('is null for a unit that is not reserved', () => {
    expect(reservedSince(unit({ status: DISPONIBLE }))).toBeNull();
  });

  it('is the latest time the unit was reserved', () => {
    const reserved = unit({
      status: APARTADA,
      movements: [
        move('STATUS', DISPONIBLE, APARTADA, '2026-10-01T16:00:00Z'),
        move('STATUS', APARTADA, DISPONIBLE, '2026-10-02T16:00:00Z'),
        move('STATUS', DISPONIBLE, APARTADA, '2026-10-09T16:00:00Z'),
      ],
    });

    expect(reservedSince(reserved)).toEqual(at('2026-10-09T16:00:00Z'));
  });
});
