import { BasesQueryResult, QueryController, BasesViewOption } from 'obsidian';
import * as React from 'react';
import { ReactBasesView } from '../base/ReactBasesView';
import { CalendarView } from './CalendarView';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

export const CalendarViewType = 'bases-calendar';

/**
 * Calendar Bases View - Month/week calendar with draggable events.
 * Integrates with Obsidian's Bases API and renders React components.
 */
export class CalendarBasesView extends ReactBasesView {
  type = CalendarViewType;

  constructor(controller: QueryController, containerEl: HTMLElement) {
    console.log('CalendarBasesView constructor called');
    super(controller, containerEl);
    console.log('CalendarBasesView constructor completed');
  }

  /**
   * Get the React component to render
   */
  protected getReactComponent(data: BasesQueryResult): React.ReactElement {
    // Get options from config
    const dateProperty = (this.config.get('dateProperty') as string) || 'date';
    const viewMode = (this.config.get('viewMode') as 'month' | 'week') || 'month';

    // Wrap in ErrorBoundary to catch React errors
    return React.createElement(
      ErrorBoundary,
      {},
      React.createElement(CalendarView, {
        data,
        options: {
          dateProperty,
          viewMode,
        },
        onDatePropertyChange: (value: string) => {
          this.config.set('dateProperty', value);
        },
        onViewModeChange: (value: 'month' | 'week') => {
          this.config.set('viewMode', value);
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
        id: 'dateProperty',
        name: 'Date Property',
        type: 'property-selector',
        filter: 'date',
        defaultValue: 'date',
      },
      {
        id: 'viewMode',
        name: 'View Mode',
        type: 'dropdown',
        defaultValue: 'month',
      },
    ];
  }
}
