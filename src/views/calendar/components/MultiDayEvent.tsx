import * as React from 'react';
import { createPortal } from 'react-dom';
import { App, HoverParent } from 'obsidian';
import { CalendarEvent } from '../../../types/view-config';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';
import { useMultiDayEventDrag } from '../hooks/useMultiDayEventDrag';
import { useEventResize } from '../hooks/useEventResize';

interface MultiDayEventProps {
  event: CalendarEvent;
  startCol: number;
  colSpan: number;
  row: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  app: App;
  hoverParent: HoverParent;
  containerRef: React.RefObject<HTMLDivElement>;
  dateProperty: string;
  endDateProperty: string;
  onInteractionEnd?: () => void;
}

/**
 * Multi-day event component that spans across calendar columns.
 * Rendered at the top of week rows for events spanning multiple days.
 * Supports drag (move entire event) and resize (change start/end dates).
 */
export const MultiDayEvent: React.FC<MultiDayEventProps> = ({
  event,
  startCol,
  colSpan,
  row,
  continuesBefore,
  continuesAfter,
  app,
  hoverParent,
  containerRef,
  dateProperty,
  endDateProperty,
  onInteractionEnd,
}) => {
  const { isDragging, cursorPosition, handleDragStart, consumeHadMovement: consumeDragMovement } = useMultiDayEventDrag({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
    onDragEnd: onInteractionEnd,
  });

  const { isResizing, handleResizeStart, consumeHadMovement: consumeResizeMovement } = useEventResize({
    event,
    app,
    containerRef,
    dateProperty,
    endDateProperty,
    onResizeEnd: onInteractionEnd,
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

  // Track position changes for animation
  const [isUpdated, setIsUpdated] = React.useState(false);
  const prevPositionRef = React.useRef({ startCol, colSpan });

  React.useEffect(() => {
    const prev = prevPositionRef.current;
    if (prev.startCol !== startCol || prev.colSpan !== colSpan) {
      // Position changed - trigger animation
      setIsUpdated(true);
      const timer = setTimeout(() => setIsUpdated(false), 300);
      prevPositionRef.current = { startCol, colSpan };
      return () => clearTimeout(timer);
    }
  }, [startCol, colSpan]);

  const style: React.CSSProperties = {
    gridColumn: `${startCol + 1} / span ${colSpan}`,
    gridRow: row + 1,
    zIndex: isActive ? 1000 : undefined,
  };

  return (
    <>
      <div
        className={`bv-calendar-multi-day-event ${continuesBefore ? 'bv-continues-before' : ''} ${continuesAfter ? 'bv-continues-after' : ''} ${isActive ? 'bv-event-active' : ''} ${isUpdated ? 'bv-event-updated' : ''}`}
        style={style}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={event.title}
      >
      {/* Left resize handle - only show if not continuing from previous week */}
      {!continuesBefore && (
        <div
          className="bv-calendar-event-resize-handle bv-calendar-event-resize-left"
          onMouseDown={(e) => handleResizeStart(e, 'start')}
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {/* Event content - draggable area */}
      <div
        className="bv-calendar-event-content"
        onMouseDown={handleDragStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <span className="bv-calendar-multi-day-event-title">{event.title}</span>
      </div>

      {/* Right resize handle - only show if not continuing to next week */}
      {!continuesAfter && (
        <div
          className="bv-calendar-event-resize-handle bv-calendar-event-resize-right"
          onMouseDown={(e) => handleResizeStart(e, 'end')}
          onClick={(e) => e.stopPropagation()}
        />
      )}
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
          <span className="bv-calendar-multi-day-event-title">{event.title}</span>
        </div>,
        document.body
      )}
    </>
  );
};
