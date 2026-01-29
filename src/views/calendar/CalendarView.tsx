import * as React from 'react';
import { App, BasesQueryResult, HoverParent } from 'obsidian';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core';
import { useCalendarData } from './hooks/useCalendarData';
import { useEventDrag } from './hooks/useEventDrag';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { DayView } from './components/DayView';
import { ViewSwitcher } from './components/ViewSwitcher';
import { CalendarDragProvider } from './context/CalendarDragContext';
import { TextInputModal } from '../../components/shared/TextInputModal';
import { CalendarViewOptions } from '../../types/view-config';
import { formatMonthYear, formatWeekRange, formatFullDate, formatDateString, previousMonth, nextMonth, previousWeek, nextWeek, previousDay, nextDay } from './utils/dateUtils';
import { startOfWeek, endOfWeek } from 'date-fns';

interface CalendarViewProps {
  data: BasesQueryResult;
  options: CalendarViewOptions;
  onViewModeChange?: (value: 'month' | 'week' | 'day') => void;
  app: App;
  hoverParent: HoverParent;
}

/**
 * Main Calendar view component.
 * Displays events on a monthly or weekly calendar with drag-and-drop.
 * Date properties are configured via options (shared with Gantt view).
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  data,
  options,
  onViewModeChange,
  app,
  hoverParent,
}) => {
  const {
    events,
    dateProperty,
    endDateProperty,
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
  } = useCalendarData(data, app, options.dateProperty, options.endDateProperty, options.viewMode);

  const handleViewModeChange = React.useCallback((value: 'month' | 'week' | 'day') => {
    setViewMode(value);
    onViewModeChange?.(value);
  }, [setViewMode, onViewModeChange]);

  const { handleDragEnd } = useEventDrag(events, dateProperty, app);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  /**
   * Navigate to previous period (month, week, or day)
   */
  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(previousMonth(currentDate));
    } else if (viewMode === 'week') {
      setCurrentDate(previousWeek(currentDate));
    } else {
      setCurrentDate(previousDay(currentDate));
    }
  };

  /**
   * Navigate to next period (month, week, or day)
   */
  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(nextMonth(currentDate));
    } else if (viewMode === 'week') {
      setCurrentDate(nextWeek(currentDate));
    } else {
      setCurrentDate(nextDay(currentDate));
    }
  };

  /**
   * Navigate to today
   */
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  /**
   * Create a new event on the specified date
   */
  const handleCreateEvent = React.useCallback((date: Date) => {
    new TextInputModal(
      app,
      'New event',
      async (name) => {
        if (!name) return;

        const timestamp = Date.now();
        const fileName = `${name} ${timestamp}.md`;
        const dateStr = formatDateString(date);

        // Build frontmatter with date property
        const frontmatter = `---\n${dateProperty}: ${dateStr}\n---\n\n`;

        try {
          await app.vault.create(fileName, frontmatter);
        } catch (error) {
          console.error('Failed to create event:', error);
        }
      },
      'Event name'
    ).open();
  }, [app, dateProperty]);

  // Format title based on view mode
  const title = viewMode === 'month'
    ? formatMonthYear(currentDate)
    : viewMode === 'week'
      ? formatWeekRange(startOfWeek(currentDate, { weekStartsOn: 1 }), endOfWeek(currentDate, { weekStartsOn: 1 }))
      : formatFullDate(currentDate);

  return (
    <CalendarDragProvider>
    <div className="bv-calendar-view">
      {/* Header with controls */}
      <div className="bv-calendar-header">
        <div className="bv-calendar-controls">
          <button
            className="bv-calendar-nav-button"
            onClick={handlePrevious}
            title="Previous"
          >
            ←
          </button>

          <button
            className="bv-calendar-today-button"
            onClick={handleToday}
            title="Today"
          >
            Today
          </button>

          <h2 className="bv-calendar-title">{title}</h2>

          <button
            className="bv-calendar-nav-button"
            onClick={handleNext}
            title="Next"
          >
            →
          </button>
        </div>

        <ViewSwitcher value={viewMode} onChange={handleViewModeChange} />
      </div>

      {/* Calendar grid with drag-and-drop */}
      <DndContext
        sensors={sensors}
        onDragEnd={handleDragEnd}
        collisionDetection={pointerWithin}
      >
        {viewMode === 'month' ? (
          <MonthView
            currentDate={currentDate}
            events={events}
            app={app}
            hoverParent={hoverParent}
            dateProperty={dateProperty}
            endDateProperty={endDateProperty}
            onCreateEvent={handleCreateEvent}
          />
        ) : viewMode === 'week' ? (
          <WeekView
            currentDate={currentDate}
            events={events}
            app={app}
            hoverParent={hoverParent}
            dateProperty={dateProperty}
            endDateProperty={endDateProperty}
            onCreateEvent={handleCreateEvent}
          />
        ) : (
          <DayView
            currentDate={currentDate}
            events={events}
            app={app}
            hoverParent={hoverParent}
            dateProperty={dateProperty}
            endDateProperty={endDateProperty}
          />
        )}

        <DragOverlay>
          {/* Could render event preview here during drag */}
        </DragOverlay>
      </DndContext>
    </div>
    </CalendarDragProvider>
  );
};
