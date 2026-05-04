import React, { useEffect, useRef, useState, useCallback } from "react"
import { Plus, Pencil, Search, X, Image as ImageIcon, Save, Loader2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { YesNoModal } from "./YesNoModal"

const API_BASE = "https://bevoh.altervista.org/api"
const FALLBACK_IMG = "/assets/drinks/illegal.jpg"

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  Id: number
  Name: string
  ABV: number | string
  Description?: string | null
  ImageUrl?: string | null
  [key: string]: any
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] border bg-white/5 border-white/10 text-white/40">
      {children}
    </span>
  )
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", h)
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", h)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/75 backdrop-blur-sm overflow-y-auto py-8 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#0f0f0f] rounded-3xl border border-white/10 shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Ingredient form modal ────────────────────────────────────────────────────

interface IngredientModalProps {
  initial?: Ingredient
  onClose: () => void
  onSave: (data: Partial<Ingredient>, imageFile: File | null) => Promise<void>
}

function IngredientModal({ initial, onClose, onSave }: IngredientModalProps) {
  const isNew = !initial?.Id

  const [form, setForm] = useState<Partial<Ingredient>>({
    Name:        initial?.Name        ?? "",
    ABV:         initial?.ABV         ?? "",
    Description: initial?.Description ?? "",
    ...(initial?.Id ? { Id: initial.Id } : {}),
  })

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(initial?.ImageUrl ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof Ingredient, val: any) => setForm((p) => ({ ...p, [key]: val }))

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async () => {
    if (!form.Name?.trim()) { setError("Name is required."); return }

    setSaving(true)
    setError(null)
    try {
      await onSave(form, imageFile)
    } catch (e: any) {
      setError(e?.message || "Error saving ingredient.")
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">
          {isNew ? "New ingredient" : `Edit — ${initial?.Name}`}
        </h2>
        <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/30 hover:text-white transition">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5 overflow-y-auto max-h-[75vh]">

        {/* Image preview + upload */}
        <div className="flex gap-4 items-start">
          <div
            className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-white/30 transition"
            onClick={() => fileRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_IMG }} />
            ) : (
              <ImageIcon className="w-7 h-7 text-white/20" />
            )}
          </div>
          <div className="flex-1">
            <Field label="Photo">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-3 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                {imagePreview ? "Change photo" : "Upload photo"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
            </Field>
          </div>
        </div>

        {/* Name */}
        <Field label="Name *">
          <input className={inputCls} placeholder="Ingredient name" value={form.Name ?? ""} onChange={(e) => set("Name", e.target.value)} />
        </Field>

        {/* ABV */}
        <Field label="ABV %">
          <input
            className={inputCls}
            type="number"
            min={0}
            max={100}
            step={0.1}
            placeholder="0.0"
            value={form.ABV ?? ""}
            onChange={(e) => set("ABV", e.target.value)}
          />
        </Field>

        {/* Description */}
        <Field label="Description">
          <textarea
            className={`${inputCls} resize-none h-20`}
            placeholder="Description…"
            value={form.Description ?? ""}
            onChange={(e) => set("Description", e.target.value)}
          />
        </Field>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/5">
        <Button variant="ghost" onClick={onClose} className="text-white/40 hover:text-white" disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </Modal>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function IngredientsAdminPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [editTarget, setEditTarget] = useState<Ingredient | null>(null)
  const [isNew, setIsNew] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Ingredient | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Fetch all ingredients ──────────────────────────────────────────────────
  const fetchIngredients = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/admin/getIngredients.php`, { signal, credentials: "include" })
      const json = await res.json()
      if (!json?.ok) return
      const rows: Ingredient[] = (json.data ?? []).map((i: any) => ({
        ...i,
        Id:  Number(i.Id),
        ABV: i.ABV ?? 0,
      }))
      setIngredients(rows)
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchIngredients(ctrl.signal)
    return () => ctrl.abort()
  }, [])

  // ── Save (add / edit) ──────────────────────────────────────────────────────
  const handleSave = async (data: Partial<Ingredient>, imageFile: File | null) => {
    const isEditing = !!data.Id

    const url = isEditing
      ? `${API_BASE}/admin/updateIngredient.php`
      : `${API_BASE}/admin/addIngredient.php`

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`)

    const savedId: number = isEditing ? (data.Id as number) : json.id

    if (imageFile && savedId) {
      const fd = new FormData()
      fd.append("image", imageFile)
      fd.append("ingredientId", String(savedId))
      const imgRes = await fetch(`${API_BASE}/admin/uploadIngredientImage.php`, {
        method: "POST",
        credentials: "include",
        body: fd,
      })
      const imgJson = await imgRes.json().catch(() => null)
      if (!imgRes.ok || !imgJson?.ok) {
        throw new Error(`Ingredient saved (id ${savedId}) but image upload failed: ${imgJson?.error ?? "unknown"}`)
      }
    }

    await fetchIngredients()
    setEditTarget(null)
    setIsNew(false)
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch(`${API_BASE}/admin/deleteIngredient.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ Id: deleteTarget.Id }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      setIngredients((prev) => prev.filter((i) => i.Id !== deleteTarget.Id))
      setDeleteTarget(null)
    } catch (e: any) {
      setDeleteError(e?.message || "Error deleting ingredient.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = ingredients.filter((i) =>
    (i.Name ?? "").toLowerCase().includes(search.trim().toLowerCase())
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* Modals */}
      {(editTarget || isNew) && (
        <IngredientModal
          initial={isNew ? undefined : (editTarget ?? undefined)}
          onClose={() => { setEditTarget(null); setIsNew(false) }}
          onSave={handleSave}
        />
      )}

      <YesNoModal
        title="Delete ingredient"
        description={`Are you sure you want to delete "${deleteTarget?.Name}"? This action cannot be undone.`}
        open={!!deleteTarget}
        loading={deleteLoading}
        error={deleteError}
        onCancel={() => { setDeleteTarget(null); setDeleteError(null) }}
        onConfirm={handleDelete}
      />

      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-30 border-b border-white/5 px-5 lg:px-8 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-8 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-white/25 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <span className="text-xs text-white/25 hidden sm:block tabular-nums">
              {filtered.length} ingredient{filtered.length !== 1 ? "s" : ""}
            </span>
            <Button onClick={() => setIsNew(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add ingredient</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="px-5 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/5 aspect-square animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
            <div className="text-6xl opacity-30">🧪</div>
            <p className="text-white/30 text-sm">No ingredients found.</p>
            <Button onClick={() => setIsNew(true)} size="sm" className="gap-1.5 mt-1">
              <Plus className="w-4 h-4" /> Add first ingredient
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {filtered.map((ingredient) => (
              <div
                key={ingredient.Id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111] cursor-pointer"
              >
                <div className="relative w-full aspect-square bg-white/5">
                  {ingredient.ImageUrl ? (
                    <img
                      src={ingredient.ImageUrl}
                      alt={ingredient.Name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget
                        if (!img.src.includes(FALLBACK_IMG)) img.src = FALLBACK_IMG
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl opacity-20">🧪</div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 z-10 px-3">
                    <button
                      type="button"
                      onClick={() => setEditTarget(ingredient)}
                      className="w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-medium transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(ingredient) }}
                      className="w-full flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-xl px-3 py-2 text-xs font-medium text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>

                  {/* Bottom info overlay */}
                  <div className="absolute inset-x-0 bottom-0 z-[5] pointer-events-none">
                    <div className="absolute inset-x-0 bottom-0 h-[55%] bg-black" />
                    <div className="absolute inset-x-0 bottom-[55%] h-[20%] bg-gradient-to-t from-black to-transparent" />
                    <div className="relative px-3 pb-3 pt-1">
                      <p
                        className="text-xs font-semibold text-white uppercase tracking-wide leading-snug"
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      >
                        {ingredient.Name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Number(ingredient.ABV) > 0 && (
                          <Badge>{Number(ingredient.ABV).toFixed(1)}%</Badge>
                        )}
                        {Number(ingredient.ABV) <= 0 && (
                          <Badge>Analcoholic</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}