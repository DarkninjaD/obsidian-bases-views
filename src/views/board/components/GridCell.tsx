import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BasesEntry } from '../../../types/view-config';
import { Card } from './Card';
import { NewPageButton } from './NewPageButton';

interface GridCellProps {
  dropId: string;
  /** Column title to display in header */
  title?: string;
  entries: BasesEntry[];
  app: App;
  hoverParent: HoverParent;
  /** Callback when user clicks "+ New page" button */
  onNewPage?: (dropId: string) => void | Promise<void>;
  /** Properties to exclude from card tag display */
  excludeProperties?: string[];
}

/**
 * Grid cell component for Board view (Notion-style).
 * Represents a single cell in the grid layout with cards and new page button.
 */
export const GridCell: React.FC<GridCellProps> = ({
  dropId,
  title,
  entries,
  app,
  hoverParent,
  onNewPage,
  excludeProperties = [],
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: dropId,
  });

  const handleNewPage = () => {
    void onNewPage?.(dropId);
  };

  return (
    <div
      ref={setNodeRef}
      className={`bv-grid-cell ${isOver ? 'bv-grid-cell-drag-over' : ''}`}
    >
      <div className="bv-column-content">
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

        {/* New page button - always visible, more prominent when empty */}
        <NewPageButton
          onClick={handleNewPage}
          compact={entries.length > 0}
          label="+ New page"
        />
      </div>
    </div>
  );
};
