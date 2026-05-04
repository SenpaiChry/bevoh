import React, { useEffect, useRef, useState, useCallback } from "react"
import { Plus, Pencil, Search, X, Image as ImageIcon, Save, ChevronDown, ChevronUp, Loader2, EyeOff, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { YesNoModal } from "./YesNoModal"

const API_BASE = "https://bevoh.altervista.org/api"
const FALLBACK_IMG = "/assets/drinks/illegal.jpg"

// ─── Types ────────────────────────────────────────────────────────────────────

interface IngredientMaster {
  Id: number
  Name: string
  ABV: number
  ImageUrl?: string
}

// Una riga ingrediente nel form: riferimento all'Ingredient + quantità + UM
interface DrinkIngredientRow {
  IdIngredient: number
  Name: string   // solo per display, non mandato al backend
  ABV: number    // solo per display
  Quantity: string
  UM: string
}

interface Drink {
  Id: number
  IdCategory: number
  Name: string
  Category?: string
  Description?: string | null
  Garnish?: string | null
  ImageUrl?: string | null
  IBA?: boolean | number
  ABV?: number | string
  Active?: boolean | number
  AvgRating?: number
  ingredients?: DrinkIngredientRow[]
  [key: string]: any
}

interface Category {
  Id: number
  Name: string
  ImageUrl?: string
}

// ─── Category dropdown (custom, no native select) ─────────────────────────────

function CategoryDropdown({
  categories,
  value,
  onChange,
}: {
  categories: Category[]
  value: string
  onChange: (name: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = categories.find((c) => c.Name.toLowerCase() === value.toLowerCase())

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white hover:bg-white/10 transition min-w-[140px]"
      >
        <span className="flex-1 text-left truncate">
          {selected ? selected.Name : "All categories"}
        </span>
        <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-48 max-h-64 overflow-y-auto rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false) }}
            className={[
              "w-full text-left px-4 py-2.5 text-sm transition",
              value === "" ? "text-white bg-white/10" : "text-white/60 hover:bg-white/5 hover:text-white",
            ].join(" ")}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c.Id}
              type="button"
              onClick={() => { onChange(c.Name); setOpen(false) }}
              className={[
                "w-full text-left px-4 py-2.5 text-sm transition",
                value.toLowerCase() === c.Name.toLowerCase() ? "text-white bg-white/10" : "text-white/60 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              {c.Name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
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
        className="relative w-full max-w-2xl bg-[#0f0f0f] rounded-3xl border border-white/10 shadow-2xl my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ─── Ingredient search combobox ───────────────────────────────────────────────

function IngredientCombobox({
  allIngredients,
  onSelect,
}: {
  allIngredients: IngredientMaster[]
  onSelect: (ing: IngredientMaster) => void
}) {
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.trim()
    ? allIngredients.filter((i) =>
        i.Name.toLowerCase().includes(query.toLowerCase())
      )
    : allIngredients

  // close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="flex gap-2">
        <input
          className={inputCls}
          placeholder="Search ingredient…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 px-3 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-white/30">No ingredients found</p>
          ) : (
            filtered.map((ing) => (
              <button
                key={ing.Id}
                type="button"
                onClick={() => {
                  onSelect(ing)
                  setQuery("")
                  setOpen(false)
                }}
                className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-white hover:bg-white/5 transition text-left"
              >
                <span>{ing.Name}</span>
                <span className="text-xs text-white/30 shrink-0">{ing.ABV}% ABV</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Single ingredient row (already added) ────────────────────────────────────

function IngredientRow({
  row,
  onChange,
  onRemove,
}: {
  row: DrinkIngredientRow
  onChange: (field: "Quantity" | "UM", val: string) => void
  onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-[1fr_90px_70px_32px] gap-2 items-center">
      {/* Name (read-only) */}
      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 min-w-0">
        <span className="text-sm text-white truncate flex-1">{row.Name}</span>
        <span className="text-[10px] text-white/30 shrink-0">{row.ABV}%</span>
      </div>

      {/* Quantity */}
      <input
        className={inputCls}
        placeholder="Qty"
        value={row.Quantity}
        onChange={(e) => onChange("Quantity", e.target.value)}
      />

      {/* UM */}
      <input
        className={inputCls}
        placeholder="UM"
        value={row.UM}
        onChange={(e) => onChange("UM", e.target.value)}
      />

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="flex items-center justify-center h-8 w-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/25 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Drink form modal ─────────────────────────────────────────────────────────

interface DrinkModalProps {
  initial?: Drink
  categories: Category[]
  allIngredients: IngredientMaster[]
  onClose: () => void
  onSave: (data: Partial<Drink>, imageFile: File | null) => Promise<void>
}

function DrinkModal({ initial, categories, allIngredients, onClose, onSave }: DrinkModalProps) {
  const isNew = !initial?.Id

  const [form, setForm] = useState<Partial<Drink>>({
    IdCategory: initial?.IdCategory ?? 0,
    Name:        initial?.Name        ?? "",
    Description: initial?.Description ?? "",
    Garnish:     initial?.Garnish     ?? "",
    IBA:         initial?.IBA         ? true : false,
    ABV:         initial?.ABV         ?? "",
    Active:      initial?.Active !== undefined ? !!initial.Active : true,
    ...(initial?.Id ? { Id: initial.Id } : {}),
  })

  const [ingredients, setIngredients] = useState<DrinkIngredientRow[]>(
    initial?.ingredients ?? []
  )

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(initial?.ImageUrl ?? "")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showIngredients, setShowIngredients] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof Drink, val: any) => setForm((p) => ({ ...p, [key]: val }))

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const addIngredient = (ing: IngredientMaster) => {
    // evita duplicati
    if (ingredients.some((r) => r.IdIngredient === ing.Id)) return
    setIngredients((p) => [
      ...p,
      { IdIngredient: ing.Id, Name: ing.Name, ABV: ing.ABV, Quantity: "", UM: "" },
    ])
  }

  const updateIngredient = (i: number, field: "Quantity" | "UM", val: string) => {
    setIngredients((p) => p.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)))
  }

  const removeIngredient = (i: number) => {
    setIngredients((p) => p.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async () => {
    if (!form.Name?.trim()) { setError("Name is required."); return }
    if (!form.IdCategory || form.IdCategory === 0) { setError("Category is required."); return }

    setSaving(true)
    setError(null)
    try {
      await onSave({ ...form, ingredients }, imageFile)
    } catch (e: any) {
      setError(e?.message || "Error saving drink.")
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-white/5">
        <h2 className="text-base font-semibold text-white">
          {isNew ? "New drink" : `Edit — ${initial?.Name}`}
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
            className="w-20 h-28 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-white/30 transition"
            onClick={() => fileRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = FALLBACK_IMG }} />
            ) : (
              <ImageIcon className="w-7 h-7 text-white/20" />
            )}
          </div>
          <div className="flex-1 space-y-3">
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
            {/* <Field label="Or image URL">
              <input
                className={inputCls}
                placeholder="assets/cocktails/negroni.png"
                value={imageFile ? "" : (form.ImageUrl ?? "")}
                onChange={(e) => {
                  set("ImageUrl", e.target.value)
                  if (!imageFile) setImagePreview(e.target.value)
                }}
              />
            </Field> */}
          </div>
        </div>

        {/* Name */}
        <Field label="Name *">
          <input className={inputCls} placeholder="Drink name" value={form.Name ?? ""} onChange={(e) => set("Name", e.target.value)} />
        </Field>

        {/* Category + ABV */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category *">
            <CategoryDropdown
              categories={categories}
              value={form.IdCategory.toString() ?? ""}
              onChange={(id) => set("IdCategory", id)}
            />
          </Field>
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
        </div>

        {/* Description */}
        <Field label="Description">
          <textarea
            className={`${inputCls} resize-none h-20`}
            placeholder="Description…"
            value={form.Description ?? ""}
            onChange={(e) => set("Description", e.target.value)}
          />
        </Field>

        {/* Garnish */}
        <Field label="Garnish">
          <input
            className={inputCls}
            placeholder="Garnish…"
            value={form.Garnish ?? ""}
            onChange={(e) => set("Garnish", e.target.value)}
          />
        </Field>

        {/* Flags */}
        <div className="flex gap-5">
          {([
            { key: "IBA",    label: "IBA"    },
            { key: "Active", label: "Active" },
          ] as { key: keyof Drink; label: string }[]).map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => set(key, !form[key])}
                className={[
                  "relative w-9 h-5 rounded-full transition-colors cursor-pointer",
                  form[key] ? "bg-primary/60" : "bg-white/10",
                ].join(" ")}
              >
                <span className={[
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                  form[key] ? "translate-x-4" : "translate-x-0",
                ].join(" ")} />
              </div>
              <span className="text-sm text-white/60">{label}</span>
            </label>
          ))}
        </div>

        {/* Ingredients */}
        <div>
          <button
            type="button"
            onClick={() => setShowIngredients((v) => !v)}
            className="w-full flex items-center justify-between gap-2 py-2 text-sm font-semibold text-white/50 hover:text-white transition"
          >
            <span>Ingredients ({ingredients.length})</span>
            {showIngredients ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showIngredients && (
            <div className="space-y-2 mt-2">
              {/* Search & add from master list */}
              <IngredientCombobox allIngredients={allIngredients} onSelect={addIngredient} />

              {/* Header labels */}
              {ingredients.length > 0 && (
                <div className="grid grid-cols-[1fr_90px_70px_32px] gap-2 mt-3">
                  {["Ingredient", "Qty", "UM", ""].map((h, i) => (
                    <p key={i} className="text-[10px] text-white/25 uppercase font-semibold px-1">{h}</p>
                  ))}
                </div>
              )}

              {/* Rows */}
              {ingredients.map((row, i) => (
                <IngredientRow
                  key={row.IdIngredient}
                  row={row}
                  onChange={(field, val) => updateIngredient(i, field, val)}
                  onRemove={() => removeIngredient(i)}
                />
              ))}

              {ingredients.length === 0 && (
                <p className="text-sm text-white/25 py-2">Search and select ingredients above.</p>
              )}
            </div>
          )}
        </div>

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

export default function DrinksAdminPage() {
  const [drinks, setDrinks] = useState<Drink[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [allIngredients, setAllIngredients] = useState<IngredientMaster[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("")

  const [editTarget, setEditTarget] = useState<Drink | null>(null)
  const [isNew, setIsNew] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Drink | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // ── Fetch all drinks (all pages) ───────────────────────────────────────────
  const fetchDrinks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    try {
      let page = 1
      let all: Drink[] = []
      let hasMore = true
      while (hasMore) {
        const res = await fetch(`${API_BASE}/getDrinkPage.php?page=${page}&pageSize=100`, { signal })
        const json = await res.json()
        if (!json?.ok) break
        const rows: Drink[] = (json.data ?? []).map((d: any) => ({
          ...d,
          Id:         Number(d.Id),
          IdCategory: Number(d.IdCategory ?? 0),
          IBA:        !!d.IBA,
          Active:     d.Active !== undefined ? !!d.Active : true,
          ABV:        d.ABV ?? 0,
        }))
        all = [...all, ...rows]
        hasMore = typeof json.hasMore === "boolean" ? json.hasMore : rows.length === 100
        page++
      }
      setDrinks(all)
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Fetch categories ───────────────────────────────────────────────────────
  const fetchCategories = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE}/category/getCategories.php`, { signal })
      const json = await res.json()
      if (json?.ok) setCategories(json.data ?? [])
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error(e)
    }
  }, [])

  // ── Fetch master ingredient list ───────────────────────────────────────────
  const fetchIngredients = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch(`${API_BASE}/admin/getIngredients.php`, { signal, credentials: "include" })
      const json = await res.json()
      if (json?.ok) setAllIngredients(json.data ?? [])
    } catch (e: any) {
      if (e?.name !== "AbortError") console.error(e)
    }
  }, [])

  useEffect(() => {
    const ctrl = new AbortController()
    fetchDrinks(ctrl.signal)
    fetchCategories(ctrl.signal)
    fetchIngredients(ctrl.signal)
    return () => ctrl.abort()
  }, [])

  // ── Fetch single drink with ingredients (for edit) ─────────────────────────
  const fetchDrinkDetail = async (drinkId: number): Promise<Drink | null> => {
    try {
      const res = await fetch(`${API_BASE}/singleDrink.php?drinkId=${drinkId}`, { credentials: "include" })
      const json = await res.json()
      if (!json?.ok) return null

      const d = json.data
      // Mappa gli ingredienti dal formato backend → DrinkIngredientRow
      const ings: DrinkIngredientRow[] = (d.ingredients ?? []).map((ing: any) => ({
        IdIngredient: Number(ing.Id ?? ing.IdIngredient),
        Name:         ing.Name ?? "",
        ABV:          Number(ing.ABV ?? 0),
        Quantity:     String(ing.Quantity ?? ""),
        UM:           String(ing.UM ?? ""),
      }))

      return {
        ...d,
        Id:          Number(d.Id),
        IdCategory:  Number(d.IdCategory ?? 0),
        IBA:         !!d.IBA,
        Active:      d.Active !== undefined ? !!d.Active : true,
        ingredients: ings,
      }
    } catch {
      return null
    }
  }

  const openEdit = async (drink: Drink) => {
    const detail = await fetchDrinkDetail(drink.Id)
    setEditTarget(detail ?? drink)
  }

  // ── Save (add / edit) ──────────────────────────────────────────────────────
  const handleSave = async (data: Partial<Drink>, imageFile: File | null) => {
    const isEditing = !!data.Id

    // 1) Prima salva il drink (add o update)
    const url = isEditing
      ? `${API_BASE}/admin/updateDrink.php`
      : `${API_BASE}/admin/addDrink.php`

    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(data),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`)

    const savedId: number = isEditing ? (data.Id as number) : json.id

    // 2) Se c'è un file immagine, fai upload ora che abbiamo l'ID
    if (imageFile && savedId) {
      const fd = new FormData()
      fd.append("image", imageFile)
      fd.append("drinkId", String(savedId))
      const imgRes = await fetch(`${API_BASE}/admin/uploadDrinkImage.php`, {
        method: "POST",
        credentials: "include",
        body: fd,
      })
      const imgJson = await imgRes.json().catch(() => null)
      if (!imgRes.ok || !imgJson?.ok) {
        // Upload immagine fallito: il drink è comunque salvato, avvisiamo
        throw new Error(`Drink saved (id ${savedId}) but image upload failed: ${imgJson?.error ?? "unknown"}`)
      }
    }

    await fetchDrinks()
    setEditTarget(null)
    setIsNew(false)
  }

  // ── Toggle Active ────────────────────────────────────────────────────────
  const handleToggleActive = async (drink: Drink) => {
    // Optimistic update
    setDrinks((prev) =>
      prev.map((d) => d.Id === drink.Id ? { ...d, Active: !d.Active } : d)
    )
    try {
      const res = await fetch(`${API_BASE}/admin/updateDrink.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ Id: drink.Id, IdCategory: drink.IdCategory, Name: drink.Name, Active: !drink.Active }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error)
    } catch {
      // rollback
      setDrinks((prev) =>
        prev.map((d) => d.Id === drink.Id ? { ...d, Active: drink.Active } : d)
      )
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch(`${API_BASE}/admin/deleteDrink.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ Id: deleteTarget.Id }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || `HTTP ${res.status}`)
      setDrinks((prev) => prev.filter((d) => d.Id !== deleteTarget.Id))
      setDeleteTarget(null)
    } catch (e: any) {
      setDeleteError(e?.message || "Error deleting drink.")
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = drinks.filter((d) => {
    const matchSearch = (d.Name ?? "").toLowerCase().includes(search.trim().toLowerCase())
    const matchCat    = filterCategory === "" || (d.Category ?? "").toLowerCase() === filterCategory.toLowerCase()
    return matchSearch && matchCat
  })

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* Modals */}
      {(editTarget || isNew) && (
        <DrinkModal
          initial={isNew ? undefined : (editTarget ?? undefined)}
          categories={categories}
          allIngredients={allIngredients}
          onClose={() => { setEditTarget(null); setIsNew(false) }}
          onSave={handleSave}
        />
      )}

      <YesNoModal
        title="Delete drink"
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
          {/* Search */}
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

          {/* Category filter */}
          <CategoryDropdown
            categories={categories}
            value={filterCategory}
            onChange={setFilterCategory}
          />

          {/* Count + Add */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <span className="text-xs text-white/25 hidden sm:block tabular-nums">
              {filtered.length} drink{filtered.length !== 1 ? "s" : ""}
            </span>
            <Button onClick={() => setIsNew(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add drink</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main grid */}
      <main className="px-5 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/5 aspect-[3/4] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
            <div className="text-6xl opacity-30">🍹</div>
            <p className="text-white/30 text-sm">No drinks found.</p>
            <Button onClick={() => setIsNew(true)} size="sm" className="gap-1.5 mt-1">
              <Plus className="w-4 h-4" /> Add first drink
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {filtered.map((drink) => (
              <div
                key={drink.Id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-[#111] cursor-pointer"
              >
                <div className="relative w-full aspect-[3/4] bg-white/5">
                  {/* Image */}
                  {drink.ImageUrl ? (
                    <img
                      src={drink.ImageUrl}
                      alt={drink.Name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      style={{ objectPosition: "50% 100%" }}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget
                        if (!img.src.includes(FALLBACK_IMG)) img.src = FALLBACK_IMG
                      }}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-4xl opacity-20">🍹</div>
                  )}

                  {/* Inactive badge */}
                  {!drink.Active && (
                    <div className="absolute top-2 left-2 z-20 bg-red-500/80 rounded-lg px-2 py-0.5 text-[10px] font-semibold text-white">
                      Inactive
                    </div>
                  )}

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 z-10 px-3">
                    <button
                      type="button"
                      onClick={() => openEdit(drink)}
                      className="w-full flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-medium transition"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleToggleActive(drink) }}
                      className={[
                        "w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border transition",
                        drink.Active
                          ? "bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/25 text-yellow-400"
                          : "bg-green-500/10 hover:bg-green-500/20 border-green-500/25 text-green-400",
                      ].join(" ")}
                    >
                      {drink.Active
                        ? <><EyeOff className="w-3.5 h-3.5" /> Deactivate</>
                        : <><Eye className="w-3.5 h-3.5" /> Activate</>
                      }
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(drink) }}
                      className="w-full flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 rounded-xl px-3 py-2 text-xs font-medium text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>

                  {/* Bottom info overlay */}
                  <div className="absolute inset-x-0 bottom-0 z-[5] pointer-events-none">
                    <div className="absolute inset-x-0 bottom-0 h-[65%] bg-black" />
                    <div className="absolute inset-x-0 bottom-[65%] h-[20%] bg-gradient-to-t from-black to-transparent" />
                    <div className="relative px-3 pb-3 pt-1">
                      <p
                        className="text-xs font-semibold text-white uppercase tracking-wide leading-snug"
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      >
                        {drink.Name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {drink.Category && <Badge>{drink.Category}</Badge>}
                        {drink.IBA && <Badge>IBA</Badge>}
                        {drink.ABV !== undefined && Number(drink.ABV) > 0 && (
                          <Badge>{Number(drink.ABV).toFixed(1)}%</Badge>
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