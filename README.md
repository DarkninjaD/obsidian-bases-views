# Obsidian Bases Custom Views Plugin

Adds three custom view types to Obsidian Bases: **Board** (Kanban), **Gantt**, and **Calendar** with full editing capabilities.

## Features

### Board View
Kanban-style board with drag-and-drop cards between columns. Group notes by any property.

### Gantt View
Timeline visualization with draggable and resizable task bars. Group tasks by any property.

### Calendar View
Month, Week, and Day views with multi-day events, drag-and-drop, and hourly scheduling.

### Common Features
- Click to open notes, hover preview
- Drag-and-drop to reschedule
- Resize events/tasks by dragging edges
- All changes persist to YAML frontmatter

## Installation

### Using BRAT (Recommended)

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin
2. Open BRAT settings → Add Beta Plugin
3. Enter: `AlexandrBukhtatyy/obsidian-bases-views`
4. Click "Add Plugin" and enable it

### Manual Installation

1. Download `main.js` and `manifest.json` from [latest release](https://github.com/AlexandrBukhtatyy/obsidian-bases-views/releases)
2. Create folder: `<vault>/.obsidian/plugins/bases-views/`
3. Copy downloaded files into that folder
4. Restart Obsidian
5. Enable plugin in Settings → Community Plugins

## Requirements

- Obsidian 1.10.0+ (for Bases API)

## Development

```bash
npm install
npm run dev    # Watch mode
npm run build  # Production build
```

## License

MIT
