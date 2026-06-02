import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Download, MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react'
import { AddKeywordDialog } from '@/components/AddKeywordDialog'
import { ImportCategoryDialog } from '@/components/ImportCategoryDialog'
import { toast } from 'sonner'

const matchModeColors: Record<string, string> = {
  exact: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  contains: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  smart: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  regex: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const actionLabels: Record<string, string> = {
  close_tab: 'Close Tab',
  close_and_media: 'Close & Media',
  close_and_redirect: 'Close & Redirect',
  overlay: 'Overlay',
}

export function Keywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editKeyword, setEditKeyword] = useState<Keyword | null>(null)

  const api = (window as any).bigBrother

  const loadKeywords = async () => {
    try {
      if (api?.getKeywords) {
        const kws = await api.getKeywords()
        setKeywords(kws)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKeywords()
  }, [])

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await api.updateKeyword(id, { enabled })
      setKeywords((prev) => prev.map((k) => (k.id === id ? { ...k, enabled } : k)))
    } catch {
      toast.error('Failed to update keyword')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.removeKeyword(id)
      setKeywords((prev) => prev.filter((k) => k.id !== id))
      toast.success('Keyword deleted')
    } catch {
      toast.error('Failed to delete keyword')
    }
  }

  const handleEdit = (kw: Keyword) => {
    setEditKeyword(kw)
    setAddOpen(true)
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
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Keywords</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {keywords.length} keyword{keywords.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            className="border-zinc-800 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <Download className="w-4 h-4 mr-2" />
            Import Category
          </Button>
          <Button
            onClick={() => {
              setEditKeyword(null)
              setAddOpen(true)
            }}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Keyword
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-zinc-800/60 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800/60 hover:bg-transparent">
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Term</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Match</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Action</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Bypass</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-zinc-500 text-xs uppercase tracking-wider w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {keywords.length === 0 ? (
              <TableRow className="border-zinc-800/60 hover:bg-transparent">
                <TableCell colSpan={7} className="text-center py-12 text-zinc-600">
                  No keywords configured. Add a keyword or import a category to get started.
                </TableCell>
              </TableRow>
            ) : (
              keywords.map((kw) => (
                <TableRow key={kw.id} className="border-zinc-800/60 hover:bg-zinc-900/30">
                  <TableCell className="font-medium text-zinc-200">{kw.term}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px]">
                      {kw.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${matchModeColors[kw.match_mode] || ''}`}
                    >
                      {kw.match_mode}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {actionLabels[kw.action_type] || kw.action_type}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm capitalize">{kw.bypass_mode}</TableCell>
                  <TableCell>
                    <Switch
                      checked={kw.enabled}
                      onCheckedChange={(v) => handleToggle(kw.id, v)}
                      className="data-[state=checked]:bg-red-600"
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-200">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                        <DropdownMenuItem
                          onClick={() => handleEdit(kw)}
                          className="text-zinc-300 focus:text-zinc-100 focus:bg-zinc-800"
                        >
                          <Pencil className="w-3.5 h-3.5 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(kw.id)}
                          className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddKeywordDialog
        open={addOpen}
        onOpenChange={(v) => {
          setAddOpen(v)
          if (!v) setEditKeyword(null)
        }}
        onAdded={loadKeywords}
        editKeyword={editKeyword}
      />
      <ImportCategoryDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={loadKeywords}
      />
    </div>
  )
}
