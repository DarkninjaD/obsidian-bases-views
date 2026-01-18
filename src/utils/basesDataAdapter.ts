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

  console.log('adaptBasesData: called with result:', result);
  console.log('adaptBasesData: result.data:', result?.data);
  console.log('adaptBasesData: result.data is array?', Array.isArray(result?.data));

  // Check if result exists and has data
  if (!result || !Array.isArray(result.data)) {
    console.warn('adaptBasesData: result is null or invalid');
    return entries;
  }

  console.log('adaptBasesData: processing', result.data.length, 'entries');

  // Iterate through all entries in the result
  result.data.forEach((obsidianEntry: ObsidianBasesEntry, index: number) => {
    console.log(`adaptBasesData: entry ${index}:`, obsidianEntry);
    console.log(`adaptBasesData: entry ${index} file:`, obsidianEntry.file);
    console.log(`adaptBasesData: entry ${index} file.path:`, obsidianEntry.file?.path);

    const properties = extractAllProperties(obsidianEntry, app);
    console.log(`adaptBasesData: entry ${index} properties:`, properties);

    entries.push({
      id: obsidianEntry.file.path,
      file: obsidianEntry.file,
      properties,
    });
  });

  console.log('adaptBasesData: returning', entries.length, 'entries');
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
function extractAllProperties(entry: ObsidianBasesEntry, app: App): Record<string, any> {
  const properties: Record<string, any> = {};

  console.log('extractAllProperties: processing entry for file:', entry.file.path);

  // Get frontmatter properties from metadata cache
  const cache = app.metadataCache.getFileCache(entry.file);
  console.log('extractAllProperties: cache:', cache);
  console.log('extractAllProperties: frontmatter:', cache?.frontmatter);

  // Safety check: cache might be undefined during updates
  if (!cache) {
    console.warn('extractAllProperties: cache is undefined for file:', entry.file.path);
    return properties;
  }

  if (cache.frontmatter) {
    Object.entries(cache.frontmatter).forEach(([key, value]) => {
      // Exclude internal Obsidian properties
      if (key !== 'position') {
        properties[key] = value;
        console.log(`extractAllProperties: added property ${key}:`, value);
      }
    });
  } else {
    console.warn('extractAllProperties: no frontmatter found for file:', entry.file.path);
  }

  console.log('extractAllProperties: final properties:', properties);
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
export function getPropertyValue(entry: ObsidianBasesEntry, propertyName: string): any {
  return entry.getValue(propertyName);
}
