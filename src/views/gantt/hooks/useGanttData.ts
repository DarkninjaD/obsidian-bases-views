import { useState, useMemo, useCallback, useEffect } from 'react';
import { App, BasesQueryResult } from 'obsidian';
import { adaptBasesData } from '../../../utils/basesDataAdapter';
import { entriesToTasks, calculateTaskRows, groupTasksByProperty, calculateGroupedRows } from '../utils/ganttHelpers';
import { calculateTimelineRange } from '../utils/dateCalculations';
import { TaskGroup } from '../../../types/view-config';

/**
 * Hook for Gantt view data management.
 * Transforms Bases data into tasks with timeline calculations and grouping support.
 *
 * @param data - Data from Bases API (BasesQueryResult)
 * @param app - Obsidian app instance
 * @param initialStartProperty - Initial start date property
 * @param initialEndProperty - Initial end date property
 * @param initialGroupByProperty - Initial group by property
 * @returns Object with tasks, timeline, groups, and property management
 */
export function useGanttData(
  data: BasesQueryResult,
  app: App,
  initialStartProperty: string,
  initialEndProperty: string,
  initialGroupByProperty?: string,
  initialHierarchyProperty?: string,
  initialCollapsedGroups?: string[]
) {
  const [startDateProperty, setStartDateProperty] = useState(
    initialStartProperty || 'start'
  );
  const [endDateProperty, setEndDateProperty] = useState(
    initialEndProperty || 'end'
  );
  const [groupByProperty, setGroupByProperty] = useState(
    initialGroupByProperty || ''
  );
  const [hierarchyProperty, setHierarchyProperty] = useState(
    initialHierarchyProperty || 'Parent'
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set(initialCollapsedGroups || [])
  );

  // Sync state with props when they change (e.g. from Settings)
  useEffect(() => { setStartDateProperty(initialStartProperty || 'start'); }, [initialStartProperty]);
  useEffect(() => { setEndDateProperty(initialEndProperty || 'end'); }, [initialEndProperty]);
  useEffect(() => { setGroupByProperty(initialGroupByProperty || ''); }, [initialGroupByProperty]);
  useEffect(() => { setHierarchyProperty(initialHierarchyProperty || 'Parent'); }, [initialHierarchyProperty]);
  // Collapsed groups might be user-managed, so maybe don't strictly sync if user collapses locally?
  // But if config changes, we probably should.
  useEffect(() => { setCollapsedGroups(new Set(initialCollapsedGroups || [])); }, [initialCollapsedGroups]);

  // Transform Bases data to our internal format
  const entries = useMemo(() => {
    return adaptBasesData(data, app);
  }, [data, app]);

  // Convert entries to tasks with date filtering and group info
  const rawTasks = useMemo(() => {
    return entriesToTasks(entries, startDateProperty, endDateProperty, groupByProperty, hierarchyProperty);
  }, [entries, startDateProperty, endDateProperty, groupByProperty, hierarchyProperty]);

  // Calculate timeline range based on all tasks
  const [timelineStart, timelineEnd] = useMemo(() => {
    return calculateTimelineRange(rawTasks);
  }, [rawTasks]);

  // Group tasks and calculate rows
  const { tasks, groups } = useMemo(() => {
    if (!groupByProperty || groupByProperty.trim() === '') {
      // No grouping - calculate rows for all tasks
      // IF hierarchy is active, tasks are already sorted and have rows assigned by sortTasksByHierarchy
      if (hierarchyProperty) {
         return { tasks: rawTasks, groups: [] as TaskGroup[] };
      }

      const tasksWithRows = calculateTaskRows(rawTasks);
      return { tasks: tasksWithRows, groups: [] as TaskGroup[] };
    }

    // Group tasks by property
    const grouped = groupTasksByProperty(rawTasks, groupByProperty);

    // Calculate rows within each group and overall positions
    const { tasks: tasksWithRows, groups: groupsWithRows } = calculateGroupedRows(
      grouped,
      collapsedGroups
    );

    return { tasks: tasksWithRows, groups: groupsWithRows };
  }, [rawTasks, groupByProperty, collapsedGroups]);

  // Toggle group collapse state
  const toggleGroupCollapse = useCallback((groupName: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  }, []);

  return {
    tasks,
    groups,
    timelineStart,
    timelineEnd,
    startDateProperty,
    endDateProperty,
    groupByProperty,
    setStartDateProperty,
    setEndDateProperty,
    setGroupByProperty,
    setHierarchyProperty, // Export this
    collapsedGroups,
    toggleGroupCollapse,
  };
}
