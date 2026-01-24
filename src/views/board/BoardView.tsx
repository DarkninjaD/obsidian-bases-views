import * as React from 'react';
import { App, BasesQueryResult, HoverParent } from 'obsidian';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, pointerWithin, CollisionDetection } from '@dnd-kit/core';
import { useBoardData } from './hooks/useBoardData';
import { usePropertyUpdate } from '../../hooks/usePropertyUpdate';
import { Column } from './components/Column';
import { GridCell } from './components/GridCell';
import { RowHeader } from './components/RowHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { TextInputModal } from '../../components/shared/TextInputModal';
import { BoardViewOptions } from '../../types/view-config';
import { Card } from './components/Card';

interface BoardViewProps {
  data: BasesQueryResult;
  options: BoardViewOptions;
  app: App;
  hoverParent: HoverParent;
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
   * Handle drag end - update property when card is dropped
   */
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (!over) return;

    const entryId = active.id as string;
    const entry = entries.find((e) => e.id === entryId);

    if (!entry) return;

    // Parse drop target ID (format: "group:subgroup" or just "group")
    const dropId = over.id as string;
    const [newGroupValue, newSubGroupValue] = dropId.split(':');

    const currentGroupValue = entry.properties[groupByProperty];
    const currentSubGroupValue = subGroupByProperty
      ? entry.properties[subGroupByProperty]
      : undefined;

    // Update group property if changed
    if (String(currentGroupValue) !== newGroupValue) {
      updateProperty(entry.file, groupByProperty, newGroupValue);
    }

    // Update sub-group property if changed
    if (
      subGroupByProperty &&
      newSubGroupValue &&
      String(currentSubGroupValue) !== newSubGroupValue
    ) {
      updateProperty(entry.file, subGroupByProperty, newSubGroupValue);
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
      // Create file in vault root
      const file = await app.vault.create(fileName, frontmatter);

      // Open the new file for editing
      const leaf = app.workspace.getLeaf('tab');
      await leaf.openFile(file);
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
      'New Group',
      async (name) => {
        if (!name) return;

        // Create a new note with this group value to make the column appear
        const timestamp = Date.now();
        const fileName = `${name} ${timestamp}.md`;
        const frontmatter = `---\n${groupByProperty}: "${name}"\n---\n\n`;

        try {
          const file = await app.vault.create(fileName, frontmatter);
          const leaf = app.workspace.getLeaf('tab');
          await leaf.openFile(file);
        } catch (error) {
          console.error('Failed to create new group:', error);
        }
      },
      'Enter group name'
    );
    modal.open();
  }, [app, groupByProperty]);

  // Show empty state if no entries
  if (entries.length === 0) {
    return <EmptyState message="No entries found in this base" icon="📋" />;
  }

  // Properties to exclude from card tags (grouping properties)
  const excludeProperties = [groupByProperty, subGroupByProperty].filter(Boolean) as string[];

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
    const subGroupKeys = Array.from(allSubGroupKeys).sort();

    return (
      <div className="bv-board-view bv-board-notion">
        {/* Section-based layout with drag-and-drop */}
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={cellOnlyCollision}>
          {/* Column headers - shared across all sections */}
          <div className="bv-board-header">
            {groups.map(([groupTitle]) => {
              // Count total entries in this column across all sub-groups
              const subGroups = groupsWithSubGroups.get(groupTitle);
              const columnTotal = subGroups
                ? Array.from(subGroups.values()).reduce((sum, entries) => sum + entries.length, 0)
                : 0;

              return (
                <div key={groupTitle} className="bv-board-header-column">
                  <span className="bv-column-title">{groupTitle}</span>
                  <span className="bv-column-count">{columnTotal}</span>
                </div>
              );
            })}
            <div className="bv-board-header-new-group">
              <button className="bv-new-group-btn" onClick={handleNewGroup}>
                + New group
              </button>
            </div>
          </div>

          <div className="bv-board-sections">
            {/* Sections - one per sub-group */}
            {subGroupKeys.map((subGroupKey) => {
              const isCollapsed = collapsedRows.has(subGroupKey);

              // Count entries in this section
              const sectionEntryCount = groups.reduce((sum, [groupTitle]) => {
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
                      {groups.map(([groupTitle]) => {
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
                    </div>
                  )}
                </div>
              );
            })}
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
          {groups.map(([groupTitle]) => {
            const subGroups = groupsWithSubGroups.get(groupTitle);
            const columnEntries = Array.from(subGroups?.values() || []).flat();

            return (
              <Column
                key={groupTitle}
                title={groupTitle}
                entries={columnEntries}
                dropId={groupTitle}
                app={app}
                hoverParent={hoverParent}
                onNewPage={handleNewPage}
                excludeProperties={excludeProperties}
              />
            );
          })}

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
