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
    <aside className="flex flex-col h-full w-[240px] bg-zinc-950 shrink-0">
      {/* Branding */}
      <div className="px-6 pt-8 pb-6 border-b border-zinc-800/40">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black uppercase tracking-widest text-zinc-100">
            Big Brother
          </h1>
          <span className="inline-block w-2 h-2 rounded-full bg-red-500 mt-0.5" />
        </div>
        <p className="text-[10px] text-zinc-600 font-medium tracking-[0.25em] uppercase mt-1">
          is watching
        </p>
      </div>

      {/* Section Label */}
      <div className="px-6 pt-6 pb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-600">
          Navigation
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-px">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-xs font-semibold uppercase tracking-wide transition-colors ${
                isActive
                  ? 'border-l-[3px] border-red-500 bg-zinc-900/60 text-zinc-100 pl-[21px]'
                  : 'border-l-[3px] border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30'
              }`
            }
          >
            <Icon className="w-4 h-4" strokeWidth={1.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Monitoring Status */}
      <div className="px-6 py-5 border-t border-zinc-800/40">
        <div className="flex items-center gap-3">
          <Eye className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  monitoringActive ? 'bg-green-400' : 'bg-red-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  monitoringActive ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            </span>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              {monitoringActive ? 'Active' : 'Paused'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
