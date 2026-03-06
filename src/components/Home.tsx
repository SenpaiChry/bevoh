// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-background pt-1 md:pt-5 px-3 lg:px-8">
//       HOME - TO DO
//     </div>
//   )
// }

import { useEffect, useRef, useState } from "react"
import { Search, UserPlus, Check, X, Users, LogIn, LogOut, Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { loadMeSafe } from "@/controllers/UserController"

const API_BASE = "https://bevoh.altervista.org/api"

// ─── Models ────────────────────────────────────────────────────────────────

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

interface FriendRequest {
  Id: number       // id della richiesta
  UserId: number
  Username: string
  ImageUrl: string | null
}

interface UserSearchResult {
  Id: number
  Username: string
  Name: string
  Surname: string
  ImageUrl: string | null
  FriendStatus: "none" | "pending_sent" | "pending_received" | "accepted"
}

interface Session {
  Id: number
  Name: string
  CreatedByUsername: string
  CreatedAt: string
  MemberCount: number
  IsMember: boolean
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const d = new Date(dateStr.replace(" ", "T"))
  if (isNaN(d.getTime())) return dateStr
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
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

// ─── HomePage ──────────────────────────────────────────────────────────────

export default function HomePage() {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: loadMeSafe,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })
  const me = meQuery.data?.ok ? meQuery.data.user : null

  return (
    <div className="min-h-screen bg-background pt-1 md:pt-5 px-3 lg:px-8 pb-24 space-y-4">
      {/* {me && <SessionsSection />} */}
      {me && <FriendsSection />}
      <FeedSection />
    </div>
  )
}

// ─── Sessions ──────────────────────────────────────────────────────────────

function SessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [creating, setCreating] = useState(false)

  async function fetchSessions() {
    try {
      const res = await fetch(`${API_BASE}/friends/getSessions.php`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      const json = await res.json()
      if (json?.ok) setSessions(json.data ?? [])
    } catch { } finally {
      setLoading(false)
    }
  }

  async function createSession() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch(`${API_BASE}/friends/createSession.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      const json = await res.json()
      if (json?.ok) { setNewName(""); fetchSessions() }
    } catch { } finally {
      setCreating(false)
    }
  }

  async function toggleJoin(session: Session) {
    const endpoint = session.IsMember ? "leaveSession.php" : "joinSession.php"
    try {
      const res = await fetch(`${API_BASE}/friends/${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ sessionId: session.Id }),
      })
      const json = await res.json()
      if (json?.ok) fetchSessions()
    } catch { }
  }

  useEffect(() => { fetchSessions() }, [])

  return (
    <section className="bg-card rounded-3xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Tonight's Sessions
        </h2>
        {!loading && <span className="text-xs text-foreground/50">{sessions.length} active</span>}
      </div>

      {/* Create new */}
      <div className="flex gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && createSession()}
          placeholder="New session name..."
          className="flex-1 bg-background rounded-xl px-3 py-2 text-sm text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <button
          onClick={createSession}
          disabled={creating || !newName.trim()}
          className="px-4 py-2 bg-primary text-background text-sm font-medium rounded-xl disabled:opacity-40 transition"
        >
          {creating ? "..." : "Create"}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <p className="text-sm text-foreground/50 text-center py-2">Loading...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-foreground/50 text-center py-2">No active sessions. Start one!</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.Id} className={[
              "flex items-center justify-between gap-3 rounded-2xl px-3 py-2 border transition",
              s.IsMember ? "bg-primary/10 border-primary/30" : "bg-white/5 border-white/10",
            ].join(" ")}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{s.Name}</p>
                <p className="text-xs text-foreground/50">
                  by {s.CreatedByUsername} · {s.MemberCount} {s.MemberCount === 1 ? "member" : "members"}
                </p>
              </div>
              <button
                onClick={() => toggleJoin(s)}
                className={[
                  "shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition",
                  s.IsMember
                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    : "bg-primary/20 text-primary hover:bg-primary/30",
                ].join(" ")}
              >
                {s.IsMember ? <><LogOut className="w-3 h-3" /> Leave</> : <><LogIn className="w-3 h-3" /> Join</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// ─── Friends ───────────────────────────────────────────────────────────────

function FriendsSection() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<UserSearchResult[]>([])
  const [searching, setSearching] = useState(false)

  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [reqLoading, setReqLoading] = useState(true)

  async function fetchRequests() {
    try {
      const res = await fetch(`${API_BASE}/friends/getPendingRequests.php`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      const json = await res.json()
      if (json?.ok) setRequests(json.data ?? [])
    } catch { } finally {
      setReqLoading(false)
    }
  }

  async function respondRequest(requestId: number, accept: boolean) {
    try {
      const res = await fetch(`${API_BASE}/friends/respondFriendRequest.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ requestId, accept }),
      })
      const json = await res.json()
      if (json?.ok) setRequests((p) => p.filter((r) => r.Id !== requestId))
    } catch { }
  }

  async function searchUsers(q: string) {
    if (!q.trim()) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`${API_BASE}/friends/searchUsers.php?q=${encodeURIComponent(q)}`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      const json = await res.json()
      if (json?.ok) setResults(json.data ?? [])
    } catch { } finally {
      setSearching(false)
    }
  }

  async function sendRequest(userId: number) {
    try {
      const res = await fetch(`${API_BASE}/friends/sendFriendRequest.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ userId }),
      })
      const json = await res.json()
      if (json?.ok) {
        setResults((p) => p.map((u) => u.Id === userId ? { ...u, FriendStatus: "pending_sent" } : u))
      }
    } catch { }
  }

  useEffect(() => { fetchRequests() }, [])

  useEffect(() => {
    const t = setTimeout(() => searchUsers(query), 400)
    return () => clearTimeout(t)
  }, [query])

  const hasContent = requests.length > 0 || query.length > 0

  if (!hasContent && !reqLoading) {
    // sezione collassata, solo la barra di ricerca
    return (
      <section className="bg-card rounded-3xl p-3 space-y-3">
        <h2 className="font-semibold text-foreground flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-primary" /> Friends
        </h2>
        <SearchBar query={query} setQuery={setQuery} searching={searching} />
        {results.length > 0 && <SearchResults results={results} onAdd={sendRequest} />}
      </section>
    )
  }

  return (
    <section className="bg-card rounded-3xl p-3 space-y-3">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <UserPlus className="w-4 h-4 text-primary" /> Friends
        {requests.length > 0 && (
          <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-background text-xs font-bold">
            {requests.length}
          </span>
        )}
      </h2>

      {/* Pending requests */}
      {requests.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-foreground/50 uppercase tracking-wide">Incoming requests</p>
          {requests.map((r) => (
            <div key={r.Id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2">
              <Avatar src={r.ImageUrl} alt={r.Username} size={9} />
              <p className="flex-1 text-sm font-medium text-foreground truncate">{r.Username}</p>
              <button onClick={() => respondRequest(r.Id, true)}
                className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => respondRequest(r.Id, false)}
                className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <SearchBar query={query} setQuery={setQuery} searching={searching} />
      {results.length > 0 && <SearchResults results={results} onAdd={sendRequest} />}
    </section>
  )
}

function SearchBar({ query, setQuery, searching }: { query: string; setQuery: (v: string) => void; searching: boolean }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users by username..."
        className="w-full bg-background rounded-xl pl-9 pr-3 py-2 text-sm text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground/40">...</span>}
    </div>
  )
}

function SearchResults({ results, onAdd }: { results: UserSearchResult[]; onAdd: (id: number) => void }) {
  return (
    <div className="space-y-2">
      {results.map((u) => (
        <div key={u.Id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2">
          <Avatar src={u.ImageUrl} alt={u.Username} size={9} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{u.Username}</p>
            <p className="text-xs text-foreground/50 truncate">{u.Name} {u.Surname}</p>
          </div>
          {u.FriendStatus === "none" && (
            <button onClick={() => onAdd(u.Id)}
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/20 text-primary text-xs font-medium hover:bg-primary/30 transition">
              <UserPlus className="w-3 h-3" /> Add
            </button>
          )}
          {u.FriendStatus === "pending_sent" && (
            <span className="shrink-0 text-xs text-foreground/40 px-3 py-1.5">Pending</span>
          )}
          {u.FriendStatus === "accepted" && (
            <span className="shrink-0 text-xs text-primary px-3 py-1.5">Friends</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Feed ──────────────────────────────────────────────────────────────────

const FEED_LIMIT = 10

function FeedSection() {
  const [items, setItems] = useState<FriendLog[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [didFirst, setDidFirst] = useState(false)
  const loadingRef = useRef(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  async function fetchFeed(opts?: { reset?: boolean }) {
    if (loadingRef.current) return
    const reset = !!opts?.reset
    if (!reset && !hasMore) return

    loadingRef.current = true
    setLoading(true)

    const nextPage = reset ? 1 : page
    const offset = (nextPage - 1) * FEED_LIMIT

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
      setHasMore(rows.length === FEED_LIMIT)
      setPage(reset ? 2 : nextPage + 1)
    } catch (e: any) {
      if (e?.name === "AbortError") return
    } finally {
      loadingRef.current = false
      setLoading(false)
      setDidFirst(true)
    }
  }

  useEffect(() => { fetchFeed({ reset: true }) }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && didFirst && hasMore && !loadingRef.current) {
          fetchFeed()
        }
      },
      { rootMargin: "600px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasMore, didFirst])

  return (
    <section className="space-y-2">
      <h2 className="font-semibold text-foreground px-1 flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" /> Friends Activity
      </h2>

      {didFirst && items.length === 0 && !loading && (
        <div className="bg-card rounded-2xl p-4 text-center text-sm text-foreground/50">
          No activity yet. Add friends to see their logs here!
        </div>
      )}

      {items.map((it) => (
        <div key={it.Id} className="bg-card rounded-2xl p-3 flex gap-3">
          {/* Drink image */}
          <div className="w-12 h-12 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
            {it.DrinkImageUrl ? (
              <img src={it.DrinkImageUrl} alt={it.DrinkName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl">🍹</span>
            )}
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

            {it.Notes && (
              <p className="text-xs text-foreground/50 break-words">{it.Notes}</p>
            )}
          </div>
        </div>
      ))}

      {!didFirst && (
        <div className="bg-card rounded-2xl p-4 text-center text-sm text-foreground/50">
          Loading feed...
        </div>
      )}

      <div ref={sentinelRef} className="h-10" />
    </section>
  )
}