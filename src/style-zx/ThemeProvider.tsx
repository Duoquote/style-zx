import React, { createContext, useContext } from 'react';
import merge from 'lodash/merge';
import { flattenTheme, getGlobalTheme } from './theme';

const ThemeContext = createContext<object | null>(null);

interface ThemeProviderProps<T extends object = object> {
    theme: Partial<T>;
    children: React.ReactNode;
}

/**
 * Provides a scoped theme by merging overrides with the parent theme.
 * CSS variables are applied to a wrapper div, cascading to children.
 * Use `useTheme()` inside ThemeProvider to access the merged theme in JS.
 * 
 * Theme inheritance:
 * - If nested inside another ThemeProvider, inherits from parent
 * - Otherwise inherits from global theme (createTheme)
 * 
 * @example
 * ```tsx
 * <ThemeProvider theme={{ colors: { primary: '#a855f7' } }}>
 *   <Sidebar />
 * </ThemeProvider>
 * ```
 */
export function ThemeProvider<T extends object>({ theme, children }: ThemeProviderProps<T>) {
    // Get parent theme from context, or fall back to global theme
    const parentTheme = useContext(ThemeContext) ?? getGlobalTheme();

    // Deep merge parent theme with overrides
    const mergedTheme = merge({}, parentTheme, theme);

    const cssVars = flattenTheme(mergedTheme);
    return (
        <ThemeContext.Provider value={mergedTheme}>
            <div style={cssVars}>{children}</div>
        </ThemeContext.Provider>
    );
}

/**
 * Hook to access the current theme from the nearest ThemeProvider.
 * Returns the merged theme (parent + overrides).
 * If not inside a ThemeProvider, returns the global theme.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const theme = useTheme();
 *   return <p style={{ color: theme.colors.primary }}>Hello</p>;
 * }
 * ```
 */
export function useTheme<T extends object = object>(): T {
    const contextTheme = useContext(ThemeContext);
    return (contextTheme ?? getGlobalTheme()) as T;
}

