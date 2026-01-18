import { BasesQueryResult, QueryController, BasesViewOption } from 'obsidian';
import * as React from 'react';
import { ReactBasesView } from '../base/ReactBasesView';
import { GanttView } from './GanttView';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

export const GanttViewType = 'bases-gantt';

/**
 * Gantt Bases View - Timeline visualization for project management.
 * Integrates with Obsidian's Bases API and renders React components.
 */
export class GanttBasesView extends ReactBasesView {
  type = GanttViewType;

  constructor(controller: QueryController, containerEl: HTMLElement) {
    console.log('GanttBasesView constructor called');
    super(controller, containerEl);
    console.log('GanttBasesView constructor completed');
  }

  /**
   * Get the React component to render
   */
  protected getReactComponent(data: BasesQueryResult): React.ReactElement {
    // Get options from config
    const startDateProperty = (this.config.get('startDateProperty') as string) || 'start';
    const endDateProperty = (this.config.get('endDateProperty') as string) || 'end';

    // Wrap in ErrorBoundary to catch React errors
    return React.createElement(
      ErrorBoundary,
      {},
      React.createElement(GanttView, {
        data,
        options: {
          startDateProperty,
          endDateProperty,
        },
        onStartDatePropertyChange: (value: string) => {
          this.config.set('startDateProperty', value);
        },
        onEndDatePropertyChange: (value: string) => {
          this.config.set('endDateProperty', value);
        },
        app: this.app,
        hoverParent: this,
      })
    );
  }

  /**
   * Static method to define view options
   */
  static getViewOptions(): BasesViewOption[] {
    return [
      {
        id: 'startDateProperty',
        name: 'Start Date',
        type: 'property-selector',
        filter: 'date',
        defaultValue: 'start',
      },
      {
        id: 'endDateProperty',
        name: 'End Date',
        type: 'property-selector',
        filter: 'date',
        defaultValue: 'end',
      },
    ];
  }
}
