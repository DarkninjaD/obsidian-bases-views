import { TFile } from 'obsidian';

/**
 * Common interface for entries transformed from BasesEntry
 */
export interface BasesEntry {
  id: string;
  file: TFile;
  properties: Record<string, unknown>;
}

/**
 * Configuration options for Board view
 */
export interface BoardViewOptions {
  groupByProperty: string;
  subGroupByProperty?: string; // Optional sub-grouping within columns
  collapsedRows?: string[]; // Rows that should be collapsed by default
  showNewPageButtons?: boolean; // Show/hide "+ New page" buttons
  columnOrder?: string[]; // Persisted column order for drag-and-drop reordering
}

/**
 * Timeline step/granularity for Gantt view
 */
export type GanttTimelineStep = 'day' | 'week' | 'month';

/**
 * Configuration options for Gantt view
 */
export interface GanttViewOptions {
  startDateProperty: string;
  endDateProperty: string;
  groupByProperty?: string;
  hierarchyProperty?: string; // Property used for parent/child hierarchy
  collapsedGroups?: string[]; // Persisted collapsed group names
  timelineStep?: GanttTimelineStep; // Timeline granularity (default: 'day')
}

/**
 * Configuration options for Calendar view
 */
export interface CalendarViewOptions {
  dateProperty: string;
  endDateProperty?: string; // Optional end date for multi-day events
  viewMode: 'month' | 'week' | 'day';
}

/**
 * Task representation for Gantt view
 */
export interface Task {
  id: string;
  file?: TFile; // Optional for virtual tasks (e.g., Orphan group)
  title: string;
  startDate: Date;
  endDate: Date;
  startDateProperty: string;
  endDateProperty: string;
  row: number;
  group?: string;
  parentId?: string;
}

/**
 * Task group for Gantt view with grouping
 */
export interface TaskGroup {
  name: string;
  tasks: Task[];
  startRow: number;
  rowCount: number;
  isCollapsed: boolean;
}

/**
 * Calendar event representation
 */
export interface CalendarEvent {
  id: string;
  file: TFile;
  title: string;
  date: Date;
  endDate?: Date; // Optional end date for multi-day events
}
