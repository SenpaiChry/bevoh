// NBAOracle.tsx
// Aggiungilo al tuo router come <Route path="/nba" element={<NBAOracle />} />
// Assicurati di avere lucide-react installato: npm i lucide-react

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Search, X, ChevronDown, Loader2,
  TrendingUp, Zap, BarChart2, AlertTriangle,
  CheckCircle2, Activity, Shield, Swords,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// ─── Config ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_NBA_API_URL ?? "https://tuo-progetto.onrender.com"

const TEAM_COLORS: Record<string, string> = {
  ATL:"#E03A3E", BOS:"#007A33", BKN:"#222",   CHA:"#1D1160", CHI:"#CE1141",
  CLE:"#6F263D", DAL:"#00538C", DEN:"#0E2240", DET:"#C8102E", GSW:"#1D428A",
  HOU:"#CE1141", IND:"#FDBB30", LAC:"#C8102E", LAL:"#552583", MEM:"#5D76A9",
  MIA:"#98002E", MIL:"#00471B", MIN:"#0C2340", NOP:"#0C2340", NYK:"#006BB6",
  OKC:"#007AC1", ORL:"#0077C0", PHI:"#006BB6", PHX:"#1D1160", POR:"#E03A3E",
  SAC:"#5A2D81", SAS:"#888",   TOR:"#CE1141", UTA:"#002B5C", WAS:"#002B5C",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Team { abbr: string; name: string }

interface Layers {
  ml_model:   { home: number; away: number }
  sportsbook: { home: number; away: number }
  polymarket: { home: number; away: number } | null
  blend:      { home: number; away: number; weights: Record<string,number> }
}

interface TeamInfo {
  abbr: string; name: string
  stats: {
    avg_PTS: number; avg_OPP_PTS: number; avg_NET_RTG: number
    avg_FG_PCT: number; avg_FG3_PCT: number
    Form: number; Streak: number; elo: number; rest_days: number; b2b: number
  }
}

interface ClaudeResult {
  winner?: string; confidence?: string; expected_margin?: number
  home_win_probability?: number; key_factors?: string[]
  upset_scenario?: string; bet_recommendation?: string; summary?: string
  error?: string
}

interface GameResult {
  match: string
  home_team: TeamInfo
  away_team: TeamInfo
  layers: Layers
  divergence: number
  all_agree: boolean
  claude: ClaudeResult
}

interface SlateGame  { home_team: string; away_team: string }
interface SlateItem  {
  home: string; away: string; home_name: string; away_name: string
  ml: { home: number; away: number }
  home_b2b: number; away_b2b: number
}
interface SlateResult { games: SlateItem[]; claude_summary: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (v: number) => `${(v * 100).toFixed(1)}%`
const tc  = (abbr: string) => TEAM_COLORS[abbr] ?? "#666"

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── ProbBar ──────────────────────────────────────────────────────────────────

function ProbBar({
  label, icon, homeP, awayP, color, height = 6,
}: {
  label: string; icon?: React.ReactNode
  homeP: number; awayP: number; color: string; height?: number
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-1.5 text-white/40">
          {icon}
          <span className="uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-white/60">{pct(homeP)} / {pct(awayP)}</span>
      </div>
      <div className="w-full bg-white/5 rounded-full overflow-hidden" style={{ height }}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${homeP * 100}%`, background: color }}
        />
      </div>
    </div>
  )
}

// ─── TeamCombobox — searchable, used everywhere ───────────────────────────────

function TeamCombobox({
  teams, value, onChange, label, placeholder = "Search team…",
}: {
  teams: Team[]; value: string; onChange: (v: string) => void
  label?: string; placeholder?: string
}) {
  const [open,  setOpen]  = useState(false)
  const [query, setQuery] = useState("")
  const ref      = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const selected = teams.find(t => t.abbr === value)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery("")
      }
    }
    document.addEventListener("mousedown", h)
    return () => document.removeEventListener("mousedown", h)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  const filtered = query.trim()
    ? teams.filter(t =>
        t.abbr.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase())
      )
    : teams

  const handleSelect = (abbr: string) => {
    onChange(abbr)
    setOpen(false)
    setQuery("")
  }

  return (
    <div ref={ref} className="relative flex-1 min-w-[150px]">
      {label && (
        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1.5">{label}</p>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white hover:bg-white/10 transition text-left"
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: selected ? tc(selected.abbr) : "#333" }}
        />
        <span className="flex-1 truncate">
          {selected
            ? `${selected.abbr} — ${selected.name}`
            : <span className="text-white/30">{placeholder}</span>
          }
        </span>
        <ChevronDown className={`w-4 h-4 text-white/25 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-full rounded-2xl bg-[#161616] border border-white/10 shadow-2xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-white/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type to search…"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-1.5 pl-8 pr-8 text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-white/25 hover:text-white transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-xs text-white/25 text-center">No teams found</p>
            ) : (
              filtered.map(t => (
                <button
                  key={t.abbr}
                  type="button"
                  onClick={() => handleSelect(t.abbr)}
                  className={[
                    "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition text-left",
                    value === t.abbr
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5 hover:text-white",
                  ].join(" ")}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: tc(t.abbr) }} />
                  <span className="font-mono text-xs w-8 shrink-0 text-white/80">{t.abbr}</span>
                  <span className="text-white/40 text-xs truncate">{t.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ team }: { team: TeamInfo }) {
  const s = team.stats
  const color = tc(team.abbr)
  const rows: [string, string, string?][] = [
    ["PPG",     s.avg_PTS.toFixed(1)],
    ["Opp PPG", s.avg_OPP_PTS.toFixed(1)],
    ["Net RTG", s.avg_NET_RTG.toFixed(1), s.avg_NET_RTG > 0 ? "text-green-400" : s.avg_NET_RTG < -2 ? "text-red-400" : ""],
    ["FG%",     pct(s.avg_FG_PCT)],
    ["3P%",     pct(s.avg_FG3_PCT)],
    ["Form",    pct(s.Form)],
    ["Streak",  (s.Streak > 0 ? "+" : "") + s.Streak, s.Streak > 2 ? "text-green-400" : s.Streak < -2 ? "text-red-400" : ""],
    ["ELO",     s.elo.toFixed(0)],
    ["Rest",    `${s.rest_days}d`],
  ]

  return (
    <div
      className="rounded-2xl bg-white/[0.03] border border-white/5 p-4"
      style={{ borderTop: `2px solid ${color}` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 shrink-0"
          style={{ borderColor: color, color, background: `${color}15` }}
        >
          {team.abbr.slice(0, 2)}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{team.abbr}</p>
          <p className="text-[10px] text-white/30">{team.name}</p>
        </div>
        {s.b2b === 1 && (
          <span className="ml-auto text-[9px] bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg px-2 py-0.5">
            B2B ⚠
          </span>
        )}
      </div>
      <div className="space-y-0.5">
        {rows.map(([k, v, cls]) => (
          <div key={k} className="flex justify-between py-[3px] border-b border-white/[0.04] last:border-0">
            <span className="text-[11px] text-white/35">{k}</span>
            <span className={`text-[11px] font-mono ${cls ?? "text-white/70"}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── ClaudePanel ─────────────────────────────────────────────────────────────

function ClaudePanel({ c }: { c: ClaudeResult }) {
  if (c.error) return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
      <p className="text-sm text-red-400">Analisi non disponibile: {c.error}</p>
    </div>
  )

  const confColor =
    c.confidence === "high"   ? "bg-green-500/10 border-green-500/20 text-green-400" :
    c.confidence === "medium" ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-400" :
                                "bg-red-500/10 border-red-500/20 text-red-400"

  return (
    <div className="space-y-4">
      {/* Chips */}
      <div className="flex flex-wrap gap-2">
        {c.winner && (
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-white">
            🏆 {c.winner}
          </span>
        )}
        {c.confidence && (
          <span className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs uppercase tracking-wider ${confColor}`}>
            {c.confidence} confidence
          </span>
        )}
        {c.expected_margin !== undefined && (
          <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-white/60">
            ±{c.expected_margin} pts
          </span>
        )}
      </div>

      {/* Summary */}
      {c.summary && (
        <p className="text-sm text-white/60 leading-relaxed">{c.summary}</p>
      )}

      {/* Key factors */}
      {c.key_factors && c.key_factors.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-white/30 mb-2">Key Factors</p>
          <div className="space-y-1.5">
            {c.key_factors.map((f, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-primary/60 mt-2 shrink-0" />
                <p className="text-xs text-white/55 leading-relaxed">{f}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upset */}
      {c.upset_scenario && (
        <div className="flex items-start gap-2 text-xs text-white/40 italic">
          <Zap className="w-3.5 h-3.5 text-yellow-500/60 shrink-0 mt-0.5" />
          {c.upset_scenario}
        </div>
      )}

      {/* Bet rec */}
      {c.bet_recommendation && (
        <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3">
          <p className="text-[10px] uppercase tracking-widest text-blue-400/60 mb-1">Bet Recommendation</p>
          <p className="text-xs text-blue-300/80">{c.bet_recommendation}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NBAOracle() {
  const [teams,      setTeams]      = useState<Team[]>([])
  const [connected,  setConnected]  = useState<boolean | null>(null)

  // ── Single game ────────────────────────────────────────────────────────────
  const [homeTeam,   setHomeTeam]   = useState("BOS")
  const [awayTeam,   setAwayTeam]   = useState("MIA")
  const [sbHome,     setSbHome]     = useState("")
  const [sbAway,     setSbAway]     = useState("")
  const [polyHome,   setPolyHome]   = useState("")
  const [polyAway,   setPolyAway]   = useState("")
  const [gameResult, setGameResult] = useState<GameResult | null>(null)
  const [gameLoading,setGameLoading]= useState(false)
  const [gameError,  setGameError]  = useState<string | null>(null)
  const [fetchingOdds, setFetchingOdds] = useState(false)
  const [oddsSource,   setOddsSource]   = useState<Record<string,string>>({})

  // ── Slate ──────────────────────────────────────────────────────────────────
  const [slateGames,   setSlateGames]   = useState<SlateGame[]>([
    { home_team: "GSW", away_team: "LAL" },
    { home_team: "BOS", away_team: "NYK" },
    { home_team: "MIL", away_team: "CHI" },
    { home_team: "PHX", away_team: "DEN" },
  ])
  const [slateResult,  setSlateResult]  = useState<SlateResult | null>(null)
  const [slateLoading, setSlateLoading] = useState(false)
  const [slateError,   setSlateError]   = useState<string | null>(null)

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"game" | "slate">("game")

  // ── API URL ────────────────────────────────────────────────────────────────
  const [apiUrl, setApiUrl] = useState(() =>
    localStorage.getItem("nba_api_url") ?? API_BASE
  )

  const base = apiUrl.replace(/\/$/, "")

  // ── Connect ────────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    setConnected(null)
    try {
      const r = await fetch(`${base}/health`)
      if (!r.ok) throw new Error()
      const d = await r.json()
      setConnected(true)
      localStorage.setItem("nba_api_url", apiUrl)

      const tr = await fetch(`${base}/teams`)
      const tj = await tr.json()
      if (tj?.teams) setTeams(tj.teams)
    } catch {
      setConnected(false)
    }
  }, [base, apiUrl])

  useEffect(() => { connect() }, [])

  // ── Predict game ───────────────────────────────────────────────────────────
  const predictGame = async () => {
    if (!homeTeam || !awayTeam || homeTeam === awayTeam) return
    setGameLoading(true)
    setGameError(null)
    setGameResult(null)
    try {
      const body: Record<string, any> = { home_team: homeTeam, away_team: awayTeam }
      if (sbHome)   body.sportsbook_home_ml = parseFloat(sbHome)
      if (sbAway)   body.sportsbook_away_ml = parseFloat(sbAway)
      if (polyHome) body.polymarket_home    = parseFloat(polyHome)
      if (polyAway) body.polymarket_away    = parseFloat(polyAway)

      const r = await fetch(`${base}/predict/game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail ?? r.statusText) }
      setGameResult(await r.json())
    } catch (e: any) {
      setGameError(e.message)
    } finally {
      setGameLoading(false)
    }
  }

  // ── Fetch odds automatically ──────────────────────────────────────────────
  const fetchOdds = async () => {
    if (!homeTeam || !awayTeam || homeTeam === awayTeam) return
    setFetchingOdds(true)
    try {
      const r = await fetch(`${base}/odds/game?home=${homeTeam}&away=${awayTeam}`)
      if (!r.ok) throw new Error(r.statusText)
      const d = await r.json()
      if (d.sportsbook) {
        // Convert back to approximate American odds for display, or just store probs
        setSbHome("")
        setSbAway("")
        setOddsSource({ sb: "the_odds_api", poly: d.polymarket ? "polymarket_api" : "none" })
        // Store as pre-fetched so predict_game uses them automatically
        setOddsSource({
          sb: d.sportsbook ? `SB: ${(d.sportsbook.home*100).toFixed(1)}% / ${(d.sportsbook.away*100).toFixed(1)}%` : "",
          poly: d.polymarket ? `Poly: ${(d.polymarket.home*100).toFixed(1)}% / ${(d.polymarket.away*100).toFixed(1)}%` : "",
        })
      } else {
        setOddsSource({ sb: "No live odds available for this game", poly: "" })
      }
    } catch (e: any) {
      setOddsSource({ sb: `Error: ${e.message}`, poly: "" })
    } finally {
      setFetchingOdds(false)
    }
  }

  // ── Analyze slate ──────────────────────────────────────────────────────────
  const analyzeSlate = async () => {
    const valid = slateGames.filter(g => g.home_team && g.away_team && g.home_team !== g.away_team)
    if (!valid.length) return
    setSlateLoading(true)
    setSlateError(null)
    setSlateResult(null)
    try {
      const r = await fetch(`${base}/predict/slate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games: valid }),
      })
      if (!r.ok) { const e = await r.json(); throw new Error(e.detail ?? r.statusText) }
      setSlateResult(await r.json())
    } catch (e: any) {
      setSlateError(e.message)
    } finally {
      setSlateLoading(false)
    }
  }

  // ── Slate row helpers ──────────────────────────────────────────────────────
  const addSlateRow = () =>
    setSlateGames(p => [...p, { home_team: "", away_team: "" }])

  const removeSlateRow = (i: number) =>
    setSlateGames(p => p.filter((_, idx) => idx !== i))

  const updateSlateRow = (i: number, field: keyof SlateGame, val: string) =>
    setSlateGames(p => p.map((g, idx) => idx === i ? { ...g, [field]: val } : g))
  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-30 border-b border-white/5 px-5 lg:px-8 py-3">
        <div className="flex items-center gap-4 flex-wrap">

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-sm shadow-lg shadow-orange-500/25">
              🏀
            </div>
            <div>
              <p className="text-sm font-semibold text-white tracking-wide leading-none">NBA Oracle</p>
              <p className="text-[9px] text-white/25 uppercase tracking-widest mt-0.5">AI Predictions</p>
            </div>
          </div>

          {/* API URL */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              className="flex-1 bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-primary/50 transition font-mono"
              placeholder="https://tuo-progetto.onrender.com"
              value={apiUrl}
              onChange={e => setApiUrl(e.target.value)}
            />
            <Button size="sm" variant="outline" onClick={connect} className="shrink-0 text-xs">
              {connected === null ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Connect"}
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <div className={[
              "w-1.5 h-1.5 rounded-full",
              connected === true  ? "bg-green-400 shadow-[0_0_6px_#4ade80]" :
              connected === false ? "bg-red-400" : "bg-white/20",
            ].join(" ")} />
            <span className="text-white/30">
              {connected === true ? "connected" : connected === false ? "offline" : "…"}
            </span>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 ml-auto bg-white/5 rounded-xl p-1 border border-white/5">
            {(["game", "slate"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  tab === t
                    ? "bg-white/10 text-white"
                    : "text-white/35 hover:text-white",
                ].join(" ")}
              >
                {t === "game" ? "Single Game" : "Full Slate"}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="px-5 lg:px-8 py-6 max-w-5xl mx-auto space-y-5">

        {/* ── SINGLE GAME TAB ──────────────────────────────────────────────── */}
        {tab === "game" && (
          <>
            {/* Selector card */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4">Select Matchup</p>

              {/* Team selectors */}
              <div className="flex items-end gap-3 flex-wrap">
                <TeamCombobox teams={teams} value={homeTeam} onChange={setHomeTeam} label="Home" />
                <div className="pb-1 text-white/15 font-bold text-lg shrink-0">VS</div>
                <TeamCombobox teams={teams} value={awayTeam} onChange={setAwayTeam} label="Away" />
                <Button
                  onClick={predictGame}
                  disabled={gameLoading || !connected || homeTeam === awayTeam}
                  className="shrink-0 gap-2 mb-[1px]"
                >
                  {gameLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing…</>
                    : <><Activity className="w-4 h-4" /> Predict</>
                  }
                </Button>
              </div>

              {/* Optional odds */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                {/* Auto-fetch row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    variant="outline" size="sm"
                    onClick={fetchOdds}
                    disabled={fetchingOdds || !homeTeam || !awayTeam || homeTeam === awayTeam || !connected}
                    className="gap-2 text-xs shrink-0"
                  >
                    {fetchingOdds
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching…</>
                      : <><TrendingUp className="w-3.5 h-3.5" /> Auto-fetch Odds</>
                    }
                  </Button>
                  <div className="flex flex-col gap-0.5">
                    {oddsSource.sb && (
                      <p className={`text-[10px] font-mono ${oddsSource.sb.startsWith("Error") || oddsSource.sb.startsWith("No") ? "text-red-400/70" : "text-green-400/70"}`}>
                        📊 {oddsSource.sb}
                      </p>
                    )}
                    {oddsSource.poly && (
                      <p className="text-[10px] font-mono text-green-400/70">🌐 {oddsSource.poly}</p>
                    )}
                    {!oddsSource.sb && (
                      <p className="text-[10px] text-white/20">Fetches DraftKings/FanDuel + Polymarket automatically</p>
                    )}
                  </div>
                </div>

                {/* Manual override inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Field label="Override SB Home ML">
                    <input className={inputCls} type="number" placeholder="-180" value={sbHome} onChange={e => setSbHome(e.target.value)} />
                  </Field>
                  <Field label="Override SB Away ML">
                    <input className={inputCls} type="number" placeholder="+155" value={sbAway} onChange={e => setSbAway(e.target.value)} />
                  </Field>
                  <Field label="Override Poly Home">
                    <input className={inputCls} type="number" step="0.01" min="0" max="1" placeholder="0.62" value={polyHome} onChange={e => setPolyHome(e.target.value)} />
                  </Field>
                  <Field label="Override Poly Away">
                    <input className={inputCls} type="number" step="0.01" min="0" max="1" placeholder="0.38" value={polyAway} onChange={e => setPolyAway(e.target.value)} />
                  </Field>
                </div>
              </div>
            </div>

            {/* Error */}
            {gameError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {gameError}
              </div>
            )}

            {/* Results */}
            {gameResult && (() => {
              const { home_team: ht, away_team: at, layers, divergence, all_agree, claude } = gameResult
              const hc = tc(ht.abbr)
              const ac = tc(at.abbr)
              return (
                <div className="space-y-4">

                  {/* Probability layers */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] uppercase tracking-widest text-white/30">
                        Probability Layers — {ht.abbr} vs {at.abbr}
                      </p>
                      <div className={[
                        "flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded-full border",
                        all_agree
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                      ].join(" ")}>
                        {all_agree
                          ? <><CheckCircle2 className="w-3 h-3" /> All agree</>
                          : <><AlertTriangle className="w-3 h-3" /> {pct(divergence)} gap</>
                        }
                      </div>
                    </div>

                    <div className="space-y-3">
                      <ProbBar label="ML Model"    icon={<BarChart2 className="w-3 h-3"/>}  homeP={layers.ml_model.home}   awayP={layers.ml_model.away}   color="#3d8fff" />
                      <ProbBar label="Sportsbook"  icon={<Shield className="w-3 h-3"/>}      homeP={layers.sportsbook.home} awayP={layers.sportsbook.away} color="#a855f7" />
                      {layers.polymarket && (
                        <ProbBar label="Polymarket" icon={<TrendingUp className="w-3 h-3"/>} homeP={layers.polymarket.home} awayP={layers.polymarket.away} color="#00e5a0" />
                      )}
                    </div>

                    {/* Final blend — thicker bar */}
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <ProbBar label="Triple Blend" icon={<Zap className="w-3 h-3"/>} homeP={layers.blend.home} awayP={layers.blend.away} color="linear-gradient(90deg,#f97316,#ef4444)" height={12} />
                    </div>

                    {/* Team labels */}
                    <div className="flex justify-between mt-3 text-xs font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: hc }} />
                        <span className="text-white/50">{ht.abbr}</span>
                        <span className="text-white font-semibold">{pct(layers.blend.home)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white font-semibold">{pct(layers.blend.away)}</span>
                        <span className="text-white/50">{at.abbr}</span>
                        <div className="w-2 h-2 rounded-full" style={{ background: ac }} />
                      </div>
                    </div>
                  </div>

                  {/* Stats + Claude side by side on desktop */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <StatCard team={ht} />
                    <StatCard team={at} />
                  </div>

                  {/* Claude analysis */}
                  <div className="rounded-2xl bg-white/[0.03] border border-white/5 border-l-2 p-5" style={{ borderLeftColor: "#f97316" }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs shrink-0">
                        ✦
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30">Claude AI Analysis</p>
                      <Swords className="w-3.5 h-3.5 text-white/15 ml-auto" />
                    </div>
                    <ClaudePanel c={claude} />
                  </div>

                </div>
              )
            })()}
          </>
        )}


        {/* ── SLATE TAB ────────────────────────────────────────────────────── */}
        {tab === "slate" && (
          <>
            <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
              <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4">Build Tonight's Slate</p>

              <div className="space-y-3 mb-4">
                {slateGames.map((g, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2 items-end">
                    <TeamCombobox
                      teams={teams}
                      value={g.home_team}
                      onChange={v => updateSlateRow(i, "home_team", v)}
                      label={i === 0 ? "Home" : undefined}
                      placeholder="Home team…"
                    />
                    <TeamCombobox
                      teams={teams}
                      value={g.away_team}
                      onChange={v => updateSlateRow(i, "away_team", v)}
                      label={i === 0 ? "Away" : undefined}
                      placeholder="Away team…"
                    />
                    <button
                      type="button"
                      onClick={() => removeSlateRow(i)}
                      className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition mb-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={addSlateRow} className="text-xs gap-1.5">
                  + Add game
                </Button>
                <Button
                  size="sm"
                  onClick={analyzeSlate}
                  disabled={slateLoading || !connected}
                  className="gap-1.5 text-xs"
                >
                  {slateLoading
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing {slateGames.length} games…</>
                    : <><Activity className="w-3.5 h-3.5" /> Analyze Slate</>
                  }
                </Button>
              </div>
            </div>

            {/* Slate error */}
            {slateError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {slateError}
              </div>
            )}

            {/* Slate results */}
            {slateResult && (
              <div className="space-y-4">
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5">
                  <p className="text-[10px] uppercase tracking-widest text-white/30 mb-4">Game Predictions</p>
                  <div className="space-y-3">
                    {slateResult.games.map((g, i) => {
                      const winner  = g.ml.home > g.ml.away ? g.home : g.away
                      const winProb = Math.max(g.ml.home, g.ml.away)
                      const winColor = tc(winner)
                      const confidence = (winProb - 0.5) * 2
                      return (
                        <div key={i} className="grid grid-cols-[1fr_1.5fr_64px] gap-4 items-center bg-white/[0.02] rounded-xl px-4 py-3 border border-white/5">
                          {/* Teams */}
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-white">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tc(g.home) }} />
                              {g.home}
                              <span className="text-white/25 text-[9px]">HOME</span>
                              {g.home_b2b === 1 && <span className="text-[9px] text-red-400">B2B</span>}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-white/50">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tc(g.away) }} />
                              {g.away}
                              <span className="text-white/25 text-[9px]">AWAY</span>
                              {g.away_b2b === 1 && <span className="text-[9px] text-red-400">B2B</span>}
                            </div>
                          </div>
                          {/* Bars: home prob + away prob */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-white/25 w-6 text-right shrink-0">{Math.round(g.ml.home * 100)}%</span>
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full bg-blue-500/70 transition-all duration-700" style={{ width: `${g.ml.home * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono text-white/25 w-6 text-right shrink-0">{Math.round(g.ml.away * 100)}%</span>
                              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${g.ml.away * 100}%`, background: "linear-gradient(90deg,#f97316,#ef4444)" }} />
                              </div>
                            </div>
                          </div>
                          {/* Pick */}
                          <div className="text-right">
                            <p className="text-sm font-bold" style={{ color: winColor }}>{winner}</p>
                            <p className="text-[10px] font-mono text-white/30">{pct(winProb)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/5 border-l-2 p-5" style={{ borderLeftColor: "#f97316" }}>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-xs">✦</div>
                    <p className="text-[10px] uppercase tracking-widest text-white/30">Claude Slate Analysis + Best Bets</p>
                  </div>
                  <pre className="text-xs text-white/55 leading-relaxed font-sans whitespace-pre-wrap">
                    {slateResult.claude_summary}
                  </pre>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Legend ───────────────────────────────────────────────────────── */}
        <div className="border-t border-white/5 pt-5 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-mono text-white/20">
          {[
            { color: "#3d8fff", label: "ML Model" },
            { color: "#a855f7", label: "Sportsbook" },
            { color: "#00e5a0", label: "Polymarket" },
            { color: "#f97316", label: "Triple Blend" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
              {label}
            </div>
          ))}
          <span className="ml-auto">NBA Oracle · Triple-Layer AI System</span>
        </div>

      </main>
    </div>
  )
}