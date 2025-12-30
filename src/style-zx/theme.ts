// Flatten theme object to CSS variables
// e.g. { colors: { primary: 'red' } } -> { '--theme-colors-primary': 'red' }
export function flattenTheme(theme: object, prefix = '--theme'): Record<string, string> {
  const result: Record<string, string> = {};

  function recurse(obj: any, currentKey: string) {
    for (const key in obj) {
      const value = obj[key];
      const newKey = currentKey ? `${currentKey}-${key}` : key;
      if (typeof value === 'object' && value !== null) {
        recurse(value, newKey);
      } else {
        result[`${prefix}-${newKey}`] = String(value);
      }
    }
  }

  recurse(theme, '');
  return result;
}

// Store global theme for inheritance in ThemeProvider
let globalTheme: object = {};

/**
 * Get the current global theme object.
 * Used internally by ThemeProvider for inheritance.
 */
export function getGlobalTheme<T extends object = object>(): T {
  return globalTheme as T;
}

/**
 * Creates a global theme by injecting CSS variables into :root.
 * Returns the theme object for direct JS access.
 * 
 * @example
 * ```ts
 * export const theme = createTheme({
 *   colors: { primary: '#F43F5E' }
 * });
 * 
 * // Use in zx prop: $theme.colors.primary
 * // Use in JS: theme.colors.primary
 * ```
 */
export function createTheme<T extends object>(themeConfig: T): T {
  // Store for inheritance
  globalTheme = themeConfig;

  // Generate CSS variables
  const cssVars = flattenTheme(themeConfig);
  let styleEl = document.getElementById('style-zx-theme');

  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'style-zx-theme';
    document.head.appendChild(styleEl);
  }

  let cssString = ':root {\n';
  for (const [key, value] of Object.entries(cssVars)) {
    cssString += `  ${key}: ${value};\n`;
  }
  cssString += '}';

  styleEl.textContent = cssString;

  return themeConfig;
}

