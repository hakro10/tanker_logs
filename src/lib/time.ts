import { differenceInMinutes, parseISO, addDays } from 'date-fns';

export function combineDateAndTime(dateISO: string, time?: string): Date | null {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  const base = parseISO(dateISO);
  const withTime = new Date(base);
  withTime.setHours(hours, minutes, 0, 0);
  return withTime;
}

export function readableDuration(start?: Date | null, end?: Date | null): {
  label: string;
  minutes: number;
} {
  if (!start || !end) return { label: '—', minutes: 0 };
  let diff = differenceInMinutes(end, start);
  // If shift passes midnight, account for next day
  if (diff < 0) {
    const endNextDay = addDays(end, 1);
    diff = differenceInMinutes(endNextDay, start);
  }
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;
  return { label: `${hours}h ${minutes.toString().padStart(2, '0')}m`, minutes: diff };
}
