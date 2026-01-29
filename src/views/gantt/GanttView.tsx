import * as React from 'react';
import { App, BasesQueryResult, HoverParent } from 'obsidian';
import { differenceInDays, addDays, format } from 'date-fns';
import { useGanttData } from './hooks/useGanttData';
import { Timeline } from './components/Timeline';
import { Grid } from './components/Grid';
import { TaskBar } from './components/TaskBar';
import { TaskList } from './components/TaskList';
import { GanttGroupHeader } from './components/GanttGroupHeader';
import { TextInputModal } from '../../components/shared/TextInputModal';
import { GanttViewOptions } from '../../types/view-config';
import { usePropertyUpdate } from '../../hooks/usePropertyUpdate';

interface GanttViewProps {
  data: BasesQueryResult;
  options: GanttViewOptions;
  onCollapsedGroupsChange?: (groups: string[]) => void;
  app: App;
  hoverParent: HoverParent;
}

/**
 * Main Gantt view component.
 * Displays tasks as horizontal bars on a timeline with start/end dates.
 * Supports grouping by property (projects/categories).
 */
export const GanttView: React.FC<GanttViewProps> = ({
  data,
  options,
  onCollapsedGroupsChange,
  app,
  hoverParent,
}) => {
  const {
    tasks,
    groups,
    timelineStart,
    timelineEnd,
    startDateProperty,
    endDateProperty,
    groupByProperty,
    collapsedGroups,
    toggleGroupCollapse,
  } = useGanttData(
    data,
    app,
    options.startDateProperty,
    options.endDateProperty,
    options.groupByProperty,
    options.collapsedGroups
  );

  // Wrap toggleGroupCollapse to persist changes
  const handleToggleGroupCollapse = React.useCallback((groupName: string) => {
    toggleGroupCollapse(groupName);
    // Calculate new collapsed groups and persist
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupName)) {
      newCollapsed.delete(groupName);
    } else {
      newCollapsed.add(groupName);
    }
    onCollapsedGroupsChange?.(Array.from(newCollapsed));
  }, [toggleGroupCollapse, collapsedGroups, onCollapsedGroupsChange]);

  // Property update for renaming groups
  const { updateProperty } = usePropertyUpdate(app);

  /**
   * Rename a group by updating the group property for all tasks in that group
   */
  const handleRenameGroup = React.useCallback(async (oldName: string, newName: string) => {
    if (!groupByProperty) return;

    // Find the group and update all its tasks
    const group = groups.find((g) => g.name === oldName);
    if (!group) return;

    // Update each task's group property
    for (const task of group.tasks) {
      await updateProperty(task.file, groupByProperty, newName);
    }
  }, [groups, groupByProperty, updateProperty]);

  // Ref for the chart container (used for drag-to-group detection)
  const chartRef = React.useRef<HTMLDivElement>(null);
  // Ref to track if interaction (drag/resize) just ended - prevents accidental task creation
  const interactionCooldownRef = React.useRef(false);

  /**
   * Mark that an interaction just ended (called from TaskBar after drag/resize)
   */
  const handleInteractionEnd = React.useCallback(() => {
    interactionCooldownRef.current = true;
    // Clear cooldown after a short delay
    setTimeout(() => {
      interactionCooldownRef.current = false;
    }, 100);
  }, []);

  /**
   * Handle click on chart to create a new task
   */
  const handleChartClick = React.useCallback((e: React.MouseEvent) => {
    // Ignore clicks right after drag/resize ended
    if (interactionCooldownRef.current) return;

    // Only handle direct clicks on the chart or grid, not on task bars
    const target = e.target as HTMLElement;
    if (target.closest('.bv-gantt-task-bar') || target.closest('.bv-gantt-group-header')) return;

    if (!chartRef.current) return;

    // Calculate date from click position
    const rect = chartRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const chartWidth = rect.width;
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    const dayOffset = Math.floor((clickX / chartWidth) * totalDays);
    const clickedDate = addDays(timelineStart, dayOffset);

    // Show modal to get task name
    new TextInputModal(
      app,
      'New task',
      async (name) => {
        if (!name) return;

        const timestamp = Date.now();
        const fileName = `${name} ${timestamp}.md`;
        const startStr = format(clickedDate, 'yyyy-MM-dd');
        const endStr = format(addDays(clickedDate, 1), 'yyyy-MM-dd');

        // Build frontmatter with date properties
        const frontmatter = `---\n${startDateProperty}: ${startStr}\n${endDateProperty}: ${endStr}\n---\n\n`;

        try {
          await app.vault.create(fileName, frontmatter);
        } catch (error) {
          console.error('Failed to create task:', error);
        }
      },
      'Task name'
    ).open();
  }, [app, timelineStart, timelineEnd, startDateProperty, endDateProperty]);

  // Calculate chart dimensions
  const hasGroups = groups.length > 0;
  const maxRow = hasGroups
    ? Math.max(...groups.map((g) => g.startRow + g.rowCount - 1), 0)
    : tasks.length > 0
    ? Math.max(...tasks.map((t) => t.row), 0)
    : 0;
  const chartHeight = Math.max((maxRow + 1) * 40, 200); // Min height for empty state

  return (
    <div className="bv-gantt-view">

      {/* Gantt chart container */}
      <div className="bv-gantt-container">
        {/* Left sidebar with task list */}
        <TaskList
          tasks={tasks}
          groups={groups}
          onToggleGroup={handleToggleGroupCollapse}
        />

        {/* Right side with timeline and chart */}
        <div className="bv-gantt-chart-wrapper">
          {/* Timeline header */}
          <Timeline start={timelineStart} end={timelineEnd} step={options.timelineStep} />

          {/* Chart area with grid and task bars */}
          <div
            ref={chartRef}
            className="bv-gantt-chart"
            style={{ height: `${chartHeight}px`, cursor: 'pointer' }}
            onClick={handleChartClick}
          >
            {/* Background grid */}
            <Grid start={timelineStart} end={timelineEnd} rowCount={maxRow + 1} step={options.timelineStep} />

            {/* Group headers */}
            {groups.map((group) => (
              <GanttGroupHeader
                key={group.name}
                group={group}
                onToggle={handleToggleGroupCollapse}
                onRenameGroup={handleRenameGroup}
                timelineWidth="100%"
              />
            ))}

            {/* Task bars */}
            {tasks.map((task) => (
              <TaskBar
                key={task.id}
                task={task}
                timelineStart={timelineStart}
                timelineEnd={timelineEnd}
                app={app}
                hoverParent={hoverParent}
                groups={groups}
                groupByProperty={groupByProperty}
                chartRef={chartRef}
                onInteractionEnd={handleInteractionEnd}
                timelineStep={options.timelineStep}
              />
            ))}

            {/* Empty state message when no tasks */}
            {tasks.length === 0 && groups.length === 0 && (
              <div className="bv-gantt-empty-overlay">
                <div className="bv-gantt-empty-message">
                  <p>No tasks with valid dates found</p>
                  <p className="bv-gantt-empty-hint">
                    Click on the chart to create your first task, or add{' '}
                    <code>{startDateProperty}</code> and <code>{endDateProperty}</code>{' '}
                    properties to existing notes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
