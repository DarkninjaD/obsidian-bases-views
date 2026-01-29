import { BasesEntry, Task, TaskGroup } from '../../../types/view-config';
import { parseISO, isValid } from 'date-fns';

/**
 * Transform entries into tasks for Gantt view.
 * Filters entries that have valid start and end dates.
 *
 * @param entries - Array of entries
 * @param startDateProperty - Property name for start date
 * @param endDateProperty - Property name for end date
 * @param groupByProperty - Optional property name for grouping
 * @returns Array of tasks
 */
export function entriesToTasks(
  entries: BasesEntry[],
  startDateProperty: string,
  endDateProperty: string,
  groupByProperty?: string
): Task[] {
  const tasks: Task[] = [];

  entries.forEach((entry, index) => {
    const startValue = entry.properties[startDateProperty];
    const endValue = entry.properties[endDateProperty];

    // Parse dates
    const startDate = parseDate(startValue);
    const endDate = parseDate(endValue);

    // Get group value if grouping is enabled
    const rawGroupValue = groupByProperty ? entry.properties[groupByProperty] : undefined;
    const groupValue = groupByProperty
      ? (rawGroupValue !== undefined && rawGroupValue !== null
          ? (typeof rawGroupValue === 'object'
              ? JSON.stringify(rawGroupValue)
              : String(rawGroupValue))
          : 'No Group')
      : undefined;

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
        row: index,
        group: groupValue,
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
function parseDate(value: unknown): Date | null {
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
 * Calculate row positions for tasks.
 * Each task gets its own row, sorted by start date.
 *
 * @param tasks - Array of tasks
 * @returns Tasks with updated row positions
 */
export function calculateTaskRows(tasks: Task[]): Task[] {
  // Sort by start date
  const sorted = [...tasks].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );

  // Assign each task its own row
  return sorted.map((task, index) => ({ ...task, row: index }));
}

/**
 * Group tasks by a property value.
 *
 * @param tasks - Array of tasks with group property
 * @param groupByProperty - Property name used for grouping
 * @returns Map of group name to tasks
 */
export function groupTasksByProperty(
  tasks: Task[],
  groupByProperty: string
): Map<string, Task[]> {
  const groups = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const groupName = task.group || 'No Group';
    if (!groups.has(groupName)) {
      groups.set(groupName, []);
    }
    groups.get(groupName)!.push(task);
  });

  return groups;
}

/**
 * Calculate row positions for grouped tasks.
 * Each group has its own row space, with a header row.
 *
 * @param groupedTasks - Map of group name to tasks
 * @param collapsedGroups - Set of collapsed group names
 * @returns Object with tasks (with updated rows) and group info
 */
export function calculateGroupedRows(
  groupedTasks: Map<string, Task[]>,
  collapsedGroups: Set<string>
): { tasks: Task[]; groups: TaskGroup[] } {
  const allTasks: Task[] = [];
  const groups: TaskGroup[] = [];
  let currentRow = 0;

  // Sort groups alphabetically, but put "No Group" last
  const sortedGroupNames = Array.from(groupedTasks.keys()).sort((a, b) => {
    if (a === 'No Group') return 1;
    if (b === 'No Group') return -1;
    return a.localeCompare(b);
  });

  sortedGroupNames.forEach((groupName) => {
    const groupTasks = groupedTasks.get(groupName) || [];
    const isCollapsed = collapsedGroups.has(groupName);

    // Group header row
    const groupStartRow = currentRow;
    currentRow++; // Reserve row for group header

    if (isCollapsed) {
      // Collapsed: only show header, no tasks visible
      groups.push({
        name: groupName,
        tasks: groupTasks,
        startRow: groupStartRow,
        rowCount: 1,
        isCollapsed: true,
      });
    } else {
      // Expanded: calculate rows for tasks within this group
      const tasksWithLocalRows = calculateTaskRows(groupTasks);

      // Offset rows by current position
      const tasksWithGlobalRows = tasksWithLocalRows.map((task) => ({
        ...task,
        row: task.row + currentRow,
      }));

      allTasks.push(...tasksWithGlobalRows);

      // Calculate how many rows this group uses
      const maxLocalRow =
        tasksWithLocalRows.length > 0
          ? Math.max(...tasksWithLocalRows.map((t) => t.row))
          : -1;
      const groupRowCount = maxLocalRow + 2; // +1 for 0-index, +1 for header

      groups.push({
        name: groupName,
        tasks: tasksWithGlobalRows,
        startRow: groupStartRow,
        rowCount: groupRowCount,
        isCollapsed: false,
      });

      currentRow += maxLocalRow + 1;
    }
  });

  return { tasks: allTasks, groups };
}
