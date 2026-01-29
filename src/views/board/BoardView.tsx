import * as React from 'react';
import { App, BasesQueryResult, HoverParent } from 'obsidian';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin, CollisionDetection } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { useBoardData } from './hooks/useBoardData';
import { usePropertyUpdate } from '../../hooks/usePropertyUpdate';
import { Column } from './components/Column';
import { GridCell } from './components/GridCell';
import { RowHeader } from './components/RowHeader';
import { SortableColumnHeader } from './components/SortableColumnHeader';
import { TextInputModal } from '../../components/shared/TextInputModal';
import { BoardViewOptions } from '../../types/view-config';
import { Card } from './components/Card';

interface BoardViewProps {
  data: BasesQueryResult;
  options: BoardViewOptions;
  app: App;
  hoverParent: HoverParent;
  /** Callback to persist column order changes */
  onColumnOrderChange?: (order: string[]) => void;
}

/**
 * Main Board (Kanban) view component - Notion-style.
 * Displays notes as cards in a matrix layout with collapsible sub-groups.
 */
export const BoardView: React.FC<BoardViewProps> = ({
  data,
  options,
  app,
  hoverParent,
  onColumnOrderChange,
}) => {
  const {
    entries,
    groups,
    groupsWithSubGroups,
    groupByProperty,
    subGroupByProperty,
  } = useBoardData(data, app, options.groupByProperty, options.subGroupByProperty);

  // State for collapsed rows
  const [collapsedRows, setCollapsedRows] = React.useState<Set<string>>(new Set());

  // State for active dragged item
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // State for column order - initialize from persisted options
  const [columnOrder, setColumnOrder] = React.useState<string[]>(
    options.columnOrder || []
  );

  // Sync column order with groups (add new columns, keep order of existing)
  React.useEffect(() => {
    const groupTitles = groups.map(([title]) => title);
    setColumnOrder((prev) => {
      // Use persisted order as base, or current state
      const baseOrder = prev.length > 0 ? prev : (options.columnOrder || []);
      // Keep existing order for known columns, append new ones
      const existing = baseOrder.filter((col) => groupTitles.includes(col));
      const newCols = groupTitles.filter((col) => !baseOrder.includes(col));
      return [...existing, ...newCols];
    });
  }, [groups, options.columnOrder]);

  // Get ordered groups based on columnOrder
  const orderedGroups = React.useMemo(() => {
    const groupMap = new Map(groups);
    return columnOrder
      .filter((col) => groupMap.has(col))
      .map((col) => [col, groupMap.get(col)!] as [string, typeof groups[0][1]]);
  }, [groups, columnOrder]);

  // Find the active entry for drag overlay
  const activeEntry = React.useMemo(() => {
    if (!activeId) return null;
    return entries.find((e) => e.id === activeId) || null;
  }, [activeId, entries]);

  // Toggle row collapse state
  const toggleRowCollapse = React.useCallback((rowKey: string) => {
    setCollapsedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }
      return next;
    });
  }, []);

  const { updateProperty } = usePropertyUpdate(app);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Custom collision detection that only considers cells/columns (not cards)
  const cellOnlyCollision: CollisionDetection = React.useCallback((args) => {
    const { droppableContainers, ...rest } = args;

    // Filter to only include cell/column droppables (exclude card IDs which are file paths)
    const cellContainers = droppableContainers.filter((container) => {
      const id = String(container.id);
      // Card IDs are file paths (contain '/' or end with '.md')
      const isCardId = id.includes('/') || id.endsWith('.md');
      return !isCardId;
    });

    return pointerWithin({ ...rest, droppableContainers: cellContainers });
  }, []);

  /**
   * Handle drag start - track active dragged item
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  /**
   * Handle drag end - update property when card is dropped or reorder columns
   */
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const activeIdStr = active.id as string;
    const overIdStr = over.id as string;

    // Check if this is a column reorder (column IDs are prefixed with "column:")
    if (activeIdStr.startsWith('column:') && overIdStr.startsWith('column:')) {
      const activeColumn = activeIdStr.replace('column:', '');
      const overColumn = overIdStr.replace('column:', '');

      if (activeColumn !== overColumn) {
        setColumnOrder((prev) => {
          const oldIndex = prev.indexOf(activeColumn);
          const newIndex = prev.indexOf(overColumn);
          const newOrder = arrayMove(prev, oldIndex, newIndex);
          // Persist the new column order
          onColumnOrderChange?.(newOrder);
          return newOrder;
        });
      }
      return;
    }

    // Handle card drop
    const entry = entries.find((e) => e.id === activeIdStr);
    if (!entry) return;

    // Parse drop target ID (format: "group:subgroup" or just "group")
    const [newGroupValue, newSubGroupValue] = overIdStr.split(':');

    const currentGroupValue = entry.properties[groupByProperty];
    const currentSubGroupValue = subGroupByProperty
      ? entry.properties[subGroupByProperty]
      : undefined;

    // Update group property if changed
    if (String(currentGroupValue) !== newGroupValue) {
      void updateProperty(entry.file, groupByProperty, newGroupValue);
    }

    // Update sub-group property if changed
    if (
      subGroupByProperty &&
      newSubGroupValue &&
      String(currentSubGroupValue) !== newSubGroupValue
    ) {
      void updateProperty(entry.file, subGroupByProperty, newSubGroupValue);
    }
  };

  /**
   * Create a new note with pre-filled properties for the cell
   */
  const handleNewPage = React.useCallback(async (dropId: string) => {
    const [groupValue, subGroupValue] = dropId.split(':');

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `Untitled ${timestamp}.md`;

    // Build frontmatter
    let frontmatter = `---\n${groupByProperty}: "${groupValue}"`;
    if (subGroupByProperty && subGroupValue) {
      frontmatter += `\n${subGroupByProperty}: "${subGroupValue}"`;
    }
    frontmatter += `\n---\n\n`;

    try {
      await app.vault.create(fileName, frontmatter);
    } catch (error) {
      console.error('Failed to create new page:', error);
    }
  }, [app, groupByProperty, subGroupByProperty]);

  /**
   * Create a new group (column) by prompting for name
   */
  const handleNewGroup = React.useCallback(() => {
    const modal = new TextInputModal(
      app,
      'New group',
      async (name) => {
        if (!name) return;

        // Create a new note with this group value to make the column appear
        const timestamp = Date.now();
        const fileName = `${name} ${timestamp}.md`;
        const frontmatter = `---\n${groupByProperty}: "${name}"\n---\n\n`;

        try {
          await app.vault.create(fileName, frontmatter);
        } catch (error) {
          console.error('Failed to create new group:', error);
        }
      },
      'Enter group name'
    );
    modal.open();
  }, [app, groupByProperty]);

  /**
   * Create a new sub-group (row) by prompting for name
   */
  const handleNewSubGroup = React.useCallback(() => {
    if (!subGroupByProperty) return;

    const modal = new TextInputModal(
      app,
      'New sub-group',
      async (name) => {
        if (!name) return;

        // Create a new note with this sub-group value to make the row appear
        const timestamp = Date.now();
        const fileName = `${name} ${timestamp}.md`;
        // Include both group and sub-group properties
        const firstGroupValue = orderedGroups[0]?.[0] || 'Uncategorized';
        const frontmatter = `---\n${groupByProperty}: "${firstGroupValue}"\n${subGroupByProperty}: "${name}"\n---\n\n`;

        try {
          await app.vault.create(fileName, frontmatter);
        } catch (error) {
          console.error('Failed to create new sub-group:', error);
        }
      },
      'Enter sub-group name'
    );
    modal.open();
  }, [app, groupByProperty, subGroupByProperty, orderedGroups]);

  // Properties to exclude from card tags (grouping properties)
  const excludeProperties = [groupByProperty, subGroupByProperty].filter((p): p is string => Boolean(p));

  const hasSubGroups = !!subGroupByProperty && subGroupByProperty.trim() !== '';

  // Render as matrix if sub-grouping is enabled
  if (hasSubGroups) {
    // Get all unique sub-group values across all groups
    const allSubGroupKeys = new Set<string>();
    groupsWithSubGroups.forEach((subGroups) => {
      subGroups.forEach((_, subGroupKey) => {
        allSubGroupKeys.add(subGroupKey);
      });
    });
    const subGroupKeys = Array.from(allSubGroupKeys).sort((a, b) => {
      // Uncategorized always first
      if (a === 'Uncategorized') return -1;
      if (b === 'Uncategorized') return 1;
      return a.localeCompare(b);
    });

    return (
      <div className="bv-board-view bv-board-notion">
        {/* Section-based layout with drag-and-drop */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={cellOnlyCollision}>
          {/* Column headers - shared across all sections */}
          <div className="bv-board-header">
            <SortableContext
              items={columnOrder.map((col) => `column:${col}`)}
              strategy={horizontalListSortingStrategy}
            >
              {orderedGroups.map(([groupTitle]) => {
                // Count total entries in this column across all sub-groups
                const subGroups = groupsWithSubGroups.get(groupTitle);
                const columnTotal = subGroups
                  ? Array.from(subGroups.values()).reduce((sum, entries) => sum + entries.length, 0)
                  : 0;

                return (
                  <SortableColumnHeader
                    key={groupTitle}
                    id={`column:${groupTitle}`}
                    title={groupTitle}
                    count={columnTotal}
                  />
                );
              })}
            </SortableContext>
          </div>

          <div className="bv-board-sections">
            {/* Sections - one per sub-group */}
            {subGroupKeys.map((subGroupKey) => {
              const isCollapsed = collapsedRows.has(subGroupKey);

              // Count entries in this section
              const sectionEntryCount = orderedGroups.reduce((sum, [groupTitle]) => {
                const subGroups = groupsWithSubGroups.get(groupTitle);
                return sum + (subGroups?.get(subGroupKey)?.length || 0);
              }, 0);

              return (
                <div
                  key={subGroupKey}
                  className={`bv-board-section ${isCollapsed ? 'bv-board-section-collapsed' : ''}`}
                >
                  {/* Section header - spans full width */}
                  <RowHeader
                    title={subGroupKey}
                    count={sectionEntryCount}
                    isCollapsed={isCollapsed}
                    onToggle={() => toggleRowCollapse(subGroupKey)}
                  />

                  {/* Section content - columns side by side */}
                  {!isCollapsed && (
                    <div className="bv-board-section-content">
                      {orderedGroups.map(([groupTitle]) => {
                        const subGroups = groupsWithSubGroups.get(groupTitle);
                        const cellEntries = subGroups?.get(subGroupKey) || [];
                        const dropId = `${groupTitle}:${subGroupKey}`;

                        return (
                          <GridCell
                            key={dropId}
                            dropId={dropId}
                            title={groupTitle}
                            entries={cellEntries}
                            app={app}
                            hoverParent={hoverParent}
                            onNewPage={handleNewPage}
                            excludeProperties={excludeProperties}
                          />
                        );
                      })}
                      {/* New group button in grid */}
                      <div className="bv-section-new-group">
                        <button className="bv-new-group-btn" onClick={handleNewGroup}>
                          + New group
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* New sub-group button */}
            <div className="bv-board-new-subgroup">
              <button className="bv-new-group-btn" onClick={handleNewSubGroup}>
                + New sub-group
              </button>
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeEntry && (
              <Card
                entry={activeEntry}
                app={app}
                hoverParent={hoverParent}
                excludeProperties={excludeProperties}
              />
            )}
          </DragOverlay>
        </DndContext>
      </div>
    );
  }

  // Render as columns if no sub-grouping
  return (
    <div className="bv-board-view bv-board-notion">
      {/* Board columns with drag-and-drop */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={cellOnlyCollision}>
        <div className="bv-board-columns">
          <SortableContext
            items={columnOrder.map((col) => `column:${col}`)}
            strategy={horizontalListSortingStrategy}
          >
            {orderedGroups.map(([groupTitle]) => {
              const subGroups = groupsWithSubGroups.get(groupTitle);
              const columnEntries = Array.from(subGroups?.values() || []).flat();

              return (
                <Column
                  key={groupTitle}
                  title={groupTitle}
                  entries={columnEntries}
                  dropId={groupTitle}
                  columnId={`column:${groupTitle}`}
                  app={app}
                  hoverParent={hoverParent}
                  onNewPage={handleNewPage}
                  excludeProperties={excludeProperties}
                />
              );
            })}
          </SortableContext>

          {/* New group button */}
          <div className="bv-column-new-group">
            <button className="bv-new-group-btn" onClick={handleNewGroup}>
              + New group
            </button>
          </div>
        </div>

        <DragOverlay dropAnimation={null}>
          {activeEntry && (
            <Card
              entry={activeEntry}
              app={app}
              hoverParent={hoverParent}
              excludeProperties={excludeProperties}
            />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
