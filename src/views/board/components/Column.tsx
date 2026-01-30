import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BasesEntry } from '../../../types/view-config';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { NewPageButton } from './NewPageButton';

interface ColumnProps {
  title: string;
  entries: BasesEntry[];
  dropId: string;
  /** ID for column sorting (prefixed with "column:") */
  columnId?: string;
  app: App;
  hoverParent: HoverParent;
  /** Callback when user clicks "+ New page" button */
  onNewPage?: (dropId: string) => void | Promise<void>;
  /** Properties to exclude from card tag display */
  excludeProperties?: string[];
}

/**
 * Column component for Board view (Notion-style).
 * Represents a vertical column of cards with colored header badge.
 */
export const Column: React.FC<ColumnProps> = ({
  title,
  entries,
  dropId,
  columnId,
  app,
  hoverParent,
  onNewPage,
  excludeProperties = [],
}) => {
  // Sortable for column reordering
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: columnId || dropId });

  // Droppable for card drops
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: dropId,
  });

  const handleNewPage = () => {
    void onNewPage?.(dropId);
  };

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="bv-column bv-column-notion"
    >
      {/* Column header with colored badge and count - draggable */}
      <div
        className="bv-column-header bv-column-header-notion bv-column-draggable"
        {...attributes}
        {...listeners}
      >
        <StatusBadge value={title} count={entries.length} size="md" />
      </div>

      {/* Column content with sortable cards */}
      <div
        ref={setDroppableRef}
        className={`bv-column-content ${isOver ? 'bv-column-drag-over' : ''}`}
      >
        <SortableContext
          items={entries.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          {entries.map((entry) => (
            <Card
              key={entry.id}
              entry={entry}
              app={app}
              hoverParent={hoverParent}
              excludeProperties={excludeProperties}
            />
          ))}
        </SortableContext>

        {/* New page button */}
        <NewPageButton
          onClick={handleNewPage}
          compact={entries.length > 0}
          label="+ New page"
        />
      </div>
    </div>
  );
};
