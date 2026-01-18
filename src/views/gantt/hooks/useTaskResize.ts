import { useState, useCallback, useRef } from 'react';
import { App } from 'obsidian';
import { Task } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';
import { calculateDateFromDelta } from '../utils/dateCalculations';

/**
 * Hook for task bar resize functionality.
 * Handles mouse events for dragging task start/end handles.
 *
 * @param task - Task to resize
 * @param app - Obsidian app instance
 * @param pixelsPerDay - Number of pixels representing one day
 * @returns Object with resize handlers and state
 */
export function useTaskResize(task: Task, app: App, pixelsPerDay: number) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeTypeRef = useRef<'start' | 'end' | null>(null);
  const { updateProperty } = usePropertyUpdate(app);

  /**
   * Handle resize start (mouse down on handle)
   */
  const handleResizeStart = useCallback(
    (e: React.MouseEvent, handle: 'start' | 'end') => {
      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      resizeTypeRef.current = handle;

      const startX = e.clientX;
      const originalDate = handle === 'start' ? task.startDate : task.endDate;

      /**
       * Handle mouse move during resize
       */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const newDate = calculateDateFromDelta(originalDate, deltaX, pixelsPerDay);

        // Update property immediately for visual feedback
        const propertyName =
          handle === 'start' ? task.startDateProperty : task.endDateProperty;

        // Only update if date changed
        if (newDate.getTime() !== originalDate.getTime()) {
          // Validate: start must be before end
          if (handle === 'start' && newDate >= task.endDate) {
            return; // Don't allow start date to be after end date
          }
          if (handle === 'end' && newDate <= task.startDate) {
            return; // Don't allow end date to be before start date
          }

          updateProperty(task.file, propertyName, newDate.toISOString());
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
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [task, updateProperty, pixelsPerDay]
  );

  return {
    isResizing,
    resizeType: resizeTypeRef.current,
    handleResizeStart,
  };
}
