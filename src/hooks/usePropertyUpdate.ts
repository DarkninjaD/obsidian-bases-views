import { useCallback } from 'react';
import { App, TFile } from 'obsidian';
import { updateFileProperty } from '../utils/propertyUpdater';

/**
 * React hook for updating file properties.
 * Provides a stable callback for property updates.
 *
 * @param app - Obsidian app instance
 * @returns Object with updateProperty function
 */
export function usePropertyUpdate(app: App) {
  const updateProperty = useCallback(
    async (file: TFile, propertyName: string, value: unknown) => {
      try {
        await updateFileProperty(app, file, propertyName, value);
      } catch (error) {
        console.error('Failed to update property:', error);
        // TODO: Show user-friendly error notification
        // For now, just log to console
      }
    },
    [app]
  );

  return { updateProperty };
}
