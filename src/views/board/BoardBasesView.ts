import { BasesQueryResult, QueryController, BasesViewOption } from 'obsidian';
import * as React from 'react';
import { ReactBasesView } from '../base/ReactBasesView';
import { BoardView } from './BoardView';
import { ErrorBoundary } from '../../components/shared/ErrorBoundary';

export const BoardViewType = 'bases-board';

/**
 * Board Bases View - Kanban-style board with vertical columns.
 * Integrates with Obsidian's Bases API and renders React components.
 */
export class BoardBasesView extends ReactBasesView {
  type = BoardViewType;

  constructor(controller: QueryController, containerEl: HTMLElement) {
    console.log('BoardBasesView constructor called');
    super(controller, containerEl);
    console.log('BoardBasesView constructor completed');
  }

  /**
   * Get the React component to render
   */
  protected getReactComponent(data: BasesQueryResult): React.ReactElement {
    // Get options from config
    console.log('BoardBasesView: reading config:', this.config);
    const groupByProperty = (this.config.get('groupByProperty') as string) || 'status';
    const subGroupByProperty = (this.config.get('subGroupByProperty') as string) || '';
    console.log('BoardBasesView: groupByProperty =', groupByProperty);
    console.log('BoardBasesView: subGroupByProperty =', subGroupByProperty);

    // Wrap in ErrorBoundary to catch React errors
    return React.createElement(
      ErrorBoundary,
      {},
      React.createElement(BoardView, {
        data,
        options: {
          groupByProperty,
          subGroupByProperty,
        },
        onGroupByChange: (value: string) => {
          console.log('BoardBasesView: onGroupByChange called with', value);
          this.config.set('groupByProperty', value);
          console.log('BoardBasesView: config after set:', this.config.get('groupByProperty'));
        },
        onSubGroupByChange: (value: string) => {
          console.log('BoardBasesView: onSubGroupByChange called with', value);
          this.config.set('subGroupByProperty', value);
          console.log('BoardBasesView: config after set:', this.config.get('subGroupByProperty'));
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
        id: 'groupByProperty',
        name: 'Group By',
        type: 'property-selector',
        defaultValue: 'status',
      },
      {
        id: 'subGroupByProperty',
        name: 'Sub-Group By',
        type: 'property-selector',
        defaultValue: '',
      },
    ];
  }
}
