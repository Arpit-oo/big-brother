import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FolderOpen, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ImportCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export function ImportCategoryDialog({ open, onOpenChange, onImported }: ImportCategoryDialogProps) {
  const [categories, setCategories] = useState<CategoryDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const api = (window as any).bigBrother
    if (api?.getCategories) {
      api.getCategories()
        .then((cats: CategoryDefinition[]) => setCategories(cats))
        .catch(() => toast.error('Failed to load categories'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [open])

  const handleImport = async (categoryId: string) => {
    setImporting(categoryId)
    try {
      const api = (window as any).bigBrother
      const imported = await api.importCategory(categoryId)
      toast.success(`Imported ${imported.length} keywords`)
      onImported()
      onOpenChange(false)
    } catch {
      toast.error('Failed to import category')
    } finally {
      setImporting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[85vw] bg-zinc-950 border-zinc-800 p-0 rounded-none sm:max-w-4xl">
        <div className="p-8 pb-0">
          <DialogHeader className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">
              Import
            </p>
            <DialogTitle className="text-2xl font-black text-zinc-100 font-['Plus_Jakarta_Sans']">
              Import Category
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              Import a pre-built set of keywords from a category. All terms will be added to your keyword list.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="border-b border-zinc-800/50 mt-4" />

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-600" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <FolderOpen className="w-8 h-8 mb-3 text-zinc-700" />
              <p className="text-sm">No categories available</p>
            </div>
          ) : (
            categories.map((cat, i) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-8 py-5 hover:bg-zinc-900/50 transition-colors ${
                  i < categories.length - 1 ? 'border-b border-zinc-800/30' : ''
                }`}
              >
                <div className="flex-1 min-w-0 mr-6">
                  <div className="flex items-baseline gap-3 mb-1">
                    <h3 className="text-sm font-bold text-zinc-200">{cat.name}</h3>
                    <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">
                      {cat.terms.length} terms
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">{cat.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleImport(cat.id)}
                  disabled={importing === cat.id}
                  className="bg-red-600 text-white hover:bg-red-700 rounded-none text-[10px] uppercase tracking-wider font-semibold h-8 px-4 shrink-0"
                >
                  {importing === cat.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Import'
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
