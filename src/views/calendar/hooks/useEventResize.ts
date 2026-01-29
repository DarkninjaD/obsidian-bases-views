import { useState, useCallback, useRef } from 'react';
import { App } from 'obsidian';
import { addDays, eachDayOfInterval } from 'date-fns';
import { CalendarEvent } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';
import { formatDateString } from '../utils/dateUtils';
import { useCalendarDrag } from '../context/CalendarDragContext';

interface UseEventResizeOptions {
  event: CalendarEvent;
  app: App;
  containerRef: React.RefObject<HTMLElement>;
  dateProperty: string;
  endDateProperty: string;
  onResizeEnd?: () => void;
}

/**
 * Hook for event resize functionality.
 * Handles mouse events for dragging event start/end handles.
 * Works for both single-day and multi-day events.
 */
export function useEventResize({
  event,
  app,
  containerRef,
  dateProperty,
  endDateProperty,
  onResizeEnd,
}: UseEventResizeOptions) {
  const [isResizing, setIsResizing] = useState(false);
  const [previewDelta, setPreviewDelta] = useState<{ type: 'start' | 'end'; days: number } | null>(null);
  const resizeTypeRef = useRef<'start' | 'end' | null>(null);
  const hadMovementRef = useRef(false);
  const { updateProperty } = usePropertyUpdate(app);
  const { setHighlightedDates, clearHighlights } = useCalendarDrag();

  /**
   * Get the width of one day column in pixels
   */
  const getDayWidth = useCallback(() => {
    if (!containerRef.current) return 100;
    return containerRef.current.getBoundingClientRect().width / 7;
  }, [containerRef]);

  /**
   * Get the height of one week row in pixels
   */
  const getRowHeight = useCallback(() => {
    if (!containerRef.current) return 100;
    return containerRef.current.getBoundingClientRect().height;
  }, [containerRef]);

  /**
   * Check if resize movement occurred and reset the flag.
   */
  const consumeHadMovement = useCallback(() => {
    const had = hadMovementRef.current;
    hadMovementRef.current = false;
    return had;
  }, []);

  /**
   * Handle resize start (mouse down on handle)
   */
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: 'start' | 'end') => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      hadMovementRef.current = false;
      resizeTypeRef.current = handle;

      const startX = e.clientX;
      const startY = e.clientY;
      const originalStartDate = event.date;
      const originalEndDate = event.endDate || event.date;
      const dayWidth = getDayWidth();
      const rowHeight = getRowHeight();

      let currentDeltaDays = 0;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        // Calculate column delta (horizontal movement within week)
        const colDelta = Math.round(deltaX / dayWidth);
        // Calculate row delta (vertical movement between weeks)
        const rowDelta = Math.round(deltaY / rowHeight);
        // Total day delta = column movement + (row movement * 7 days per week)
        currentDeltaDays = colDelta + (rowDelta * 7);

        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          hadMovementRef.current = true;
        }

        // Update preview delta for phantom display (no file update during drag)
        setPreviewDelta({ type: handle, days: currentDeltaDays });

        // Update highlighted dates for resize preview
        let newStartDate: Date;
        let newEndDate: Date;
        if (handle === 'start') {
          newStartDate = addDays(originalStartDate, currentDeltaDays);
          newEndDate = originalEndDate;
          // Don't allow start to go past end
          if (newStartDate > newEndDate) {
            newStartDate = newEndDate;
          }
        } else {
          newStartDate = originalStartDate;
          newEndDate = addDays(originalEndDate, currentDeltaDays);
          // Don't allow end to go before start
          if (newEndDate < newStartDate) {
            newEndDate = newStartDate;
          }
        }
        const datesInRange = eachDayOfInterval({ start: newStartDate, end: newEndDate });
        setHighlightedDates(datesInRange.map(d => formatDateString(d)));
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        // Clear highlights immediately
        clearHighlights();

        // Apply changes only on mouse up
        if (currentDeltaDays !== 0) {
          if (handle === 'start') {
            const newStartDate = addDays(originalStartDate, currentDeltaDays);
            // Don't allow start to go past end
            if (newStartDate <= originalEndDate) {
              void updateProperty(event.file, dateProperty, formatDateString(newStartDate));
            }
          } else {
            const newEndDate = addDays(originalEndDate, currentDeltaDays);
            // Don't allow end to go before start
            if (newEndDate >= originalStartDate) {
              void updateProperty(event.file, endDateProperty, formatDateString(newEndDate));
            }
          }
        }

        // Delay state reset to allow data update to propagate and prevent flicker
        setTimeout(() => {
          setIsResizing(false);
          setPreviewDelta(null);
          resizeTypeRef.current = null;
          // Notify parent to trigger re-sort
          onResizeEnd?.();
        }, 150);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [event, updateProperty, getDayWidth, getRowHeight, dateProperty, endDateProperty, onResizeEnd, setHighlightedDates, clearHighlights]
  );

  return {
    isResizing,
    resizeType: resizeTypeRef.current,
    previewDelta,
    handleResizeStart,
    consumeHadMovement,
  };
}
