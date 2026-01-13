// DrinkDetailPage.tsx
import React, { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { DrinkModel } from "@/models/drinks-models"
import { getDrinksCatalog } from "./ReadData"
import { Button } from "@/components/ui/button"

const LS_USER_RATINGS = "drinks:rating"
const LS_REVIEWS = "drinks:reviews"

function clampRating(n: number) {
  const x = Number.isFinite(n) ? n : 0
  return Math.max(0, Math.min(5, x))
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

function resolveImgSrc(img?: unknown): string | null {
  if (typeof img !== "string") return null
  const s = img.trim()
  if (!s) return null
  if (s.startsWith("http://") || s.startsWith("https://")) return s
  if (s.startsWith("/")) return s
  return `/${s}`
}

export default function DrinkDetailPage() {
  const params = useParams()
  const id = Number(params.id)

  // ✅ on open: scroll to top
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [id])

  const drink: DrinkModel | undefined = useMemo(() => {
    const all = getDrinksCatalog()
    return all.find((d) => d.id === id)
  }, [id])

  const [userRatings, setUserRatings] = useState<Record<number, number>>(() =>
    safeParse(localStorage.getItem(LS_USER_RATINGS), {})
  )
  const [reviewsMap, setReviewsMap] = useState<Record<number, Review[]>>(() =>
    safeParse(localStorage.getItem(LS_REVIEWS), {})
  )

  const [name, setName] = useState("")
  const [text, setText] = useState("")
  const [newReviewRating, setNewReviewRating] = useState<number>(4.0)
  const [imgFailed, setImgFailed] = useState(false)

  if (!drink || Number.isNaN(id)) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Link to="/drinks" className="text-primary hover:underline inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="mt-6 bg-card border border-white/5 rounded-2xl p-6">
          <p className="text-foreground">Drink not found</p>
        </div>
      </div>
    )
  }

  const reviews = reviewsMap[drink.id] ?? []
  const baseRating = typeof (drink as any).rating === "number" ? clampRating((drink as any).rating) : 0
  const userRating = typeof userRatings[drink.id] === "number" ? clampRating(userRatings[drink.id]) : undefined
  const avgReviews =
    reviews.length > 0
      ? clampRating(reviews.reduce((s, r) => s + clampRating(r.rating), 0) / reviews.length)
      : undefined
  const displayedRating = userRating ?? avgReviews ?? baseRating

  const ingredients: string[] = Array.isArray((drink as any).ingredients)
    ? ((drink as any).ingredients as string[])
    : []

  const imgSrc = resolveImgSrc((drink as any).img)

  const saveUserRating = (value: number) => {
    const next = { ...userRatings, [drink.id]: clampRating(value) }
    setUserRatings(next)
    localStorage.setItem(LS_USER_RATINGS, JSON.stringify(next))
  }

  const addReview = () => {
    const n = name.trim()
    const t = text.trim()
    if (!n || !t) return

    const newReview: Review = {
      id: (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`) as string,
      name: n,
      text: t,
      rating: clampRating(newReviewRating),
      createdAt: new Date().toISOString(),
    }

    const nextForDrink = [newReview, ...reviews]
    const next = { ...reviewsMap, [drink.id]: nextForDrink }
    setReviewsMap(next)
    localStorage.setItem(LS_REVIEWS, JSON.stringify(next))

    setName("")
    setText("")
    setNewReviewRating(4.0)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 p-4 lg:px-8 border-b border-white/5">
        <Link
          to="/drinks"
          className="inline-flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </Link>
      </header>

      <main className="px-5 pb-24 lg:px-8 pt-4">
        {/* ✅ PC: sinistra (nome+foto) | destra (info) + sotto (reviews) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: name + image */}
          <aside className="lg:col-span-5 space-y-6">
            {/* Name (sezione separata) */}
            <section className="bg-card rounded-2xl border border-white/5 p-5">
              <h1 className="text-2xl font-semibold text-foreground break-words">{drink.name}</h1>
            </section>

            {/* Image (sezione separata) */}
            <section className="bg-card rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-white/5 flex items-center justify-center">
                {imgSrc && !imgFailed ? (
                  <img
                    src={imgSrc}
                    alt=""
                    className="w-full max-h-[75vh] object-contain"
                    loading="lazy"
                    onError={() => {
                      setImgFailed(true)
                      console.warn("Image failed to load:", imgSrc)
                    }}
                  />
                ) : (
                  <div className="w-full h-[55vh] flex items-center justify-center text-6xl opacity-70">
                    🍹
                  </div>
                )}
              </div>
            </section>
          </aside>

          {/* RIGHT: info + reviews (stacked) */}
          <section className="lg:col-span-7 space-y-6">
            {/* Info */}
            <div className="bg-card rounded-2xl border border-white/5 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeof drink.alcoholic === "boolean" ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-white/5 border-white/10 text-foreground-muted">
                        {drink.alcoholic ? "Alcoholic" : "Non-alcoholic"}
                      </span>
                    ) : null}

                    {!!(drink as any).iba ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-white/5 border-white/10 text-foreground-muted">
                        IBA
                      </span>
                    ) : null}

                    {drink.category ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-white/5 border-white/10 text-foreground-muted capitalize">
                        {drink.category}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-xs text-foreground-muted">Rating</div>
                  <div className="text-3xl font-semibold tabular-nums text-foreground">
                    {displayedRating.toFixed(1)}
                  </div>
                </div>
              </div>

              {drink.description ? (
                <div className="mt-4">
                  <p className="text-sm text-foreground-muted leading-relaxed">{drink.description}</p>
                </div>
              ) : null}

              {ingredients.length > 0 ? (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-foreground mb-2">Ingredients</p>
                  <ul className="space-y-1">
                    {ingredients.map((ing, idx) => (
                      <li key={idx} className="text-sm text-foreground-muted">
                        • {ing}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-6">
                <p className="text-sm font-semibold text-foreground mb-2">Set your rating (0–5)</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={userRating ?? displayedRating}
                    onChange={(e) => saveUserRating(Number(e.target.value))}
                    className="w-28 bg-background rounded-xl px-3 py-2 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
                  />
                  <span className="text-xs text-foreground-muted">Step 0.1</span>
                </div>
              </div>
            </div>

            {/* Reviews (sempre a destra sotto info) */}
            <div className="bg-card rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-foreground">Reviews</h2>
                <p className="text-xs text-foreground-muted">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>

              {/* Add review */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-background rounded-xl px-3 py-2 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="md:col-span-6">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a review..."
                    className="w-full bg-background rounded-xl px-3 py-2 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="md:col-span-2">
                  <input
                    type="number"
                    min={0}
                    max={5}
                    step={0.1}
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="w-full bg-background rounded-xl px-3 py-2 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50 tabular-nums"
                    title="Rating 0–5"
                  />
                </div>

                <div className="md:col-span-1">
                  <Button onClick={addReview} className="w-full">
                    Add
                  </Button>
                </div>
              </div>

              {/* Reviews list */}
              <div className="mt-5 space-y-3">
                {reviews.length === 0 ? (
                  <p className="text-sm text-foreground-muted">No reviews yet. Be the first!</p>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="bg-background rounded-2xl border border-white/10 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground break-words">{r.name}</p>
                          <p className="text-xs text-foreground-muted">
                            {new Date(r.createdAt).toLocaleString("it-IT")}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="text-xs text-foreground-muted">Rating</div>
                          <div className="text-lg font-semibold tabular-nums text-foreground">
                            {clampRating(r.rating).toFixed(1)}
                          </div>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-foreground-muted leading-relaxed break-words">{r.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
