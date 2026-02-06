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

export function Calendar({ month, selectedDate, logs, onSelect, onMonthChange }: CalendarProps) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const todayISO = format(new Date(), 'yyyy-MM-dd');

  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDays(cursor, 1);
  }

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
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
