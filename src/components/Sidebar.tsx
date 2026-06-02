import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Shield, ScrollText, Settings, Eye } from 'lucide-react'
import { useState, useEffect } from 'react'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/keywords', icon: Shield, label: 'Keywords' },
  { to: '/logs', icon: ScrollText, label: 'Logs' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  const [monitoringActive, setMonitoringActive] = useState(true)

  useEffect(() => {
    const api = (window as any).bigBrother
    if (api?.getSetting) {
      api.getSetting('monitoring_enabled').then((val: string | null) => {
        setMonitoringActive(val !== 'false')
      })
    }
  }, [])

  return (
    <aside className="flex flex-col h-full w-[220px] bg-zinc-950 border-r border-zinc-800/60 shrink-0">
      {/* Branding */}
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/15">
          <Eye className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-zinc-100">Big Brother</h1>
          <p className="text-[10px] text-zinc-500 font-medium tracking-wider uppercase">is watching</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-red-500/10 text-red-400 border-l-2 border-red-500 -ml-[2px] pl-[14px]'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Monitoring Status */}
      <div className="px-4 py-4 border-t border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                monitoringActive ? 'bg-green-400' : 'bg-red-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                monitoringActive ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
          </span>
          <span className="text-xs text-zinc-500 font-medium">
            {monitoringActive ? 'Monitoring Active' : 'Monitoring Paused'}
          </span>
        </div>
      </div>
    </aside>
  )
}
