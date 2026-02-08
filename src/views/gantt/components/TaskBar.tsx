import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { Task, TaskGroup, GanttTimelineStep } from '../../../types/view-config';
import { useTaskResize } from '../hooks/useTaskResize';
import { useTaskDrag } from '../hooks/useTaskDrag';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';
import { calculateTaskPosition } from '../utils/dateCalculations';

interface TaskBarProps {
  task: Task;
  timelineStart: Date;
  timelineEnd: Date;
  app: App;
  hoverParent: HoverParent;
  groups: TaskGroup[];
  groupByProperty: string;
  chartRef: React.RefObject<HTMLDivElement>;
  onInteractionEnd?: () => void;
  timelineStep?: GanttTimelineStep;
  onTaskDateChange?: (task: Task, newStartDate: Date, newEndDate: Date) => Promise<void>;
}

/**
 * TaskBar component for Gantt view.
 * Displays a task as a horizontal bar with resize handles and drag support.
 * Supports dragging between groups when grouping is enabled.
 */
export const TaskBar: React.FC<TaskBarProps> = ({
  task,
  timelineStart,
  timelineEnd,
  app,
  hoverParent,
  groups,
  groupByProperty,
  chartRef,
  onInteractionEnd,
  timelineStep,
  onTaskDateChange,
}) => {
  // Inline editing state
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(task.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Calculate position on timeline
  const position = React.useMemo(
    () => calculateTaskPosition(task.startDate, task.endDate, timelineStart, timelineEnd),
    [task.startDate, task.endDate, timelineStart, timelineEnd]
  );

  const { isResizing, handleResizeStart, consumeHadMovement: consumeResizeMovement } = useTaskResize({
    task,
    app,
    timelineStart,
    timelineEnd,
    chartRef,
    onResizeEnd: onInteractionEnd,
    timelineStep,
    onTaskDateChange,
  });
  const { isDragging, handleDragStart, consumeHadMovement: consumeDragMovement } = useTaskDrag({
    task,
    app,
    timelineStart,
    timelineEnd,
    groups,
    groupByProperty,
    chartRef,
    onDragEnd: onInteractionEnd,
    timelineStep,
    onTaskDateChange,
  });

  const { handleMouseEnter, handleMouseLeave } = useHoverPreview(
    app,
    hoverParent,
    task.file || null
  );

  const openNote = task.file ? createNoteOpener(app, task.file) : () => {};

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  /**
   * Save the new task name by renaming the file
   */
  const saveTaskName = React.useCallback(async () => {
    if (!task.file) return; // Cannot rename virtual tasks

    const newName = editValue.trim();
    if (newName && newName !== task.title) {
      try {
        const newPath = task.file.parent
          ? `${task.file.parent.path}/${newName}.md`
          : `${newName}.md`;
        await app.fileManager.renameFile(task.file, newPath);
      } catch (error) {
        console.error('Failed to rename task:', error);
        setEditValue(task.title); // Reset on error
      }
    } else {
      setEditValue(task.title); // Reset if empty or unchanged
    }
    setIsEditing(false);
  }, [app, task.file, task.title, editValue]);

  /**
   * Handle double-click to enter edit mode
   */
  const handleDoubleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!task.file) return; // Prevent editing virtual tasks
    setEditValue(task.title);
    setIsEditing(true);
  }, [task.title, task.file]);

  /**
   * Handle click - only open note if no drag/resize occurred
   */
  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (isEditing) return;
    if (!task.file) return;

    // Check if there was any movement during drag or resize
    const hadDrag = consumeDragMovement();
    const hadResize = consumeResizeMovement();

    if (hadDrag || hadResize) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    openNote(e);
  }, [isEditing, consumeDragMovement, consumeResizeMovement, openNote, task.file]);

  /**
   * Handle keyboard events in edit mode
   */
  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void saveTaskName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(task.title);
      setIsEditing(false);
    }
  }, [saveTaskName, task.title]);

  // Determine if task is being manipulated
  const isActive = isResizing || isDragging;

  return (
    <div
      className={`bv-gantt-task-bar ${isActive ? 'bv-gantt-task-bar-active' : ''} ${isDragging ? 'bv-gantt-task-bar-dragging' : ''}`}
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
        onClick={(e) => e.stopPropagation()}
      />

      {/* Task content - draggable area */}
      <div
        className="bv-gantt-task-content"
        onMouseDown={isEditing ? undefined : handleDragStart}
        onDoubleClick={handleDoubleClick}
        style={{ cursor: isEditing ? 'text' : isDragging ? 'grabbing' : 'grab' }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className="bv-gantt-task-title-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => void saveTaskName()}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="bv-gantt-task-title">{task.title}</span>
        )}
      </div>

      {/* Right resize handle */}
      <div
        className="bv-gantt-resize-handle bv-gantt-resize-right"
        onMouseDown={(e) => handleResizeStart(e, 'end')}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
