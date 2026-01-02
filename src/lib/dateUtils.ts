import { startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, addDays, isAfter, isBefore, isSameDay, isWithinInterval } from "date-fns";

/**
 * Check if a date is in the current week (Mon-Sun)
 */
export function isCurrentWeek(weekStart: Date): boolean {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  return isSameDay(weekStart, currentWeekStart);
}

/**
 * Check if a week is in the past (before current week)
 */
export function isPastWeek(weekStart: Date): boolean {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  return isBefore(weekStart, currentWeekStart);
}

/**
 * Check if a journal entry date is today
 */
export function isToday(entryDate: string | Date): boolean {
  const today = new Date();
  const date = typeof entryDate === "string" ? new Date(entryDate) : entryDate;
  return isSameDay(date, today);
}

/**
 * Check if a journal entry date is in the past (before today)
 */
export function isPastDate(entryDate: string | Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = typeof entryDate === "string" ? new Date(entryDate) : entryDate;
  date.setHours(0, 0, 0, 0);
  return isBefore(date, today);
}

/**
 * Check if a quarter is within its 7-day finalization window
 * The window opens the day after the quarter ends and stays open for 7 days
 */
export function isQuarterlyFinalizationWindowOpen(quarterStart: Date): boolean {
  const today = new Date();
  const quarterEndDate = endOfQuarter(quarterStart);
  const windowStart = addDays(quarterEndDate, 1); // Day after quarter ends
  const windowEnd = addDays(quarterEndDate, 7); // 7 days after quarter ends
  
  return isWithinInterval(today, { start: windowStart, end: windowEnd });
}

/**
 * Check if we're still within the quarter (before finalization window)
 */
export function isCurrentQuarter(quarterStart: Date): boolean {
  const today = new Date();
  const quarterEndDate = endOfQuarter(quarterStart);
  
  // Current quarter means we're within the quarter dates
  return isWithinInterval(today, { start: quarterStart, end: quarterEndDate });
}

/**
 * Check if a quarter is completely past (past the 7-day window)
 */
export function isPastQuarter(quarterStart: Date): boolean {
  const today = new Date();
  const quarterEndDate = endOfQuarter(quarterStart);
  const windowEnd = addDays(quarterEndDate, 7);
  
  return isAfter(today, windowEnd);
}

/**
 * Check if quarterly editing is allowed (within quarter or in finalization window)
 */
export function canEditQuarterly(quarterStart: Date, isFinalized: boolean): boolean {
  if (isFinalized) return false;
  
  // Can edit during the quarter or during the 7-day window
  return isCurrentQuarter(quarterStart) || isQuarterlyFinalizationWindowOpen(quarterStart);
}

/**
 * Get the remaining days in the finalization window
 */
export function getFinalizationWindowDaysRemaining(quarterStart: Date): number {
  const today = new Date();
  const quarterEndDate = endOfQuarter(quarterStart);
  const windowEnd = addDays(quarterEndDate, 7);
  
  const diffTime = windowEnd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}
