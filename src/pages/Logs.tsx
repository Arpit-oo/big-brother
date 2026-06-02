import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Trash2, Loader2, FileX2 } from 'lucide-react'
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
        <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Activity Logs</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {logs.length} entr{logs.length !== 1 ? 'ies' : 'y'} recorded
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setConfirmClear(true)}
          disabled={logs.length === 0}
          className="border-zinc-800 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/20"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Logs
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="w-48">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-300 h-9 text-sm">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="browser">Browser</SelectItem>
              <SelectItem value="app">App</SelectItem>
              <SelectItem value="keystroke">Keystroke</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/60 hover:bg-transparent">
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Time</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Keyword</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Matched Text</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Source</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Action</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Bypassed</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow className="border-zinc-800/60 hover:bg-transparent">
                <TableCell colSpan={6} className="py-16">
                  <div className="flex flex-col items-center text-zinc-600">
                    <FileX2 className="w-10 h-10 mb-3 text-zinc-700" />
                    <p className="text-sm font-medium">No logs recorded</p>
                    <p className="text-xs text-zinc-700 mt-1">
                      Activity will appear here when keywords are detected
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-zinc-800/60 hover:bg-zinc-900/30">
                  <TableCell className="text-zinc-400 text-sm tabular-nums whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="font-medium text-zinc-200">{log.keyword_term}</TableCell>
                  <TableCell className="text-zinc-400 text-sm max-w-[200px] truncate">
                    {log.matched_text}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px]">
                      {log.source}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">{log.action_taken}</TableCell>
                  <TableCell>
                    {log.bypassed ? (
                      <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]" variant="outline">
                        Yes
                      </Badge>
                    ) : (
                      <Badge className="bg-zinc-800/50 text-zinc-600 text-[10px]" variant="secondary">
                        No
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Clear confirmation */}
      <Dialog open={confirmClear} onOpenChange={setConfirmClear}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 p-6">
          <DialogHeader>
            <DialogTitle className="text-zinc-100">Clear All Logs</DialogTitle>
            <DialogDescription className="text-zinc-500">
              This will permanently delete all activity logs. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmClear(false)}
              className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearLogs}
              disabled={clearing}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {clearing ? 'Clearing...' : 'Clear All'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
