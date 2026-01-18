/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Use CSS variables to match Obsidian theme
        'var-background': 'var(--background-primary)',
        'var-background-secondary': 'var(--background-secondary)',
        'var-text': 'var(--text-normal)',
        'var-text-muted': 'var(--text-muted)',
        'var-interactive': 'var(--interactive-accent)',
        'var-interactive-hover': 'var(--interactive-accent-hover)',
      },
    },
  },
  plugins: [],
  // Important for Obsidian plugin isolation
  prefix: 'bv-',
};
