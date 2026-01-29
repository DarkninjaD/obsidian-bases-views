import { useState, useCallback, useRef } from 'react';
import { App } from 'obsidian';
import { addMinutes, format } from 'date-fns';
import { CalendarEvent } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';

// Must match HOUR_HEIGHT in DayView.tsx
const HOUR_HEIGHT = 60;
const MINUTES_PER_SNAP = 15;

interface UseTimedEventDragOptions {
  event: CalendarEvent;
  app: App;
  containerRef: React.RefObject<HTMLElement>;
  dateProperty: string;
  endDateProperty: string;
}

/**
 * Hook for timed event drag and resize in day view.
 * Handles vertical movement for time-based events.
 */
export function useTimedEventDrag({
  event,
  app,
  containerRef,
  dateProperty,
  endDateProperty,
}: UseTimedEventDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragDeltaMinutes, setDragDeltaMinutes] = useState(0);
  const [resizeDelta, setResizeDelta] = useState<{ type: 'start' | 'end'; minutes: number } | null>(null);

  const hadMovementRef = useRef(false);
  const { updateProperty } = usePropertyUpdate(app);

  /**
   * Convert pixels to minutes (snapped to intervals)
   */
  const pixelsToMinutes = useCallback((pixels: number): number => {
    const rawMinutes = (pixels / HOUR_HEIGHT) * 60;
    return Math.round(rawMinutes / MINUTES_PER_SNAP) * MINUTES_PER_SNAP;
  }, []);

  /**
   * Format date with time for property update
   */
  const formatDateTime = useCallback((date: Date): string => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  }, []);

  /**
   * Consume had movement flag (for click vs drag detection)
   */
  const consumeDragMovement = useCallback(() => {
    const had = hadMovementRef.current;
    hadMovementRef.current = false;
    return had;
  }, []);

  /**
   * Handle drag start (mouse down on event body)
   */
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    hadMovementRef.current = false;

    const startY = e.clientY;
    const originalStartDate = event.date;
    const originalEndDate = event.endDate || addMinutes(event.date, 30);
    const duration = originalEndDate.getTime() - originalStartDate.getTime();

    let currentDeltaMinutes = 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      currentDeltaMinutes = pixelsToMinutes(deltaY);

      if (Math.abs(deltaY) > 5) {
        hadMovementRef.current = true;
      }

      setDragDeltaMinutes(currentDeltaMinutes);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (currentDeltaMinutes !== 0) {
        const newStartDate = addMinutes(originalStartDate, currentDeltaMinutes);
        const newEndDate = new Date(newStartDate.getTime() + duration);

        // Update both start and end times
        void updateProperty(event.file, dateProperty, formatDateTime(newStartDate));
        void updateProperty(event.file, endDateProperty, formatDateTime(newEndDate));
      }

      // Delay state reset to allow data update to propagate and prevent flicker
      setTimeout(() => {
        setIsDragging(false);
        setDragDeltaMinutes(0);
      }, 150);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [event, updateProperty, dateProperty, endDateProperty, pixelsToMinutes, formatDateTime]);

  /**
   * Handle resize start (mouse down on edge)
   */
  const handleResizeStart = useCallback((e: React.MouseEvent, edge: 'start' | 'end') => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    hadMovementRef.current = false;

    const startY = e.clientY;
    const originalStartDate = event.date;
    const originalEndDate = event.endDate || addMinutes(event.date, 30);

    let currentDeltaMinutes = 0;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      currentDeltaMinutes = pixelsToMinutes(deltaY);

      if (Math.abs(deltaY) > 5) {
        hadMovementRef.current = true;
      }

      setResizeDelta({ type: edge, minutes: currentDeltaMinutes });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);

      if (currentDeltaMinutes !== 0) {
        if (edge === 'start') {
          const newStartDate = addMinutes(originalStartDate, currentDeltaMinutes);
          // Don't allow start to go past end (minimum 15 minutes)
          if (newStartDate < originalEndDate) {
            void updateProperty(event.file, dateProperty, formatDateTime(newStartDate));
          }
        } else {
          const newEndDate = addMinutes(originalEndDate, currentDeltaMinutes);
          // Don't allow end to go before start (minimum 15 minutes)
          if (newEndDate > originalStartDate) {
            void updateProperty(event.file, endDateProperty, formatDateTime(newEndDate));
          }
        }
      }

      // Delay state reset to allow data update to propagate and prevent flicker
      setTimeout(() => {
        setIsResizing(false);
        setResizeDelta(null);
      }, 150);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [event, updateProperty, dateProperty, endDateProperty, pixelsToMinutes, formatDateTime]);

  return {
    isDragging,
    isResizing,
    dragDeltaMinutes,
    resizeDelta,
    handleDragStart,
    handleResizeStart,
    consumeDragMovement,
  };
}
