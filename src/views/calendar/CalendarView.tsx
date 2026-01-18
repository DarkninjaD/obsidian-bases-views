import * as React from 'react';
import { App, BasesQueryResult, HoverParent } from 'obsidian';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin } from '@dnd-kit/core';
import { useCalendarData } from './hooks/useCalendarData';
import { useEventDrag } from './hooks/useEventDrag';
import { MonthView } from './components/MonthView';
import { WeekView } from './components/WeekView';
import { ViewSwitcher } from './components/ViewSwitcher';
import { PropertySelector } from '../../components/shared/PropertySelector';
import { CalendarViewOptions } from '../../types/view-config';
import { formatMonthYear, formatWeekRange, previousMonth, nextMonth, previousWeek, nextWeek } from './utils/dateUtils';
import { startOfWeek, endOfWeek } from 'date-fns';

interface CalendarViewProps {
  data: BasesQueryResult;
  options: CalendarViewOptions;
  onDatePropertyChange?: (value: string) => void;
  onViewModeChange?: (value: 'month' | 'week') => void;
  app: App;
  hoverParent: HoverParent;
}

/**
 * Main Calendar view component.
 * Displays events on a monthly or weekly calendar with drag-and-drop.
 */
export const CalendarView: React.FC<CalendarViewProps> = ({
  data,
  options,
  onDatePropertyChange,
  onViewModeChange,
  app,
  hoverParent,
}) => {
  const {
    events,
    dateProperty,
    setDateProperty,
    viewMode,
    setViewMode,
    currentDate,
    setCurrentDate,
  } = useCalendarData(data, app, options.dateProperty, options.viewMode);

  // Wrap callbacks to trigger both local state and parent callback
  const handleDatePropertyChange = React.useCallback((value: string) => {
    setDateProperty(value);
    onDatePropertyChange?.(value);
  }, [setDateProperty, onDatePropertyChange]);

  const handleViewModeChange = React.useCallback((value: 'month' | 'week') => {
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
   * Navigate to previous period (month or week)
   */
  const handlePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(previousMonth(currentDate));
    } else {
      setCurrentDate(previousWeek(currentDate));
    }
  };

  /**
   * Navigate to next period (month or week)
   */
  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(nextMonth(currentDate));
    } else {
      setCurrentDate(nextWeek(currentDate));
    }
  };

  /**
   * Navigate to today
   */
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Format title based on view mode
  const title = viewMode === 'month'
    ? formatMonthYear(currentDate)
    : formatWeekRange(startOfWeek(currentDate), endOfWeek(currentDate));

  return (
    <div className="bv-calendar-view">
      {/* Header with controls */}
      <div className="bv-calendar-header">
        <div className="bv-calendar-property-selector">
          <PropertySelector
            label="Date Property"
            value={dateProperty}
            onChange={handleDatePropertyChange}
            app={app}
            filter="date"
          />
        </div>

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
          />
        ) : (
          <WeekView
            currentDate={currentDate}
            events={events}
            app={app}
            hoverParent={hoverParent}
          />
        )}

        <DragOverlay>
          {/* Could render event preview here during drag */}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
