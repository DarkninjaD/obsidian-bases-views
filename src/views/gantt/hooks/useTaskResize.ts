import { useState, useCallback, useRef } from 'react';
import { App } from 'obsidian';
import { Task, GanttTimelineStep } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';
import { calculateDateFromDelta, getTimelineUnitCount } from '../utils/dateCalculations';

interface UseTaskResizeOptions {
  task: Task;
  app: App;
  timelineStart: Date;
  timelineEnd: Date;
  chartRef: React.RefObject<HTMLDivElement>;
  onResizeEnd?: () => void;
  timelineStep?: GanttTimelineStep;
  onTaskDateChange?: (task: Task, newStartDate: Date, newEndDate: Date) => Promise<void>;
}

/**
 * Hook for task bar resize functionality.
 * Handles mouse events for dragging task start/end handles.
 *
 * @param options - Resize options
 * @returns Object with resize handlers and state
 */
export function useTaskResize({
  task,
  app,
  timelineStart,
  timelineEnd,
  chartRef,
  onResizeEnd,
  timelineStep,
  onTaskDateChange,
}: UseTaskResizeOptions) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeTypeRef = useRef<'start' | 'end' | null>(null);
  const hadMovementRef = useRef(false);
  const { updateProperty } = usePropertyUpdate(app);
  const step = timelineStep || 'day';

  /**
   * Calculate pixels per unit based on actual chart width and step
   */
  const getPixelsPerUnit = useCallback(() => {
    const totalUnits = getTimelineUnitCount(timelineStart, timelineEnd, step);
    const chartWidth = chartRef.current?.getBoundingClientRect().width || 1000;
    return chartWidth / totalUnits;
  }, [timelineStart, timelineEnd, chartRef, step]);

  /**
   * Check if resize movement occurred and reset the flag.
   * Used to prevent click navigation after resize.
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
      const originalDate = handle === 'start' ? task.startDate : task.endDate;

      // Calculate pixels per unit at resize start using actual chart width
      const pixelsPerUnit = getPixelsPerUnit();

      /**
       * Handle mouse move during resize
       */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;

        // Mark as moved if significant movement
        if (Math.abs(deltaX) > 3) {
          hadMovementRef.current = true;
        }

        const newDate = calculateDateFromDelta(originalDate, deltaX, pixelsPerUnit, step);

        // Update property immediately for visual feedback
        const propertyName =
          handle === 'start' ? task.startDateProperty : task.endDateProperty;

        // Only update if date changed
        if (newDate.getTime() !== originalDate.getTime()) {
          // Validate: start must be before or equal to end (allow 1-day events)
          if (handle === 'start' && newDate > task.endDate) {
            return; // Don't allow start date to be after end date
          }
          if (handle === 'end' && newDate < task.startDate) {
            return; // Don't allow end date to be before start date
          }

          if (onTaskDateChange) {
            // Reconstruct the full date range for the callback
            const sDate = handle === 'start' ? newDate : task.startDate;
            const eDate = handle === 'end' ? newDate : task.endDate;
            void onTaskDateChange(task, sDate, eDate);
          } else {
            void updateProperty(task.file, propertyName, newDate.toISOString());
          }
        }
      };

      /**
       * Handle mouse up (end resize)
       */
      const handleMouseUp = () => {
        setIsResizing(false);
        resizeTypeRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        onResizeEnd?.();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [task, updateProperty, getPixelsPerUnit, step, onResizeEnd]
  );

  return {
    isResizing,
    resizeType: resizeTypeRef.current,
    handleResizeStart,
    consumeHadMovement,
  };
}
