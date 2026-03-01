import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Trash2, Pencil } from "lucide-react"
import { DrinkModel, Ingredient } from "@/models/drinks-models"
import { Button } from "@/components/ui/button"
import { StarRating } from "./StarRating"
import { YesNoModal } from "./YesNoModal"
import { EditReviewModal } from "./EditReviewModal"
import { ReviewModel } from "@/models/review-models"

function clampRating(n: number) {
  const x = Number.isFinite(n) ? n : 0
  return Math.max(0, Math.min(5, x))
}

const API_BASE = "https://bevoh.altervista.org/api";

export default function DrinkDetailPage() {
  const params = useParams()
  const id = Number(params.id)

  const [drink, setDrink] = useState<DrinkModel>()

  async function getDrink(signal?: AbortSignal): Promise<void> {
    try {
      const url = `${API_BASE}/singleDrink.php?drinkId=${id}`;
      const res = await fetch(url, { signal })

      if (!res.ok)
        throw new Error(`HTTP ${res.status}`)

      const json = await res.json()

      if (!json?.ok)
        throw new Error(json?.error || "Errore API")

      setDrink(json.data)
    } catch (e: any) {
      if (e?.name !== "AbortError") console.log(e)
    }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })

    const controller = new AbortController()

    getDrink(controller.signal)
    getDrinkReviews(controller.signal)
    loadMe(controller.signal)

    return () => controller.abort()
  }, [id])

  async function getDrinkReviews(signal?: AbortSignal): Promise<void> {
    try {
      const url = `${API_BASE}/drink_review/getDrinkReviews.php?drinkId=${id}`
      const res = await fetch(url, { signal }) // se è protetto: aggiungi credentials: "include"
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Errore API")

      // La tua API ritorna { "0": {...}, "ok": true } quindi estraggo tutte le keys numeriche
      const rows = Object.keys(json)
        .filter((k) => /^\d+$/.test(k))
        .map((k) => json[k])

      const payload = json.data

      setReviews(
        payload.map((x: any) => ({
          id: x.Id,
          text: x.Description ?? "",
          rating: Number(x.Vote ?? 0),
          username: x.Username ?? "anon",
          userId: Number(x.IdUser ?? 0),
        }))
      )
    } catch (e: any) {
      if (e?.name !== "AbortError") console.log(e)
    }
  }

  const [myUserId, setMyUserId] = useState<number | null>(null)

  const [reviews, setReviews] = useState<ReviewModel[]>([])
  const [isPostingReview, setIsPostingReview] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const [text, setText] = useState("")
  const [newReviewRating, setNewReviewRating] = useState<number>(2.5)

  const [deleteTarget, setDeleteTarget] = useState<ReviewModel | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [editTarget, setEditTarget] = useState<ReviewModel | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  async function updateReview(reviewId: number | string, description: string, vote: number) {
    setIsUpdating(true)
    setUpdateError(null)

    try {
      const res = await fetch(`${API_BASE}/drink_review/updateDrinkReview.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          reviewId: Number(reviewId),
          description: description.trim(),
          vote: clampRating(vote),
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.ok) {
        const msg = json?.error || json?.message || `HTTP ${res.status}`
        setUpdateError(msg)
        return
      }

      await getDrinkReviews()
      setEditTarget(null)
    } catch (e: any) {
      setUpdateError(e?.message || "Network error")
    } finally {
      setIsUpdating(false)
    }
  }

  async function deleteReview(reviewId: number | string) {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const res = await fetch(`${API_BASE}/drink_review/deleteDrinkReview.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ reviewId: Number(reviewId) }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.ok) {
        const msg = json?.error || json?.message || `HTTP ${res.status}`
        setDeleteError(msg)
        return
      }

      await getDrinkReviews()
      setDeleteTarget(null)
    } catch (e: any) {
      setDeleteError(e?.message || "Network error")
    } finally {
      setIsDeleting(false)
    }
  }

  async function loadMe(signal?: AbortSignal) {
    try {
      const res = await fetch(`${API_BASE}/auth/me.php`, {
        credentials: "include",
        signal,
      })

      const json = await res.json()
      if (json?.ok) {
        setMyUserId(json.user.Id)
      }
    } catch (e) {
      console.log(e)
    }
  }

  const sortedReviews = useMemo(() => {
    if (!myUserId) return reviews

    return [...reviews].sort((a, b) => {
      if (a.userId === myUserId) return -1
      if (b.userId === myUserId) return 1
      return 0
    })
  }, [reviews, myUserId])


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

  const baseRating = typeof (drink as any).rating === "number" ? clampRating((drink as any).rating) : 0
  const avgReviews =
    reviews.length > 0
      ? clampRating(reviews.reduce((s, r) => s + clampRating(r.rating), 0) / reviews.length)
      : undefined
  const displayedRating = avgReviews ?? baseRating

  const ingredients = Array.isArray((drink as any).ingredients)
    ? ((drink as any).ingredients as Ingredient[])
    : []

  const addReview = async () => {
    const t = text.trim()
    if (!t) return

    setIsPostingReview(true)
    setReviewError(null)

    try {
      const url = `${API_BASE}/drink_review/addDrinkReview.php`

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // IMPORTANTISSIMO se usi session cookie
        body: JSON.stringify({
          drinkId: drink.Id,
          description: t,
          vote: clampRating(newReviewRating),
        }),
      })

      const json = await res.json().catch(() => null)

      if (!res.ok || !json?.ok) {
        // gestisci errori API
        const msg = json?.error || json?.message || `HTTP ${res.status}`
        setReviewError(msg)
        return
      }

      // ✅ Opzione 1: reload da server (sempre consistente)
      await getDrinkReviews()

      // ✅ reset form
      setText("")
      setNewReviewRating(2.5)
    } catch (e: any) {
      setReviewError(e?.message || "Errore di rete")
    } finally {
      setIsPostingReview(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {deleteTarget && <YesNoModal
        title="Delete review?"
        description="This action cannot be undone. Your review will be permanently removed."
        open={!!deleteTarget}
        loading={isDeleting}
        error={deleteError}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteReview(deleteTarget.id)
        }}
      />}
      {editTarget && <EditReviewModal
        open={!!editTarget}
        loading={isUpdating}
        error={updateError}
        initialText={editTarget?.text ?? ""}
        initialRating={editTarget?.rating ?? 0}
        onCancel={() => setEditTarget(null)}
        onConfirm={({ text, rating }) => {
          if (!editTarget) return
          updateReview(editTarget.id, text, rating)
        }}
      />}

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* LEFT: name + image */}
          <aside className="lg:col-span-5 space-y-3">
            {/* Name */}
            <section className="bg-card rounded-2xl border border-white/5 p-3">
              <h1 className="text-2xl font-semibold text-foreground break-words">{drink.Name}</h1>
            </section>

            {/* Image */}
            <section className="bg-card rounded-2xl border border-white/5 overflow-hidden">
              <div className="bg-white/5 flex items-center justify-center">

                {drink.ImageUrl ? (
                  <img
                    src={drink.ImageUrl.startsWith("/") ? drink.ImageUrl : `/${drink.ImageUrl}`}
                    alt={drink.Name}
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
          <section className="lg:col-span-7 space-y-3">
            {/* Info */}
            <div className="bg-card rounded-2xl border border-white/5 p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {typeof drink.Alcoholic === "boolean" ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-white/5 border-white/10 text-foreground-muted">
                        {drink.Alcoholic ? "Alcoholic" : "Non-alcoholic"}
                      </span>
                    ) : null}

                    {!!(drink as any).iba ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-white/5 border-white/10 text-foreground-muted">
                        IBA
                      </span>
                    ) : null}

                    {drink.Category ? (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs border bg-white/5 border-white/10 text-foreground-muted capitalize">
                        {drink.Category}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="shrink-0 text-right row">
                  {/* <div className="text-xs text-foreground-muted">Rating</div> */}
                  <div className="text-3xl font-semibold tabular-nums text-foreground">
                    {drink.ABV}% ~ {displayedRating.toFixed(1)}
                  </div>
                </div>
              </div>

              {drink.Description ? (
                <div className="mt-4">
                  <p className="text-sm text-foreground-muted leading-relaxed">{drink.Description}</p>
                </div>
              ) : null}

              {ingredients.length > 0 ? (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-foreground mb-2">Ingredients</p>
                  <ul className="space-y-1">
                    {ingredients.map((ing) => (
                      <li key={ing.Id} className="text-sm text-foreground-muted">
                        • {ing.Name}
                        {/* {ing.Quantity ? ` — ${ing.Quantity}${ing.UM ? ` ${ing.UM}` : ""}` : ""} */}
                        {Number(String(ing.Quantity ?? "").replace(",", ".").trim()) > 0
                          ? ` — ${ing.Quantity}${ing.UM ? ` ${ing.UM}` : ""}`
                          : ` — ${ing.UM ? `${ing.UM}` : ""}`} ~ {ing.ABV}%
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            {/* Reviews (sempre a destra sotto info) */}
            <div className="bg-card rounded-2xl border border-white/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-foreground">Reviews</h2>
                <p className="text-xs text-foreground-muted">
                  {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
                </p>
              </div>

              {/* Add review */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write a review..."
                    className="w-full bg-background rounded-xl px-3 py-2 text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="md:col-span-3 flex items-center gap-2">
                  <StarRating
                    value={newReviewRating}
                    onChange={setNewReviewRating}
                  />
                  {/* <span className="text-sm tabular-nums text-foreground-muted">
                    {newReviewRating.toFixed(1)}
                  </span> */}
                </div>

                <div className="md:col-span-1">
                  <Button onClick={addReview} className="w-full" disabled={isPostingReview || !text.trim()}>
                    {isPostingReview ? "..." : "Add"}
                  </Button>
                </div>
              </div>

              {reviewError ? (
                <p className="mt-3 text-sm text-red-500">{reviewError}</p>
              ) : null}

              {/* Reviews list */}
              <div className="mt-5 space-y-2">
                {reviews.length === 0 ? (
                  <p className="text-sm text-foreground-muted">No reviews yet. Be the first!</p>
                ) : (
                  sortedReviews.map((r) => (
                    <div
                      key={r.id}
                      className={[
                        "bg-background rounded-2xl border p-4 transition-all duration-200",
                        "hover:border-white/20 hover:bg-white/[0.03]",
                        r.userId === myUserId
                          ? "border-primary/60 ring-1 ring-primary/30"
                          : "border-white/10",
                      ].join(" ")}
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between gap-4">
                        {/* LEFT: name + badge */}
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {r.username}
                          </p>

                          {r.userId === myUserId && (
                            <span
                              className={[
                                "inline-flex items-center",
                                "text-[10px] font-medium tracking-wide",
                                "px-2 py-0.5 rounded-full",
                                "border border-primary/30",
                                "bg-gradient-to-r from-primary/25 to-primary/10",
                                "text-primary",
                                "shadow-sm shadow-primary/10",
                                "transition-all duration-300",
                                "group-hover:shadow-primary/30",
                                "shrink-0", // ⭐ IMPORTANTISSIMO
                              ].join(" ")}
                            >
                              You
                            </span>
                          )}
                        </div>

                        {/* RIGHT: edit + delete + stars */}
                        <div className="flex items-center gap-2 shrink-0">
                          {r.userId === myUserId && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl hover:bg-primary/10"
                                onClick={() => {
                                  setUpdateError(null)
                                  setEditTarget(r)
                                }}
                                title="Edit review"
                              >
                                <Pencil className="w-4 h-4 text-foreground-muted hover:text-primary" />
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl hover:bg-red-500/10"
                                onClick={() => {
                                  setDeleteError(null)
                                  setDeleteTarget(r)
                                }}
                                title="Delete review"
                              >
                                <Trash2 className="w-4 h-4 text-foreground-muted hover:text-red-400" />
                              </Button>
                            </>
                          )}

                          {/* ⭐ stelle responsive */}
                          <span className="sm:hidden">
                            <StarRating value={clampRating(r.rating)} size={18} />
                          </span>
                          <span className="hidden sm:inline">
                            <StarRating value={clampRating(r.rating)} size={24} />
                          </span>
                        </div>
                      </div>

                      {/* Text */}
                      <p className="mt-3 text-sm text-foreground-muted leading-relaxed break-words">
                        {r.text}
                      </p>
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
