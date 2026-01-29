import { BasesQueryResult, BasesEntry as ObsidianBasesEntry, App } from 'obsidian';
import { BasesEntry } from '../types/view-config';

/**
 * Transform BasesQueryResult from Obsidian API to our internal format.
 * Extracts all properties from YAML frontmatter.
 *
 * @param result - Data from Bases API
 * @param app - Obsidian app instance
 * @returns Array of transformed entries
 */
export function adaptBasesData(result: BasesQueryResult | null | undefined, app: App): BasesEntry[] {
  const entries: BasesEntry[] = [];

  // Check if result exists and has data
  if (!result || !Array.isArray(result.data)) {
    return entries;
  }

  // Iterate through all entries in the result
  result.data.forEach((obsidianEntry: ObsidianBasesEntry) => {
    const properties = extractAllProperties(obsidianEntry, app);

    entries.push({
      id: obsidianEntry.file.path,
      file: obsidianEntry.file,
      properties,
    });
  });

  return entries;
}

/**
 * Extract all properties from a Bases entry.
 * Reads from file's frontmatter via metadata cache.
 *
 * @param entry - Obsidian Bases entry
 * @param app - Obsidian app instance
 * @returns Record of property name to value
 */
function extractAllProperties(entry: ObsidianBasesEntry, app: App): Record<string, unknown> {
  const properties: Record<string, unknown> = {};

  // Get frontmatter properties from metadata cache
  const cache = app.metadataCache.getFileCache(entry.file);

  // Safety check: cache might be undefined during updates
  if (!cache) {
    return properties;
  }

  if (cache.frontmatter) {
    Object.entries(cache.frontmatter).forEach(([key, value]) => {
      // Exclude internal Obsidian properties
      if (key !== 'position') {
        properties[key] = value;
      }
    });
  }

  return properties;
}

/**
 * Get a specific property value from a Bases entry.
 * Uses entry.getValue() method for evaluated results.
 *
 * @param entry - Obsidian Bases entry
 * @param propertyName - Name of the property
 * @returns Property value (can be any type)
 */
export function getPropertyValue(entry: ObsidianBasesEntry, propertyName: string): unknown {
  return entry.getValue(propertyName);
}
