"use client";

import {
  MONTH_TITLE,
  WEEKDAYS,
  cellClass,
  monthCells,
  shiftMonth,
  type CalCell,
} from "@/lib/calendar";
import type { Schedule } from "@/lib/person-card";

export function MonthCalendar({
  year,
  month,
  onYearMonth,
  schedule,
  interactive,
  onDayClick,
}: {
  year: number;
  month: number;
  onYearMonth: (year: number, month: number) => void;
  schedule?: Schedule;
  interactive?: boolean;
  onDayClick?: (cell: CalCell) => void;
}) {
  const cells = monthCells(year, month);
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const now = new Date();

  return (
    <div>
      <div className="kadr-cal-month">
        <button
          type="button"
          className="kadr-cal-month__btn"
          aria-label="Предыдущий месяц"
          onClick={() => onYearMonth(prev.year, prev.month)}
        >
          ‹
        </button>
        <button
          type="button"
          className="kadr-cal-month__label"
          onClick={() => onYearMonth(now.getFullYear(), now.getMonth())}
          title="Текущий месяц"
        >
          {MONTH_TITLE[month]} {year}
        </button>
        <button
          type="button"
          className="kadr-cal-month__btn"
          aria-label="Следующий месяц"
          onClick={() => onYearMonth(next.year, next.month)}
        >
          ›
        </button>
      </div>
      <div className={`mini-cal${interactive ? " kadr-settings-cal" : ""}`}>
        {WEEKDAYS.map((day) => (
          <span className="mini-cal__h" key={day}>
            {day}
          </span>
        ))}
        {cells.map((cell) => {
          const cls = cellClass(cell, schedule);
          const className = cls ? `mini-cal__d ${cls}` : "mini-cal__d";
          if (interactive) {
            return (
              <button
                type="button"
                className={className}
                key={cell.iso}
                onClick={() => onDayClick?.(cell)}
              >
                {cell.n}
              </button>
            );
          }
          return (
            <span className={className} key={cell.iso}>
              {cell.n}
            </span>
          );
        })}
      </div>
    </div>
  );
}
