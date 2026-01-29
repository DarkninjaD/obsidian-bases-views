import { startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, differenceInDays, differenceInWeeks, differenceInMonths, addDays, addWeeks, addMonths, format } from 'date-fns';
import { GanttTimelineStep } from '../../../types/view-config';
import { Task } from '../../../types/view-config';

/**
 * Calculate the timeline range that encompasses all tasks.
 * Returns start and end dates with some padding.
 *
 * @param tasks - Array of tasks with start/end dates
 * @returns Tuple of [startDate, endDate]
 */
export function calculateTimelineRange(tasks: Task[]): [Date, Date] {
  if (tasks.length === 0) {
    // No tasks, return current month
    const now = new Date();
    return [startOfMonth(now), endOfMonth(now)];
  }

  // Find earliest start date and latest end date
  const allDates = tasks.flatMap((t) => [t.startDate, t.endDate]);
  const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // Add padding: start of month for min, end of month for max
  return [startOfMonth(minDate), endOfMonth(maxDate)];
}

/**
 * Calculate position and width of a task bar on the timeline.
 * Returns percentage values for CSS positioning.
 *
 * @param taskStart - Task start date
 * @param taskEnd - Task end date
 * @param timelineStart - Timeline start date
 * @param timelineEnd - Timeline end date
 * @returns Object with left and width percentages
 */
export function calculateTaskPosition(
  taskStart: Date,
  taskEnd: Date,
  timelineStart: Date,
  timelineEnd: Date
): { left: number; width: number } {
  // Add 1 because differenceInDays doesn't include the end date,
  // but the timeline visually shows both start and end dates (inclusive)
  const timelineSpan = differenceInDays(timelineEnd, timelineStart) + 1;
  const taskStartOffset = differenceInDays(taskStart, timelineStart);
  const taskSpan = differenceInDays(taskEnd, taskStart) + 1;

  return {
    left: (taskStartOffset / timelineSpan) * 100,
    width: (taskSpan / timelineSpan) * 100,
  };
}

/**
 * Generate timeline markers for the header based on step.
 *
 * @param timelineStart - Timeline start date
 * @param timelineEnd - Timeline end date
 * @param step - Timeline step (day, week, month)
 * @returns Array of marker objects
 */
export function generateTimelineMarkers(
  timelineStart: Date,
  timelineEnd: Date,
  step: GanttTimelineStep = 'day'
): Array<{ date: Date; label: string; isMonthStart: boolean }> {
  if (step === 'week') {
    const weeks = eachWeekOfInterval({ start: timelineStart, end: timelineEnd }, { weekStartsOn: 1 });
    return weeks.map((date) => ({
      date,
      label: format(date, 'd MMM'),
      isMonthStart: date.getDate() <= 7,
    }));
  }

  if (step === 'month') {
    const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
    return months.map((date) => ({
      date,
      label: format(date, 'MMM yyyy'),
      isMonthStart: true,
    }));
  }

  // Default: day
  const days = eachDayOfInterval({ start: timelineStart, end: timelineEnd });
  return days.map((date) => ({
    date,
    label: format(date, 'd'),
    isMonthStart: date.getDate() === 1,
  }));
}

/**
 * Get the number of timeline units between two dates.
 *
 * @param timelineStart - Timeline start date
 * @param timelineEnd - Timeline end date
 * @param step - Timeline step
 * @returns Number of units (inclusive)
 */
export function getTimelineUnitCount(
  timelineStart: Date,
  timelineEnd: Date,
  step: GanttTimelineStep = 'day'
): number {
  if (step === 'week') {
    return differenceInWeeks(timelineEnd, timelineStart) + 1;
  }
  if (step === 'month') {
    return differenceInMonths(timelineEnd, timelineStart) + 1;
  }
  return differenceInDays(timelineEnd, timelineStart) + 1;
}

/**
 * Calculate new date from pixel delta during resize/drag.
 *
 * @param originalDate - Original date before resize
 * @param pixelDelta - Pixel movement
 * @param pixelsPerUnit - Pixels representing one unit (day/week/month)
 * @param step - Timeline step
 * @returns New date
 */
export function calculateDateFromDelta(
  originalDate: Date,
  pixelDelta: number,
  pixelsPerUnit: number,
  step: GanttTimelineStep = 'day'
): Date {
  const unitsDelta = Math.round(pixelDelta / pixelsPerUnit);

  if (step === 'week') {
    return addWeeks(originalDate, unitsDelta);
  }
  if (step === 'month') {
    return addMonths(originalDate, unitsDelta);
  }
  return addDays(originalDate, unitsDelta);
}
