import { useMemo } from 'react';
import { App, TFile, HoverParent } from 'obsidian';
import { createHoverPreview } from '../utils/hoverPreview';

/**
 * React hook for hover preview functionality.
 * Returns stable event handlers for mouse enter/leave.
 *
 * @param app - Obsidian app instance
 * @param parent - HoverParent interface (the view)
 * @param file - File to preview on hover
 * @returns Object with handleMouseEnter and handleMouseLeave
 */
export function useHoverPreview(app: App, parent: HoverParent, file: TFile) {
  return useMemo(() => {
    return createHoverPreview(app, parent, file);
  }, [app, parent, file]);
}
