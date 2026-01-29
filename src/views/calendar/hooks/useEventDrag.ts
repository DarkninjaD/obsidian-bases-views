import { useCallback } from 'react';
import { DragEndEvent } from '@dnd-kit/core';
import { App } from 'obsidian';
import { CalendarEvent } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';
import { formatDateString } from '../utils/dateUtils';

/**
 * Hook for event drag-and-drop functionality.
 * Handles dropping events on different days to update their date.
 *
 * @param events - Array of calendar events
 * @param dateProperty - Name of the date property
 * @param app - Obsidian app instance
 * @returns Object with drag end handler
 */
export function useEventDrag(
  events: CalendarEvent[],
  dateProperty: string,
  app: App
) {
  const { updateProperty } = usePropertyUpdate(app);

  /**
   * Handle drag end - update event date when dropped on new day
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over) return;

      // Find the event that was dragged
      const eventId = active.id as string;
      const calendarEvent = events.find((e) => e.id === eventId);

      if (!calendarEvent) return;

      // Get the new date where it was dropped
      // The droppable ID is the date string (ISO format)
      const newDateString = over.id as string;

      // Only update if date actually changed
      const oldDateString = formatDateString(calendarEvent.date);
      if (oldDateString !== newDateString) {
        // Write in YYYY-MM-DD format to preserve local date
        void updateProperty(calendarEvent.file, dateProperty, newDateString);
      }
    },
    [events, dateProperty, updateProperty]
  );

  return { handleDragEnd };
}
