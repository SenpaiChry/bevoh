// MenuDrinksPage.tsx
import React, { useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Search, Filter, X, Heart } from "lucide-react"
import { DrinkModel } from "@/models/drinks-models"
import { getDrinksCatalog } from "./ReadData"
import { Slider } from "@/components/ui/slider"

type DrinkCategory = "cocktail" | "beer" | "wine" | "shot" | "coffee" | "soft drink"

const CATEGORIES: { key: DrinkCategory; label: string; emoji: string }[] = [
  { key: "cocktail", label: "Cocktails", emoji: "🍸" },
  { key: "beer", label: "Beers", emoji: "🍺" },
  { key: "wine", label: "Wine", emoji: "🍷" },
  { key: "shot", label: "Shots", emoji: "🥃" },
  { key: "coffee", label: "Coffee", emoji: "☕" },
  { key: "soft drink", label: "Soft Drinks", emoji: "🥤" },
]

const LS_USER_RATINGS = "drinks:rating" // { [drinkId]: number }
const LS_REVIEWS = "drinks:reviews" // { [drinkId]: Review[] }

function clampRating(n: number) {
  return Math.max(0, Math.min(5, n))
}

type Review = {
  id: string
  name: string
  text: string
  rating: number
  createdAt: string
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function IBABadge({ iba }: { iba?: boolean }) {
  if (!iba) return null
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-white/5 border-white/10 text-foreground-muted">
      IBA
    </span>
  )
}

function AlcoholPill({ alcoholic }: { alcoholic?: boolean }) {
  if (typeof alcoholic !== "boolean") return null
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs border",
        alcoholic
          ? "bg-primary/10 border-primary/30 text-foreground"
          : "bg-white/5 border-white/10 text-foreground-muted",
      ].join(" ")}
    >
      {alcoholic ? "Alcoholic" : "Non-alcoholic"}
    </span>
  )
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

  // filters
  const [activeCategory, setActiveCategory] = useState<DrinkCategory | null>(null)
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 5])
  const [onlyFavorites, setOnlyFavorites] = useState(false) // optional if you still want it
  const [onlyIba, setOnlyIba] = useState(false) // assumes (drink as any).iba boolean

  // favorites
  const [favorites, setFavorites] = useState<Record<number, boolean>>({})

  // user ratings + reviews (for computing list rating)
  const [userRatings, setUserRatings] = useState<Record<number, number>>({})
  const [reviewsMap, setReviewsMap] = useState<Record<number, Review[]>>({})

  const listRef = useRef<HTMLDivElement | null>(null)

  React.useEffect(() => {
    setDrinks(getDrinksCatalog())

    const loadedRatings = safeParse<Record<number, number>>(localStorage.getItem(LS_USER_RATINGS), {})
    setUserRatings(loadedRatings)

    const loadedReviews = safeParse<Record<number, Review[]>>(localStorage.getItem(LS_REVIEWS), {})
    setReviewsMap(loadedReviews)
  }, [])

  const getBaseRating = (d: DrinkModel) =>
    typeof (d as any).rating === "number" ? clampRating((d as any).rating) : 0

  const getDrinkRating = (d: DrinkModel) => {
    // show: user's explicit rating if present, else average of reviews if any, else base rating
    const user = typeof userRatings[d.id] === "number" ? userRatings[d.id] : undefined
    if (typeof user === "number") return clampRating(user)

    const revs = reviewsMap[d.id] ?? []
    if (revs.length > 0) {
      const avg = revs.reduce((s, r) => s + clampRating(r.rating), 0) / revs.length
      return clampRating(avg)
    }

    return getBaseRating(d)
  }

  const drinksForView = useMemo(() => {
    const searchTrimmed = search.trim().toLowerCase()

    let base = activeCategory ? drinks.filter((d) => d.category == activeCategory) : [...drinks]

    if (searchTrimmed) {
      base = base.filter((d) => (d.name ?? "").toLowerCase().includes(searchTrimmed))
    }

    base = base.filter((d) => {
      const r = getDrinkRating(d)
      return r >= ratingRange[0] && r <= ratingRange[1]
    })

    if (onlyFavorites) {
      base = base.filter((d) => !!favorites[d.id])
    }

    if (onlyIba) {
      base = base.filter((d) => !!(d as any).iba)
    }

    // sort by rating desc then name
    base.sort((a, b) => {
      const ra = getDrinkRating(a)
      const rb = getDrinkRating(b)
      if (rb !== ra) return rb - ra
      return (a.name ?? "").localeCompare(b.name ?? "", "it", { sensitivity: "base" })
    })

    return base
  }, [drinks, search, activeCategory, ratingRange, onlyFavorites, onlyIba, favorites, userRatings, reviewsMap])

  const resetFilters = () => {
    setActiveCategory(null)
    setRatingRange([0, 5])
    setOnlyFavorites(false)
    setOnlyIba(false)
  }

  const clearSearch = () => setSearch("")

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 p-3 lg:px-8 border-b border-white/5">
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
            title="Toggle filters"
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

              {/* Categories */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {CATEGORIES.map((cat) => {
                  const isActive = cat.key === activeCategory
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory((prev) => (prev === cat.key ? null : cat.key))}
                      className={[
                        "relative bg-background rounded-2xl p-4 text-left transition-colors border flex items-center",
                        isActive ? "border-primary/40 bg-primary/10" : "border-white/10 hover:bg-white/5",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                          <span className="text-xl">{cat.emoji}</span>
                        </div>
                        <p className="font-semibold text-foreground truncate">{cat.label}</p>
                      </div>
                      {isActive && (
                        <span aria-hidden="true" className="ml-3 text-xl leading-none text-foreground-muted">
                          ×
                        </span>
                      )}
                    </button>
                  )
                })}
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

        {/* LIST: photo + name + alcoholic + numeric rating */}
        <section ref={listRef} className="mt-2">
          {drinksForView.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center border border-white/5">
              <p className="text-foreground-muted">No drinks found</p>
              <p className="text-foreground-muted">Write to us for adding a new drink!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {drinksForView.map((drink) => {
                const rating = getDrinkRating(drink)
                const wishlisted = !!favorites[drink.id]

                const onToggleWishlist = (e: React.MouseEvent) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setFavorites((prev) => {
                    const next = { ...prev, [drink.id]: !prev[drink.id] }
                    localStorage.setItem("drinks:favorite", JSON.stringify(next))
                    return next
                  })
                }

                return (
                  <Link
                    key={drink.id}
                    to={`/drink/${drink.id}`}
                    className="group block bg-card rounded-2xl overflow-hidden border border-white/5 hover:bg-card/80 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* IMAGE */}
                      <div className="relative w-full md:w-44 lg:w-52 shrink-0">
                        <div className="w-full aspect-[4/3] md:aspect-[3/4] bg-white/5 overflow-hidden">
                          {drink.img ? (
                            <img
                              src={drink.img}
                              alt={drink.name}
                              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl opacity-70">
                              🍹
                            </div>
                          )}
                        </div>

                        {/* ❤️ wishlist button (come snippet tuo) */}
                        <button
                          onClick={onToggleWishlist}
                          className="absolute top-3 right-3 w-8 h-8 rounded-3xl bg-background/80 backdrop-blur border border-white/10 flex items-center justify-center text-foreground/80 hover:text-foreground transition-colors"
                          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart size={18} className={wishlisted ? "fill-foreground" : ""} />
                        </button>
                      </div>

                      {/* CONTENT */}
                      <div className="flex-1 p-4 flex flex-col justify-between gap-4">
                        {/* Title + category */}
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground leading-tight break-words text-base md:text-lg">
                            {drink.name}
                          </p>

                          <p className="mt-1 text-sm text-foreground-muted capitalize">
                            {drink.category}
                          </p>

                          {/* rating sotto la categoria, centrato */}
                          <div className="md:mt-14 flex justify-center">
                            <span className="text-3xl font-semibold tabular-nums text-foreground">
                              {rating.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* bottom row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <AlcoholPill alcoholic={drink.alcoholic} />
                            <IBABadge iba={!!(drink as any).iba} />
                          </div>
                          <span className="text-xs text-foreground-muted">Tap to open →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
