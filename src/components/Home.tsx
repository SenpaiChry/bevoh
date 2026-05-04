import { useRef, useState, useEffect } from "react"
import { Clock, UserPlus, Users } from "lucide-react"
import { Link } from "react-router-dom"

const API_BASE = "https://bevoh.altervista.org/api"
const FEED_LIMIT = 10

interface FriendLog {
  Id: number
  Username: string
  ImageUrl: string | null
  DrinkName: string
  DrinkImageUrl: string | null
  CategoryName: string
  DateLog: string
  Quantity: number
  Notes: string | null
}

const FALLBACK_AVATAR = "/assets/avatars/male_1.png"

function Avatar({ src, alt, size = 10 }: { src: string | null; alt: string; size?: number }) {
  return (
    <div className={`w-${size} h-${size} rounded-full overflow-hidden ring-1 ring-border shrink-0`}>
      <img
        src={src || FALLBACK_AVATAR}
        alt={alt}
        className="w-full h-full object-cover"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_AVATAR }}
      />
    </div>
  )
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr.replace(" ", "T"))
  if (isNaN(d.getTime())) return dateStr
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function HomePage() {
  const [items, setItems] = useState<FriendLog[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [didFirst, setDidFirst] = useState(false)
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const pageRef = useRef(1)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function fetchFeed(reset = false) {
    if (loadingRef.current) return
    if (!reset && !hasMoreRef.current) return

    loadingRef.current = true
    setLoading(true)

    if (reset) pageRef.current = 1

    const offset = (pageRef.current - 1) * FEED_LIMIT

    try {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      const res = await fetch(
        `${API_BASE}/friends/getFriendsFeed.php?limit=${FEED_LIMIT}&offset=${offset}`,
        { credentials: "include", headers: { Accept: "application/json" }, signal: ctrl.signal }
      )
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Feed error")

      const rows: FriendLog[] = json.data ?? []
      setItems((p) => reset ? rows : [...p, ...rows])

      const more = rows.length === FEED_LIMIT
      hasMoreRef.current = more
      setHasMore(more)
      pageRef.current += 1
    } catch (e: any) {
      if (e?.name === "AbortError") return
    } finally {
      loadingRef.current = false
      setLoading(false)
      setDidFirst(true)
    }
  }

  useEffect(() => { fetchFeed(true) }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && didFirst && hasMoreRef.current && !loadingRef.current) {
          fetchFeed(false)
        }
      },
      { rootMargin: "600px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [didFirst])

  return (
    <div className="min-h-screen bg-background pt-1 md:pt-5 px-3 lg:px-8 pb-24 space-y-4">
      {/* Quick nav */}
      <div className="flex gap-2">
        <Link to="/friends"
          className="flex-1 flex items-center justify-center gap-2 bg-card rounded-2xl px-4 py-3 text-sm font-medium text-foreground hover:bg-white/10 transition border border-white/10">
          <UserPlus className="w-4 h-4 text-primary" /> Friends
        </Link>
        {/* <Link to="/sessions"
          className="flex-1 flex items-center justify-center gap-2 bg-card rounded-2xl px-4 py-3 text-sm font-medium text-foreground hover:bg-white/10 transition border border-white/10">
          <Users className="w-4 h-4 text-primary" /> Sessions
        </Link> */}
      </div>

      {/* Feed */}
      <section className="space-y-2">
        {/* <h2 className="font-semibold text-foreground px-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" /> Friends Activity
        </h2> */}

        {didFirst && items.length === 0 && !loading && (
          <div className="bg-card rounded-2xl p-4 text-center text-sm text-foreground/50">
            No activity yet. Add friends to see their logs here!
          </div>
        )}

        {items.map((it) => (
          <div key={it.Id} className="bg-card rounded-2xl p-3 flex gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
              {it.DrinkImageUrl
                ? <img src={it.DrinkImageUrl} alt={it.DrinkName} className="w-full h-full object-cover" />
                : <span className="text-xl">🍹</span>}
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar src={it.ImageUrl} alt={it.Username} size={6} />
                  <p className="text-sm font-semibold text-foreground truncate">{it.Username}</p>
                </div>
                <span className="text-xs text-foreground/40 shrink-0">{timeAgo(it.DateLog)}</span>
              </div>
              <p className="text-sm text-foreground/80 truncate">
                {it.Quantity > 1 ? `${it.Quantity}× ` : ""}{it.DrinkName}
                <span className="text-xs text-foreground/40 ml-1">· {it.CategoryName}</span>
              </p>
              {it.Notes && <p className="text-xs text-foreground/50 break-words">{it.Notes}</p>}
            </div>
          </div>
        ))}

        {!didFirst && (
          <div className="bg-card rounded-2xl p-4 text-center text-sm text-foreground/50">Loading...</div>
        )}

        <div ref={sentinelRef} className="h-10" />
      </section>
    </div>
  )
}