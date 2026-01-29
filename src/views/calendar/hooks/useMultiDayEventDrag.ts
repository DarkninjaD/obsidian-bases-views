import { useState, useCallback, useRef } from 'react';
import { App } from 'obsidian';
import { addDays, eachDayOfInterval } from 'date-fns';
import { CalendarEvent } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';
import { formatDateString } from '../utils/dateUtils';
import { useCalendarDrag } from '../context/CalendarDragContext';

interface UseMultiDayEventDragOptions {
  event: CalendarEvent;
  app: App;
  containerRef: React.RefObject<HTMLElement>;
  dateProperty: string;
  endDateProperty: string;
  onDragEnd?: () => void;
}

/**
 * Hook for multi-day event drag (move) functionality.
 * Handles mouse events for dragging entire event to different dates.
 * Both start and end dates are shifted by the same amount.
 */
export function useMultiDayEventDrag({
  event,
  app,
  containerRef,
  dateProperty,
  endDateProperty,
  onDragEnd,
}: UseMultiDayEventDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewDelta, setPreviewDelta] = useState<number>(0);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startDate: Date; endDate: Date } | null>(null);
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
   * Check if drag movement occurred and reset the flag.
   */
  const consumeHadMovement = useCallback(() => {
    const had = hadMovementRef.current;
    hadMovementRef.current = false;
    return had;
  }, []);

  /**
   * Handle drag start (mouse down on event content)
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      hadMovementRef.current = false;

      const startDate = event.date;
      const endDate = event.endDate || event.date;

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startDate,
        endDate,
      };

      const dayWidth = getDayWidth();
      const rowHeight = getRowHeight();

      let currentDeltaDays = 0;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;

        const deltaX = moveEvent.clientX - dragStartRef.current.x;
        const deltaY = moveEvent.clientY - dragStartRef.current.y;

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
        setPreviewDelta(currentDeltaDays);
        // Track cursor position for cursor-following phantom
        setCursorPosition({ x: moveEvent.clientX, y: moveEvent.clientY });

        // Update highlighted dates for drop zone preview
        const newStartDate = addDays(dragStartRef.current.startDate, currentDeltaDays);
        const newEndDate = addDays(dragStartRef.current.endDate, currentDeltaDays);
        const datesInRange = eachDayOfInterval({ start: newStartDate, end: newEndDate });
        setHighlightedDates(datesInRange.map(d => formatDateString(d)));
      };

      const handleMouseUp = () => {
        // Apply changes only on mouse up
        if (dragStartRef.current && currentDeltaDays !== 0) {
          const newStartDate = addDays(dragStartRef.current.startDate, currentDeltaDays);
          const newEndDate = addDays(dragStartRef.current.endDate, currentDeltaDays);

          void updateProperty(event.file, dateProperty, formatDateString(newStartDate));
          void updateProperty(event.file, endDateProperty, formatDateString(newEndDate));
        }

        setIsDragging(false);
        setPreviewDelta(0);
        setCursorPosition(null);
        clearHighlights();
        dragStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Notify parent to trigger re-sort
        onDragEnd?.();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [event, updateProperty, getDayWidth, dateProperty, endDateProperty, onDragEnd, setHighlightedDates, clearHighlights]
  );

  return {
    isDragging,
    previewDelta,
    cursorPosition,
    handleDragStart,
    consumeHadMovement,
  };
}
