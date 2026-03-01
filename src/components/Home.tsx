import { useEffect, useMemo, useState } from "react"
import SafetyCard from "./SafetyCard"
import { DrinkLogModel } from "@/models/log-drink-models"

const API_BASE = "https://bevoh.altervista.org/api"

type DrinkLogsResponse =
  | {
    ok: true
    range: string
    fromDate: string | null
    limit: number
    offset: number
    total: number
    items: DrinkLogModel[]
  }
  | { ok: false; error: string }

export default function HomePage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [tonightDrinks, setTonightDrinks] = useState<{ category: string; timestamp: string; quantity: number }[]>([])
  const [totalDrinks, setTotalDrinks] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadLast24h() {
      try {
        setLoading(true)
        setError(null)

        // ci serve "items" per le categorie + firstDrinkTime
        const res = await fetch(`${API_BASE}/drink_log/getDrinkLogs.php?range=24h&limit=500&offset=0`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        })

        const text = await res.text()
        if (!text.trim()) throw new Error(`Empty response (HTTP ${res.status})`)

        const json: DrinkLogsResponse = JSON.parse(text)

        if (!res.ok || !json.ok) {
          throw new Error("error" in json ? json.error : `HTTP ${res.status}`)
        }

        if (cancelled) return

        setTotalDrinks(Number(json.total ?? 0))

        const mapped = (json.items ?? []).map((it) => ({
          category: it.CategoryName,
          timestamp: it.DateLog,
          quantity: Number(it.Quantity ?? 1),
        }))

        setTonightDrinks(mapped)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Errore caricamento stats")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadLast24h()
    return () => {
      cancelled = true
    }
  }, [])

  // backend ORDER BY DateLog DESC => l'ultimo è il più vecchio nel range
  const firstDrinkTime: Date | undefined = useMemo(() => {
    if (tonightDrinks.length === 0) return undefined

    const raw = tonightDrinks[tonightDrinks.length - 1].timestamp
    return new Date(raw.replace(" ", "T"))
  }, [tonightDrinks])


  return (
    <div className="min-h-screen bg-background pt-1 md:pt-5 px-3 lg:px-8">
      {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
      {loading && <p className="text-xs text-foreground-muted mb-2">Loading...</p>}

      <SafetyCard totalDrinks={totalDrinks} firstDrinkTime={firstDrinkTime} />
    </div>
  )
}
