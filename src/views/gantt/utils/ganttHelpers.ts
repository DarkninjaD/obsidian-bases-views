import { BasesEntry, Task } from '../../../types/view-config';
import { parseISO, isValid } from 'date-fns';

/**
 * Transform entries into tasks for Gantt view.
 * Filters entries that have valid start and end dates.
 *
 * @param entries - Array of entries
 * @param startDateProperty - Property name for start date
 * @param endDateProperty - Property name for end date
 * @returns Array of tasks
 */
export function entriesToTasks(
  entries: BasesEntry[],
  startDateProperty: string,
  endDateProperty: string
): Task[] {
  const tasks: Task[] = [];

  entries.forEach((entry, index) => {
    const startValue = entry.properties[startDateProperty];
    const endValue = entry.properties[endDateProperty];

    // Parse dates
    const startDate = parseDate(startValue);
    const endDate = parseDate(endValue);

    // Only include entries with valid dates
    if (startDate && endDate) {
      tasks.push({
        id: entry.id,
        file: entry.file,
        title: entry.file.basename,
        startDate,
        endDate,
        startDateProperty,
        endDateProperty,
        row: index, // Simple row assignment (could be improved with smart layout)
      });
    }
  });

  return tasks;
}

/**
 * Parse a date value from various formats.
 * Handles Date objects, ISO strings, and timestamps.
 *
 * @param value - Value to parse
 * @returns Date object or null
 */
function parseDate(value: any): Date | null {
  if (!value) return null;

  // Already a Date object
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  // String (ISO format)
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : null;
  }

  // Number (timestamp)
  if (typeof value === 'number') {
    const parsed = new Date(value);
    return isValid(parsed) ? parsed : null;
  }

  return null;
}

/**
 * Check if two tasks overlap in time.
 *
 * @param task1 - First task
 * @param task2 - Second task
 * @returns True if tasks overlap
 */
export function tasksOverlap(task1: Task, task2: Task): boolean {
  return (
    task1.startDate <= task2.endDate && task1.endDate >= task2.startDate
  );
}

/**
 * Calculate optimal row positions to minimize overlaps.
 * Simple algorithm: place each task in the first available row.
 *
 * @param tasks - Array of tasks
 * @returns Tasks with updated row positions
 */
export function calculateTaskRows(tasks: Task[]): Task[] {
  // Sort by start date
  const sorted = [...tasks].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  // Track occupied rows
  const rowEndDates: Date[] = [];

  return sorted.map((task) => {
    // Find first available row
    let row = 0;
    while (row < rowEndDates.length) {
      if (rowEndDates[row] < task.startDate) {
        // Row is available
        break;
      }
      row++;
    }

    // Update row end date
    rowEndDates[row] = task.endDate;

    return { ...task, row };
  });
}
