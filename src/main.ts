import { Plugin } from 'obsidian';
import './styles/main.css';
import { BoardBasesView, BoardViewType } from './views/board/BoardBasesView';
import { GanttBasesView, GanttViewType } from './views/gantt/GanttBasesView';
import { CalendarBasesView, CalendarViewType } from './views/calendar/CalendarBasesView';

/**
 * Bases Custom Views Plugin
 *
 * Adds three custom view types to Obsidian Bases:
 * - Board (Kanban view with vertical columns)
 * - Gantt (Timeline visualization)
 * - Calendar (Month/week calendar view)
 */
export default class BasesCustomViewsPlugin extends Plugin {
  async onload() {
    console.log('Loading Bases Custom Views plugin');

    // Check if registerBasesView is available (requires Obsidian 1.10.0+)
    if (typeof (this as any).registerBasesView !== 'function') {
      console.error('registerBasesView is not available - Obsidian version may be too old (need 1.10.0+)');
      return;
    }

    // Register Board view
    try {
      console.log('Registering Board view...');
      const boardRegistered = (this as any).registerBasesView(BoardViewType, {
        name: 'Board',
        icon: 'lucide-layout-dashboard',
        factory: (controller: any, containerEl: HTMLElement) => {
          console.log('Board factory called with controller:', controller);
          return new BoardBasesView(controller, containerEl);
        },
        options: BoardBasesView.getViewOptions,
      });
      console.log('✓ Board view registration result:', boardRegistered);
    } catch (e) {
      console.error('✗ Failed to register Board view:', e);
    }

    // Register Gantt view
    try {
      console.log('Registering Gantt view...');
      const ganttRegistered = (this as any).registerBasesView(GanttViewType, {
        name: 'Gantt',
        icon: 'lucide-gantt-chart',
        factory: (controller: any, containerEl: HTMLElement) => {
          console.log('Gantt factory called with controller:', controller);
          return new GanttBasesView(controller, containerEl);
        },
        options: GanttBasesView.getViewOptions,
      });
      console.log('✓ Gantt view registration result:', ganttRegistered);
    } catch (e) {
      console.error('✗ Failed to register Gantt view:', e);
    }

    // Register Calendar view
    try {
      console.log('Registering Calendar view...');
      const calendarRegistered = (this as any).registerBasesView(CalendarViewType, {
        name: 'Calendar',
        icon: 'lucide-calendar',
        factory: (controller: any, containerEl: HTMLElement) => {
          console.log('Calendar factory called with controller:', controller);
          return new CalendarBasesView(controller, containerEl);
        },
        options: CalendarBasesView.getViewOptions,
      });
      console.log('✓ Calendar view registration result:', calendarRegistered);
    } catch (e) {
      console.error('✗ Failed to register Calendar view:', e);
    }

    console.log('Bases Custom Views plugin loaded successfully');
  }

  async onunload() {
    console.log('Unloading Bases Custom Views plugin');

    // Remove injected styles
    const styleEl = document.getElementById('bases-custom-views-styles');
    if (styleEl) {
      styleEl.remove();
    }
  }
}
