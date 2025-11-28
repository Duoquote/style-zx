import { useState, useEffect } from 'react';

// Simple deep merge for theme objects
function isObject(item: any) {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

// Flatten theme object to CSS variables
// e.g. { colors: { primary: 'red' } } -> { '--theme-colors-primary': 'red' }
function flattenTheme(theme: any, prefix = '--theme'): Record<string, string> {
  const result: Record<string, string> = {};

  function recurse(obj: any, currentKey: string) {
    for (const key in obj) {
      const value = obj[key];
      const newKey = currentKey ? `${currentKey}-${key}` : key;
      if (typeof value === 'object' && value !== null) {
        recurse(value, newKey);
      } else {
        result[`${prefix}-${newKey}`] = value;
      }
    }
  }

  recurse(theme, '');
  return result;
}

let currentTheme: any = {};
const listeners = new Set<(theme: any) => void>();

export function createTheme<T extends object>(themeConfig: T) {
  currentTheme = themeConfig;
  
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

  // Notify listeners
  listeners.forEach(listener => listener(currentTheme));

  return currentTheme as T;
}

export function useTheme<T = any>(): T {
  const [theme, setTheme] = useState<T>(currentTheme);

  useEffect(() => {
    const listener = (newTheme: any) => setTheme(newTheme);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return theme;
}
