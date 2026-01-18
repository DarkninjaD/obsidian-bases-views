import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BasesEntry } from '../../../types/view-config';
import { Card } from './Card';
import { StatusBadge } from './StatusBadge';
import { NewPageButton } from './NewPageButton';

interface ColumnProps {
  title: string;
  entries: BasesEntry[];
  dropId: string;
  app: App;
  hoverParent: HoverParent;
  /** Callback when user clicks "+ New page" button */
  onNewPage?: (dropId: string) => void;
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
  app,
  hoverParent,
  onNewPage,
  excludeProperties = [],
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
  });

  const handleNewPage = () => {
    onNewPage?.(dropId);
  };

  return (
    <div className="bv-column bv-column-notion">
      {/* Column header with colored badge and count */}
      <div className="bv-column-header bv-column-header-notion">
        <StatusBadge value={title} count={entries.length} size="md" />
      </div>

      {/* Column content with sortable cards */}
      <div
        ref={setNodeRef}
        className={`bv-column-content ${isOver ? 'bv-column-content-hover' : ''}`}
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
