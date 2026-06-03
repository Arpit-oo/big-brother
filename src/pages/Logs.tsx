import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function Logs() {
  const [logs, setLogs] = useState<LogRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [confirmClear, setConfirmClear] = useState(false)
  const [clearing, setClearing] = useState(false)

  const api = (window as any).bigBrother

  const loadLogs = async () => {
    try {
      if (api?.getLogs) {
        const filter: any = {}
        if (sourceFilter !== 'all') filter.source = sourceFilter
        const data = await api.getLogs(filter)
        setLogs(data)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [sourceFilter])

  const handleClearLogs = async () => {
    setClearing(true)
    try {
      const count = await api.clearLogs()
      setLogs([])
      toast.success(`Cleared ${count} log entries`)
    } catch {
      toast.error('Failed to clear logs')
    } finally {
      setClearing(false)
      setConfirmClear(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
      </div>
    )
  }

  return (
    <div className="p-10 space-y-8 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
            Activity Log
          </h1>
          <div className="flex items-center gap-6">
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36 bg-transparent border-none text-zinc-500 text-xs uppercase tracking-wider h-8 focus:ring-0 focus:ring-offset-0">
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="browser">Browser</SelectItem>
                <SelectItem value="app">App</SelectItem>
                <SelectItem value="keystroke">Keystroke</SelectItem>
              </SelectContent>
            </Select>
            <button
              onClick={() => setConfirmClear(true)}
              disabled={logs.length === 0}
              className="text-xs uppercase tracking-wider text-red-500 hover:text-red-400 disabled:text-zinc-700 disabled:cursor-not-allowed transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
        <div className="border-b border-zinc-800/50 mt-4" />
      </div>

      {/* Log List */}
      <div>
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-32">
            <p className="text-sm text-zinc-700">No activity recorded</p>
          </div>
        ) : (
          <div>
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-6 py-4 border-b border-zinc-800/30"
              >
                {/* Bypassed indicator */}
                <div className="flex-shrink-0">
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${
                      log.bypassed ? 'bg-red-500' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Timestamp */}
                <span className="text-xs text-zinc-700 font-mono tabular-nums whitespace-nowrap w-32 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>

                {/* Keyword */}
                <span className="font-semibold text-zinc-200 text-sm w-32 flex-shrink-0">
                  {log.keyword_term}
                </span>

                {/* Matched text */}
                <span className="text-zinc-500 text-sm truncate flex-1 min-w-0">
                  {log.matched_text}
                </span>

                {/* Source */}
                <span className="text-xs uppercase text-zinc-600 tracking-wider flex-shrink-0">
                  {log.source}
                </span>

                {/* Action */}
                <span className="text-xs text-zinc-600 flex-shrink-0">
                  {log.action_taken}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clear confirmation */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 p-8">
          <DialogHeader>
            <DialogTitle className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-400">
              Clear All Logs
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm mt-3">
              This will permanently delete all activity logs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3 mt-6">
            <button
              onClick={() => setConfirmClear(false)}
              className="text-xs uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleClearLogs}
              disabled={clearing}
              className="text-xs uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
            >
              {clearing ? 'Clearing...' : 'Clear All'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
