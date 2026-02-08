# GanttView.tsx Understanding notes

in the GanttView.tsx file, there are three main html components

## Left side is the TaskList component

1. [TaskList](src/views/gantt/components/TaskList.tsx) -> this is the left sidebar that shows the tasks.

## Right side is the Timeline component

1. [GanttGroupHeader](src/views/gantt/components/GanttGroupHeader.tsx) -> this is the group of tasks that are shown in the TaskList.
2. [TaskBar](src/views/gantt/components/TaskBar.tsx) -> this is the task that is shown in the TaskList.
3. [NoTask](src/views/gantt/components/NoTask.tsx) -> this is the component that is shown when there are no tasks.
