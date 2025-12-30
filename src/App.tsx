import { useState } from 'react'
import { createStyles, ThemeProvider, useTheme } from './style-zx'
import { Button } from './components/Button'
import { theme } from './theme'

// Demo component that uses useTheme inside a ThemeProvider
function ScopedThemeDemo() {
  const scopedTheme = useTheme();
  return (
    <div zx={{ p: 20, bg: '$theme.colors.surface', borderRadius: 8, flex: 1 }}>
      <h3 zx={{ m: 0, color: '$theme.colors.primary' }}>Scoped Theme (useTheme)</h3>
      <p zx={{ m: 0, mt: 10, color: '$theme.colors.text' }}>Uses overridden colors from ThemeProvider.</p>
      <pre zx={{ mt: 10, fontSize: 11, color: '$theme.colors.text', opacity: 0.7 }}>
        {JSON.stringify(scopedTheme, null, 2)}
      </pre>
    </div>
  );
}

// Test createStyles - these get compiled at build time
const styles = createStyles({
  demoCard: {
    bg: '#f0f4ff',
    p: 20,
    borderRadius: 8,
    border: '2px solid #4f46e5',
  },
  demoTitle: {
    m: 0,
    color: '#4f46e5',
    fontSize: '1.2em',
  },
  demoText: {
    m: 0,
    mt: 10,
    color: '#666',
  },
});

function App() {
  const [count, setCount] = useState(0)

  return (
    <div zx={{
      bg: '$theme.colors.background',
      color: '$theme.colors.text',
      display: 'flex',
      width: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif'
    }}>
      <h1 zx={{
        color: '$theme.colors.primary',
        fontSize: '3.2em',
        lineHeight: 1.1,
        mb: 20
      }}>
        Style-ZX
      </h1>

      <div zx={{
        bg: '$theme.colors.surface',
        color: '$theme.colors.text',
        p: 30,
        borderRadius: 12,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: 500,
        width: '100%'
      }}>
        <p zx={{ mb: 20, fontSize: 18 }}>
          Zero-runtime CSS-in-JS with <code>zx</code> prop.
        </p>

        <Button
          onClick={() => setCount((count) => count + 1)}
          zx={{
            width: '100%',
            mt: 10,
            bg: "$theme.colors.primary",
          }}
        >
          count is {count}
        </Button>

        <div zx={{ mt: 20, p: 10, border: '1px solid #eee', borderRadius: 4 }}>
          <p zx={{ m: 0, fontSize: 14, color: '#888' }}>
            Edit <code>src/App.tsx</code> and save to test HMR.
          </p>
        </div>
      </div>

      <div zx={{ mt: 40, display: 'flex', gap: 20 }}>
        <div zx={{
          p: 20,
          bg: '#ffeeee',
          borderRadius: 8,
          '& > h3': { color: 'red', m: 0 }
        }}>
          <h3>Nested Selectors</h3>
          <p zx={{ m: 0, mt: 10 }}>This box uses nested selectors to style the header.</p>
        </div>

        <div zx={{
          p: 20,
          bg: '#eeffee',
          borderRadius: 8,
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
          },
          transition: 'all 0.3s ease'
        }}>
          <h3 zx={{ m: 0, color: 'green' }}>Hover Me</h3>
          <p zx={{ m: 0, mt: 10 }}>This box has a hover effect defined in `zx`.</p>
        </div>

        {/* Demo: createStyles usage */}
        <div className={styles.demoCard}>
          <h3 className={styles.demoTitle}>createStyles Demo</h3>
          <p className={styles.demoText}>
            This box uses <code>createStyles</code> for reusable static styles.
          </p>
        </div>
      </div>

      {/* Demo: ThemeProvider for scoped themes */}
      <div zx={{ mt: 40, mb: 40, display: 'flex', gap: 20 }}>
        <div zx={{ p: 20, bg: '$theme.colors.surface', borderRadius: 8, flex: 1 }}>
          <h3 zx={{ m: 0, color: '$theme.colors.primary' }}>Global Theme</h3>
          <p zx={{ m: 0, mt: 10, color: '$theme.colors.text' }}>Uses colors from the global theme.</p>
          <pre zx={{ mt: 10, fontSize: 11, color: '$theme.colors.text', opacity: 0.7 }}>
            {JSON.stringify(theme, null, 2)}
          </pre>
        </div>

        <ThemeProvider theme={{
          colors: {
            primary: '#a855f7',
            text: 'rgba(255, 255, 255, 0.9)',
            surface: '#1e1e2e',
          }
        }}>
          <ScopedThemeDemo />
        </ThemeProvider>
      </div>
    </div>
  )
}

export default App
