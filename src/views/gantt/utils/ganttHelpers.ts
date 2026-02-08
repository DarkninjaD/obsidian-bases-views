import { BasesEntry, Task, TaskGroup } from '../../../types/view-config';
import { parseISO, isValid } from 'date-fns';

/**
 * Safely convert any value to a string.
 * Objects are JSON-stringified, primitives use String().
 * HANDLES LINKS: If value is a link object or WikiLink, extracts display text.
 */
export function valueToString(value: unknown): string {
  if (value === null || value === undefined) return '';

  // Handle WikiLinks [[Link]]
  if (typeof value === 'string' && value.startsWith('[[') && value.endsWith(']]')) {
    const content = value.slice(2, -2); // Remove [[ ]]
    // Handle aliases [[Path|Alias]]
    const parts = content.split('|');
    return parts.length > 1 ? parts[1] : parts[0];
  }

  if (typeof value === 'object') {
    // Handle Frontmatter Links / TFile references often found in Bases
    // Common properties: path, file, link, displayText, or simply a file object
    const v = value as any;
    if (v.displayText) return v.displayText;
    if (v.path) {
        // Extract basename from path (e.g., "Folder/Note.md" -> "Note")
        const parts = v.path.split('/');
        const filename = parts[parts.length - 1];
        return filename.replace(/\.md$/, '');
    }
    if (v.file && v.file.basename) return v.file.basename;

    return JSON.stringify(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  return String(value);
}

/**
 * Extract text from a link/object property for hierarchy ID matching.
 * Similar to valueToString but focused on getting the ID/Path for parent lookup.
 */
export function extractLinkText(value: unknown): string {
    return valueToString(value);
}


/**
 * Transform entries into tasks for Gantt view.
 * Filters entries that have valid start and end dates.
 *
 * @param entries - Array of entries
 * @param startDateProperty - Property name for start date
 * @param endDateProperty - Property name for end date
 * @param groupByProperty - Optional property name for grouping
 * @param hierarchyProperty - Optional property name for parent/child hierarchy
 * @returns Array of tasks
 */
export function entriesToTasks(
  entries: BasesEntry[],
  startDateProperty: string,
  endDateProperty: string,
  groupByProperty?: string,
  hierarchyProperty?: string
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
          ? valueToString(rawGroupValue)
          : 'No Group')
      : undefined;

    // Get parent ID if hierarchy is enabled
    let parentId: string | undefined = undefined;
    if (hierarchyProperty) {
        const rawParent = entry.properties[hierarchyProperty];
        if (rawParent) {
            // Handle array values (pick first parent if multiple)
            const parentValue = Array.isArray(rawParent) ? rawParent[0] : rawParent;
            parentId = extractLinkText(parentValue);
        }
    }

    // Only include entries with valid dates
    if (startDate && endDate) {
      tasks.push({
        id: entry.id, // Full path
        file: entry.file,
        title: entry.file.basename,
        startDate,
        endDate,
        startDateProperty,
        endDateProperty,
        row: index, // Temporary row
        group: groupValue,
        parentId
      });
    }
  });

  // If hierarchy property is set, sort tasks by hierarchy
  if (hierarchyProperty) {
      return sortTasksByHierarchy(tasks);
  }

  return tasks;
}

/**
 * Sort tasks to respect hierarchy (Parent -> Children).
 * Handles orphans (missing parents) and cycles A->B->A.
 */
export function sortTasksByHierarchy(tasks: Task[]): Task[] {
    const taskMap = new Map<string, Task>();
    const childrenMap = new Map<string, Task[]>();
    const hasParent = new Set<string>();

    // 1. Build maps
    tasks.forEach(task => {
        taskMap.set(task.title, task);
        taskMap.set(task.id, task);
    });

    // 2. Identify relationships
    tasks.forEach(task => {
        if (task.parentId) {
            const parent = taskMap.get(task.parentId);
            if (parent) {
                const parentKey = parent.title;
                if (!childrenMap.has(parentKey)) {
                    childrenMap.set(parentKey, []);
                }
                childrenMap.get(parentKey)!.push(task);
                hasParent.add(task.title);
            } else {
                // Invalid parent -> Treat as if no parent (but keep ID for reference if needed)
                task.parentId = undefined;
            }
        }
    });

    const sortedTasks: Task[] = [];
    const visited = new Set<string>();
    const processing = new Set<string>();

    // Recursive visit
    function visit(task: Task, depth: number = 0) {
        if (visited.has(task.title)) return;
        if (processing.has(task.title)) {
            console.warn(`Cycle detected: ${task.title}`);
            return;
        }

        processing.add(task.title);
        visited.add(task.title);
        sortedTasks.push(task);

        const children = childrenMap.get(task.title);
        if (children) {
            // Sort children by date
            children.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
            children.forEach(child => visit(child, depth + 1));
        }

        processing.delete(task.title);
    }

    // 3. Separate Roots (Valid Parent or Children) from True Orphans (No Parent + No Children)
    const roots: Task[] = [];
    const trueOrphans: Task[] = [];

    tasks.forEach(task => {
        if (!hasParent.has(task.title)) {
            // It has no parent. Does it have children?
            if (childrenMap.has(task.title) && childrenMap.get(task.title)!.length > 0) {
                roots.push(task);
            } else {
                // No parent, no children -> True Orphan
                trueOrphans.push(task);
            }
        }
    });

    // 4. Sort Roots by Date
    roots.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

    // 5. Visit Roots (and their children)
    roots.forEach(root => visit(root));

    // 6. Handle True Orphans
    if (trueOrphans.length > 0) {
        // Sort orphans by date
        trueOrphans.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        // Calculate bounds for virtual parent
        const minDate = new Date(Math.min(...trueOrphans.map(t => t.startDate.getTime())));
        const maxDate = new Date(Math.max(...trueOrphans.map(t => t.endDate.getTime())));

        const virtualOrphanParent: Task = {
            id: 'virtual-orphan-parent',
            title: 'Orphans',
            startDate: minDate,
            endDate: maxDate,
            startDateProperty: '',
            endDateProperty: '',
            row: 0,
            group: 'Orphans'
        };

        // Add virtual parent
        sortedTasks.push(virtualOrphanParent);

        // Add orphans as children (visually) - we just list them after
        trueOrphans.forEach(task => sortedTasks.push(task));
    }

    // 7. Re-assign rows
    return sortedTasks.map((task, index) => ({
        ...task,
        row: index
    }));
}

/**
 * Parse a date value from various formats.
 * Handles Date objects, ISO strings, timestamps, and common text formats.
 *
 * @param value - Value to parse
 * @returns Date object or null
 */
export function parseDate(value: unknown): Date | null {
  if (!value) return null;

  // Already a Date object
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  // String
  if (typeof value === 'string') {
    // Try ISO format first
    let parsed = parseISO(value);
    if (isValid(parsed)) return parsed;

    // Try YYYY-MM-DD manually if Date.parse/parseISO fails slightly differently
    // Or other formats like DD.MM.YYYY
    if (value.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
        const [d, m, y] = value.split('.');
        parsed = new Date(`${y}-${m}-${d}`);
        if (isValid(parsed)) return parsed;
    }
  }

  // Number (timestamp)
  if (typeof value === 'number') {
    const parsed = new Date(value);
    // Filter out obviously wrong timestamps (e.g. very small numbers that aren't dates)
    // But Bases might use Unix seconds vs ms? Usually ms in JS.
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
