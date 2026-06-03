import { HashRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/Sidebar'
import { Dashboard } from '@/pages/Dashboard'
import { Keywords } from '@/pages/Keywords'
import { Logs } from '@/pages/Logs'
import { Settings } from '@/pages/Settings'
import Overlay from './pages/Overlay'

function MainLayout() {
  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-900">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/keywords" element={<Keywords />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/overlay" element={<Overlay />} />
        <Route path="/*" element={<MainLayout />} />
      </Routes>
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#e4e4e7',
          },
        }}
      />
    </HashRouter>
  )
}
