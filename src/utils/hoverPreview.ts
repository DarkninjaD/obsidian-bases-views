import { App, TFile, HoverParent } from 'obsidian';

/**
 * Create hover preview handlers for a note.
 * Integrates with Obsidian's native hover preview system.
 *
 * @param app - Obsidian app instance
 * @param parent - HoverParent interface (usually the view itself)
 * @param file - File to preview on hover
 * @returns Object with mouse event handlers
 */
export function createHoverPreview(app: App, parent: HoverParent, file: TFile) {
  return {
    /**
     * Handle mouse enter to trigger hover preview
     */
    handleMouseEnter: (event: React.MouseEvent<HTMLElement>) => {
      const targetEl = event.currentTarget;

      // Trigger Obsidian's hover-link event
      app.workspace.trigger('hover-link', {
        event: event.nativeEvent,
        source: 'bases-view',
        hoverParent: parent,
        targetEl,
        linktext: file.path,
        sourcePath: file.path,
      });
    },

    /**
     * Handle mouse leave (cleanup handled automatically by Obsidian)
     */
    handleMouseLeave: () => {
      // Obsidian handles hover cleanup automatically
    },
  };
}
