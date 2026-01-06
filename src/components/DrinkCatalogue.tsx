"use client"

import React, { useMemo, useRef, useState } from "react"
import { Search } from "lucide-react"
import { DrinkModel } from "@/models/drinks-models"
import { getDrinksCatalog } from "./ReadData"

type DrinkCategory = "cocktail" | "beer" | "wine" | "shot" | "coffee" | "soft drink"

const CATEGORIES: { key: DrinkCategory; label: string; emoji: string }[] = [
  { key: "cocktail", label: "Cocktails", emoji: "🍸" },
  { key: "beer", label: "Beers", emoji: "🍺" },
  { key: "wine", label: "Wine", emoji: "🍷" },
  { key: "shot", label: "Shots", emoji: "🥃" },
  { key: "coffee", label: "Coffee", emoji: "☕" },
  { key: "soft drink", label: "Soft Drinks", emoji: "🥤" },
]

// --- UI helpers ---
function RatingStars({ value }: { value?: number }) {
  const v = typeof value === "number" ? Math.max(0, Math.min(5, value)) : 0
  const full = Math.floor(v)
  const half = v - full >= 0.5 ? 1 : 0
  const empty = 5 - full - half

  // Stelline "semplici" senza dipendenze
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${v} su 5`}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={`f-${i}`} className="text-yellow-400">★</span>
      ))}
      {half ? <span className="text-yellow-400">☆</span> : null}
      {Array.from({ length: empty }).map((_, i) => (
        <span key={`e-${i}`} className="text-foreground-muted/40">★</span>
      ))}
      <span className="ml-2 text-xs text-foreground-muted">{v.toFixed(v % 1 === 0 ? 0 : 1)}/5</span>
    </div>
  )
}

function AlcoholBadge({ alcoholic }: { alcoholic?: boolean }) {
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

export default function MenuDrinksPage() {
  const [drinks, setDrinks] = useState<DrinkModel[]>([])

  React.useEffect(() => {
    setDrinks(getDrinksCatalog())
  }, [])

  const [activeCategory, setActiveCategory] = useState<DrinkCategory>("cocktail")

  // Cerca "prima"
  const [searchTop, setSearchTop] = useState("")
  // Cerca "dopo"
  const [searchList, setSearchList] = useState("")

  // per "mostra altro/meno" descrizione
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const listRef = useRef<HTMLDivElement | null>(null)

  const visibleCategories = useMemo(() => {
    const q = searchTop.trim().toLowerCase()
    if (!q) return CATEGORIES
    return CATEGORIES.filter((c) => c.label.toLowerCase().includes(q) || c.key.toLowerCase().includes(q))
  }, [searchTop])

  const drinksForCategory = useMemo(() => {
    const q = searchList.trim().toLowerCase()

    const base = drinks.filter((d) => d.category === activeCategory)

    if (!q) return base

    return base.filter((d) => {
      const name = (d.name ?? "").toLowerCase()
      const cat = (d.category ?? "").toLowerCase()
      const desc = ((d as any).description ?? "").toLowerCase()
      return name.includes(q) || cat.includes(q) || desc.includes(q)
    })
  }, [drinks, activeCategory, searchList]) // ✅ drinks mancava

  const onPickCategory = (cat: DrinkCategory) => {
    setActiveCategory(cat)
    setSearchList("")
    // requestAnimationFrame(() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
  }

  const activeMeta = CATEGORIES.find((c) => c.key === activeCategory)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 p-3 lg:px-8 border-b border-white/5">
        {/* SEARCH #1 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTop}
            onChange={(e) => setSearchTop(e.target.value)}
            className="w-full bg-card rounded-2xl py-3 pl-12 pr-4 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </header>

      <main className="px-5 pb-24 lg:px-8 pt-4">
        {/* Category buttons */}
        <section className="mb-5">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {visibleCategories.map((cat) => {
              const isActive = cat.key === activeCategory
              return (
                <button
                  key={cat.key}
                  onClick={() => onPickCategory(cat.key)}
                  className={[
                    "bg-card rounded-2xl p-4 text-left transition-colors border",
                    isActive ? "border-primary/40 bg-primary/10" : "border-white/5 hover:bg-card/80",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                      <span className="text-xl">{cat.emoji}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{cat.label}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {visibleCategories.length === 0 && (
            <div className="bg-card rounded-2xl p-6 text-center mt-3">
              <p className="text-foreground-muted">No categories found</p>
            </div>
          )}
        </section>

        {/* List section */}
        <section ref={listRef} className="mt-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">{activeMeta?.label}</h2>
              <p className="text-sm text-foreground-muted">{drinksForCategory.length} items</p>
            </div>
          </div>

          {/* SEARCH #2 */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              placeholder={`Search in ${activeMeta?.label.toLowerCase()}...`}
              value={searchList}
              onChange={(e) => setSearchList(e.target.value)}
              className="w-full bg-card rounded-2xl py-3 pl-12 pr-4 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {drinksForCategory.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">{activeMeta?.emoji}</div>
              <p className="text-foreground-muted">No drinks found in this category</p>
              <p className="text-sm text-foreground-muted/70">Try changing search or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {drinksForCategory.map((drink) => {
                const description = (drink as any).description as string | undefined
                const rating = (drink as any).rating as number | undefined
                const alcoholic = (drink as any).alcoholic as boolean | undefined

                const isExpanded = !!expanded[drink.id]
                const short = description && description.length > 110 ? description.slice(0, 110) + "..." : description

                return (
                  <div
                    key={drink.id}
                    className="bg-card rounded-2xl p-4 text-left hover:bg-card/80 transition-colors border border-white/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{drink.name}</p>
                        <p className="text-sm text-foreground-muted">{drink.category}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <AlcoholBadge alcoholic={alcoholic} />
                        <RatingStars value={rating} />
                      </div>
                    </div>

                    {description ? (
                      <div className="mt-3">
                        <p className="text-sm text-foreground-muted leading-relaxed">
                          {isExpanded ? description : short}
                        </p>
                        {description.length > 110 ? (
                          <button
                            type="button"
                            onClick={() => setExpanded((prev) => ({ ...prev, [drink.id]: !prev[drink.id] }))}
                            className="mt-2 text-xs text-primary hover:underline"
                          >
                            {isExpanded ? "Mostra meno" : "Mostra altro"}
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
