// ============================================================
// DoOrDrinkGame.tsx — Gioco Do or Drink (#DOorDRINK)
// ============================================================
// Ispirato al gioco di carte originale #DOorDRINK.
//
// Fasi del gioco:
//   1. "setup"   → inserisci i nomi dei giocatori (2–10)
//   2. "playing" → carte a turno con ordine casuale per round
//   3. (inline)  → schermata fine mazzo con stats
//
// Meccaniche:
//   - Ogni turno: un giocatore pesca una carta rossa
//   - Può scegliere: DO (fai la sfida) | DRINK (bevi) | QUIT (esci dal round)
//   - Ordine giocatori: sequenziale nel round, ma ogni nuovo round
//     l'ordine viene rimescolato (shuffleArray sui giocatori)
//   - Pool carte: tutte le carte mescolate, senza ripetizioni
//   - Storico: ultime 6 azioni con esito
// ============================================================

import { useState, useCallback, useRef } from "react"
import { ChevronLeft, Plus, Trash2, Shuffle, RefreshCw, X } from "lucide-react"
import { shuffleArray } from "./game-data"

// ──────────────────────────────────────────────────────────
// CARTE ORIGINALI DO OR DRINK
// Tutte ispirate al gioco fisico #DOorDRINK
// ──────────────────────────────────────────────────────────
const DO_OR_DRINK_CARDS: string[] = [
  // ── Sfide fisiche ──
  "Rasati un sopracciglio, fai questo, o smetti di giocare.",
  "Fai 20 flessioni. Se ti fermi, bevi un sorso per ogni flessione mancante.",
  "Salta sul posto per 30 secondi senza fermarti o bevi 3 sorsi.",
  "Fai la verticale contro il muro per 10 secondi o bevi 2 sorsi.",
  "Imita un animale a scelta del gruppo per 30 secondi o bevi 2 sorsi.",
  "Fai 10 burpee o bevi un sorso per ogni burpee saltato.",
  "Cammina come un granchio per 30 secondi o bevi 3 sorsi.",
  "Tieni un cubetto di ghiaccio in mano per 30 secondi o bevi 2 sorsi.",
  "Fai la ruota o bevi 4 sorsi. Il gruppo giudica se è accettabile.",
  "Stai in equilibrio su una gamba per 60 secondi o bevi 3 sorsi.",

  // ── Sfide sociali ──
  "Chiama un numero a caso dalla tua rubrica e di' 'Sei la mia persona preferita' o bevi 3 sorsi.",
  "Manda un messaggio imbarazzante a qualcuno che hai il numero ma non senti da mesi, o bevi 4 sorsi.",
  "Scrivi 'Mi manchi' all'ultima persona con cui hai smesso di parlare o bevi 3 sorsi.",
  "Cambia la tua foto profilo WhatsApp con una scelta dal gruppo per il resto della serata o bevi 5 sorsi.",
  "Manda un vocale di 10 secondi a tua madre ora stesso o bevi 3 sorsi.",
  "Posta una storia Instagram imbarazzante scelta dal gruppo o bevi 5 sorsi.",
  "Chiama qualcuno e di' solo 'Non ti dimenticherò mai' poi riattacca o bevi 4 sorsi.",
  "Scrivi un tweet o stato Facebook qualsiasi e pubblicalo o bevi 3 sorsi.",

  // ── Sfide imbarazzanti ──
  "Di' sinceramente a ogni persona nel gruppo cosa pensi di loro o bevi 2 sorsi per persona saltata.",
  "Confessa la cosa più imbarazzante che hai fatto nell'ultimo mese o bevi 4 sorsi.",
  "Racconta la tua peggiore esperienza di appuntamento o bevi 3 sorsi.",
  "Imita qualcuno nel gruppo finché non indovinano chi sei, o bevi 3 sorsi.",
  "Rivela il tuo più grande rimpianto o bevi 4 sorsi.",
  "Di' al gruppo cosa fai quando sei solo e annoiato, onestamente, o bevi 3 sorsi.",
  "Rivela il messaggio più strano che hai mai mandato o ricevuto o bevi 3 sorsi.",
  "Rivela una bugia che hai detto di recente o bevi 4 sorsi.",
  "Di' chi nel gruppo ti fa più ridere e perché, o bevi 2 sorsi.",
  "Confessa qualcosa che non hai mai detto a nessuno o bevi 5 sorsi.",

  // ── Sfide creative ──
  "Improvvisa uno stand-up comedy di 60 secondi o bevi 3 sorsi. Il gruppo vota se era divertente.",
  "Canta 30 secondi di una canzone scelta dal gruppo o bevi 2 sorsi.",
  "Inventa una storia di 30 secondi che includa: un drago, una pizza e il tuo ex o bevi 3 sorsi.",
  "Fai un discorso motivazionale di 20 secondi su qualcosa di inutile o bevi 2 sorsi.",
  "Descrivi il tuo film preferito come se fosse orribile o bevi 2 sorsi.",
  "Inventa una pubblicità per un prodotto assurdo scelto dal gruppo o bevi 3 sorsi.",
  "Di' l'alfabeto al contrario senza sbagliare o bevi un sorso per ogni errore.",
  "Improvvisa una canzone di 20 secondi sul giocatore alla tua destra o bevi 3 sorsi.",

  // ── Sfide di abilità ──
  "Lancia un oggetto (moneta, tappo…) nel bicchiere di qualcuno da 2 metri o bevi 2 sorsi.",
  "Di' 'Red lorry yellow lorry' 5 volte di fila velocemente o bevi un sorso per ogni errore.",
  "Conta in italiano da 20 a 1 in 10 secondi o bevi 3 sorsi.",
  "Scrivi il tuo nome in aria con il sedere o bevi 2 sorsi.",
  "Tieni gli occhi chiusi e indovina chi ti tocca il braccio o bevi 2 sorsi.",

  // ── Sfide sociali hard ──
  "Di' qualcosa di sincero a ogni persona nel gruppo iniziando da destra, o bevi 3 sorsi se salti qualcuno.",
  "Spiegati: qual è il segreto più grande che stai nascondendo al gruppo? O bevi 5 sorsi.",
  "Il gruppo sceglie il tuo nuovo soprannome per questa sera. Lo devi usare o bevi ogni volta che non lo usi.",
  "Non puoi smettere di parlare con accento straniero scelto dal gruppo per 2 turni o bevi 3 sorsi.",
  "Devi rispondere 'sì' alla prossima cosa che ti viene chiesta dal gruppo, qualunque cosa sia, o bevi 4 sorsi.",
  "Descrivi ogni persona nel gruppo con un solo aggettivo (onestamente) o bevi 2 sorsi.",
  "Il giocatore alla tua sinistra ti fa una domanda: devi rispondere onestamente o bevi 4 sorsi.",
  "Rivela lo screenshot più imbarazzante sul tuo telefono o bevi 5 sorsi.",

  // ── Sfide di gruppo ──
  "Tutti fanno una mossa di danza: tu scegli chi era la peggiore. Quella persona beve.",
  "Fai indovinare al gruppo una parola senza parlare, solo con i gesti, in 30 secondi o bevi 2 sorsi.",
  "Il gruppo ha 3 domande per scoprire a cosa stai pensando. Devi rispondere onestamente o bevi 3 sorsi.",
  "Fai un complimento sincero e specifico alla persona che ti sta più antipatica stanotte o bevi 4 sorsi.",
  "Di' 3 cose vere e 1 falsa su di te. Il gruppo deve indovinare la falsa o beve.",

  // ── Carte speciali ──
  "Niente smartphone per i prossimi 10 minuti o bevi ogni volta che lo usi.",
  "Per il prossimo giro, devi rispondere a tutto con una domanda o bevi ogni volta che non lo fai.",
  "Bevi due sorsi e poi distribuisci altri due sorsi come vuoi tra i giocatori.",
  "Scegli una persona: deve bere ogni volta che tu bevi per il prossimo giro.",
  "Waterfall! Inizia a bere, tutti gli altri devono iniziare. Non puoi smettere finché non smette chi hai iniziato tu.",
  "Tutti toccano il naso. L'ultimo beve.",
  "Chi parla per primo dopo questa carta beve 2 sorsi. Comincia il silenzio ora.",
  "Il giocatore con il compleanno più vicino ad oggi beve 2 sorsi.",
  "Tutti coloro che hanno meno di X anni bevono (X = tua età meno 5).",
  "Scegli: verità imbarazzante rivelata al gruppo, oppure bevi 4 sorsi.",
]

// ──────────────────────────────────────────────────────────
// TIPI
// ──────────────────────────────────────────────────────────

type GamePhase = "setup" | "playing"

type CardChoice = "do" | "drink" | "quit"

interface HistoryEntry {
  playerName: string
  cardText:   string   // testo breve della carta (prime 30 char)
  choice:     CardChoice
}

interface DoOrDrinkGameProps {
  onBack: () => void
}

// ──────────────────────────────────────────────────────────
// COMPONENTE PRINCIPALE
// ──────────────────────────────────────────────────────────

export default function DoOrDrinkGame({ onBack }: DoOrDrinkGameProps) {
  const [phase, setPhase] = useState<GamePhase>("setup")

  // ── Setup: lista nomi giocatori ──
  const [playerNames, setPlayerNames] = useState<string[]>(["", ""])
  const [newName,     setNewName]     = useState("")

  // ── Playing: ordine giocatori per il round corrente ──
  const [turnOrder,      setTurnOrder]      = useState<string[]>([])
  const [turnIdx,        setTurnIdx]        = useState(0)   // indice in turnOrder
  const [roundNumber,    setRoundNumber]    = useState(1)

  // ── Mazzo carte ──
  const cardDeckRef   = useRef<string[]>([])  // carte rimaste
  const [currentCard, setCurrentCard] = useState<string | null>(null)
  const [cardRevealed,setCardRevealed] = useState(false)

  // ── Statistiche ──
  const [stats, setStats] = useState({ do: 0, drink: 0, quit: 0, total: 0 })

  // ── Storico ──
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // ── Giocatori che hanno abbandonato il round ──
  const [quitPlayers, setQuitPlayers] = useState<string[]>([])

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null)

  const triggerToast = useCallback((msg: string, duration = 2200) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }, [])

  // ──────────────────────────────────────────
  // SETUP — gestione nomi giocatori
  // ──────────────────────────────────────────

  const addPlayer = useCallback(() => {
    const name = newName.trim()
    if (!name || playerNames.includes(name)) return
    setPlayerNames(prev => [...prev, name])
    setNewName("")
  }, [newName, playerNames])

  const removePlayer = useCallback((idx: number) => {
    setPlayerNames(prev => prev.filter((_, i) => i !== idx))
  }, [])

  const updatePlayer = useCallback((idx: number, value: string) => {
    setPlayerNames(prev => prev.map((n, i) => i === idx ? value : n))
  }, [])

  // ──────────────────────────────────────────
  // START GAME — dalla fase setup a playing
  // ──────────────────────────────────────────

  const startGame = useCallback(() => {
    const validNames = playerNames.map(n => n.trim()).filter(Boolean)
    if (validNames.length < 2) {
      triggerToast("Servono almeno 2 giocatori!")
      return
    }

    // Costruisci mazzo mescolato
    cardDeckRef.current = shuffleArray([...DO_OR_DRINK_CARDS])

    // Primo turno: ordine casuale
    const order = shuffleArray([...validNames])
    setTurnOrder(order)
    setTurnIdx(0)
    setRoundNumber(1)
    setQuitPlayers([])
    setStats({ do: 0, drink: 0, quit: 0, total: 0 })
    setHistory([])

    // Pesca prima carta
    const firstCard = cardDeckRef.current.pop() ?? null
    setCurrentCard(firstCard)
    setCardRevealed(false)

    setPhase("playing")
  }, [playerNames, triggerToast])

  // ──────────────────────────────────────────
  // SCEGLI AZIONE — DO / DRINK / QUIT
  // ──────────────────────────────────────────

  const handleChoice = useCallback((choice: CardChoice) => {
    const playerName = turnOrder[turnIdx]

    // Aggiorna stats
    setStats(prev => ({ ...prev, [choice]: prev[choice] + 1, total: prev.total + 1 }))

    // Aggiungi allo storico (max 6)
    const shortCard = (currentCard ?? "").slice(0, 40) + ((currentCard?.length ?? 0) > 40 ? "…" : "")
    setHistory(prev => [{ playerName, cardText: shortCard, choice }, ...prev].slice(0, 6))

    // Gestione QUIT — il giocatore esce dalla partita definitivamente
    let newQuitPlayers = quitPlayers
    if (choice === "quit") {
      newQuitPlayers = [...quitPlayers, playerName]
      setQuitPlayers(newQuitPlayers)
      triggerToast(`${playerName} è uscito dalla partita! 👋`, 2500)
    } else if (choice === "do") {
      triggerToast(`💪 ${playerName} accetta la sfida!`)
    } else {
      triggerToast(`🍺 ${playerName} beve!`)
    }

    // Giocatori ancora in gioco (QUIT = fuori per sempre)
    const activePlayers = turnOrder.filter(p => !newQuitPlayers.includes(p))

    if (activePlayers.length === 0) {
      // Tutti hanno abbandonato → partita finita, torna al setup
      triggerToast("💀 Tutti sono usciti! Partita finita.", 3000)
      setTimeout(() => setPhase("setup"), 2000)
      return
    }

    // Prossimo indice nel turnOrder (saltando i quit permanenti)
    let nextIdx = (turnIdx + 1) % turnOrder.length
    let safetyCount = 0
    while (newQuitPlayers.includes(turnOrder[nextIdx])) {
      nextIdx = (nextIdx + 1) % turnOrder.length
      safetyCount++
      if (safetyCount > turnOrder.length) { startNewRound(activePlayers); return }
    }

    // Controlla se abbiamo completato un giro (siamo tornati al primo giocatore attivo)
    const firstActiveInOrder = turnOrder.find(p => !newQuitPlayers.includes(p))
    const nextPlayer = turnOrder[nextIdx]
    if (nextPlayer === firstActiveInOrder && nextIdx <= turnIdx) {
      // Nuovo round — i quit restano fuori
      startNewRound(activePlayers)
      return
    }

    // Pesca nuova carta
    if (cardDeckRef.current.length === 0) {
      // Mazzo esaurito → rimescola
      cardDeckRef.current = shuffleArray([...DO_OR_DRINK_CARDS])
      triggerToast("🔀 Mazzo finito! Rimescolato.")
    }

    setTurnIdx(nextIdx)
    setCurrentCard(cardDeckRef.current.pop() ?? null)
    setCardRevealed(false)
  }, [turnOrder, turnIdx, currentCard, quitPlayers, triggerToast])

  // ──────────────────────────────────────────
  // NUOVO ROUND — rimescola l'ordine
  // I giocatori che hanno fatto QUIT restano fuori
  // ──────────────────────────────────────────

  const startNewRound = useCallback((players: string[]) => {
    // players è già filtrato senza i quit → rimangono fuori
    const newOrder = shuffleArray([...players])
    setTurnOrder(newOrder)
    setTurnIdx(0)
    setRoundNumber(prev => prev + 1)
    // NON tocchiamo quitPlayers: chi è uscito non rientra mai

    if (cardDeckRef.current.length === 0) {
      cardDeckRef.current = shuffleArray([...DO_OR_DRINK_CARDS])
    }

    setCurrentCard(cardDeckRef.current.pop() ?? null)
    setCardRevealed(false)
    triggerToast(`🔀 Round ${players.length < 2 ? "?" : ""}! Ordine rimescolato.`, 2500)
  }, [triggerToast])

  // ──────────────────────────────────────────
  // RENDERING FASE SETUP
  // ──────────────────────────────────────────

  if (phase === "setup") {
    const validCount = playerNames.filter(n => n.trim()).length

    return (
      <div className="min-h-screen bg-background">
        <div className="px-5 pt-6 pb-24 lg:px-8 max-w-2xl mx-auto">

          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-foreground-muted text-sm mb-6 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Torna ai giochi
          </button>

          {/* Header */}
          <div className="mb-7">
            {/* Logo stile DO or DRINK */}
            <div className="inline-flex items-center gap-1 bg-red-500 px-4 py-1.5 rounded-full mb-4">
              <span className="text-white font-black text-sm tracking-wider">#DOorDRINK</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-1">Chi gioca stasera?</h1>
            <p className="text-foreground-muted text-sm">
              Aggiungi 2–10 giocatori. Ogni round l'ordine viene rimescolato.
            </p>
          </div>

          {/* Lista giocatori */}
          <div className="flex flex-col gap-2.5 mb-4">
            {playerNames.map((name, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {/* Avatar numero */}
                <div className="w-9 h-9 rounded-full bg-red-500/15 border border-red-500/25 flex items-center justify-center text-red-400 font-bold text-sm flex-shrink-0">
                  {idx + 1}
                </div>

                {/* Input nome */}
                <input
                  type="text"
                  value={name}
                  onChange={e => updatePlayer(idx, e.target.value)}
                  onKeyDown={e => e.key === "Enter" && playerNames.length < 10 && setPlayerNames(prev => [...prev, ""])}
                  placeholder={`Giocatore ${idx + 1}`}
                  maxLength={20}
                  className="
                    flex-1 bg-card border border-white/8
                    rounded-xl px-4 py-3 text-foreground text-sm
                    placeholder:text-foreground-muted
                    focus:outline-none focus:border-red-500/50
                    transition-colors
                  "
                />

                {/* Rimuovi (solo se più di 2) */}
                {playerNames.length > 2 && (
                  <button
                    onClick={() => removePlayer(idx)}
                    className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Aggiungi giocatore */}
          <button
            onClick={() => setPlayerNames(prev => [...prev, ""])}
            className="
              w-full flex items-center justify-center gap-2
              border border-dashed border-white/15 rounded-xl py-3
              text-foreground-muted text-sm
              hover:border-red-500/40 hover:text-red-400
              transition-all mb-6
            "
          >
            <Plus className="w-4 h-4" />
            Aggiungi giocatore
          </button>

          {/* Info regole */}
          <div className="bg-card border border-white/5 rounded-2xl p-4 mb-6">
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider mb-3">Come si gioca</p>
            <div className="flex flex-col gap-2">
              {[
                ["💪", "DO",   "Fai la sfida scritta sulla carta"],
                ["🍺", "DRINK","Bevi invece di fare la sfida"],
                ["❌", "QUIT", "Esci dalla partita (puoi rientrare solo riavviando il gioco)"],
              ].map(([emoji, label, desc]) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-base">{emoji}</span>
                  <div>
                    <span className="font-bold text-foreground text-sm">{label} </span>
                    <span className="text-foreground-muted text-sm">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-foreground-muted text-xs mt-3 pt-3 border-t border-white/5">
              Ogni nuovo round l'ordine dei giocatori viene rimescolato casualmente.
              Chi fa QUIT esce definitivamente fino al prossimo riavvio.
            </p>
          </div>

          {/* Start */}
          <button
            onClick={startGame}
            disabled={validCount < 2}
            className="
              w-full bg-red-500 hover:bg-red-600 active:scale-[0.98]
              text-white font-bold text-base rounded-2xl py-4
              transition-all disabled:opacity-40 disabled:cursor-not-allowed
            "
          >
            {validCount < 2
              ? "Aggiungi almeno 2 giocatori"
              : `Inizia con ${validCount} giocatori! 🎉`
            }
          </button>
        </div>

        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-card border border-white/10 rounded-full px-5 py-2.5 text-sm font-medium text-foreground shadow-xl whitespace-nowrap z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            {toast}
          </div>
        )}
      </div>
    )
  }

  // ──────────────────────────────────────────
  // RENDERING FASE PLAYING
  // ──────────────────────────────────────────

  const currentPlayer = turnOrder[turnIdx] ?? ""
  const activePlayers = turnOrder.filter(p => !quitPlayers.includes(p))
  const cardsLeft = cardDeckRef.current.length

  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-24 lg:px-8 max-w-2xl mx-auto">

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-foreground-muted text-sm hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Esci
          </button>

          {/* Badge round */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-foreground-muted bg-white/5 px-3 py-1 rounded-full">
              Round {roundNumber}
            </span>
            <div className="inline-flex items-center gap-1 bg-red-500 px-3 py-1 rounded-full">
              <span className="text-white font-black text-[11px] tracking-wider">#DOorDRINK</span>
            </div>
          </div>
        </div>

        {/* ── Statistiche quick ── */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-card border border-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-400">{stats.do}</p>
            <p className="text-[10px] text-foreground-muted uppercase tracking-wide">DO 💪</p>
          </div>
          <div className="bg-card border border-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-blue-400">{stats.drink}</p>
            <p className="text-[10px] text-foreground-muted uppercase tracking-wide">DRINK 🍺</p>
          </div>
          <div className="bg-card border border-white/5 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-red-400">{stats.quit}</p>
            <p className="text-[10px] text-foreground-muted uppercase tracking-wide">QUIT ❌</p>
          </div>
        </div>

        {/* ── Turno di chi ── */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider mb-2">
            Turno di
          </p>
          {/* Scroll orizzontale con tutti i giocatori */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {turnOrder.map((name, idx) => {
              const isActive = idx === turnIdx
              const hasQuit  = quitPlayers.includes(name)
              return (
                <div
                  key={name}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-full border flex-shrink-0 transition-all
                    ${isActive
                      ? "border-red-500 bg-red-500/15"
                      : hasQuit
                        ? "border-white/5 bg-white/3 opacity-40"
                        : "border-white/8 bg-card"
                    }
                  `}
                >
                  {/* Puntino stato */}
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isActive ? "bg-red-400" : hasQuit ? "bg-foreground-muted" : "bg-foreground-muted/40"
                  }`} />
                  <span className={`text-sm font-medium whitespace-nowrap ${
                    isActive ? "text-foreground" : "text-foreground-muted"
                  }`}>
                    {name}
                    {hasQuit && " (fuori)"}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── La carta rossa (DO or DRINK style) ── */}
        <div
          onClick={() => !cardRevealed && setCardRevealed(true)}
          className={`
            relative rounded-3xl mb-5 overflow-hidden
            transition-all duration-300 cursor-pointer
            ${cardRevealed ? "cursor-default" : "hover:scale-[1.01] active:scale-[0.99]"}
          `}
          style={{ minHeight: 240 }}
        >
          {/* Sfondo rosso stile DO or DRINK */}
          <div className="absolute inset-0 bg-red-500" />

          {/* Texture leggera */}
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)" }}
          />

          <div className="relative z-10 p-7 flex flex-col justify-between h-full" style={{ minHeight: 240 }}>
            {cardRevealed && currentCard ? (
              /* Testo carta rivelato */
              <>
                <p className="text-white font-bold text-[22px] leading-snug flex-1">
                  {currentCard}
                </p>
                <div className="mt-6">
                  <p className="text-white/60 font-bold text-sm tracking-widest">#DOorDRINK</p>
                </div>
              </>
            ) : (
              /* Retro carta — tocca per rivelare */
              <div className="flex flex-col items-center justify-center h-full gap-4" style={{ minHeight: 200 }}>
                <p className="text-white font-black text-3xl tracking-wider">#DOorDRINK</p>
                <p className="text-white/60 text-sm font-medium">
                  {currentPlayer ? `${currentPlayer}, tocca per rivelare` : "Tocca per rivelare"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pulsanti scelta (visibili solo dopo aver rivelato) ── */}
        {cardRevealed ? (
          <div className="flex flex-col gap-3 mb-4">
            {/* DO — verde */}
            <button
              onClick={() => handleChoice("do")}
              className="
                w-full bg-green-500/15 border border-green-500/25 text-green-400
                rounded-2xl py-4 font-bold text-[16px]
                hover:bg-green-500/22 active:scale-[0.98] transition-all
              "
            >
              💪 DO — Faccio la sfida!
            </button>

            {/* DRINK — blu */}
            <button
              onClick={() => handleChoice("drink")}
              className="
                w-full bg-blue-500/15 border border-blue-500/25 text-blue-400
                rounded-2xl py-4 font-bold text-[16px]
                hover:bg-blue-500/22 active:scale-[0.98] transition-all
              "
            >
              🍺 DRINK — Bevo invece!
            </button>

            {/* QUIT — rosso attenuato */}
            <button
              onClick={() => handleChoice("quit")}
              className="
                w-full bg-white/5 border border-white/8 text-foreground-muted
                rounded-2xl py-3 font-medium text-sm
                hover:border-red-500/30 hover:text-red-400/70 active:scale-[0.98] transition-all
              "
            >
              ❌ QUIT — Esco dalla partita
            </button>
          </div>
        ) : (
          /* Prompt prima di rivelare */
          <div className="text-center text-foreground-muted text-sm mb-4 py-2">
            <span className="font-semibold text-foreground">{currentPlayer}</span>, tocca la carta per rivelare la sfida
          </div>
        )}

        {/* ── Info mazzo + giocatori attivi ── */}
        <div className="flex items-center justify-between text-xs text-foreground-muted mb-5">
          <span>{cardsLeft} carte rimaste nel mazzo</span>
          <span>{activePlayers.length}/{turnOrder.length} giocatori attivi</span>
        </div>

        {/* ── Storico ── */}
        {history.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider mb-3">
              Ultime azioni
            </p>
            <div className="flex flex-col gap-0">
              {history.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-0">
                  <span className="text-base flex-shrink-0">
                    {entry.choice === "do" ? "💪" : entry.choice === "drink" ? "🍺" : "❌"}
                  </span>
                  <span className="text-foreground text-sm font-medium flex-shrink-0">{entry.playerName}</span>
                  <span className="text-foreground-muted text-xs truncate flex-1">{entry.cardText}</span>
                  <span className={`text-xs font-bold flex-shrink-0 ${
                    entry.choice === "do"    ? "text-green-400"
                    : entry.choice === "drink" ? "text-blue-400"
                    : "text-red-400"
                  }`}>
                    {entry.choice.toUpperCase()}
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