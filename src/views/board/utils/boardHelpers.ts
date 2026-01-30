import { BasesEntry } from '../../../types/view-config';

/**
 * Safely convert any value to a string.
 * Objects are JSON-stringified, primitives use String().
 */
function valueToString(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return String(value);
}

/**
 * Group entries by a property value.
 * Creates a Map where keys are property values and values are arrays of entries.
 *
 * @param entries - Array of entries to group
 * @param propertyName - Property to group by
 * @returns Map of property value to entries
 */
export function groupEntriesByProperty(
  entries: BasesEntry[],
  propertyName: string
): Map<string, BasesEntry[]> {
  const groups = new Map<string, BasesEntry[]>();

  entries.forEach((entry) => {
    // Get the property value, default to 'Uncategorized' if not set
    const propertyValue = entry.properties[propertyName];
    const groupKey = propertyValue !== undefined && propertyValue !== null
      ? valueToString(propertyValue)
      : 'Uncategorized';

    // Add entry to the appropriate group
    const group = groups.get(groupKey) || [];
    group.push(entry);
    groups.set(groupKey, group);
  });

  return groups;
}

/**
 * Sort groups by a custom order.
 * Useful for maintaining consistent column order (e.g., Todo, In Progress, Done).
 *
 * @param groups - Map of groups
 * @param order - Optional array defining the order of group keys
 * @returns Sorted array of [key, entries] tuples
 */
export function sortGroups(
  groups: Map<string, BasesEntry[]>,
  order?: string[]
): Array<[string, BasesEntry[]]> {
  const entries = Array.from(groups.entries());

  if (!order || order.length === 0) {
    // No custom order, sort alphabetically
    return entries.sort((a, b) => a[0].localeCompare(b[0]));
  }

  // Sort by custom order, putting unmatched items at the end
  return entries.sort((a, b) => {
    const aIndex = order.indexOf(a[0]);
    const bIndex = order.indexOf(b[0]);

    // If both are in the order array, sort by order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }

    // If only a is in the order, a comes first
    if (aIndex !== -1) return -1;

    // If only b is in the order, b comes first
    if (bIndex !== -1) return 1;

    // If neither is in the order, sort alphabetically
    return a[0].localeCompare(b[0]);
  });
}
