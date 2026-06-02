import { HashRouter, Routes, Route } from 'react-router-dom'
import Overlay from './pages/Overlay'

// The main app content (dashboard) will be added in Task 6.2
// For now, just a placeholder
function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center flex-col gap-2">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
        Big Brother
      </h1>
      <p className="text-muted-foreground">Watching. Always.</p>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/overlay" element={<Overlay />} />
      </Routes>
    </HashRouter>
  )
}
