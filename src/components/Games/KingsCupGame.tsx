// ============================================================
// KingsCupGame.tsx — Gioco Kings Cup
// ============================================================
// Logica:
//   - Mazzo da 52 carte costruito e mescolato con Fisher-Yates
//   - Ad ogni "pesca" si mostra il fronte della carta e la regola
//   - Ogni Re pescato riempie il 25% del bicchiere comune
//   - Al 4° Re: alert drammatico
//   - Pulsante reset per ricominciare con mazzo nuovo
// ============================================================

import { useState, useCallback } from "react"
import { ChevronLeft, RefreshCw } from "lucide-react"
import {
  KINGS_RULES,
  CARD_VALUES,
  CARD_SUITS,
  shuffleArray,
  type KingsRule,
} from "./game-data"

// ── Tipo per una singola carta ──
interface Card {
  value: string
  suit:  string
}

// ── Props del componente ──
interface KingsCupGameProps {
  onBack: () => void
}

// ── Costruisce un mazzo da 52 carte ──
function buildDeck(): Card[] {
  const deck: Card[] = []
  for (const value of CARD_VALUES) {
    for (const suit of CARD_SUITS) {
      deck.push({ value, suit })
    }
  }
  return shuffleArray(deck)
}

export default function KingsCupGame({ onBack }: KingsCupGameProps) {
  // ── Stato del mazzo ──
  const [deck,       setDeck]       = useState<Card[]>(buildDeck)
  const [drawnCount, setDrawnCount] = useState(0)
  const [kingsCount, setKingsCount] = useState(0)
  const [cupLevel,   setCupLevel]   = useState(0)    // 0–100 %

  // ── Carta corrente mostrata ──
  const [currentCard, setCurrentCard] = useState<Card | null>(null)
  const [currentRule, setCurrentRule] = useState<KingsRule | null>(null)
  const [showFourthKingAlert, setShowFourthKingAlert] = useState(false)

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null)

  // Mostra un toast per `duration` ms
  const triggerToast = useCallback((msg: string, duration = 2000) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }, [])

  // ────────────────────────────────────────
  // dealCard() — pesca la carta in cima
  // ────────────────────────────────────────
  const dealCard = useCallback(() => {
    if (deck.length === 0) {
      triggerToast("Mazzo esaurito! Ricomincia. 🏁", 2500)
      return
    }

    // Pesca l'ultima carta (cima del mazzo)
    const card = deck[deck.length - 1]
    const newDeck = deck.slice(0, -1)

    let newKingsCount = kingsCount
    let newCupLevel   = cupLevel

    // Gestione speciale Re
    if (card.value === "K") {
      newKingsCount = kingsCount + 1
      newCupLevel   = Math.min(cupLevel + 25, 100)
      setKingsCount(newKingsCount)
      setCupLevel(newCupLevel)

      if (newKingsCount === 4) {
        setShowFourthKingAlert(true)
        triggerToast("💀 QUARTO RE! Bevi tutto il bicchiere!", 4000)
      }
    }

    setDeck(newDeck)
    setDrawnCount(prev => prev + 1)
    setCurrentCard(card)
    setCurrentRule(KINGS_RULES[card.value] ?? null)
  }, [deck, kingsCount, cupLevel, triggerToast])

  // ────────────────────────────────────────
  // resetDeck() — azzera tutto
  // ────────────────────────────────────────
  const resetDeck = useCallback(() => {
    setDeck(buildDeck())
    setDrawnCount(0)
    setKingsCount(0)
    setCupLevel(0)
    setCurrentCard(null)
    setCurrentRule(null)
    setShowFourthKingAlert(false)
    triggerToast("🔀 Mazzo mescolato!")
  }, [triggerToast])

  // Cuori e quadri sono rossi, picche e fiori bianchi
  const isRedSuit = currentCard?.suit === "♥️" || currentCard?.suit === "♦️"

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

        {/* ── Intestazione + statistiche ── */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">🃏 Kings Cup</h1>
          <p className="text-foreground-muted text-sm">Pesca una carta e scopri la regola</p>

          {/* Tre statistiche */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-card rounded-2xl p-3 border border-white/5">
              <p className="text-xl font-bold text-foreground">{deck.length}</p>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wide mt-0.5">Rimaste</p>
            </div>
            <div className="bg-card rounded-2xl p-3 border border-white/5">
              <p className="text-xl font-bold text-orange-400">{kingsCount}</p>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wide mt-0.5">Re pescati</p>
            </div>
            <div className="bg-card rounded-2xl p-3 border border-white/5">
              <p className="text-xl font-bold text-foreground">{drawnCount}</p>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wide mt-0.5">Turni</p>
            </div>
          </div>
        </div>

        {/* ── Carta da gioco (cliccabile) ── */}
        <div className="flex justify-center mb-5">
          <button
            onClick={dealCard}
            disabled={deck.length === 0}
            className="
              w-40 h-52 rounded-2xl
              bg-card border border-white/10
              flex flex-col items-center justify-center
              cursor-pointer select-none
              transition-all duration-200
              hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-black/50
              active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0
            "
          >
            {currentCard ? (
              /* Fronte carta */
              <div className="flex flex-col items-center text-center px-3">
                <span className={`text-5xl font-black leading-none ${isRedSuit ? "text-red-400" : "text-foreground"}`}>
                  {currentCard.value}
                </span>
                <span className="text-3xl my-1">{currentCard.suit}</span>
                {currentRule && (
                  <span className="text-[10px] text-foreground-muted mt-1 leading-snug">
                    {currentRule.title}
                  </span>
                )}
              </div>
            ) : (
              /* Retro carta */
              <>
                <span className="text-5xl">🂠</span>
                <span className="text-foreground-muted text-[11px] mt-2">Tocca per pescare</span>
              </>
            )}
          </button>
        </div>

        {/* ── Box regola ── */}
        <div className="bg-card border border-white/5 rounded-2xl p-5 mb-4 min-h-[100px] flex flex-col items-center justify-center text-center">
          {currentRule ? (
            <>
              <span className="text-3xl mb-2">{currentRule.emoji}</span>
              <p className="font-semibold text-foreground mb-1">
                {currentCard?.value} {currentCard?.suit} — {currentRule.title}
              </p>
              <p className="text-foreground-muted text-sm leading-relaxed">{currentRule.text}</p>
            </>
          ) : (
            <p className="text-foreground-muted text-sm">Premi la carta per pescare e scoprire la regola</p>
          )}
        </div>

        {/* ── Alert 4° Re ── */}
        {showFourthKingAlert && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 mb-4 text-center">
            <p className="font-bold text-red-400 text-base mb-1">💀 Quarto Re!</p>
            <p className="text-foreground-muted text-sm">Chi ha pescato questo Re deve bere tutto il bicchiere comune!</p>
          </div>
        )}

        {/* ── Bicchiere comune ── */}
        <div className="bg-card border border-white/5 rounded-2xl p-4 mb-4 flex items-center gap-4">
          <span className="text-3xl">🍺</span>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-foreground-muted">Bicchiere comune</p>
              <p className="text-xs font-semibold text-orange-400">{cupLevel}%</p>
            </div>
            {/* Barra riempimento — cresce del 25% per ogni Re */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  cupLevel >= 100 ? "bg-red-400 animate-pulse" : "bg-orange-500"
                }`}
                style={{ width: `${cupLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* ── Pulsante pesca ── */}
        <button
          onClick={dealCard}
          disabled={deck.length === 0}
          className="
            w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.98]
            text-white font-bold text-base rounded-2xl py-4
            transition-all disabled:opacity-40 disabled:cursor-not-allowed
            mb-3
          "
        >
          🃏 Pesca carta
        </button>

        {/* ── Pulsante reset ── */}
        <button
          onClick={resetDeck}
          className="
            w-full flex items-center justify-center gap-2
            text-foreground-muted text-sm py-3 rounded-2xl
            border border-dashed border-white/10
            hover:border-white/20 hover:text-foreground
            transition-all
          "
        >
          <RefreshCw className="w-4 h-4" />
          Ricomincia con mazzo nuovo
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="
          fixed bottom-24 left-1/2 -translate-x-1/2
          bg-card border border-white/10 rounded-full
          px-5 py-2.5 text-sm font-medium text-foreground
          shadow-xl shadow-black/30
          animate-in fade-in slide-in-from-bottom-2 duration-200
          whitespace-nowrap z-50
        ">
          {toast}
        </div>
      )}
    </div>
  )
}