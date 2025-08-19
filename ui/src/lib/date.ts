import { DateTime, Interval } from 'luxon';

// Date range types
export interface DateRange {
  start: DateTime;
  end: DateTime;
}

export interface WeekRange {
  weekStart: DateTime;
  weekEnd: DateTime;
  weekNumber: number;
  year: number;
}

export interface MonthRange {
  monthStart: DateTime;
  monthEnd: DateTime;
  month: number;
  year: number;
}

// Get current week range
export function getCurrentWeekRange(): WeekRange {
  const now = DateTime.now();
  const weekStart = now.startOf('week');
  const weekEnd = now.endOf('week');
  
  return {
    weekStart,
    weekEnd,
    weekNumber: now.weekNumber,
    year: now.year,
  };
}

// Get week range for a specific date
export function getWeekRange(date: DateTime): WeekRange {
  const weekStart = date.startOf('week');
  const weekEnd = date.endOf('week');
  
  return {
    weekStart,
    weekEnd,
    weekNumber: date.weekNumber,
    year: date.year,
  };
}

// Get current month range
export function getCurrentMonthRange(): MonthRange {
  const now = DateTime.now();
  const monthStart = now.startOf('month');
  const monthEnd = now.endOf('month');
  
  return {
    monthStart,
    monthEnd,
    month: now.month,
    year: now.year,
  };
}

// Get month range for a specific date
export function getMonthRange(date: DateTime): MonthRange {
  const monthStart = date.startOf('month');
  const monthEnd = date.endOf('month');
  
  return {
    monthStart,
    monthEnd,
    month: date.month,
    year: date.year,
  };
}

// Get next week range
export function getNextWeekRange(): WeekRange {
  const nextWeek = DateTime.now().plus({ weeks: 1 });
  return getWeekRange(nextWeek);
}

// Get previous week range
export function getPreviousWeekRange(): WeekRange {
  const prevWeek = DateTime.now().minus({ weeks: 1 });
  return getWeekRange(prevWeek);
}

// Get next month range
export function getNextMonthRange(): MonthRange {
  const nextMonth = DateTime.now().plus({ months: 1 });
  return getMonthRange(nextMonth);
}

// Get previous month range
export function getPreviousMonthRange(): MonthRange {
  const prevMonth = DateTime.now().minus({ months: 1 });
  return getMonthRange(prevMonth);
}

// Format date for display
export function formatDate(date: DateTime, format: string = 'dd/MM/yyyy'): string {
  return date.toFormat(format);
}

// Format date for API (ISO)
export function formatDateForAPI(date: DateTime): string {
  return date.toISO();
}

// Format time for display
export function formatTime(date: DateTime, format: string = 'HH:mm'): string {
  return date.toFormat(format);
}

// Format date range for display
export function formatDateRange(range: DateRange, format: string = 'dd/MM/yyyy'): string {
  return `${formatDate(range.start, format)} - ${formatDate(range.end, format)}`;
}

// Check if date is today
export function isToday(date: DateTime): boolean {
  return date.hasSame(DateTime.now(), 'day');
}

// Check if date is in the past
export function isPast(date: DateTime): boolean {
  return date < DateTime.now();
}

// Check if date is in the future
export function isFuture(date: DateTime): boolean {
  return date > DateTime.now();
}

// Get days between two dates
export function getDaysBetween(start: DateTime, end: DateTime): DateTime[] {
  const interval = Interval.fromDateTimes(start, end);
  const days: DateTime[] = [];
  
  let current = start;
  while (current <= end) {
    days.push(current);
    current = current.plus({ days: 1 });
  }
  
  return days;
}

// Parse date string to DateTime
export function parseDate(dateString: string): DateTime {
  return DateTime.fromISO(dateString);
}

// Get human readable relative time
export function getRelativeTime(date: DateTime): string {
  return date.toRelative() || 'Unknown';
}
