import { useState } from 'react'
import { useTheme } from './style-zx'
import { Button } from './components/Button'

function App() {
  const [count, setCount] = useState(0)
  const theme = useTheme()

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
          variant="secondary"
          zx={{
            width: '100%',
            mt: 10
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
      </div>
    </div>
  )
}

export default App
