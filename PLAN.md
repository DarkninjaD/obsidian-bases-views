# Obsidian Bases View Plugin - Implementation Plan

## Overview
Creating an Obsidian plugin that adds three custom Bases views: **Board** (Kanban), **Gantt**, and **Calendar** with full editing capabilities, drag-and-drop, and seamless Obsidian integration.

**Tech Stack**: React 18, TypeScript, TailwindCSS 4, esbuild

## What are Obsidian Bases?
Obsidian Bases (introduced in v1.9.0, API added in v1.10.0) is a core feature that turns note collections into databases. Data is stored in markdown files with YAML frontmatter. The Bases API allows plugins to create custom view types.

## User Requirements ✓

### Views to Implement
1. **Board View** - Kanban with vertical columns grouped by user-selected property
2. **Gantt View** - Timeline visualization with resizable task bars
3. **Calendar View** - Month/week calendar with draggable events

### Capabilities
- **Full editing**: Drag-and-drop updates properties, inline editing
- **Configurable**: User selects which properties to use (grouping, dates)
- **Interactive**: Click to open notes, hover for preview, drag to update

## Architecture

### Core Pattern: React Bridge

Challenge: Integrating React into Obsidian's class-based BasesView architecture.

**Solution**: Create `ReactBasesView` base class that bridges Obsidian ↔ React:

```
ObsidianBasesView (Class extending BasesView)
    ↓ creates React root
ReactBasesView (React integration wrapper)
    ↓ renders on data updates
React Component Tree
```

**Key Files**:
- `src/views/base/ReactBasesView.ts` - Abstract base class with React lifecycle
- `src/views/board/BoardBasesView.ts` - Obsidian integration for Board
- `src/views/board/BoardView.tsx` - React component for Board
- Similar structure for Gantt and Calendar

### Data Flow

```
Bases Engine (Obsidian)
    ↓ filtered/sorted data
onDataUpdated(BasesEntryGroup)
    ↓ transform
React props
    ↓ render
UI Components
    ↓ user interaction
Property Update
    ↓ YAML frontmatter
File Modified
    ↓ metadata cache update
Bases re-evaluates → onDataUpdated (loop)
```

## Project Structure

```
src/
├── main.ts                          # Plugin entry, registers views
├── types/
│   ├── obsidian-bases.d.ts          # Bases API types
│   └── view-config.ts               # View configuration interfaces
├── views/
│   ├── base/
│   │   └── ReactBasesView.ts        # React integration base class
│   ├── board/
│   │   ├── BoardBasesView.ts        # Obsidian integration
│   │   ├── BoardView.tsx            # Main React component
│   │   ├── components/              # Column, Card, ColumnHeader
│   │   ├── hooks/                   # useBoardData, useDragDrop
│   │   └── utils/                   # Grouping logic
│   ├── gantt/
│   │   ├── GanttBasesView.ts
│   │   ├── GanttView.tsx
│   │   ├── components/              # Timeline, TaskBar, Grid
│   │   ├── hooks/                   # useGanttData, useTaskResize
│   │   └── utils/                   # Date calculations
│   └── calendar/
│       ├── CalendarBasesView.ts
│       ├── CalendarView.tsx
│       ├── components/              # MonthView, WeekView, DayCell
│       ├── hooks/                   # useCalendarData, useEventDrag
│       └── utils/                   # Calendar helpers
├── components/shared/               # PropertySelector, EmptyState
├── utils/
│   ├── basesDataAdapter.ts          # Transform Bases data
│   ├── propertyUpdater.ts           # Update YAML frontmatter
│   ├── hoverPreview.ts              # Hover preview integration
│   └── noteOpener.ts                # Open notes utility
├── hooks/
│   ├── usePropertyUpdate.ts         # React hook for updates
│   └── useHoverPreview.ts           # React hook for hover
└── styles/
    ├── main.css                     # TailwindCSS entry
    ├── board.css
    ├── gantt.css
    └── calendar.css
```

## Build Configuration

### Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@dnd-kit/core": "^6.1.0",           // Modern drag-and-drop
    "@dnd-kit/sortable": "^8.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "date-fns": "^3.3.0"                 // Lightweight date utils
  },
  "devDependencies": {
    "obsidian": "latest",
    "typescript": "^5.6.0",
    "esbuild": "^0.20.0",
    "@tailwindcss/postcss": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "postcss": "^8.4.35",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

**Why these libraries:**
- **@dnd-kit**: Active, performant, better than archived react-beautiful-dnd
- **date-fns**: Tree-shakeable, modern (vs deprecated moment.js)
- **TailwindCSS 4**: Latest with CSS-based config
- **Custom Gantt/Calendar**: Avoid 100kb+ libraries, full control

### esbuild Setup
- Bundle React + TypeScript
- PostCSS plugin for TailwindCSS 4
- External Obsidian APIs (not bundled)
- Dev mode with watch + sourcemaps
- Production with tree-shaking

### TailwindCSS Config
- Prefix classes with `bv-` to avoid conflicts
- Map to Obsidian CSS variables for theming:
  - `var(--background-primary)`
  - `var(--text-normal)`
  - `var(--interactive-accent)`

## Critical Implementation Details

### 1. ReactBasesView Base Class

**Purpose**: Bridge between Obsidian's BasesView and React components.

**Key Methods**:
- `onDataUpdated(data)`: Called by Obsidian when data changes → render React
- `getReactComponent()`: Abstract method, returns React element to render
- `onClose()`: Cleanup React root on view close

**Pattern**:
```typescript
export abstract class ReactBasesView extends BasesView {
  private root: Root | null = null;

  async onDataUpdated(data: BasesEntryGroup): Promise<void> {
    if (!this.root) {
      this.root = createRoot(this.containerEl);
    }
    const component = this.getReactComponent(data, this.options);
    this.root.render(component);
  }

  async onClose(): Promise<void> {
    this.root?.unmount();
  }
}
```

### 2. Property Updates (Critical for Editing)

**Challenge**: Update YAML frontmatter when user drags card/resizes task/moves event.

**Solution**: `propertyUpdater.ts` utility:
- Read file content
- Parse/update YAML frontmatter
- Write back to file
- Trigger Obsidian metadata cache update

**React Hook**:
```typescript
const { updateProperty } = usePropertyUpdate(app);
// Usage: updateProperty(file, 'status', 'Done')
```

### 3. Drag-and-Drop Implementation

**Board View**:
- Use `@dnd-kit` DndContext wrapper
- Each Column is a droppable
- Each Card is draggable/sortable
- `onDragEnd`: Update property when card moved to new column

**Gantt View**:
- Custom resize handles on TaskBar
- Mouse events calculate date delta
- Update start/end date properties

**Calendar View**:
- DndContext for events
- DayCell as droppable
- Event as draggable
- `onDragEnd`: Update date property

### 4. Hover Preview Integration

**Pattern**: Implement `HoverParent` interface in ReactBasesView, pass to React components.

```typescript
const { handleMouseEnter } = useHoverPreview(app, file);
<div onMouseEnter={handleMouseEnter}>...</div>
```

Triggers Obsidian's native hover preview system.

### 5. Open Notes

```typescript
const openNote = useNoteOpener(app, file);
<div onClick={openNote}>...</div>
```

Respects modifier keys (Ctrl = new pane, Shift = new tab).

## View-Specific Details

### Board View
- **Component hierarchy**: BoardView → Column[] → Card[]
- **Grouping**: User selects property via PropertySelector dropdown
- **Data transform**: Group entries by property value into Map
- **Drag-and-drop**: @dnd-kit with SortableContext per column
- **Performance**: Virtual scrolling for 1000+ cards (Phase 5)

### Gantt View
- **Component hierarchy**: GanttView → Timeline + Grid + TaskBar[]
- **Date properties**: User selects start/end via PropertySelector
- **Timeline calculation**: Auto-adjust range to fit all tasks
- **Task positioning**: Calculate left/width % based on dates
- **Resize**: Mouse drag on handles updates date properties
- **Implementation**: Custom (not using library to save 100kb+)

### Calendar View
- **Component hierarchy**: CalendarView → MonthView/WeekView → DayCell[] → Event[]
- **Date property**: User selects via PropertySelector
- **Views**: Toggle between month/week
- **Calendar math**: date-fns for day grid calculation
- **Drag-and-drop**: @dnd-kit, drag event to new day updates date
- **Implementation**: Custom (not react-big-calendar to save 170kb)

## Performance Considerations

### Strategy
- React.memo for expensive components
- useMemo for computed values (grouping, timeline calculations)
- useCallback for stable function references
- Virtual scrolling (Phase 5) for 1000+ entries

### Testing Targets
- ✅ 10-100 entries: Smooth (baseline)
- ✅ 100-500 entries: Acceptable
- ⚠️ 500-1000 entries: May need optimization
- 🔧 1000+ entries: Virtual scrolling required

## Development Phases

### Phase 1: Foundation (Week 1)
**Goal**: Setup infrastructure, React renders in Obsidian

**Tasks**:
- Initialize project (package.json, tsconfig.json, manifest.json)
- Configure esbuild + TailwindCSS 4
- Implement ReactBasesView base class
- Create main.ts plugin entry
- Test React component renders

**Deliverable**: Plugin loads, simple React component displays

### Phase 2: Board View MVP (Week 2-3)
**Goal**: Functional Board with drag-and-drop

**Tasks**:
- Implement BoardBasesView + BoardView
- Build Column, Card components
- Integrate @dnd-kit
- Implement property updates
- Add PropertySelector
- Style with TailwindCSS

**Deliverable**: Working Board view, drag updates properties

### Phase 3: Gantt View MVP (Week 4-5)
**Goal**: Functional Gantt with timeline

**Tasks**:
- Implement GanttBasesView + GanttView
- Build Timeline, TaskBar, Grid components
- Implement date calculations
- Add task bar resize
- Implement date property updates

**Deliverable**: Working Gantt view, resize updates dates

### Phase 4: Calendar View MVP (Week 6-7)
**Goal**: Functional Calendar with month/week views

**Tasks**:
- Implement CalendarBasesView + CalendarView
- Build MonthView, WeekView, DayCell components
- Implement calendar calculations
- Add event drag-and-drop
- Add view toggle

**Deliverable**: Working Calendar view, drag updates dates

### Phase 5: Enhancements (Week 8-9)
**Goal**: Polish and advanced features

**Tasks**:
- Hover preview for all views
- Click-to-open notes
- Inline property editing
- Empty/loading states
- Error handling
- Performance optimization
- Keyboard shortcuts
- Documentation

**Deliverable**: Polished v1.0.0

### Phase 6: Release (Week 10)
**Goal**: Testing and publication

**Tasks**:
- End-to-end testing
- Cross-platform testing
- Bug fixes
- README + demo vault
- Submit to Obsidian plugin directory

**Deliverable**: Published plugin

## Critical Files for First Implementation

1. **esbuild.config.mjs** - Build must work first
2. **src/views/base/ReactBasesView.ts** - Core abstraction
3. **src/main.ts** - Plugin registration
4. **src/utils/propertyUpdater.ts** - Property updates
5. **src/views/board/BoardView.tsx** - Pattern for other views

## Trade-offs & Decisions

### Bundle Size
- React + TailwindCSS + @dnd-kit ≈ 200kb
- Alternative: Vanilla TS ≈ 50kb (like obsidian-maps)
- **Decision**: Accept larger bundle for rich features and faster development

### Custom vs Libraries
- Gantt: Custom (save 100kb+)
- Calendar: Custom (save 170kb+)
- Drag-and-drop: Library (@dnd-kit worth it)
- **Decision**: Custom for views, library for complex interactions

### Performance
- Virtual scrolling adds complexity
- **Decision**: Ship without initially, add if needed (most users < 1000 entries)

## Verification Plan

### Manual Testing
1. Create test vault with 10, 100, 1000 sample notes
2. Test each view with different property types
3. Verify property updates persist in files
4. Test drag-and-drop in all views
5. Test hover preview and click-to-open
6. Test across Windows/Mac/Linux
7. Test with different Obsidian themes

### Performance Testing
1. Generate 1000+ test notes
2. Measure render time for each view
3. Monitor memory usage
4. Identify bottlenecks

### Integration Testing
1. Test with real Obsidian vaults
2. Test with other plugins enabled
3. Verify no conflicts with Obsidian UI

## Success Criteria

✅ All three views render correctly
✅ Drag-and-drop updates properties
✅ Changes persist in YAML frontmatter
✅ Click opens notes, hover shows preview
✅ User can configure properties
✅ Performance acceptable up to 500 entries
✅ Works with Obsidian themes
✅ No console errors
✅ Plugin loads/unloads cleanly
