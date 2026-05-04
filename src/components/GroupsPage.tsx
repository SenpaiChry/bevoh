import { useEffect, useState } from "react"
import { Users, LogIn, LogOut } from "lucide-react"

const API_BASE = "https://bevoh.altervista.org/api"

interface Session {
  Id: number
  Name: string
  CreatedByUsername: string
  CreatedAt: string
  MemberCount: number
  IsMember: boolean
}

export default function GroupsPage() {
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
    <div className="min-h-screen bg-background pt-1 md:pt-5 px-3 lg:px-8 pb-24 space-y-4">
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
                  {s.IsMember
                    ? <><LogOut className="w-3 h-3" /> Leave</>
                    : <><LogIn className="w-3 h-3" /> Join</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}