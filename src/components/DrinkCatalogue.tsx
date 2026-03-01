import React, { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Filter, X, Heart } from "lucide-react"
import { DrinkModel } from "@/models/drinks-models"
import { Slider } from "@/components/ui/slider"
import { CategoryModel } from "@/models/category-models"

const API_BASE = "https://bevoh.altervista.org/api"
const CATEGORY_FALLBACK_IMG = "/assets/drinks/illegal.jpg"

// pagination
const PAGE_SIZE = 30

function clampRating(n: number) {
  const x = Number.isFinite(n) ? n : 0
  return Math.max(0, Math.min(5, x))
}

// prende il rating “come nella detail” (ma senza reviews, quindi solo dal drink)
function getDrinkRating(d: DrinkModel): number {
  const anyD = d as any

  // prova più possibili nomi campo che potrebbero arrivare dal backend
  const raw = anyD?.AvgRating ?? anyD?.avgRating ?? anyD?.rating ?? anyD?.Rating ?? 0

  return clampRating(Number(raw ?? 0))
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 bg-background rounded-xl px-3 py-2 border border-white/10">
      <p className="text-sm text-foreground">{label}</p>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative w-11 h-6 rounded-full transition-colors shrink-0",
          checked ? "bg-primary/60" : "bg-white/10",
        ].join(" ")}
        aria-pressed={checked}
        aria-label={label}
        title={label}
      >
        <span
          className={[
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </button>
    </div>
  )
}

export default function MenuDrinksPage() {
  const [drinks, setDrinks] = useState<DrinkModel[]>([])
  const [search, setSearch] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const [categories, setCategories] = useState<CategoryModel[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 5])
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [onlyIba, setOnlyIba] = useState(false)

  const listRef = useRef<HTMLDivElement | null>(null)

  const [favorites, setFavorites] = useState<Record<number, boolean>>({})

  // pagination state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [listLoading, setListLoading] = useState(false)

  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const listAbortRef = useRef<AbortController | null>(null)
  const listReqIdRef = useRef(0)

  async function getCategories(signal?: AbortSignal): Promise<void> {
    try {
      setCategoriesLoading(true)

      const url = `${API_BASE}/category/getCategories.php`
      const res = await fetch(url, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Errore API")

      const rows: CategoryModel[] = json.data ?? []

      const mapped: CategoryModel[] = rows.map((c) => ({
        Id: Number(c.Id),
        Name: c.Name,
        ImageUrl:
          c.ImageUrl && String(c.ImageUrl).trim() !== ""
            ? String(c.ImageUrl)
            : CATEGORY_FALLBACK_IMG,
      }))

      setCategories(mapped)
    } catch (e: any) {
      if (e?.name !== "AbortError") console.log(e)
    } finally {
      setCategoriesLoading(false)
    }
  }

  async function getListDrink(signal?: AbortSignal, opts?: { reset?: boolean }): Promise<void> {
    const reset = !!opts?.reset

    // prevent parallel fetches
    if (listLoading) return
    if (!reset && !hasMore) return

    // request id to avoid out-of-order updates
    const reqId = ++listReqIdRef.current

    try {
      setListLoading(true)

      const nextPage = reset ? 1 : page

      let url = `${API_BASE}/getDrinkPage.php?page=${nextPage}&pageSize=${PAGE_SIZE}`

      // aligned with your PHP: categoryId
      if (activeCategory != null && activeCategory > 0) url += `&categoryId=${activeCategory}`

      // optional server-side search (recommended with pagination)
      const q = search.trim()
      if (q) url += `&search=${encodeURIComponent(q)}`

      const res = await fetch(url, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Errore API")

      // ignore stale requests
      if (reqId !== listReqIdRef.current) return

      const rows: DrinkModel[] = json.data ?? []

      setDrinks((prev) => (reset ? rows : [...prev, ...rows]))

      // if API returns hasMore use it, else fallback to "rows == PAGE_SIZE"
      const hm = typeof json.hasMore === "boolean" ? json.hasMore : rows.length === PAGE_SIZE
      setHasMore(hm)

      setPage(reset ? 2 : nextPage + 1)
    } catch (e: any) {
      if (e?.name !== "AbortError") console.log(e)
    } finally {
      setListLoading(false)
    }
  }

  async function getFavouriteDrinks(signal?: AbortSignal): Promise<void> {
    try {
      const url = `${API_BASE}/getFavoriteDrinks.php`

      const res = await fetch(url, {
        signal,
        credentials: "include",
        headers: { Accept: "application/json" },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Errore API")

      const map: Record<number, boolean> = {}
      for (const r of json.data ?? []) {
        if (r?.Id != null) map[Number(r.Id)] = true
      }
      setFavorites(map)
    } catch (e: any) {
      if (e?.name !== "AbortError") console.log(e)
    }
  }

  async function toggleFavoriteOnServer(payload: {
    drinkId: number
    action: "add" | "remove"
    signal?: AbortSignal
  }) {
    const url = `${API_BASE}/toggleFavoriteDrink.php`

    const res = await fetch(url, {
      method: "POST",
      signal: payload.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ drinkId: payload.drinkId, action: payload.action }),
    })

    const json = await res.json().catch(() => null)

    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    if (!json?.ok) throw new Error(json?.error || "Errore API")

    return true
  }

  const handleToggleFavorite = async (drinkId: number) => {
    const wasFav = !!favorites[drinkId]
    const nextAction: "add" | "remove" = wasFav ? "remove" : "add"

    // optimistic UI
    setFavorites((prev) => {
      const next = { ...prev }
      if (wasFav) delete next[drinkId]
      else next[drinkId] = true
      return next
    })

    try {
      await toggleFavoriteOnServer({ drinkId, action: nextAction })
    } catch (e) {
      console.log(e)
      // rollback
      setFavorites((prev) => {
        const next = { ...prev }
        if (wasFav) next[drinkId] = true
        else delete next[drinkId]
        return next
      })
    }
  }

  // initial load
  React.useEffect(() => {
    const controller = new AbortController()
    getCategories(controller.signal)
    getFavouriteDrinks(controller.signal)
    return () => controller.abort()
  }, [])

  // refetch drinks when category changes
  // (and when search changes: with pagination, it's better server-side)
  React.useEffect(() => {
    // cancel previous list request
    listAbortRef.current?.abort()

    const controller = new AbortController()
    listAbortRef.current = controller

    // reset paging
    setDrinks([])
    setPage(1)
    setHasMore(true)

    // load first page
    getListDrink(controller.signal, { reset: true })

    return () => controller.abort()
  }, [activeCategory, search])

  // infinite scroll sentinel
  React.useEffect(() => {
    const el = loadMoreRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (listLoading) return
        if (!hasMore) return

        // load next page
        getListDrink(listAbortRef.current?.signal)
      },
      { rootMargin: "800px" } // load a bit before reaching the bottom
    )

    obs.observe(el)
    return () => obs.disconnect()
  }, [listLoading, hasMore, page, activeCategory, search])

  const drinksForView = useMemo(() => {
    const searchTrimmed = search.trim().toLowerCase()
    let base = [...drinks]

    // NOTE:
    // If search is already applied server-side, this filter becomes redundant but harmless.
    if (searchTrimmed) {
      base = base.filter((d) => (d.Name ?? "").toLowerCase().includes(searchTrimmed))
    }

    // ✅ rating filter (real rating)
    base = base.filter((d) => {
      const r = getDrinkRating(d)
      return r >= ratingRange[0] && r <= ratingRange[1]
    })

    if (onlyFavorites) base = base.filter((d) => !!favorites[d.Id])
    if (onlyIba) base = base.filter((d) => !!(d as any).iba)

    // ✅ rating sort (real rating)
    base.sort((a, b) => {
      const ra = getDrinkRating(a)
      const rb = getDrinkRating(b)
      if (rb !== ra) return rb - ra
      return (a.Name ?? "").localeCompare(b.Name ?? "", "it", { sensitivity: "base" })
    })

    return base
  }, [drinks, search, ratingRange, onlyFavorites, onlyIba, favorites])

  const resetFilters = () => {
    setActiveCategory(null)
    setRatingRange([0, 5])
    setOnlyFavorites(false)
    setOnlyIba(false)
  }

  const clearSearch = () => setSearch("")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-30 p-3 lg:px-8 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card rounded-2xl py-3 pl-12 pr-12 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {search.trim().length > 0 && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground-muted hover:text-foreground transition-colors"
                aria-label="Clear search"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={[
              "shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-2xl border transition-colors",
              showFilters
                ? "bg-primary/10 border-primary/40 text-foreground"
                : "bg-card border-white/5 text-foreground-muted hover:bg-card/80",
            ].join(" ")}
            aria-label="Toggle filters"
            title={showFilters ? "Hide filters" : "Show filters"}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-5 pb-24 lg:px-8 pt-4">
        {showFilters && (
          <section className="mb-5">
            <div className="bg-card rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between gap-3 mb-4">
                <p className="font-semibold text-foreground">Filters</p>
                <button type="button" onClick={resetFilters} className="text-xs text-foreground-muted hover:underline">
                  Reset
                </button>
              </div>

              {/* Categories (API) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {categoriesLoading ? (
                  <div className="col-span-2 md:col-span-4 text-sm text-foreground-muted">
                    Loading categories...
                  </div>
                ) : (
                  categories.map((cat) => {
                    const isActive = cat.Id === activeCategory
                    return (
                      <button
                        key={cat.Id}
                        onClick={() => setActiveCategory((prev) => (prev === cat.Id ? null : cat.Id))}
                        className={[
                          "relative bg-background rounded-2xl p-3 text-left transition-colors border",
                          isActive ? "border-primary/40 bg-primary/10" : "border-white/10 hover:bg-white/5",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={cat.ImageUrl}
                            alt={cat.Name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0"
                            loading="lazy"
                            onError={(e) => {
                              const img = e.currentTarget
                              if (img.src.includes(CATEGORY_FALLBACK_IMG)) return
                              img.src = CATEGORY_FALLBACK_IMG
                            }}
                          />
                          <p className="font-semibold text-foreground truncate flex-1">{cat.Name}</p>
                          {isActive && (
                            <span aria-hidden="true" className="ml-2 text-lg leading-none text-foreground-muted">
                              ×
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })
                )}
              </div>

              {/* Rating range + switches */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-background rounded-xl px-3 py-2 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-foreground">Rating</p>
                    <p className="text-xs text-foreground-muted tabular-nums">
                      {ratingRange[0].toFixed(1)} – {ratingRange[1].toFixed(1)}
                    </p>
                  </div>
                  <Slider
                    value={ratingRange}
                    onValueChange={(v) => setRatingRange([v[0], v[1]] as [number, number])}
                    min={0}
                    max={5}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-foreground-muted tabular-nums">
                    <span>0.0</span>
                    <span>5.0</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
                  <Switch checked={onlyFavorites} onChange={setOnlyFavorites} label="Favorites" />
                  <Switch checked={onlyIba} onChange={setOnlyIba} label="IBA" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* LIST: photo + name + rating */}
        <section ref={listRef} className="mt-2">
          {drinksForView.length === 0 && !listLoading ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-white/5">
              <p className="text-foreground-muted">No drinks found</p>
              <p className="text-foreground-muted">Write to us for adding a new drink!</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
                {drinksForView.map((drink) => {
                  const rating = getDrinkRating(drink)
                  const wishlisted = !!favorites[drink.Id]

                  const onToggleWishlist = (e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleToggleFavorite(drink.Id)
                  }

                  return (
                    <Link
                      key={drink.Id}
                      to={`/drink/${drink.Id}`}
                      className="group relative block overflow-hidden rounded-3xl border border-white/5 bg-card"
                    >
                      <div className="relative w-full aspect-[3/4] bg-white/5">
                        {drink.ImageUrl ? (
                          <img
                            src={drink.ImageUrl}
                            alt={drink.Name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            style={{ objectPosition: "50% 100%" }}
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-6xl opacity-70">🍹</div>
                        )}

                        {/* ❤️ HEART */}
                        <button
                          onClick={onToggleWishlist}
                          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 backdrop-blur border border-white/20 text-white hover:bg-black/70 transition-colors"
                          aria-label={wishlisted ? "Remove from favorites" : "Add to favorites"}
                          title={wishlisted ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Heart size={18} className={wishlisted ? "fill-white" : ""} />
                        </button>

                        {/* BOTTOM OVERLAY */}
                        <div className="absolute inset-x-0 bottom-0 z-10">
                          <div className="absolute inset-x-0 bottom-0 h-[80%] bg-black" />
                          <div className="absolute inset-x-0 bottom-[80%] h-[20%] bg-gradient-to-t from-black to-transparent" />

                          <div className="relative px-4 h-16 flex items-center">
                            <div className="w-full flex gap-3">
                              <p
                                className="flex-[8] text-sm md:text-base font-medium tracking-wide text-white uppercase leading-snug pt-2"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {drink.Name}
                              </p>

                              <div className="flex-1 flex items-center justify-end pt-2">
                                <span className="text-lg md:text-2xl font-semibold tabular-nums text-white">
                                  {rating.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <div ref={loadMoreRef} className="h-10" />

              {listLoading && <div className="mt-4 text-center text-sm text-foreground-muted">Loading more...</div>}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
