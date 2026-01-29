import { BasesQueryResult, QueryController } from 'obsidian';
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
    super(controller, containerEl);
  }

  /**
   * Extract property name from BasesPropertyId (format: "type.propertyName")
   */
  private extractPropertyName(propertyId: unknown): string {
    if (!propertyId || typeof propertyId !== 'string') return '';
    const parts = propertyId.split('.');
    return parts.length > 1 ? parts.slice(1).join('.') : propertyId;
  }

  /**
   * Get the React component to render
   */
  protected getReactComponent(data: BasesQueryResult): React.ReactElement {
    // Get options from config - property type returns BasesPropertyId like "date.start"
    const dateProperty = this.extractPropertyName(this.config.get('startDateProperty')) || 'start';
    const endDateProperty = this.extractPropertyName(this.config.get('endDateProperty')) || 'end';
    const viewMode = (this.config.get('viewMode') as 'month' | 'week' | 'day') || 'month';

    // Wrap in ErrorBoundary to catch React errors
    return React.createElement(
      ErrorBoundary,
      {},
      React.createElement(CalendarView, {
        data,
        options: {
          dateProperty,
          endDateProperty,
          viewMode,
        },
        onViewModeChange: (value: 'month' | 'week' | 'day') => {
          this.config.set('viewMode', value);
        },
        app: this.app,
        hoverParent: this,
      })
    );
  }

  /**
   * Static method to define view options
   * Uses same property IDs as Gantt view for consistency
   */
  static getViewOptions(this: void) {
    return [
      {
        key: 'startDateProperty',
        displayName: 'Start Date',
        type: 'property',
        default: 'start',
        placeholder: 'Select date property',
      },
      {
        key: 'endDateProperty',
        displayName: 'End Date',
        type: 'property',
        default: 'end',
        placeholder: 'Select date property (optional)',
      },
      {
        key: 'viewMode',
        displayName: 'View Mode',
        type: 'dropdown',
        default: 'month',
        options: {
          month: 'Month',
          week: 'Week',
          day: 'Day',
        },
      },
    ];
  }
}
