import * as React from 'react';
import { createPortal } from 'react-dom';
import { App, HoverParent } from 'obsidian';
import { CalendarEvent } from '../../../types/view-config';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';
import { useMultiDayEventDrag } from '../hooks/useMultiDayEventDrag';
import { useEventResize } from '../hooks/useEventResize';

interface EventProps {
  event: CalendarEvent;
  app: App;
  hoverParent: HoverParent;
  containerRef: React.RefObject<HTMLElement>;
  dateProperty: string;
  endDateProperty: string;
}

/**
 * Event component for Calendar view.
 * Displays an event as a draggable/resizable item in a calendar day.
 * Supports drag (move entire event) and resize (change start/end dates).
 */
export const Event: React.FC<EventProps> = ({
  event,
  app,
  hoverParent,
  containerRef,
  dateProperty,
  endDateProperty,
}) => {
  const { isDragging, cursorPosition, handleDragStart, consumeHadMovement: consumeDragMovement } = useMultiDayEventDrag({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
  });

  const { isResizing, handleResizeStart, consumeHadMovement: consumeResizeMovement } = useEventResize({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
  });

  const { handleMouseEnter, handleMouseLeave } = useHoverPreview(
    app,
    hoverParent,
    event.file
  );

  const openNote = createNoteOpener(app, event.file);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    const hadDrag = consumeDragMovement();
    const hadResize = consumeResizeMovement();

    if (hadDrag || hadResize) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    openNote(e);
  }, [consumeDragMovement, consumeResizeMovement, openNote]);

  const isActive = isDragging || isResizing;

  const style: React.CSSProperties = {
    zIndex: isActive ? 999 : undefined,
    position: 'relative',
  };

  return (
    <>
      <div
        className={`bv-calendar-event ${isActive ? 'bv-event-active' : ''}`}
        style={style}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={event.title}
      >
      {/* Left resize handle */}
      <div
        className="bv-calendar-event-resize-handle bv-calendar-event-resize-left"
        onMouseDown={(e) => handleResizeStart(e, 'start')}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Event content - draggable area */}
      <div
        className="bv-calendar-event-content"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="bv-calendar-event-title">{event.title}</span>
      </div>

      {/* Right resize handle */}
      <div
        className="bv-calendar-event-resize-handle bv-calendar-event-resize-right"
        onMouseDown={(e) => handleResizeStart(e, 'end')}
        onClick={(e) => e.stopPropagation()}
      />
      </div>

      {/* Cursor-following drag phantom */}
      {isDragging && cursorPosition && createPortal(
        <div
          className="bv-calendar-drag-phantom"
          style={{
            position: 'fixed',
            left: cursorPosition.x + 12,
            top: cursorPosition.y + 12,
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          <span className="bv-calendar-event-title">{event.title}</span>
        </div>,
        document.body
      )}
    </>
  );
};
