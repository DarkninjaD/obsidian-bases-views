import React, { useMemo } from 'react';
import { App } from 'obsidian';

interface PropertySelectorProps {
  value: string;
  onChange: (value: string) => void;
  app: App;
  filter?: 'date' | 'all';
  label?: string;
  placeholder?: string;
}

/**
 * Dropdown component for selecting a property from the vault.
 * Scans all files' frontmatter to find available properties.
 */
export const PropertySelector: React.FC<PropertySelectorProps> = ({
  value,
  onChange,
  app,
  filter = 'all',
  label,
  placeholder = 'Select property',
}) => {
  // Get all available properties from the vault
  const properties = useMemo(() => {
    const metadataCache = app.metadataCache;
    const allProperties = new Set<string>();

    // Iterate through all markdown files
    app.vault.getMarkdownFiles().forEach((file) => {
      const cache = metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        Object.keys(cache.frontmatter).forEach((key) => {
          // Exclude internal Obsidian properties
          if (key !== 'position') {
            allProperties.add(key);
          }
        });
      }
    });

    let propertyArray = Array.from(allProperties);

    // Filter by type if specified
    if (filter === 'date') {
      propertyArray = propertyArray.filter(
        (prop) =>
          prop.toLowerCase().includes('date') ||
          prop.toLowerCase().includes('time') ||
          prop.toLowerCase().includes('due') ||
          prop.toLowerCase().includes('start') ||
          prop.toLowerCase().includes('end')
      );
    }

    return propertyArray.sort();
  }, [app, filter]);

  return (
    <div className="bv-flex bv-flex-col bv-gap-1">
      {label && (
        <label className="bv-text-sm bv-font-medium bv-text-var-text">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bv-px-3 bv-py-2 bv-rounded bv-border bv-border-var-interactive bv-bg-var-background bv-text-var-text"
      >
        <option value="">{placeholder}</option>
        {properties.map((prop) => (
          <option key={prop} value={prop}>
            {prop}
          </option>
        ))}
      </select>
    </div>
  );
};
