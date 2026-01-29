import { App, TFile } from 'obsidian';

/**
 * Create a function to open a note in Obsidian.
 * Respects modifier keys for different open behaviors:
 * - Normal click: Open in current pane
 * - Ctrl/Cmd + click: Open in new split pane
 * - Shift + click: Open in new tab
 *
 * @param app - Obsidian app instance
 * @param file - File to open
 * @returns Click handler function
 */
export function createNoteOpener(app: App, file: TFile) {
  return (event: React.MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();

    // Determine where to open based on modifier keys
    const newLeaf = event.ctrlKey || event.metaKey;
    const newTab = event.shiftKey;

    const openFile = async () => {
      try {
        if (newLeaf) {
          // Open in new split pane
          const leaf = app.workspace.getLeaf('split');
          await leaf.openFile(file);
        } else if (newTab) {
          // Open in new tab
          const leaf = app.workspace.getLeaf('tab');
          await leaf.openFile(file);
        } else {
          // Open in current pane
          const leaf = app.workspace.getLeaf(false);
          await leaf.openFile(file);
        }
      } catch (error) {
        console.error('Failed to open note:', error);
      }
    };

    void openFile();
  };
}
