// ============================================================
// GamesPage.tsx — Pagina principale dei giochi
// ============================================================
// Gestisce la navigazione tra i giochi tramite stato locale
// (activeGame) senza bisogno di route extra. Ogni gioco viene
// renderizzato come componente figlio direttamente qui.
//
// Struttura:
//   GamesPage
//     ├── GameSelector   (schermata di selezione)
//     ├── KingsCupGame   (Kings Cup)
//     ├── BeviOFaiGame   (Bevi o Fai)
//     └── QuizGame       (Quiz Ubriaco)
// ============================================================

import { useState } from "react"
import KingsCupGame   from "./KingsCupGame"
import BeviOFaiGame   from "./BeviOFaiGame"
import QuizGame       from "./QuizGame"
import DoOrDrinkGame  from "./DoOrDrinkGame"

// Il tipo del gioco attivo (null = schermata selezione)
type ActiveGame = "kings" | "dare" | "quiz" | "doordrink" | null

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<ActiveGame>(null)

  // Se un gioco è attivo, renderizza il suo componente
  if (activeGame === "kings")     return <KingsCupGame  onBack={() => setActiveGame(null)} />
  if (activeGame === "dare")      return <BeviOFaiGame   onBack={() => setActiveGame(null)} />
  if (activeGame === "quiz")      return <QuizGame        onBack={() => setActiveGame(null)} />
  if (activeGame === "doordrink") return <DoOrDrinkGame   onBack={() => setActiveGame(null)} />

  // Altrimenti mostra la schermata di selezione
  return <GameSelector onSelect={setActiveGame} />
}

// ============================================================
// GameSelector — Griglia di selezione gioco
// ============================================================

interface GameSelectorProps {
  onSelect: (game: ActiveGame) => void
}

function GameSelector({ onSelect }: GameSelectorProps) {
  const games = [
    {
      id:    "kings" as const,
      emoji: "🃏",
      name:  "Kings Cup",
      desc:  "Pesca una carta e scopri la regola. Bicchiere comune, 4° Re fatale.",
      badge: "2–8 👥",
      // Colore accent specifico per questo gioco
      accent:     "bg-orange-500/10 border-orange-500/20",
      accentText: "text-orange-400",
      iconBg:     "bg-orange-500/15",
    },
    {
      id:    "dare" as const,
      emoji: "🎯",
      name:  "Bevi o Fai",
      desc:  "Sfide divertenti a turno. Accetti la sfida o bevi — non ci sono vie di mezzo.",
      badge: "2–10 👥",
      accent:     "bg-blue-500/10 border-blue-500/20",
      accentText: "text-blue-400",
      iconBg:     "bg-blue-500/15",
    },
    {
      id:    "quiz" as const,
      emoji: "🧠",
      name:  "Quiz Ubriaco",
      desc:  "Domande assurde con countdown. Risposta sbagliata o timeout? Bevi.",
      badge: "2–6 👥",
      accent:     "bg-purple-500/10 border-purple-500/20",
      accentText: "text-purple-400",
      iconBg:     "bg-purple-500/15",
    },
    {
      id:    "doordrink" as const,
      emoji: "🃏",
      name:  "Do or Drink",
      desc:  "Il gioco originale #DOorDRINK. Inserisci i giocatori, carte a turno, ordine casuale ogni round.",
      badge: "2+ 👥",
      accent:     "bg-red-500/10 border-red-500/20",
      accentText: "text-red-400",
      iconBg:     "bg-red-500/15",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-24 lg:px-8 max-w-2xl mx-auto">

        {/* Intestazione */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-foreground mb-1">🎮 Giochi</h1>
          <p className="text-foreground-muted text-sm">Scegli un gioco per animare la serata</p>
        </div>

        {/* Lista giochi */}
        <div className="flex flex-col gap-3">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelect(game.id)}
              className={`
                w-full text-left
                bg-card border rounded-2xl p-5
                flex items-center gap-4
                transition-all active:scale-[0.98]
                hover:border-white/15
                border-white/5
              `}
            >
              {/* Icona */}
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${game.iconBg}`}>
                {game.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-[15px] mb-0.5">{game.name}</p>
                <p className="text-foreground-muted text-xs leading-relaxed">{game.desc}</p>
              </div>

              {/* Badge giocatori */}
              <span className={`
                text-[10px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap
                border ${game.accent} ${game.accentText}
              `}>
                {game.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Nota a piè di pagina */}
        <p className="text-center text-foreground-muted text-xs mt-8 leading-relaxed">
          Bevi responsabilmente 🍻 — Solo per adulti
        </p>
      </div>
    </div>
  )
}