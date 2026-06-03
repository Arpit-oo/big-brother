import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Plus, Download, Trash2, Loader2 } from 'lucide-react'
import { AddKeywordDialog } from '@/components/AddKeywordDialog'
import { ImportCategoryDialog } from '@/components/ImportCategoryDialog'
import { toast } from 'sonner'

const matchModeColors: Record<string, string> = {
  exact: 'text-blue-400',
  contains: 'text-emerald-400',
  smart: 'text-purple-400',
  regex: 'text-amber-400',
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
    <div className="p-10 space-y-8 overflow-y-auto h-full">
      {/* Header */}
      <div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-500">
              Keywords
            </p>
            <h1 className="text-4xl font-black text-zinc-100 mt-1 font-['Plus_Jakarta_Sans']">
              {keywords.length} keyword{keywords.length !== 1 ? 's' : ''}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-none text-xs uppercase tracking-wider font-semibold h-10 px-5"
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Import Category
            </Button>
            <Button
              onClick={() => {
                setEditKeyword(null)
                setAddOpen(true)
              }}
              className="bg-red-600 text-white hover:bg-red-700 rounded-none text-xs uppercase tracking-wider font-semibold h-10 px-5"
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Add Keyword
            </Button>
          </div>
        </div>
        <div className="border-b border-zinc-800 mt-6" />
      </div>

      {/* Table */}
      {keywords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
          <p className="text-sm">No keywords configured.</p>
          <p className="text-xs text-zinc-700 mt-1">Add a keyword or import a category to get started.</p>
        </div>
      ) : (
        <div>
          {/* Table Header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px_40px] gap-4 pb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Term</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Category</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Match</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Action</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Bypass</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Active</span>
            <span />
          </div>

          {/* Data Rows */}
          {keywords.map((kw) => (
            <div
              key={kw.id}
              onClick={() => handleEdit(kw)}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_60px_40px] gap-4 items-center py-4 border-b border-zinc-800/30 cursor-pointer hover:bg-zinc-800/10 transition-colors"
            >
              <span className="font-semibold text-zinc-100 text-sm">{kw.term}</span>
              <span className="text-xs uppercase text-zinc-500 tracking-wide">{kw.category}</span>
              <span className={`text-xs font-medium ${matchModeColors[kw.match_mode] || 'text-zinc-400'}`}>
                {kw.match_mode}
              </span>
              <span className="text-zinc-400 text-sm">
                {actionLabels[kw.action_type] || kw.action_type}
              </span>
              <span className="text-zinc-500 text-sm capitalize">{kw.bypass_mode}</span>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={kw.enabled}
                  onCheckedChange={(v) => handleToggle(kw.id, v)}
                  className="data-[state=checked]:bg-red-600"
                />
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleDelete(kw.id)}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
