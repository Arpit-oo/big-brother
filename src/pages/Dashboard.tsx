import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ShieldAlert, Activity, TrendingUp, Star, Monitor, Globe, Keyboard } from 'lucide-react'

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [logs, setLogs] = useState<LogRecord[]>([])
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
          api.getSetting('monitoring_enabled'),
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
      await api.updateSettings('monitoring_enabled', String(checked))
    }
  }

  const sourceBreakdown = stats?.source_breakdown || { browser: 0, app: 0, keystroke: 0 }
  const totalSources = sourceBreakdown.browser + sourceBreakdown.app + sourceBreakdown.keystroke

  const statCards = [
    {
      title: 'Blocked Today',
      value: stats?.blocked_today ?? 0,
      icon: ShieldAlert,
      accent: true,
    },
    {
      title: 'All Time Blocks',
      value: stats?.blocked_all_time ?? 0,
      icon: Activity,
    },
    {
      title: 'Last 7 Days',
      value: stats?.blocked_last_7_days ?? 0,
      icon: TrendingUp,
    },
    {
      title: 'Top Keyword',
      value: stats?.top_keyword_today ?? '--',
      icon: Star,
      isText: true,
    },
  ]

  const sourceIcons = {
    browser: Globe,
    app: Monitor,
    keystroke: Keyboard,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Overview of monitoring activity</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60">
          <span className="text-sm text-zinc-400">Monitoring</span>
          <Switch
            checked={monitoring}
            onCheckedChange={toggleMonitoring}
            className="data-[state=checked]:bg-red-600"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.title}
              className={`border-zinc-800/60 ${
                card.accent ? 'bg-red-500/5 border-red-500/20' : 'bg-zinc-900/50'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  {card.title}
                </CardTitle>
                <Icon
                  className={`w-4 h-4 ${card.accent ? 'text-red-500' : 'text-zinc-600'}`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${
                    card.accent ? 'text-red-400' : 'text-zinc-100'
                  } ${card.isText ? 'text-lg truncate' : ''}`}
                >
                  {card.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2">
          <Card className="border-zinc-800/60 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-300">
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-zinc-600 py-8 text-center">No recent activity</p>
              ) : (
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between py-2.5 px-3 rounded-md bg-zinc-950/50 border border-zinc-800/40"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-zinc-200 truncate">
                            {log.keyword_term}
                          </p>
                          <p className="text-xs text-zinc-600 truncate">
                            {log.matched_text}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px]">
                          {log.source}
                        </Badge>
                        <span className="text-[10px] text-zinc-600 tabular-nums">
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
            </CardContent>
          </Card>
        </div>

        {/* Source Breakdown */}
        <div className="col-span-1">
          <Card className="border-zinc-800/60 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-zinc-300">
                Source Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(Object.entries(sourceBreakdown) as [keyof typeof sourceIcons, number][]).map(
                ([source, count]) => {
                  const Icon = sourceIcons[source]
                  const pct = totalSources > 0 ? (count / totalSources) * 100 : 0
                  return (
                    <div key={source} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="text-sm text-zinc-300 capitalize">{source}</span>
                        </div>
                        <span className="text-xs text-zinc-500 tabular-nums">{count}</span>
                      </div>
                      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-red-500/70 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                }
              )}
              {totalSources === 0 && (
                <p className="text-xs text-zinc-600 text-center py-4">No data yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
