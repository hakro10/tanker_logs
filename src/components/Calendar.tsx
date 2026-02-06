import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  addDays,
} from 'date-fns';
import { WorkLog } from '../types';
import { combineDateAndTime, readableDuration } from '../lib/time';

interface CalendarProps {
  month: Date;
  selectedDate?: string;
  logs: WorkLog[];
  onSelect: (dateISO: string) => void;
  onMonthChange: (month: Date) => void;
}

const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dayHasLog(logs: WorkLog[], iso: string) {
  return logs.some((log) => log.date === iso);
}

function minutesForLog(log: WorkLog): number {
  const start = combineDateAndTime(log.date, log.startTime);
  const end = combineDateAndTime(log.date, log.endTime);
  return readableDuration(start, end).minutes;
}

export function Calendar({ month, selectedDate, logs, onSelect, onMonthChange }: CalendarProps) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const minutesByDate = new Map<string, number>();
  logs.forEach((log) => {
    minutesByDate.set(log.date, minutesForLog(log));
  });

  const weekMinutes = (day: Date) => {
    const weekStart = startOfWeek(day, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(day, { weekStartsOn: 1 });
    let total = 0;
    let cursor = weekStart;
    while (cursor <= weekEnd) {
      const iso = format(cursor, 'yyyy-MM-dd');
      total += minutesByDate.get(iso) || 0;
      cursor = addDays(cursor, 1);
    }
    return total;
  };

  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

  const sundaySummaries: { iso: string; label: string }[] = [];
  days.forEach((day) => {
    if (day.getDay() === 0) {
      const iso = format(day, 'yyyy-MM-dd');
      const minutes = weekMinutes(day);
      sundaySummaries.push({
        iso,
        label: `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`,
      });
    }
  });

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div>
          <div className="eyebrow">Calendar</div>
          <div className="title">{format(month, 'MMMM yyyy')}</div>
        </div>
        <div className="calendar__nav">
          <button onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Previous month">
            ◀
          </button>
          <button onClick={() => onMonthChange(new Date())} aria-label="Jump to today">
            Today
          </button>
          <button onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Next month">
            ▶
          </button>
        </div>
      </div>
      <div className="calendar__weekdays">
        {weekdayLabels.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar__grid">
        {days.map((day) => {
          const iso = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, month);
          const isToday = iso === todayISO;
          const isSelected = iso === selectedDate;
          const hasLog = dayHasLog(logs, iso);
          const isSunday = day.getDay() === 0;
          const weekTotalMinutes = isSunday ? weekMinutes(day) : 0;
          const weekLabel = isSunday
            ? `${Math.floor(weekTotalMinutes / 60)}h ${String(weekTotalMinutes % 60).padStart(2, '0')}m`
            : '';
          return (
            <button
              key={iso}
              className={`calendar__day ${isCurrentMonth ? '' : 'faded'} ${isSelected ? 'selected' : ''} ${
                isToday ? 'today' : ''
              }`}
              onClick={() => onSelect(iso)}
              >
                <span className="date-number">{format(day, 'd')}</span>
                {hasLog && <span className="dot" />}
                {isSunday && <span className="week-total">{weekLabel}</span>}
            </button>
          );
        })}
      </div>
      {sundaySummaries.length > 0 && (
        <div className="week-total-list">
          {sundaySummaries.map((w) => (
            <div key={w.iso} className="week-total-chip">
              <span className="week-total-date">{w.iso}</span>
              <span className="week-total-text">{w.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Calendar;
