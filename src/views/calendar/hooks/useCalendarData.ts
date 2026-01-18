import { useState, useMemo } from 'react';
import { App, BasesQueryResult } from 'obsidian';
import { adaptBasesData } from '../../../utils/basesDataAdapter';
import { entriesToEvents } from '../utils/calendarHelpers';
import { CalendarEvent } from '../../../types/view-config';

/**
 * Hook for Calendar view data management.
 * Transforms Bases data into calendar events.
 *
 * @param data - Data from Bases API (BasesQueryResult)
 * @param app - Obsidian app instance
 * @param initialDateProperty - Initial date property
 * @param initialViewMode - Initial view mode (month/week)
 * @returns Object with events, date property, and view mode management
 */
export function useCalendarData(
  data: BasesQueryResult,
  app: App,
  initialDateProperty: string,
  initialViewMode: 'month' | 'week'
) {
  const [dateProperty, setDateProperty] = useState(initialDateProperty || 'date');
  const [viewMode, setViewMode] = useState<'month' | 'week'>(initialViewMode || 'month');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Transform Bases data to our internal format
  const entries = useMemo(() => {
    console.log('useCalendarData: processing data:', data);
    console.log('useCalendarData: data.data length:', data?.data?.length);
    return adaptBasesData(data, app);
  }, [data, app]);

  // Convert entries to events with date filtering
  const events = useMemo(() => {
    return entriesToEvents(entries, dateProperty);
  }, [entries, dateProperty]);

  return {
    events,
    dateProperty,
    setDateProperty,
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
  };
}
