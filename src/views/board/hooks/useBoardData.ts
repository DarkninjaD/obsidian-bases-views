import { useState, useMemo, useEffect } from 'react';
import { App, BasesQueryResult } from 'obsidian';
import { adaptBasesData } from '../../../utils/basesDataAdapter';
import { groupEntriesByProperty, sortGroups } from '../utils/boardHelpers';
import { BasesEntry } from '../../../types/view-config';

/**
 * Hook for Board view data management.
 * Transforms Bases data into grouped columns with optional sub-grouping.
 *
 * @param data - Data from Bases API (BasesQueryResult)
 * @param app - Obsidian app instance
 * @param initialGroupByProperty - Initial property to group by (columns)
 * @param initialSubGroupByProperty - Initial property for sub-grouping within columns
 * @returns Object with entries, groups, sub-groups, and property management
 */
export function useBoardData(
  data: BasesQueryResult,
  app: App,
  initialGroupByProperty: string,
  initialSubGroupByProperty?: string
) {
  const [groupByProperty, setGroupByProperty] = useState(initialGroupByProperty || 'status');
  const [subGroupByProperty, setSubGroupByProperty] = useState(initialSubGroupByProperty || '');

  // Sync state with props when config changes
  useEffect(() => {
    if (initialGroupByProperty) {
      setGroupByProperty(initialGroupByProperty);
    }
  }, [initialGroupByProperty]);

  useEffect(() => {
    setSubGroupByProperty(initialSubGroupByProperty || '');
  }, [initialSubGroupByProperty]);

  // Transform Bases data to our internal format
  const entries = useMemo(() => {
    return adaptBasesData(data, app);
  }, [data, app]);

  // Group entries by the selected property (main columns)
  const groups = useMemo(() => {
    if (!groupByProperty) {
      // No grouping, put all in one group
      const allGroups = new Map<string, BasesEntry[]>();
      allGroups.set('All', entries);
      return allGroups;
    }

    const grouped = groupEntriesByProperty(entries, groupByProperty);

    // Always ensure 'Uncategorized' group exists so users can create first entry
    if (!grouped.has('Uncategorized')) {
      grouped.set('Uncategorized', []);
    }

    return grouped;
  }, [entries, groupByProperty]);

  // Create sub-groups within each group if subGroupByProperty is set
  const groupsWithSubGroups = useMemo(() => {
    const result = new Map<string, Map<string, BasesEntry[]>>();

    groups.forEach((groupEntries, groupKey) => {
      if (subGroupByProperty && subGroupByProperty.trim()) {
        // Sub-group the entries within this group
        const subGroups = groupEntriesByProperty(groupEntries, subGroupByProperty);

        // Ensure 'Uncategorized' sub-group exists so users can create entries
        if (!subGroups.has('Uncategorized')) {
          subGroups.set('Uncategorized', []);
        }

        const sortedSubGroups = sortGroups(subGroups);
        // Convert sorted array back to Map
        const subGroupsMap = new Map(sortedSubGroups);
        result.set(groupKey, subGroupsMap);
      } else {
        // No sub-grouping, put all entries in a single sub-group
        const singleSubGroup = new Map<string, BasesEntry[]>();
        singleSubGroup.set('', groupEntries);
        result.set(groupKey, singleSubGroup);
      }
    });

    return result;
  }, [groups, subGroupByProperty]);

  // Sort main groups
  const sortedGroups = useMemo(() => {
    return sortGroups(groups);
  }, [groups]);

  return {
    entries,
    groups: sortedGroups,
    groupsWithSubGroups,
    groupByProperty,
    setGroupByProperty,
    subGroupByProperty,
    setSubGroupByProperty,
  };
}
