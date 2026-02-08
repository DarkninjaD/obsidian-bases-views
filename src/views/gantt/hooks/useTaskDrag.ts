import { useState, useCallback, useRef } from 'react';
import { App } from 'obsidian';
import { Task, TaskGroup, GanttTimelineStep } from '../../../types/view-config';
import { usePropertyUpdate } from '../../../hooks/usePropertyUpdate';
import { calculateDateFromDelta, getTimelineUnitCount } from '../utils/dateCalculations';

interface UseTaskDragOptions {
  task: Task;
  app: App;
  timelineStart: Date;
  timelineEnd: Date;
  groups: TaskGroup[];
  groupByProperty: string;
  chartRef: React.RefObject<HTMLDivElement>;
  onDragEnd?: () => void;
  timelineStep?: GanttTimelineStep;
  onTaskDateChange?: (task: Task, newStartDate: Date, newEndDate: Date) => Promise<void>;
}

/**
 * Find which group a Y position corresponds to.
 * Returns the group name or null if no group.
 */
function findGroupAtPosition(
  y: number,
  groups: TaskGroup[],
  rowHeight: number
): string | null {
  const row = Math.floor(y / rowHeight);

  for (const group of groups) {
    const groupEndRow = group.startRow + group.rowCount;
    if (row >= group.startRow && row < groupEndRow) {
      return group.name;
    }
  }

  return null;
}

/**
 * Hook for task bar drag (move) functionality.
 * Handles mouse events for dragging entire task to different time position.
 * Supports moving tasks between groups via vertical dragging.
 *
 * @param options - Drag options including task, app, pixelsPerDay, groups, and groupByProperty
 * @returns Object with drag handlers and state
 */
export function useTaskDrag({
  task,
  app,
  timelineStart,
  timelineEnd,
  groups,
  groupByProperty,
  chartRef,
  onDragEnd,
  timelineStep,
  onTaskDateChange,
}: UseTaskDragOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const hadMovementRef = useRef(false);
  const { updateProperty } = usePropertyUpdate(app);
  const step = timelineStep || 'day';

  const ROW_HEIGHT = 40;

  /**
   * Calculate pixels per unit based on actual chart width and step
   */
  const getPixelsPerUnit = useCallback(() => {
    const totalUnits = getTimelineUnitCount(timelineStart, timelineEnd, step);
    const chartWidth = chartRef.current?.getBoundingClientRect().width || 1000;
    return chartWidth / totalUnits;
  }, [timelineStart, timelineEnd, chartRef, step]);

  /**
   * Check if drag movement occurred and reset the flag.
   * Used to prevent click navigation after drag.
   */
  const consumeHadMovement = useCallback(() => {
    const had = hadMovementRef.current;
    hadMovementRef.current = false;
    return had;
  }, []);

  /**
   * Handle drag start (mouse down on task bar content)
   */
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag on left mouse button
      if (e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      setIsDragging(true);
      hadMovementRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY };

      const originalStartDate = task.startDate;
      const originalEndDate = task.endDate;
      const originalGroup = task.group;

      // Calculate pixels per unit at drag start using actual chart width
      const pixelsPerUnit = getPixelsPerUnit();

      /**
       * Handle mouse move during drag
       */
      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!dragStartRef.current) return;

        const deltaX = moveEvent.clientX - dragStartRef.current.x;
        const deltaY = moveEvent.clientY - dragStartRef.current.y;

        // Mark as moved if significant movement
        if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
          hadMovementRef.current = true;
        }

        // Calculate new dates based on horizontal movement
        const newStartDate = calculateDateFromDelta(originalStartDate, deltaX, pixelsPerUnit, step);
        const newEndDate = calculateDateFromDelta(originalEndDate, deltaX, pixelsPerUnit, step);

        // Update dates: use callback if provided (for cascading), else direct update
        if (onTaskDateChange) {
            void onTaskDateChange(task, newStartDate, newEndDate);
        } else {
            void updateProperty(task.file, task.startDateProperty, newStartDate.toISOString());
            void updateProperty(task.file, task.endDateProperty, newEndDate.toISOString());
        }
      };

      /**
       * Handle mouse up (end drag)
       */
      const handleMouseUp = (upEvent: MouseEvent) => {
        // Check if we need to update the group
        if (groups.length > 0 && groupByProperty && chartRef.current) {
          const chartRect = chartRef.current.getBoundingClientRect();
          const relativeY = upEvent.clientY - chartRect.top;
          const newGroup = findGroupAtPosition(relativeY, groups, ROW_HEIGHT);

          // Update group property if changed
          if (newGroup && newGroup !== originalGroup) {
            // Handle "No Group" - set empty value
            const groupValue = newGroup === 'No Group' ? '' : newGroup;
            void updateProperty(task.file, groupByProperty, groupValue);
          }
        }

        setIsDragging(false);
        dragStartRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        onDragEnd?.();
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [task, updateProperty, getPixelsPerUnit, step, groups, groupByProperty, chartRef, onDragEnd, onTaskDateChange]
  );

  return {
    isDragging,
    handleDragStart,
    consumeHadMovement,
  };
}
