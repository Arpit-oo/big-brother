import { useState, useEffect } from 'react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

export function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [monitoring, setMonitoring] = useState(true)
  const [loading, setLoading] = useState(true)

  const api = (window as any).bigBrother

  useEffect(() => {
    loadData()
    // Listen for live interventions
    if (api?.onIntervention) {
      const cleanup = api.onIntervention(() => loadData())
      return cleanup
    }
  }, [])

  const loadData = async () => {
    try {
      if (api?.getStats) {
        const [s, l, monEnabled] = await Promise.all([
          api.getStats(),
          api.getLogs(),
          api.getSetting('monitoring.enabled'),
        ])
        setStats(s)
        setLogs((l as LogRecord[]).slice(0, 10))
        setMonitoring(monEnabled !== 'false')
      }
    } catch {
      // fallback for browser-only
    } finally {
      setLoading(false)
    }
  }

  const toggleMonitoring = async (checked: boolean) => {
    setMonitoring(checked)
    if (api?.updateSettings) {
      await api.updateSettings('monitoring.enabled', String(checked))
    }
  }

  const bySourceArray: { source: string; count: number }[] = stats?.bySource || []
  const sourceBreakdown = { browser_url: 0, browser_search: 0, browser_title: 0, app_title: 0, keystroke: 0 }
  for (const s of bySourceArray) {
    if (s.source in sourceBreakdown) sourceBreakdown[s.source as keyof typeof sourceBreakdown] = s.count
  }
  const grouped = {
    browser: sourceBreakdown.browser_url + sourceBreakdown.browser_search + sourceBreakdown.browser_title,
    app: sourceBreakdown.app_title,
    keystroke: sourceBreakdown.keystroke,
  }
  const totalSources = grouped.browser + grouped.app + grouped.keystroke

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-10 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
          Dashboard
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-zinc-600">
            Monitoring
          </span>
          <Switch
            checked={monitoring}
            onCheckedChange={toggleMonitoring}
            className="data-[state=checked]:bg-red-600"
          />
          <span className={`text-xs font-semibold ${monitoring ? 'text-red-500' : 'text-zinc-600'}`}>
            {monitoring ? 'Active' : 'Off'}
          </span>
        </div>
      </div>

      <div className="border-b border-zinc-800/40 mt-6 mb-10" />

      {/* Stats Row */}
      <div className="flex items-end gap-0">
        {/* Blocked Today */}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-600 mb-2">
            Blocked Today
          </p>
          <p className="text-5xl font-black text-red-500 tabular-nums leading-none">
            {stats?.totalToday ?? 0}
          </p>
        </div>

        <div className="w-px h-16 bg-zinc-800/40 mx-6 self-center shrink-0" />

        {/* All Time */}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-600 mb-2">
            All Time
          </p>
          <p className="text-5xl font-black text-zinc-100 tabular-nums leading-none">
            {stats?.totalAllTime ?? 0}
          </p>
        </div>

        <div className="w-px h-16 bg-zinc-800/40 mx-6 self-center shrink-0" />

        {/* Last 7 Days */}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-600 mb-2">
            Last 7 Days
          </p>
          <p className="text-5xl font-black text-zinc-100 tabular-nums leading-none">
            {stats?.last7Days ?? 0}
          </p>
        </div>

        <div className="w-px h-16 bg-zinc-800/40 mx-6 self-center shrink-0" />

        {/* Top Keyword */}
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-widest text-zinc-600 mb-2">
            Top Keyword
          </p>
          <p className="text-3xl font-black text-zinc-100 leading-none truncate">
            {stats?.topKeyword?.term ?? '--'}
          </p>
          {stats?.topKeyword?.count != null && (
            <p className="text-xs text-zinc-600 mt-1.5 tabular-nums">
              {stats.topKeyword.count} matches
            </p>
          )}
        </div>
      </div>

      <div className="border-b border-zinc-800/40 mt-10 mb-10" />

      {/* Recent Activity */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6">
          Recent Activity
        </h2>

        {logs.length === 0 ? (
          <p className="text-sm text-zinc-600 py-12 text-center">
            No recent activity recorded
          </p>
        ) : (
          <div>
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between py-3.5 border-b border-zinc-800/30"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-sm font-semibold text-zinc-200 shrink-0">
                    {log.keyword_term}
                  </span>
                  <span className="text-sm text-zinc-600 truncate">
                    {log.matched_text}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <Badge variant="secondary" className="bg-zinc-800/80 text-zinc-500 text-[10px] font-medium border-0">
                    {log.source}
                  </Badge>
                  <span className="text-xs text-zinc-700 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-b border-zinc-800/40 mt-10 mb-10" />

      {/* Source Breakdown */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500 mb-6">
          Source Breakdown
        </h2>

        {totalSources === 0 ? (
          <p className="text-sm text-zinc-600 py-8 text-center">No data yet</p>
        ) : (
          <div className="space-y-5 max-w-xl">
            {(Object.entries(grouped) as [string, number][]).map(([source, count]) => {
              const pct = totalSources > 0 ? (count / totalSources) * 100 : 0
              return (
                <div key={source}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-zinc-300 capitalize">
                      {source}
                    </span>
                    <span className="text-xs text-zinc-600 tabular-nums">
                      {count}
                    </span>
                  </div>
                  <div className="h-1 bg-zinc-800/60 overflow-hidden">
                    <div
                      className="h-full bg-red-500/70 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
