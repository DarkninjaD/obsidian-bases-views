import React from 'react';
import { App, HoverParent } from 'obsidian';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { CalendarEvent } from '../../../types/view-config';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';

interface EventProps {
  event: CalendarEvent;
  app: App;
  hoverParent: HoverParent;
}

/**
 * Event component for Calendar view.
 * Displays an event as a draggable item in a calendar day.
 */
export const Event: React.FC<EventProps> = ({ event, app, hoverParent }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({ id: event.id });

  const { handleMouseEnter, handleMouseLeave } = useHoverPreview(
    app,
    hoverParent,
    event.file
  );

  const handleClick = createNoteOpener(app, event.file);

  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bv-calendar-event"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span className="bv-calendar-event-title">{event.title}</span>
    </div>
  );
};
