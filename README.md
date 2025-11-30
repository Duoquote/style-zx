# Style-ZX

**Zero-runtime CSS-in-JS with a `zx` prop.**

`style-zx` is a lightweight, zero-runtime CSS-in-JS library designed for Vite. It allows you to style your React components using a `zx` prop, which is compiled to static CSS classes at build time. This combines the developer experience of CSS-in-JS with the performance of static CSS.

## Features

- **Zero Runtime**: Styles are extracted to static CSS files during the build process. No runtime style injection or overhead.
- **Ultra Lightweight**: The plugin output is tiny (~5KB), ensuring minimal impact on your build process.
- **`zx` Prop**: Style any component directly with the `zx` prop (inspired by MUI's `sx` and other similar libraries).
- **TypeScript Support**: Full type safety for CSS properties and theme variables.
- **Theming**: Define a theme and access variables easily (e.g., `"$theme.colors.primary"`).
- **Aliases**: Shorthand properties for common styles (e.g., `p`, `m`, `px`, `my`, `bg`).
- **Nested Selectors**: Support for pseudo-classes and nested selectors (e.g., `&:hover`, `& > div`).
- **Vite Integration**: Seamless integration as a Vite plugin with HMR support.

## Installation

1. **Install the package** (assuming local or published package):

    ```bash
    npm install style-zx
    # or
    yarn add style-zx
    ```

2. **Add the Vite plugin** in `vite.config.ts`:

    ```typescript
    import { defineConfig } from 'vite'
    import react from '@vitejs/plugin-react'
    import styleZx from 'style-zx/plugin'

    export default defineConfig({
      plugins: [styleZx(), react()],
    })
    ```

## Usage

### Basic Styling

Use the `zx` prop on any HTML element. Numeric values for dimensions are treated as pixels by default.

```tsx
<div zx={{
  bg: 'white',
  p: 20, // padding: 20px
  borderRadius: 8,
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
}}>
  <h1 zx={{ color: 'blue', fontSize: 24 }}>Hello World</h1>
</div>
```

### Theming

1. **Define your theme** and create the hook:

    ```typescript
    // src/style-zx/theme.ts
    import { createTheme } from 'style-zx';

    export const { useTheme, theme } = createTheme({
      colors: {
        primary: '#007bff',
        background: '#f0f2f5',
        text: '#333'
      },
      spacing: {
        small: 8,
        medium: 16
      }
    });
    ```

2. **Use theme variables** in your components. You can reference them as strings starting with `$theme.`.

    ```tsx
    import { useTheme } from './style-zx';

    function App() {
      const theme = useTheme();

      return (
        <button zx={{
          bg: '$theme.colors.primary',
          color: 'white',
          p: '$theme.spacing.small'
        }}>
          Click Me
        </button>
      )
    }
    ```

### Nested Selectors

You can use standard CSS nesting syntax.

```tsx
<div zx={{
  color: 'black',
  '&:hover': {
    color: 'blue'
  },
  '& > span': {
    fontWeight: 'bold'
  }
}}>
  Hover me <span>(Bold)</span>
</div>
```

## Comparison & Concept

### The Concept

`style-zx` relies on **static analysis**. The build plugin scans your code for the `zx` prop, extracts the object literal, generates a unique class hash, creates CSS rules, and replaces the `zx` prop with a `className`.

### vs. Pigment CSS

Both libraries aim for zero-runtime CSS-in-JS.

- **Pigment CSS**: A more robust, complex solution often integrated with Next.js and MUI's ecosystem. It handles more complex dynamic scenarios but requires deeper integration. Also the project is not actively maintained at the moment.
- **Style-ZX**: A lightweight, Vite-first approach. It focuses on simplicity and the specific `zx` prop API. It's easier to set up for simple Vite projects but may have fewer features than Pigment.

### vs. Emotion / Styled-Components

- **Emotion/Styled-Components**: Runtime CSS-in-JS. They parse styles in the browser, generate classes, and inject tags. This offers great flexibility (dynamic props) but incurs a runtime performance cost (script execution + style recalculation).
- **Style-ZX**: No runtime cost. The browser just loads a CSS file.

### vs. Tailwind CSS

- **Tailwind**: Utility-first. You compose classes (`p-4 bg-white`).
- **Style-ZX**: Object-based. You write CSS-like objects (`{ p: 16, bg: 'white' }`). This is often preferred by developers who like keeping styles colocated but find long class strings hard to read.

## Caveats & Limitations

1. **Static Analysis Only**: The values in `zx` must be statically analyzable at build time.
    - ✅ `zx={{ color: 'red' }}`
    - ✅ `zx={{ color: '$theme.colors.primary' }}` (if theme is static)
    - ❌ `zx={{ color: props.color }}` (Dynamic props are **not** supported directly in the build step. Use CSS variables for dynamic values).
2. **Vite Only**: Currently designed specifically as a Vite plugin.
3. **No Dynamic Function Interpolations**: You cannot pass a function to `zx` that depends on runtime state.

## Gains

- **Performance**: Zero JS runtime for styles means faster TTI (Time to Interactive) and less main-thread work.
- **Bundle Size**: The plugin itself is extremely small (~5KB), keeping your dev dependencies lean.
- **Developer Experience**: Write styles in TypeScript right next to your components. Get autocomplete and type checking.
- **Maintainability**: Styles are scoped and colocated, reducing dead code and global namespace pollution.
