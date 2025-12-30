import type { CSSProperties } from 'react';
export { createTheme, flattenTheme } from './theme';
export { ThemeProvider, useTheme } from './ThemeProvider';

// Type definitions for zx prop
export interface ZxStyle extends CSSProperties {
    // Allow any other string for nested selectors or theme variables
    [key: string]: any;

    // Aliases
    m?: number | string;
    mt?: number | string;
    mr?: number | string;
    mb?: number | string;
    ml?: number | string;
    mx?: number | string;
    my?: number | string;

    p?: number | string;
    pt?: number | string;
    pr?: number | string;
    pb?: number | string;
    pl?: number | string;
    px?: number | string;
    py?: number | string;

    bg?: string;
}

declare module 'react' {
    interface HTMLAttributes<T> {
        zx?: ZxStyle;
    }
}

/**
 * Create static styles that are compiled at build time.
 * The returned object maps style names to generated class names.
 * 
 * @example
 * ```tsx
 * const styles = createStyles({
 *   container: { bg: '$theme.colors.background', p: 20 },
 *   title: { fontSize: '2em', color: '$theme.colors.primary' },
 * });
 * 
 * <div className={styles.container}>
 *   <h1 className={styles.title}>Hello</h1>
 * </div>
 * ```
 */
export function createStyles<T extends Record<string, ZxStyle>>(
    styles: T
): { [K in keyof T]: string } {
    // Runtime stub - replaced at build time by vite-plugin-style-zx
    // This exists for:
    // 1. TypeScript type checking
    // 2. Fallback if code runs without the plugin (returns empty strings)
    const result = {} as { [K in keyof T]: string };
    for (const key in styles) {
        result[key] = '';
    }
    return result;
}
