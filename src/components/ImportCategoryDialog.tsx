import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
      <DialogContent className="max-w-4xl w-[85vw] bg-zinc-950 border-zinc-800 p-8">
        <DialogHeader>
          <DialogTitle className="text-xl text-zinc-100">Import Category</DialogTitle>
          <DialogDescription className="text-zinc-500">
            Import a pre-built set of keywords from a category. All terms will be added to your keyword list.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <FolderOpen className="w-10 h-10 mb-3 text-zinc-600" />
              <p className="text-sm">No categories available</p>
            </div>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 rounded-lg border border-zinc-800/60 bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-sm font-semibold text-zinc-200">{cat.name}</h3>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 text-[10px]">
                      {cat.terms.length} terms
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-1">{cat.description}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleImport(cat.id)}
                  disabled={importing === cat.id}
                  className="bg-red-600 text-white hover:bg-red-700 shrink-0"
                >
                  {importing === cat.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
