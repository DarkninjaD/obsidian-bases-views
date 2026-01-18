import { useState, useMemo } from 'react';
import { App, BasesQueryResult } from 'obsidian';
import { adaptBasesData } from '../../../utils/basesDataAdapter';
import { entriesToTasks, calculateTaskRows } from '../utils/ganttHelpers';
import { calculateTimelineRange } from '../utils/dateCalculations';
import { Task } from '../../../types/view-config';

/**
 * Hook for Gantt view data management.
 * Transforms Bases data into tasks with timeline calculations.
 *
 * @param data - Data from Bases API (BasesQueryResult)
 * @param app - Obsidian app instance
 * @param initialStartProperty - Initial start date property
 * @param initialEndProperty - Initial end date property
 * @returns Object with tasks, timeline, and property management
 */
export function useGanttData(
  data: BasesQueryResult,
  app: App,
  initialStartProperty: string,
  initialEndProperty: string
) {
  const [startDateProperty, setStartDateProperty] = useState(
    initialStartProperty || 'start'
  );
  const [endDateProperty, setEndDateProperty] = useState(
    initialEndProperty || 'end'
  );

  // Transform Bases data to our internal format
  const entries = useMemo(() => {
    console.log('useGanttData: processing data:', data);
    console.log('useGanttData: data.data length:', data?.data?.length);
    return adaptBasesData(data, app);
  }, [data, app]);

  // Convert entries to tasks with date filtering
  const rawTasks = useMemo(() => {
    return entriesToTasks(entries, startDateProperty, endDateProperty);
  }, [entries, startDateProperty, endDateProperty]);

  // Calculate optimal row positions to minimize overlaps
  const tasks = useMemo(() => {
    return calculateTaskRows(rawTasks);
  }, [rawTasks]);

  // Calculate timeline range based on tasks
  const [timelineStart, timelineEnd] = useMemo(() => {
    return calculateTimelineRange(tasks);
  }, [tasks]);

  return {
    tasks,
    timelineStart,
    timelineEnd,
    startDateProperty,
    endDateProperty,
    setStartDateProperty,
    setEndDateProperty,
  };
}
