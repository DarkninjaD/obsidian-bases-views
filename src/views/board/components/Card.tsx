import * as React from 'react';
import { App, HoverParent } from 'obsidian';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BasesEntry } from '../../../types/view-config';
import { useHoverPreview } from '../../../hooks/useHoverPreview';
import { createNoteOpener } from '../../../utils/noteOpener';
import { StatusBadge } from './StatusBadge';

interface CardProps {
  entry: BasesEntry;
  app: App;
  hoverParent: HoverParent;
  /** Properties to exclude from tag display (e.g., groupBy properties) */
  excludeProperties?: string[];
}

/**
 * Check if a value is a tag-like value (string, not a date).
 */
function isTagLikeValue(key: string, value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value === '') return false;

  // Skip date-like properties
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.includes('date') ||
    lowerKey.includes('time') ||
    lowerKey.includes('created') ||
    lowerKey.includes('modified')
  ) {
    return false;
  }

  // Skip if value looks like a date (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return false;
  }

  return true;
}

/**
 * Card component for Board view (Notion-style).
 * Displays file icon, title, and colored tag badges.
 */
export const Card: React.FC<CardProps> = ({
  entry,
  app,
  hoverParent,
  excludeProperties = [],
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.id });

  const { handleMouseEnter, handleMouseLeave } = useHoverPreview(
    app,
    hoverParent,
    entry.file
  );

  const handleClick = createNoteOpener(app, entry.file);

  // Extract tag-like properties for display
  const tags = React.useMemo(() => {
    return Object.entries(entry.properties)
      .filter(([key, value]) => {
        // Skip internal and excluded properties
        if (key === 'position') return false;
        if (excludeProperties.includes(key)) return false;

        return isTagLikeValue(key, value);
      })
      .slice(0, 3); // Limit to 3 tags
  }, [entry.properties, excludeProperties]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bv-card bv-card-notion"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bv-card-header">
        {/* File icon */}
        <span className="bv-card-icon">
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 2.5h7l3 3v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1z" />
            <path d="M10 2.5v3h3" />
          </svg>
        </span>
        <h4 className="bv-card-title">{entry.file.basename}</h4>
      </div>

      {/* Colored tag badges */}
      {tags.length > 0 && (
        <div className="bv-card-tags">
          {tags.map(([key, value]) => (
            <StatusBadge key={key} value={String(value)} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
};
