// ============================================================
// BeviOFaiGame.tsx — Gioco Bevi o Fai
// ============================================================
// Logica:
//   - Rotazione automatica dei giocatori (DEFAULT_PLAYERS)
//   - Click manuale su un chip per selezionare il giocatore
//   - Sfide pescate casualmente senza ripetizioni (pool reset
//     automatico quando tutte le sfide sono state usate)
//   - Tracking: sfide accettate, sorsi bevuti, totale
//   - Storico delle ultime 5 azioni
// ============================================================

import { useState, useCallback, useRef } from "react"
import { ChevronLeft, RefreshCw } from "lucide-react"
import { DARES, DEFAULT_PLAYERS, shuffleArray, type Dare } from "./game-data"

// ── Tipo per un'azione salvata nello storico ──
interface HistoryEntry {
  playerName: string
  emoji:      string
  result:     "accepted" | "drank"
  sips:       number
}

interface BeviOFaiGameProps {
  onBack: () => void
}

export default function BeviOFaiGame({ onBack }: BeviOFaiGameProps) {
  // ── Stato giocatore attivo ──
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0)

  // ── Pool sfide: array di indici non ancora usati ──
  const unusedIndicesRef = useRef<number[]>([])   // usiamo ref per non scatenare re-render

  // ── Sfida corrente ──
  const [currentDare, setCurrentDare] = useState<Dare | null>(null)

  // ── Statistiche sessione ──
  const [stats, setStats] = useState({ accepted: 0, drinks: 0, total: 0 })

  // ── Storico ultime azioni (max 5) ──
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null)

  const triggerToast = useCallback((msg: string, duration = 2000) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }, [])

  // ────────────────────────────────────────
  // pickNextDare() — pesca sfida casuale non ripetuta
  // ────────────────────────────────────────
  const pickNextDare = useCallback((): Dare => {
    // Se il pool è esaurito, ricrea tutti gli indici mescolati
    if (unusedIndicesRef.current.length === 0) {
      unusedIndicesRef.current = shuffleArray(
        Array.from({ length: DARES.length }, (_, i) => i)
      )
    }
    // Pesca il primo dall'array mescolato (simuliamo uno stack)
    const idx = unusedIndicesRef.current.pop()!
    return DARES[idx]
  }, [])

  // ────────────────────────────────────────
  // nextDare() — carica la prossima sfida
  // ────────────────────────────────────────
  const nextDare = useCallback(() => {
    setCurrentDare(pickNextDare())
  }, [pickNextDare])

  // ────────────────────────────────────────
  // selectPlayer(idx) — cambio turno manuale
  // ────────────────────────────────────────
  const selectPlayer = useCallback((idx: number) => {
    setCurrentPlayerIdx(idx)
  }, [])

  // ────────────────────────────────────────
  // advancePlayer() — passa al giocatore successivo
  // ────────────────────────────────────────
  const advancePlayer = useCallback(() => {
    setCurrentPlayerIdx(prev => (prev + 1) % DEFAULT_PLAYERS.length)
  }, [])

  // ────────────────────────────────────────
  // addHistory() — aggiunge azione allo storico
  // ────────────────────────────────────────
  const addHistory = useCallback((entry: HistoryEntry) => {
    setHistory(prev => [entry, ...prev].slice(0, 5)) // max 5 elementi
  }, [])

  // ────────────────────────────────────────
  // acceptDare() — giocatore accetta la sfida
  // ────────────────────────────────────────
  const acceptDare = useCallback(() => {
    if (!currentDare) return
    const player = DEFAULT_PLAYERS[currentPlayerIdx]

    setStats(prev => ({ ...prev, accepted: prev.accepted + 1, total: prev.total + 1 }))
    addHistory({ playerName: player.name, emoji: currentDare.emoji, result: "accepted", sips: 0 })
    triggerToast("✅ Sfida accettata! Forza!")
    advancePlayer()
    setTimeout(nextDare, 400)
  }, [currentDare, currentPlayerIdx, addHistory, triggerToast, advancePlayer, nextDare])

  // ────────────────────────────────────────
  // drinkDare() — giocatore rifiuta e beve
  // ────────────────────────────────────────
  const drinkDare = useCallback(() => {
    if (!currentDare) return
    const player = DEFAULT_PLAYERS[currentPlayerIdx]

    // Estrae il numero di sorsi dalla stringa penalty (es: "o bevi 3 sorsi" → 3)
    const sips = parseInt(currentDare.penalty.match(/\d+/)?.[0] ?? "2", 10)
    setStats(prev => ({ ...prev, drinks: prev.drinks + sips, total: prev.total + 1 }))
    addHistory({ playerName: player.name, emoji: currentDare.emoji, result: "drank", sips })
    triggerToast(`🍺 ${player.name} beve ${sips} sorsi!`)
    advancePlayer()
    setTimeout(nextDare, 400)
  }, [currentDare, currentPlayerIdx, addHistory, triggerToast, advancePlayer, nextDare])

  // Colori badge difficoltà
  const diffConfig = {
    easy:   { label: "Facile",   cls: "bg-green-500/15 text-green-400" },
    medium: { label: "Medio",    cls: "bg-orange-500/15 text-orange-400" },
    hard:   { label: "Difficile",cls: "bg-red-500/15 text-red-400" },
  }

  const currentPlayer = DEFAULT_PLAYERS[currentPlayerIdx]

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-24 lg:px-8 max-w-2xl mx-auto">

        {/* ── Barra superiore ── */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-foreground-muted text-sm mb-6 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Torna ai giochi
        </button>

        {/* ── Titolo ── */}
        <h1 className="text-2xl font-bold text-foreground mb-5">🎯 Bevi o Fai</h1>

        {/* ── Statistiche sessione ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-card border border-white/5 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-green-400">{stats.accepted}</p>
            <p className="text-[10px] text-foreground-muted uppercase tracking-wide mt-0.5">Accettate ✅</p>
          </div>
          <div className="bg-card border border-white/5 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-red-400">{stats.drinks}</p>
            <p className="text-[10px] text-foreground-muted uppercase tracking-wide mt-0.5">Sorsi bevuti 🍺</p>
          </div>
          <div className="bg-card border border-white/5 rounded-2xl p-3 text-center">
            <p className="text-xl font-bold text-foreground">{stats.total}</p>
            <p className="text-[10px] text-foreground-muted uppercase tracking-wide mt-0.5">Sfide totali</p>
          </div>
        </div>

        {/* ── Selezione giocatore di turno ── */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Giocatore di turno
          </p>
          {/* Scroll orizzontale nascosto */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DEFAULT_PLAYERS.map((player, idx) => (
              <button
                key={player.name}
                onClick={() => selectPlayer(idx)}
                className={`
                  flex items-center gap-2 px-3 py-1.5 rounded-full
                  border flex-shrink-0 transition-all
                  ${idx === currentPlayerIdx
                    ? "border-blue-400 bg-blue-500/15"
                    : "border-white/10 bg-card hover:border-white/20"
                  }
                `}
              >
                {/* Avatar con colore personalizzato */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                  style={{ background: player.color }}
                >
                  {player.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-foreground whitespace-nowrap">
                  {player.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Card grande con la sfida ── */}
        <div className="bg-card border border-white/5 rounded-3xl p-7 mb-4 text-center relative overflow-hidden min-h-[200px] flex flex-col items-center justify-center">
          {/* Blob decorativo */}
          <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />

          {currentDare ? (
            <>
              {/* Badge difficoltà */}
              <span className={`
                absolute top-4 left-4 text-[10px] font-semibold px-2.5 py-1 rounded-full
                ${diffConfig[currentDare.diff].cls}
              `}>
                {diffConfig[currentDare.diff].label}
              </span>

              <span className="text-5xl mb-3 relative z-10">{currentDare.emoji}</span>

              {/* Tag giocatore */}
              <span className="text-[11px] font-bold text-blue-400 bg-blue-500/15 px-3 py-1 rounded-full mb-3 tracking-wider uppercase relative z-10">
                {currentPlayer.name}
              </span>

              <p className="text-foreground font-bold text-[18px] leading-snug mb-2 max-w-xs relative z-10">
                {currentDare.text}
              </p>

              {currentDare.penalty && (
                <p className="text-red-400 text-sm relative z-10">{currentDare.penalty}</p>
              )}
            </>
          ) : (
            /* Stato iniziale prima di pescare */
            <div className="flex flex-col items-center gap-3">
              <span className="text-4xl">🎲</span>
              <p className="text-foreground-muted text-sm">Premi "Nuova sfida" per iniziare</p>
            </div>
          )}
        </div>

        {/* ── Pulsanti Accetto / Bevo ── */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <button
            onClick={acceptDare}
            disabled={!currentDare}
            className="
              bg-green-500/15 text-green-400
              border border-green-500/25
              rounded-2xl py-4 font-bold text-[15px]
              transition-all active:scale-[0.97]
              hover:bg-green-500/20
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            ✅ Accetto!
          </button>
          <button
            onClick={drinkDare}
            disabled={!currentDare}
            className="
              bg-red-500/15 text-red-400
              border border-red-500/25
              rounded-2xl py-4 font-bold text-[15px]
              transition-all active:scale-[0.97]
              hover:bg-red-500/20
              disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            🍺 Bevo
          </button>
        </div>

        {/* ── Pulsante Nuova sfida ── */}
        <button
          onClick={nextDare}
          className="
            w-full flex items-center justify-center gap-2
            bg-card border border-white/10 text-foreground-muted
            rounded-2xl py-3.5 text-sm font-medium
            hover:border-white/20 hover:text-foreground
            transition-all active:scale-[0.98] mb-6
          "
        >
          <RefreshCw className="w-4 h-4" />
          Nuova sfida
        </button>

        {/* ── Storico azioni ── */}
        {history.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider mb-3">
              Ultime azioni
            </p>
            <div className="flex flex-col gap-0">
              {history.map((entry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0"
                >
                  <span className="text-lg">{entry.emoji}</span>
                  <span className="text-foreground text-sm font-medium flex-1">{entry.playerName}</span>
                  <span className={`text-xs font-semibold ${
                    entry.result === "accepted" ? "text-green-400" : "text-red-400"
                  }`}>
                    {entry.result === "accepted" ? "✅ Accettata" : `🍺 ${entry.sips} sorsi`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="
          fixed bottom-24 left-1/2 -translate-x-1/2
          bg-card border border-white/10 rounded-full
          px-5 py-2.5 text-sm font-medium text-foreground
          shadow-xl shadow-black/30 whitespace-nowrap z-50
          animate-in fade-in slide-in-from-bottom-2 duration-200
        ">
          {toast}
        </div>
      )}
    </div>
  )
}