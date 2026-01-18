import * as React from 'react';
import { App, BasesQueryResult, HoverParent } from 'obsidian';
import { useGanttData } from './hooks/useGanttData';
import { Timeline } from './components/Timeline';
import { Grid } from './components/Grid';
import { TaskBar } from './components/TaskBar';
import { TaskList } from './components/TaskList';
import { PropertySelector } from '../../components/shared/PropertySelector';
import { EmptyState } from '../../components/shared/EmptyState';
import { GanttViewOptions } from '../../types/view-config';

interface GanttViewProps {
  data: BasesQueryResult;
  options: GanttViewOptions;
  onStartDatePropertyChange?: (value: string) => void;
  onEndDatePropertyChange?: (value: string) => void;
  app: App;
  hoverParent: HoverParent;
}

/**
 * Main Gantt view component.
 * Displays tasks as horizontal bars on a timeline with start/end dates.
 */
export const GanttView: React.FC<GanttViewProps> = ({
  data,
  options,
  onStartDatePropertyChange,
  onEndDatePropertyChange,
  app,
  hoverParent,
}) => {
  const {
    tasks,
    timelineStart,
    timelineEnd,
    startDateProperty,
    endDateProperty,
    setStartDateProperty,
    setEndDateProperty,
  } = useGanttData(data, app, options.startDateProperty, options.endDateProperty);

  // Wrap callbacks to trigger both local state and parent callback
  const handleStartDatePropertyChange = React.useCallback((value: string) => {
    setStartDateProperty(value);
    onStartDatePropertyChange?.(value);
  }, [setStartDateProperty, onStartDatePropertyChange]);

  const handleEndDatePropertyChange = React.useCallback((value: string) => {
    setEndDateProperty(value);
    onEndDatePropertyChange?.(value);
  }, [setEndDateProperty, onEndDatePropertyChange]);

  // Show empty state if no tasks with valid dates
  if (tasks.length === 0) {
    return (
      <EmptyState
        message="No tasks with valid start and end dates found"
        icon="📊"
      />
    );
  }

  const maxRow = Math.max(...tasks.map((t) => t.row));
  const chartHeight = (maxRow + 1) * 40;

  return (
    <div className="bv-gantt-view">
      {/* Header with property selectors */}
      <div className="bv-gantt-header">
        <div className="bv-gantt-property-selectors">
          <PropertySelector
            label="Start Date"
            value={startDateProperty}
            onChange={handleStartDatePropertyChange}
            app={app}
            filter="date"
          />
          <PropertySelector
            label="End Date"
            value={endDateProperty}
            onChange={handleEndDatePropertyChange}
            app={app}
            filter="date"
          />
        </div>
      </div>

      {/* Gantt chart container */}
      <div className="bv-gantt-container">
        {/* Left sidebar with task list */}
        <TaskList tasks={tasks} />

        {/* Right side with timeline and chart */}
        <div className="bv-gantt-chart-wrapper">
          {/* Timeline header */}
          <Timeline start={timelineStart} end={timelineEnd} />

          {/* Chart area with grid and task bars */}
          <div className="bv-gantt-chart" style={{ height: `${chartHeight}px` }}>
            {/* Background grid */}
            <Grid start={timelineStart} end={timelineEnd} rowCount={maxRow + 1} />

            {/* Task bars */}
            {tasks.map((task) => (
              <TaskBar
                key={task.id}
                task={task}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                app={app}
                hoverParent={hoverParent}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
