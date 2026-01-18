import React from 'react';
import { format } from 'date-fns';
import { Task } from '../../../types/view-config';

interface TaskListProps {
  tasks: Task[];
}

/**
 * TaskList component displaying task names and dates.
 * Shows on the left side of the Gantt chart.
 */
export const TaskList: React.FC<TaskListProps> = ({ tasks }) => {
  return (
    <div className="bv-gantt-task-list">
      <div className="bv-gantt-task-list-header">
        <div className="bv-gantt-task-list-title">Task</div>
      </div>

      <div className="bv-gantt-task-list-content">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bv-gantt-task-list-item"
            style={{
              top: `${task.row * 40}px`,
            }}
          >
            <div className="bv-gantt-task-list-item-title">{task.title}</div>
            <div className="bv-gantt-task-list-item-dates">
              {format(task.startDate, 'MMM d')} - {format(task.endDate, 'MMM d')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
