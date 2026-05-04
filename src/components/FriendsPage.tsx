import { useEffect, useState } from "react"
import { Search, UserPlus, Check, X, ArrowLeft, UserMinus, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { YesNoModal } from "@/components/YesNoModal"

const API_BASE = "https://bevoh.altervista.org/api"

interface Friend {
    Id: number
    Username: string
    Name: string
    Surname: string
    ImageUrl: string | null
    FriendshipId: number
}

interface FriendRequest {
    Id: number
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

const FALLBACK_AVATAR = "/assets/avatars/male_1.png"

function Avatar({ src, alt, size = 9 }: { src: string | null; alt: string; size?: number }) {
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

export default function FriendsPage() {
    const navigate = useNavigate()

    const [friends, setFriends] = useState<Friend[]>([])
    const [friendsLoading, setFriendsLoading] = useState(true)

    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [reqLoading, setReqLoading] = useState(true)

    // const [showSearch, setShowSearch] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<UserSearchResult[]>([])
    const [searching, setSearching] = useState(false)

    async function fetchFriends() {
        try {
            const res = await fetch(`${API_BASE}/friends/getFriends.php`, {
                credentials: "include",
                headers: { Accept: "application/json" },
            })
            const json = await res.json()
            if (json?.ok) setFriends(json.data ?? [])
        } catch { } finally {
            setFriendsLoading(false)
        }
    }

    const [removeTarget, setRemoveTarget] = useState<Friend | null>(null)
    const [removing, setRemoving] = useState(false)
    const [removeError, setRemoveError] = useState<string | null>(null)

    async function removeFriend(friendshipId: number) {
        setRemoving(true)
        setRemoveError(null)
        try {
            const res = await fetch(`${API_BASE}/friends/removeFriend.php`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ friendshipId }),
            })
            const json = await res.json()
            if (json?.ok) {
                setFriends((p) => p.filter((f) => f.FriendshipId !== friendshipId))
                setRemoveTarget(null)
            } else {
                setRemoveError(json?.error || "Error removing friend")
            }
        } catch {
            setRemoveError("Network error")
        } finally {
            setRemoving(false)
        }
    }

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
            if (json?.ok) {
                setRequests((p) => p.filter((r) => r.Id !== requestId))
                if (accept) fetchFriends()
            }
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
            if (json?.ok) setResults((p) => p.map((u) => u.Id === userId ? { ...u, FriendStatus: "pending_sent" } : u))
        } catch { }
    }

    useEffect(() => {
        fetchFriends()
        fetchRequests()
    }, [])

    useEffect(() => {
        const t = setTimeout(() => searchUsers(query), 400)
        return () => clearTimeout(t)
    }, [query])

    return (
        <div className="min-h-screen bg-background pt-1 md:pt-5 px-3 lg:px-8 pb-24 space-y-4">
            {removeTarget && <YesNoModal
                title="Remove friend"
                description={`Are you sure you want to remove ${removeTarget?.Username} from your friends?`}
                open={!!removeTarget}
                loading={removing}
                error={removeError}
                onCancel={() => { setRemoveTarget(null); setRemoveError(null) }}
                onConfirm={() => removeTarget && removeFriend(removeTarget.FriendshipId)}
            />}

            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => navigate("/")}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-white/10 text-sm text-foreground hover:bg-white/10 transition">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
                {/* <button onClick={() => setShowSearch((v) => !v)}
                    className={[
                        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition border",
                        showSearch
                            ? "bg-primary/20 text-primary border-primary/30"
                            : "bg-card text-foreground border-white/10 hover:bg-white/10",
                    ].join(" ")}>
                    <UserPlus className="w-4 h-4" /> Add Friend
                </button> */}
            </div>

            {/* Search panel */}
            <section className="bg-card rounded-3xl p-3 space-y-3">
                <h2 className="font-semibold text-foreground flex items-center gap-2">
                    <Search className="w-4 h-4 text-primary" /> Search Users to Add
                </h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by username..."
                        autoFocus
                        className="w-full bg-background rounded-xl pl-9 pr-3 py-2 text-sm text-foreground border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    {searching && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-foreground/40">...</span>}
                </div>

                {results.length > 0 && (
                    <div className="space-y-2">
                        {results.map((u) => (
                            <div key={u.Id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2">
                                <Avatar src={u.ImageUrl} alt={u.Username} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{u.Username}</p>
                                    <p className="text-xs text-foreground/50 truncate">{u.Name} {u.Surname}</p>
                                </div>
                                {u.FriendStatus === "none" && (
                                    <button onClick={() => sendRequest(u.Id)}
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
                )}

                {query.length > 0 && !searching && results.length === 0 && (
                    <p className="text-sm text-foreground/50 text-center py-2">No users found.</p>
                )}
            </section>

            {/* Pending requests */}
            {!reqLoading && requests.length > 0 && (
                <section className="bg-card rounded-3xl p-3 space-y-3">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        Incoming Requests
                        <span className="px-2 py-0.5 rounded-full bg-primary text-background text-xs font-bold">
                            {requests.length}
                        </span>
                    </h2>
                    {requests.map((r) => (
                        <div key={r.Id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2">
                            <Avatar src={r.ImageUrl} alt={r.Username} />
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
                </section>
            )}

            {/* Friends list */}
            <section className="bg-card rounded-3xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" /> My Friends
                    </h2>
                    {!friendsLoading && (
                        <span className="text-xs">{friends.length}</span>
                    )}
                </div>

                {friendsLoading ? (
                    <p className="text-sm text-foreground/50 text-center py-2">Loading...</p>
                ) : friends.length === 0 ? (
                    <p className="text-sm text-foreground/50 text-center py-2">No friends yet. Search and add someone!</p>
                ) : (
                    <div className="space-y-2">
                        {friends.map((f) => (
                            <div key={f.Id} className="flex items-center gap-3 bg-white/5 rounded-2xl px-3 py-2">
                                <Avatar src={f.ImageUrl} alt={f.Username} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{f.Username}</p>
                                    <p className="text-xs text-foreground/50 truncate">{f.Name} {f.Surname}</p>
                                </div>
                                <button onClick={() => { setRemoveError(null); setRemoveTarget(f) }}
                                    className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition"
                                    title="Remove friend">
                                    <UserMinus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}