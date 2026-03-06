import { useEffect, useRef, useState } from "react"
import { ChevronRight, Pencil, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { YesNoModal } from "./YesNoModal"
import { EditLogModal } from "./EditLogModal"
import { DrinkLogModel } from "@/models/log-drink-models"

const API_BASE = "https://bevoh.altervista.org/api"

type DrinkLogsResponse =
    | {
        ok: true
        range: string
        fromDate: string | null
        limit: number
        offset: number
        items: DrinkLogModel[]
    }
    | { ok: false; error: string }

type DrinkLogsStatsResponse =
    | {
        ok: true
        range: string
        fromDate: string | null
        total: number
        counts: {
            cocktail: number
            beer: number
            shot: number
            wine: number
            other: number
        }
    }
    | { ok: false; error: string }

function normalizeCategory(cat: string | null | undefined): "cocktail" | "beer" | "shot" | "wine" | "other" {
    const c = (cat ?? "").trim().toLowerCase()
    if (c.includes("cocktail")) return "cocktail"
    if (c.includes("beer") || c.includes("birra")) return "beer"
    if (c.includes("shot") || c.includes("shottino")) return "shot"
    if (c.includes("wine") || c.includes("vino")) return "wine"
    return "other"
}

type RangeKey = "24h" | "7d" | "month" | "all"

const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date())

const RANGE_TABS: { key: RangeKey; label: string }[] = [
    { key: "24h", label: "24hr" },
    { key: "7d", label: "week" },
    { key: "month", label: `month (${currentMonthName})` },
    { key: "all", label: "all time" },
]

function formatDateNice(dateLog: string) {
    const d = new Date(dateLog.replace(" ", "T"))
    if (Number.isNaN(d.getTime())) return dateLog
    return d.toLocaleString()
}

function toDateOrNull(dateLog: string) {
    const d = new Date(dateLog.replace(" ", "T"))
    return Number.isNaN(d.getTime()) ? null : d
}

function pad2(n: number) {
    return String(n).padStart(2, "0")
}

function extractYYYYMMDD(dateLog: string) {
    const d = toDateOrNull(dateLog)
    if (!d) return ""
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function extractHHmm(dateLog: string) {
    const d = toDateOrNull(dateLog)
    if (!d) return "00:00"
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

// ricostruisce "YYYY-MM-DD HH:mm:ss" da date + time
function buildDateLog(dateYYYYMMDD: string, timeHHmm: string) {
    const date = (dateYYYYMMDD || "").trim()
    const time = (timeHHmm || "00:00").trim()

    // fallback safe
    const [hh, mm] = time.split(":")
    const H = Math.max(0, Math.min(23, Number(hh ?? 0)))
    const M = Math.max(0, Math.min(59, Number(mm ?? 0)))

    return `${date} ${pad2(H)}:${pad2(M)}:00`
}

export default function MyLogsPage() {
    const navigate = useNavigate()

    const listLoadingRef = useRef(false)
    const [didFirstFetch, setDidFirstFetch] = useState(false)

    const [rangeIdx, setRangeIdx] = useState(0)
    const activeRange: RangeKey = RANGE_TABS[rangeIdx].key

    const LIMIT = 10

    const [items, setItems] = useState<DrinkLogModel[]>([])
    const [statsTotal, setStatsTotal] = useState(0)
    const [statsCounts, setStatsCounts] = useState({
        cocktail: 0,
        beer: 0,
        shot: 0,
        wine: 0,
        other: 0,
    })

    const [editTarget, setEditTarget] = useState<DrinkLogModel | null>(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [updateError, setUpdateError] = useState<string | null>(null)

    const [deleteTarget, setDeleteTarget] = useState<DrinkLogModel | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    // infinite scroll state
    const [page, setPage] = useState(1) // 1..n
    const [hasMore, setHasMore] = useState(true)
    const [listLoading, setListLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadMoreRef = useRef<HTMLDivElement | null>(null)
    const listAbortRef = useRef<AbortController | null>(null)
    const listReqIdRef = useRef(0)

    async function getStats(signal?: AbortSignal) {
        try {
            // Aggiunto parametro &_t per bypassare la cache di AlterVista
            const url = `${API_BASE}/drink_log/getDrinkLogsStats.php?range=${activeRange}&_t=${Date.now()}`
            const res = await fetch(url, {
                credentials: "include",
                headers: { Accept: "application/json" },
                signal,
            })

            const text = await res.text()
            if (!text.trim()) throw new Error(`Empty stats response (HTTP ${res.status})`)

            const json: DrinkLogsStatsResponse = JSON.parse(text)

            if (!res.ok || !json.ok) {
                throw new Error("error" in json ? json.error : `HTTP ${res.status}`)
            }

            setStatsTotal(Number(json.total ?? 0))
            setStatsCounts({
                cocktail: Number(json.counts?.cocktail ?? 0),
                beer: Number(json.counts?.beer ?? 0),
                shot: Number(json.counts?.shot ?? 0),
                wine: Number(json.counts?.wine ?? 0),
                other: Number(json.counts?.other ?? 0),
            })
        } catch (e: any) {
            if (e?.name !== "AbortError") {
                // se vuoi, puoi mostrare errore anche qui
                console.log("getStats error:", e?.message || e)
                setStatsTotal(0)
                setStatsCounts({ cocktail: 0, beer: 0, shot: 0, wine: 0, other: 0 })
            }
        }
    }

    async function updateDrinkLog(payload: { id: number; quantity: number; dateLog: string; notes: string | null }) {
        setIsUpdating(true)
        setUpdateError(null)

        try {
            // ⚠️ Nomi campi come nel PHP: logId, quantity, dateLog, notes
            const body = new URLSearchParams()
            body.set("logId", String(payload.id))
            body.set("quantity", String(payload.quantity))
            body.set("dateLog", String(payload.dateLog)) // "YYYY-MM-DD HH:MM:SS"
            body.set("notes", payload.notes?.trim() ? payload.notes.trim() : "") // vuoto se null

            const res = await fetch(`${API_BASE}/drink_log/updateDrinkLog.php`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                },
                body,
            })

            const text = await res.text()
            const json = text ? JSON.parse(text) : null

            if (!res.ok || !json?.ok) {
                throw new Error(json?.error || json?.message || `HTTP ${res.status}`)
            }

            // aggiorna UI
            setItems((prev) =>
                prev.map((x) =>
                    x.Id === payload.id
                        ? { ...x, quantity: payload.quantity, dateLog: payload.dateLog, notes: payload.notes?.trim() ? payload.notes : null }
                        : x
                )
            )

            setEditTarget(null)
        } catch (e: any) {
            setUpdateError(e?.message || "Update failed")
        } finally {
            setIsUpdating(false)
        }
    }

    async function deleteDrinkLog(id: number) {
        setIsDeleting(true)
        setDeleteError(null)

        try {
            const res = await fetch(`${API_BASE}/drink_log/deleteDrinkLog.php`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ id }),
            })

            const text = await res.text()
            const json = text ? JSON.parse(text) : null

            if (!res.ok || !json?.ok) throw new Error(json?.error || json?.message || `HTTP ${res.status}`)

            // rimuovi dalla lista e aggiorna total
            setItems((prev) => prev.filter((x) => x.Id !== id))
            setStatsTotal((p) => Math.max(0, p - 1))

            // aggiorna anche counts (best-effort) in base alla categoria del log eliminato
            const removed = items.find((x) => x.Id === id)
            if (removed) {
                const cat = normalizeCategory(removed.CategoryName)
                setStatsCounts((p) => ({
                    ...p,
                    [cat]: Math.max(0, Number((p as any)[cat] ?? 0) - 1),
                }))
            }

            setDeleteTarget(null)
        } catch (e: any) {
            setDeleteError(e?.message || "Delete failed")
        } finally {
            setIsDeleting(false)
        }
    }

    async function getLogs(signal?: AbortSignal, opts?: { reset?: boolean }) {
        const reset = !!opts?.reset

        // evita fetch paralleli (REF, immediato)
        if (listLoadingRef.current) return
        if (!reset && !hasMore) return

        listLoadingRef.current = true
        setListLoading(true)
        setError(null)

        const reqId = ++listReqIdRef.current

        try {
            const nextPage = reset ? 1 : page
            const offset = (nextPage - 1) * LIMIT

            // Aggiunto parametro &_t per bypassare la cache
            const url = `${API_BASE}/drink_log/getDrinkLogs.php?range=${activeRange}&limit=${LIMIT}&offset=${offset}&_t=${Date.now()}`
            
            const res = await fetch(url, {
                credentials: "include",
                headers: { Accept: "application/json" },
                signal,
            })

            const text = await res.text()
            if (!text.trim()) throw new Error(`Empty response (HTTP ${res.status})`)

            const json: DrinkLogsResponse = JSON.parse(text)
            if (!res.ok || !json.ok) {
                throw new Error("error" in json ? json.error : `HTTP ${res.status}`)
            }

            if (reqId !== listReqIdRef.current) return

            const rows = json.items ?? []
            setItems((prev) => (reset ? rows : [...prev, ...rows]))

            // hasMore: usa statsTotal, ma fallback se ancora 0
            const loadedAfter = offset + rows.length
            const tot = statsTotal
            const hm = rows.length > 0 && loadedAfter < tot
            const hmFallback = rows.length === LIMIT
            setHasMore(tot > 0 ? hm : hmFallback)

            setPage(reset ? 2 : nextPage + 1)
        } catch (e: any) {
            if (e?.name !== "AbortError") setError(e?.message || "Errore caricamento logs")
        } finally {
            listLoadingRef.current = false
            setListLoading(false)
            setDidFirstFetch(true) // ✅ importante: almeno 1 fetch finito
        }
    }

    // reset + prima page quando cambia range
    useEffect(() => {
        listAbortRef.current?.abort()

        const controller = new AbortController()
        listAbortRef.current = controller

        // reset UI
        setItems([])
        setStatsTotal(0)
        setStatsCounts({ cocktail: 0, beer: 0, shot: 0, wine: 0, other: 0 })
        setPage(1)
        setHasMore(true)
        setError(null)
        setDidFirstFetch(false)

        // 🔥 fai partire entrambe (parallel) così non aspetti stats per vedere logs
        getStats(controller.signal)
        getLogs(controller.signal, { reset: true })

        return () => controller.abort()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeRange])

    // infinite scroll sentinel (come MenuDrinksPage)
    useEffect(() => {
        const el = loadMoreRef.current
        if (!el) return

        const obs = new IntersectionObserver(
            (entries) => {
                const first = entries[0]
                if (!first?.isIntersecting) return
                if (!didFirstFetch) return
                if (items.length === 0) return
                if (listLoadingRef.current) return
                if (!hasMore) return

                getLogs(listAbortRef.current?.signal)
            },
            { rootMargin: "800px" }
        )

        obs.observe(el)
        return () => obs.disconnect()
    }, [hasMore, activeRange, didFirstFetch, items.length])

    return (
        <div className="min-h-screen bg-background p-3 lg:px-10">
            {editTarget && <EditLogModal
                open={!!editTarget}
                loading={isUpdating}
                error={updateError}
                initialQuantity={editTarget?.Quantity ?? 1}
                initialDateYYYYMMDD={editTarget ? extractYYYYMMDD(editTarget.DateLog) : ""}
                initialTimeHHmm={editTarget ? extractHHmm(editTarget.DateLog) : "00:00"}
                initialNotes={editTarget?.Notes ?? ""}
                onCancel={() => setEditTarget(null)}
                onConfirm={({ quantity, dateYYYYMMDD, timeHHmm, notes }) => {
                    if (!editTarget) return
                    const newDateLog = buildDateLog(dateYYYYMMDD, timeHHmm)

                    updateDrinkLog({
                        id: editTarget.Id,
                        quantity,
                        dateLog: newDateLog,
                        notes: notes ?? "",
                    })
                }}
            />}

            {deleteTarget && <YesNoModal
                title="Delete log?"
                description="This action cannot be undone. Your log will be permanently removed."
                open={!!deleteTarget}
                loading={isDeleting}
                error={deleteError}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) deleteDrinkLog(deleteTarget.Id)
                }}
            />}
            {/* Header & Navigation */}
            <div className="flex items-center justify-between mb-6">
                <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-white/5 hover:bg-white/10 transition text-sm font-medium text-foreground"
                >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                    Back
                </button>
                <h1 className="text-lg font-bold tracking-wide">MY LOGS</h1>
                <div className="w-20" /> {/* Spacer per bilanciare il titolo al centro */}
            </div>

            {/* Drink Summary riprogettato (Simile al Widget) */}
            <div className="bg-card rounded-3xl p-5 mb-6 border border-white/5 shadow-lg">
                
                {/* Controlli Range Temporale */}
                <div className="flex items-center justify-between mb-6 bg-black/20 p-1 rounded-2xl">
                    <button
                        type="button"
                        onClick={() => setRangeIdx((p) => (p - 1 + RANGE_TABS.length) % RANGE_TABS.length)}
                        className="h-10 w-12 rounded-xl hover:bg-white/10 transition flex items-center justify-center"
                    >
                        <ChevronRight className="w-5 h-5 text-foreground-muted rotate-180" />
                    </button>
                    <p className="text-sm font-bold text-primary tracking-widest uppercase">
                        {RANGE_TABS[rangeIdx].label}
                    </p>
                    <button
                        type="button"
                        onClick={() => setRangeIdx((p) => (p + 1) % RANGE_TABS.length)}
                        className="h-10 w-12 rounded-xl hover:bg-white/10 transition flex items-center justify-center"
                    >
                        <ChevronRight className="w-5 h-5 text-foreground-muted" />
                    </button>
                </div>

                {/* Griglia Dati */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Totale Evidenziato */}
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center md:col-span-1">
                        <p className="text-sm text-primary/80 font-semibold mb-1 uppercase tracking-wider">Total Drinks</p>
                        <p className="text-5xl font-black text-primary">{statsTotal}</p>
                    </div>

                    {/* Sottocategorie */}
                    <div className="grid grid-cols-2 gap-3 md:col-span-2">
                        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5 flex flex-col justify-center">
                            <p className="text-2xl font-bold text-foreground">{statsCounts.cocktail}</p>
                            <p className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">Cocktails</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5 flex flex-col justify-center">
                            <p className="text-2xl font-bold text-foreground">{statsCounts.beer}</p>
                            <p className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">Beer</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5 flex flex-col justify-center">
                            <p className="text-2xl font-bold text-foreground">{statsCounts.shot}</p>
                            <p className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">Shots</p>
                        </div>
                        <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5 flex flex-col justify-center">
                            <p className="text-2xl font-bold text-foreground">{statsCounts.wine}</p>
                            <p className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">Wine</p>
                        </div>
                    </div>
                </div>
                
                {error && <p className="text-xs text-red-400 mt-4 text-center">{error}</p>}
            </div>

            {/* Intestazione Lista Connessa al Range */}
            <div className="flex items-center justify-between mb-4 px-2 mt-2">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <span className="bg-primary text-primary w-1.5 h-5 rounded-full inline-block shadow-[0_0_10px_rgba(var(--color-primary),0.5)]"></span>
                    Log {RANGE_TABS[rangeIdx].label.toUpperCase()}
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground-muted bg-black/20 px-3 py-1 rounded-lg border border-white/5">
                        {statsTotal} {statsTotal === 1 ? 'drink trovato' : 'drink trovati'}
                    </span>
                    <span className="text-[10px] font-medium text-foreground-muted/50 uppercase tracking-wider hidden sm:inline-block">
                        (Max {LIMIT} per pagina)
                    </span>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {items.map((it) => {
                    const cat = normalizeCategory(it.CategoryName)
                    return (
                        <div key={it.Id} className="bg-card rounded-2xl border border-white/5 flex flex-col overflow-hidden shadow-sm transition-all hover:bg-white/[0.02]">
                            
                            {/* Dati Principali (Lettura) */}
                            <div className="p-4 flex gap-4">
                                {/* Avatar */}
                                <div className="w-16 h-16 rounded-2xl bg-black/20 border border-white/5 overflow-hidden flex items-center justify-center shrink-0">
                                    {it.DrinkImageUrl ? (
                                        <img src={it.DrinkImageUrl} alt={it.DrinkName ?? "Drink"} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-[10px] font-bold text-foreground-muted uppercase tracking-widest">
                                            {cat}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-foreground font-semibold truncate text-lg">
                                            {it.DrinkName ?? "Drink"}
                                        </p>
                                        {Number(it.Quantity ?? 0) > 1 && (
                                            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md shrink-0">
                                                x{Number(it.Quantity)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-foreground-muted mt-1">
                                        {it.CategoryName ?? "Unknown"} • {formatDateNice(it.DateLog)}
                                    </p>
                                    
                                    {/* Notes */}
                                    {it.Notes && (
                                        <p className="text-sm text-foreground-muted/80 mt-3 bg-black/20 p-2.5 rounded-xl border border-white/5 italic line-clamp-2">
                                            "{it.Notes}"
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Action Bar (Interazione Sicura) */}
                            <div className="grid grid-cols-2 border-t border-white/5 bg-black/10 divide-x divide-white/5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUpdateError(null)
                                        setEditTarget(it)
                                    }}
                                    className="py-3 flex items-center justify-center gap-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                    Modifica
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDeleteError(null)
                                        setDeleteTarget(it)
                                    }}
                                    className="py-3 flex items-center justify-center gap-2 text-sm font-medium text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Elimina
                                </button>
                            </div>
                        </div>
                    )
                })}

                {didFirstFetch && !listLoading && items.length === 0 && (
                    <div className="bg-card rounded-2xl p-8 border border-white/5 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                            <span className="text-xl opacity-50">🍹</span>
                        </div>
                        <p className="text-foreground font-medium">Nessun drink registrato</p>
                        <p className="text-sm text-foreground-muted mt-1">Non hai log per questo periodo temporale.</p>
                    </div>
                )}

                {!didFirstFetch && (
                    <div className="bg-card rounded-2xl p-8 border border-white/5 text-center flex flex-col items-center justify-center animate-pulse">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-sm text-foreground-muted">Caricamento log...</p>
                    </div>
                )}

                {/* Sentinel */}
                <div ref={loadMoreRef} className="h-10" />
            </div>
        </div>
    )
}