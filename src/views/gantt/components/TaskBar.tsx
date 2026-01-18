import React, { useMemo } from 'react';
import { App, HoverParent } from 'obsidian';
import { differenceInDays } from 'date-fns';
import { Task } from '../../../types/view-config';
import { useTaskResize } from '../hooks/useTaskResize';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';
import { calculateTaskPosition } from '../utils/dateCalculations';

interface TaskBarProps {
  task: Task;
  timelineStart: Date;
  timelineEnd: Date;
  app: App;
  hoverParent: HoverParent;
}

/**
 * TaskBar component for Gantt view.
 * Displays a task as a horizontal bar with resize handles.
 */
export const TaskBar: React.FC<TaskBarProps> = ({
  task,
  timelineStart,
  timelineEnd,
  app,
  hoverParent,
}) => {
  // Calculate position on timeline
  const position = useMemo(
    () => calculateTaskPosition(task.startDate, task.endDate, timelineStart, timelineEnd),
    [task.startDate, task.endDate, timelineStart, timelineEnd]
  );

  // Calculate pixels per day for resize calculations
  const pixelsPerDay = useMemo(() => {
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    // Assume chart width is 100% of container, estimate ~1000px
    return 1000 / totalDays;
  }, [timelineStart, timelineEnd]);

  const { isResizing, handleResizeStart } = useTaskResize(task, app, pixelsPerDay);

  const { handleMouseEnter, handleMouseLeave } = useHoverPreview(
    app,
    hoverParent,
    task.file
  );

  const handleClick = createNoteOpener(app, task.file);

  return (
    <div
      className={`bv-gantt-task-bar ${isResizing ? 'bv-gantt-task-bar-resizing' : ''}`}
      style={{
        left: `${position.left}%`,
        width: `${position.width}%`,
        top: `${task.row * 40}px`,
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Left resize handle */}
      <div
        className="bv-gantt-resize-handle bv-gantt-resize-left"
        onMouseDown={(e) => handleResizeStart(e, 'start')}
        onClick={(e) => e.stopPropagation()} // Prevent opening note
      />

      {/* Task content */}
      <div className="bv-gantt-task-content">
        <span className="bv-gantt-task-title">{task.title}</span>
      </div>

      {/* Right resize handle */}
      <div
        className="bv-gantt-resize-handle bv-gantt-resize-right"
        onMouseDown={(e) => handleResizeStart(e, 'end')}
        onClick={(e) => e.stopPropagation()} // Prevent opening note
      />
    </div>
  );
};
