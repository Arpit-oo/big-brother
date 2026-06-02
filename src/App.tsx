import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState<string>('Initializing...')

  useEffect(() => {
    // Test the preload API is available
    if (window.bigBrother) {
      setStatus('Connected')
    } else {
      setStatus('Running in browser mode')
    }
  }, [])

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#e0e0e0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', 'DM Sans', system-ui, -apple-system, sans-serif",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #ef4444, #f97316)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Big Brother
        </h1>
        <p
          style={{
            fontSize: '1.1rem',
            color: '#666',
            marginBottom: '2rem',
          }}
        >
          is watching.
        </p>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            backgroundColor: '#1a1a1a',
            border: '1px solid #2a2a2a',
            fontSize: '0.875rem',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: status === 'Connected' ? '#22c55e' : '#eab308',
            }}
          />
          {status}
        </div>
      </div>
    </div>
  )
}

export default App
