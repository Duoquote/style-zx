
const ALIASES: Record<string, string[]> = {
    m: ['margin'],
    mt: ['marginTop'],
    mr: ['marginRight'],
    mb: ['marginBottom'],
    ml: ['marginLeft'],
    mx: ['marginLeft', 'marginRight'],
    my: ['marginTop', 'marginBottom'],

    p: ['padding'],
    pt: ['paddingTop'],
    pr: ['paddingRight'],
    pb: ['paddingBottom'],
    pl: ['paddingLeft'],
    px: ['paddingLeft', 'paddingRight'],
    py: ['paddingTop', 'paddingBottom'],

    bg: ['backgroundColor'],
};

const UNITLESS_PROPS = new Set([
    'opacity', 'fontWeight', 'lineHeight', 'zIndex', 'flex', 'flexGrow', 'flexShrink', 'order'
]);

function toKebabCase(str: string) {
    return str.replace(/[A-Z]/g, match => `-${match.toLowerCase()}`);
}

function processValue(prop: string, value: any): string {
    if (typeof value === 'number' && !UNITLESS_PROPS.has(prop)) {
        return `${value}px`;
    }
    if (typeof value === 'string' && value.startsWith('$theme.')) {
        // $theme.colors.primary -> var(--theme-colors-primary)
        const varName = value.replace('$theme.', '--theme-').replace(/\./g, '-');
        return `var(${varName})`;
    }
    return String(value);
}

export function compileStyle(style: any, className: string): string {
    let css = `.${className} {`;
    let nestedCss = '';

    for (const key in style) {
        const value = style[key];

        // Handle nested selectors
        if (key.startsWith('&') || key.startsWith(':') || key.startsWith('@')) {
            // Recursive call for nested styles
            // We need to wrap it in the parent selector
            // e.g. "&:hover" -> ".className:hover"
            const selector = key.replace(/&/g, `.${className}`);
            const nestedBody = compileStyle(value, 'TEMP_CLASS').replace('.TEMP_CLASS', selector);
            // Remove the outer braces from the recursive result as we are building a list of rules
            // Actually, compileStyle returns a full block.
            // So for nested, we just append it outside the main block.
            nestedCss += `\n${nestedBody}`;
            continue;
        }

        // Handle aliases
        const props = ALIASES[key] || [key];

        props.forEach(prop => {
            const cssProp = toKebabCase(prop);
            const cssValue = processValue(prop, value);
            css += `\n  ${cssProp}: ${cssValue};`;
        });
    }

    css += '\n}';
    return css + nestedCss;
}
