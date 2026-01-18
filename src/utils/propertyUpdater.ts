import { App, TFile } from 'obsidian';

/**
 * Update a property in a file's YAML frontmatter.
 * Uses Obsidian's official processFrontMatter API for safe updates.
 *
 * @param app - Obsidian app instance
 * @param file - File to update
 * @param propertyName - Name of the property to update
 * @param value - New value for the property
 */
export async function updateFileProperty(
  app: App,
  file: TFile,
  propertyName: string,
  value: any
): Promise<void> {
  try {
    console.log(`updateFileProperty: updating ${file.path} - ${propertyName} = ${value}`);

    // Use Obsidian's official API to update frontmatter
    await app.fileManager.processFrontMatter(file, (frontmatter) => {
      // Format the value appropriately
      frontmatter[propertyName] = formatValue(value);
      console.log(`updateFileProperty: frontmatter updated:`, frontmatter);
    });

    console.log(`updateFileProperty: ✓ successfully updated ${propertyName}`);
  } catch (error) {
    console.error('updateFileProperty: ✗ failed to update property:', error);
    throw error;
  }
}

/**
 * Format a value for YAML frontmatter.
 * Handles different value types appropriately.
 *
 * @param value - Value to format
 * @returns Formatted value for YAML
 */
function formatValue(value: any): any {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    // Format date as YYYY-MM-DD
    return value.toISOString().split('T')[0];
  }

  // For other types, return as-is - Obsidian's YAML serializer handles them
  return value;
}
