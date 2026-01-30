import * as React from 'react';
import { TaskGroup } from '../../../types/view-config';

interface GanttGroupHeaderProps {
  group: TaskGroup;
  onToggle: (groupName: string) => void;
  onRenameGroup?: (oldName: string, newName: string) => void | Promise<void>;
  timelineWidth: string;
}

/**
 * Group header row for Gantt chart.
 * Shows group name with collapse toggle and spans the full timeline width.
 * Supports inline editing of group name via double-click.
 */
export const GanttGroupHeader: React.FC<GanttGroupHeaderProps> = ({
  group,
  onToggle,
  onRenameGroup,
  timelineWidth,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(group.name);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing) {
      onToggle(group.name);
    }
  };

  /**
   * Handle double-click to enter edit mode
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Don't allow editing "No Group"
    if (group.name === 'No Group') return;
    setEditValue(group.name);
    setIsEditing(true);
  };

  /**
   * Save the new group name
   */
  const saveGroupName = React.useCallback(() => {
    const newName = editValue.trim();
    if (newName && newName !== group.name && onRenameGroup) {
      void onRenameGroup(group.name, newName);
    } else {
      setEditValue(group.name);
    }
    setIsEditing(false);
  }, [editValue, group.name, onRenameGroup]);

  /**
   * Handle keyboard events in edit mode
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveGroupName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditValue(group.name);
      setIsEditing(false);
    }
  };

  return (
    <div
      className="bv-gantt-group-header"
      style={{
        top: `${group.startRow * 40}px`,
        width: timelineWidth,
      }}
      onClick={handleClick}
    >
      <span
        className={`bv-gantt-group-toggle ${group.isCollapsed ? 'bv-gantt-group-toggle-collapsed' : ''}`}
      >
        <svg
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 4.5 L6 7.5 L9 4.5" />
        </svg>
      </span>
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="bv-gantt-group-name-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveGroupName}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="bv-gantt-group-name"
          onDoubleClick={handleDoubleClick}
        >
          {group.name}
        </span>
      )}
      <span className="bv-gantt-group-count">{group.tasks.length}</span>
    </div>
  );
};
