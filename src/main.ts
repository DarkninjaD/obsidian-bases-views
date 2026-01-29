import { Plugin } from "obsidian";
import "./styles/main.css";
import { BoardBasesView, BoardViewType } from "./views/board/BoardBasesView";
import { GanttBasesView, GanttViewType } from "./views/gantt/GanttBasesView";
import {
  CalendarBasesView,
  CalendarViewType,
} from "./views/calendar/CalendarBasesView";

/**
 * Bases Views Plugin
 *
 * Adds three custom view types to Obsidian Bases:
 * - Board (Kanban view with vertical columns)
 * - Gantt (Timeline visualization)
 * - Calendar (Month/week calendar view)
 */
export default class BasesCustomViewsPlugin extends Plugin {
  onload(): void {
    // Check if registerBasesView is available (requires Obsidian 1.10.0+)
    if (typeof (this as unknown as { registerBasesView?: unknown }).registerBasesView !== "function") {
      console.error(
        "registerBasesView is not available - Obsidian version may be too old (need 1.10.0+)",
      );
      return;
    }

    const plugin = this as unknown as {
      registerBasesView: (viewType: string, config: {
        name: string;
        icon: string;
        factory: (controller: unknown, containerEl: HTMLElement) => unknown;
        options: unknown;
      }) => boolean;
    };

    // Register Board view
    try {
      plugin.registerBasesView(BoardViewType, {
        name: "Board",
        icon: "lucide-layout-dashboard",
        factory: (controller: unknown, containerEl: HTMLElement) => {
          return new BoardBasesView(controller, containerEl);
        },
        options: BoardBasesView.getViewOptions,
      });
    } catch (e) {
      console.error("Failed to register Board view:", e);
    }

    // Register Gantt view
    try {
      plugin.registerBasesView(GanttViewType, {
        name: "Gantt",
        icon: "lucide-gantt-chart",
        factory: (controller: unknown, containerEl: HTMLElement) => {
          return new GanttBasesView(controller, containerEl);
        },
        options: GanttBasesView.getViewOptions,
      });
    } catch (e) {
      console.error("Failed to register Gantt view:", e);
    }

    // Register Calendar view
    try {
      plugin.registerBasesView(CalendarViewType, {
        name: "Calendar",
        icon: "lucide-calendar",
        factory: (controller: unknown, containerEl: HTMLElement) => {
          return new CalendarBasesView(controller, containerEl);
        },
        options: CalendarBasesView.getViewOptions,
      });
    } catch (e) {
      console.error("Failed to register Calendar view:", e);
    }
  }

  onunload(): void {
    // Remove injected styles
    const styleEl = document.getElementById("bases-views-styles");
    if (styleEl) {
      styleEl.remove();
    }
  }
}
