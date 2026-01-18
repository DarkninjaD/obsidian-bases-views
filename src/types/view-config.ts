import { TFile } from 'obsidian';

/**
 * Common interface for entries transformed from BasesEntry
 */
export interface BasesEntry {
  id: string;
  file: TFile;
  properties: Record<string, any>;
}

/**
 * Configuration options for Board view
 */
export interface BoardViewOptions {
  groupByProperty: string;
  subGroupByProperty?: string; // Optional sub-grouping within columns
  collapsedRows?: string[]; // Rows that should be collapsed by default
  showNewPageButtons?: boolean; // Show/hide "+ New page" buttons
}

/**
 * Configuration options for Gantt view
 */
export interface GanttViewOptions {
  startDateProperty: string;
  endDateProperty: string;
}

/**
 * Configuration options for Calendar view
 */
export interface CalendarViewOptions {
  dateProperty: string;
  viewMode: 'month' | 'week';
}

/**
 * Task representation for Gantt view
 */
export interface Task {
  id: string;
  file: TFile;
  title: string;
  startDate: Date;
  endDate: Date;
  startDateProperty: string;
  endDateProperty: string;
  row: number;
}

/**
 * Calendar event representation
 */
export interface CalendarEvent {
  id: string;
  file: TFile;
  title: string;
  date: Date;
}
