/**
 * Color utilities for Board view.
 * Generates consistent colors for status badges based on value hash.
 */

export interface BadgeColors {
  background: string;
  text: string;
  border: string;
}

/**
 * Simple string hash function (djb2 algorithm).
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * Generate consistent HSL colors from a string value.
 * Same value always produces same color.
 */
export function generateColorFromValue(value: string): BadgeColors {
  const hash = hashString(value);

  // Map to hue (0-360), keep saturation and lightness in pleasant range
  const hue = hash % 360;
  const saturation = 55 + (hash >> 8) % 25; // 55-80%
  const lightness = 88 + (hash >> 16) % 7; // 88-95% for background

  return {
    background: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    text: `hsl(${hue}, ${saturation}%, 30%)`,
    border: `hsl(${hue}, ${saturation}%, ${lightness - 15}%)`,
  };
}

/**
 * Predefined colors for common status values.
 * These match typical Notion-style colors.
 */
const PREDEFINED_COLORS: Record<string, BadgeColors> = {
  'No Status': {
    background: 'var(--background-modifier-hover)',
    text: 'var(--text-muted)',
    border: 'var(--background-modifier-border)',
  },
  'Uncategorized': {
    background: 'var(--background-modifier-hover)',
    text: 'var(--text-muted)',
    border: 'var(--background-modifier-border)',
  },
  'No Category': {
    background: 'var(--background-modifier-hover)',
    text: 'var(--text-muted)',
    border: 'var(--background-modifier-border)',
  },
};

/**
 * Get color for a value, checking predefined colors first.
 */
export function getColorForValue(value: string): BadgeColors {
  // Check for predefined colors
  if (PREDEFINED_COLORS[value]) {
    return PREDEFINED_COLORS[value];
  }

  // Generate color from value hash
  return generateColorFromValue(value);
}

/**
 * Get contrasting text color based on background lightness.
 */
export function getContrastingTextColor(bgLightness: number): string {
  return bgLightness > 60 ? 'hsl(0, 0%, 20%)' : 'hsl(0, 0%, 95%)';
}
