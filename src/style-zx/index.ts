import type { CSSProperties } from 'react';
export { createTheme, useTheme } from './theme';

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
