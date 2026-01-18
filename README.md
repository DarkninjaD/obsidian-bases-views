# Obsidian Bases Custom Views Plugin

Adds three custom view types to Obsidian Bases: **Board** (Kanban), **Gantt**, and **Calendar** with full editing capabilities.

## Features

### Planned Views

1. **Board View** 🎯
   - Kanban-style board with vertical columns
   - Group notes by any property (status, category, priority, etc.)
   - Drag-and-drop cards between columns to update properties
   - Visual card display with note information

2. **Gantt View** 📊
   - Timeline visualization for project management
   - Tasks with configurable start/end dates
   - Resize task bars to adjust dates
   - Auto-adjusting timeline range

3. **Calendar View** 📅
   - Monthly and weekly calendar views
   - Events from any date property
   - Drag events to reschedule
   - Multiple events per day support

### Interactive Features

- ✅ **Click to open**: Open notes in Obsidian
- ✅ **Hover preview**: Native Obsidian hover preview
- ✅ **Drag-and-drop**: Move cards/events, resize tasks
- ✅ **Property editing**: Updates persist to YAML frontmatter
- ✅ **Configurable**: Select which properties to use for each view

## Tech Stack

- **React 18**: Component-based UI
- **TypeScript**: Type safety
- **TailwindCSS 4**: Utility-first styling
- **@dnd-kit**: Modern drag-and-drop
- **date-fns**: Lightweight date utilities
- **esbuild**: Fast bundling

## Development Status

### ✅ Phase 1: Foundation (Completed)

- [x] Project initialization (package.json, tsconfig, manifest)
- [x] esbuild + React + TailwindCSS 4 configuration
- [x] ReactBasesView base class (bridges Obsidian ↔ React)
- [x] Type definitions for Obsidian Bases API
- [x] Plugin entry point (main.ts)
- [x] Successful build (main.js generated)

### ✅ Phase 2: Board View (Completed)

- [x] BoardBasesView integration
- [x] BoardView React component with drag-and-drop
- [x] Column and Card components
- [x] @dnd-kit integration for drag-and-drop
- [x] Property updates (YAML frontmatter)
- [x] PropertySelector component
- [x] TailwindCSS styling

### ✅ Phase 3: Gantt View (Completed)

- [x] GanttBasesView integration
- [x] GanttView React component
- [x] Timeline, TaskBar, Grid, TaskList components
- [x] Task resize with handles
- [x] Date calculations and positioning
- [x] Property updates for start/end dates
- [x] Custom implementation (no library)

### ✅ Phase 4: Calendar View (Completed)

- [x] CalendarBasesView integration
- [x] CalendarView React component
- [x] MonthView and WeekView components
- [x] DayCell and Event components
- [x] ViewSwitcher for month/week toggle
- [x] Drag-and-drop events between days
- [x] Navigation controls (prev/next/today)
- [x] Custom implementation (no library)

### 📋 Phase 5-6: Upcoming

- Phase 5: Enhancements (inline editing, performance optimization, keyboard shortcuts)
- Phase 6: Testing & Release

## Installation (Development)

1. Clone the repository:
```bash
git clone <repository-url>
cd obsidian-bases-view-plugin
```

2. Install dependencies:
```bash
npm install
```

3. Build the plugin:
```bash
npm run build
```

4. Copy to your Obsidian vault:
```bash
# Copy main.js and manifest.json to:
# <vault>/.obsidian/plugins/bases-custom-views/
```

5. Enable the plugin in Obsidian Settings → Community Plugins

## Development

### Commands

- `npm run dev` - Build in watch mode with sourcemaps
- `npm run build` - Build for production

### Project Structure

```
src/
├── main.ts                      # Plugin entry
├── types/                       # TypeScript definitions
├── views/
│   ├── base/                    # ReactBasesView base class
│   ├── board/                   # Board view (Kanban)
│   ├── gantt/                   # Gantt view (Timeline)
│   └── calendar/                # Calendar view
├── components/shared/           # Reusable components
├── utils/                       # Utilities
├── hooks/                       # React hooks
└── styles/                      # TailwindCSS styles
```

### Architecture

The plugin uses a **React Bridge** pattern:

```
Obsidian BasesView (class)
    ↓
ReactBasesView (bridge)
    ↓
React Components
```

Key files:
- `src/views/base/ReactBasesView.ts` - Core abstraction
- `src/types/obsidian-bases.d.ts` - Bases API types
- `esbuild.config.mjs` - Build configuration

## Requirements

- Obsidian 1.10.0+ (for Bases API)
- Node.js 18+ (for development)

## License

MIT

## See Also

- [Implementation Plan](PLAN.md) - Detailed technical plan
- [Obsidian Bases Documentation](https://help.obsidian.md/bases)
- [Obsidian Plugin API](https://docs.obsidian.md/)

---

**Status**: ✅ MVP Complete (Phases 1-4 Complete) - All three views implemented and functional!
