// ============================================================
// QuizGame.tsx — Gioco Quiz Ubriaco
// ============================================================
// Logica:
//   - 10 domande randomizzate da un pool più grande
//   - Timer countdown da 15 secondi con anello SVG animato
//   - Punti = secondi rimasti × 10 (max 150 con risposta immediata)
//   - Risposta sbagliata o timeout → sorsi da bere
//   - Sistema streak con bonus messaggio
//   - Schermata finale con riepilogo completo
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft } from "lucide-react"
import { QUESTIONS, shuffleArray, type Question } from "./game-data"

// ── Configurazione partita ──
const TOTAL_QUESTIONS = 10   // domande per partita
const TIMER_SECONDS   = 15   // secondi per domanda

// Circonferenza del cerchio SVG (raggio 26 → 2π×26 ≈ 163.4)
const SVG_CIRCUMFERENCE = 163.4

interface QuizGameProps {
  onBack: () => void
}

// ── Stato della singola domanda ──
type AnswerState = "unanswered" | "correct" | "wrong" | "timeout"

export default function QuizGame({ onBack }: QuizGameProps) {
  // ── Fase del gioco: "playing" | "end" ──
  const [phase, setPhase] = useState<"playing" | "end">("playing")

  // ── Domande della partita corrente ──
  const [questions, setQuestions] = useState<Question[]>(() =>
    shuffleArray(QUESTIONS).slice(0, TOTAL_QUESTIONS)
  )

  // ── Indice domanda corrente ──
  const [currentIdx, setCurrentIdx] = useState(0)

  // ── Stato risposta corrente ──
  const [answerState, setAnswerState] = useState<AnswerState>("unanswered")

  // ── Opzione scelta dall'utente (-1 = nessuna/timeout) ──
  const [chosenOption, setChosenOption] = useState<number>(-1)

  // ── Timer ──
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Statistiche partita ──
  const [score,        setScore]        = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [totalDrinks,  setTotalDrinks]  = useState(0)
  const [streak,       setStreak]       = useState(0)
  const [bestStreak,   setBestStreak]   = useState(0)

  // ── Toast ──
  const [toast, setToast] = useState<string | null>(null)

  const triggerToast = useCallback((msg: string, duration = 2000) => {
    setToast(msg)
    setTimeout(() => setToast(null), duration)
  }, [])

  // ────────────────────────────────────────
  // startTimer() — avvia il countdown
  // ────────────────────────────────────────
  const startTimer = useCallback(() => {
    // Cancella eventuale timer precedente
    if (timerRef.current) clearInterval(timerRef.current)

    setTimeLeft(TIMER_SECONDS)

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  // Quando timeLeft arriva a 0 → timeout automatico
  useEffect(() => {
    if (timeLeft === 0 && answerState === "unanswered") {
      handleAnswer(-1) // -1 = timeout
    }
  }, [timeLeft, answerState]) // eslint-disable-line react-hooks/exhaustive-deps

  // ────────────────────────────────────────
  // handleAnswer(chosen) — gestisce la risposta
  // chosen: indice opzione, oppure -1 per timeout
  // ────────────────────────────────────────
  const handleAnswer = useCallback((chosen: number) => {
    if (answerState !== "unanswered") return // evita doppio click

    // Ferma il timer
    if (timerRef.current) clearInterval(timerRef.current)

    const q          = questions[currentIdx]
    const isCorrect  = chosen === q.ans
    const isTimeout  = chosen === -1

    setChosenOption(chosen)

    if (isCorrect) {
      // ── Risposta corretta ──
      const bonusPoints = Math.max(10, timeLeft * 10) // più veloce = più punti
      setScore(prev => prev + bonusPoints)
      setCorrectCount(prev => prev + 1)
      setStreak(prev => {
        const newStreak = prev + 1
        setBestStreak(best => Math.max(best, newStreak))
        return newStreak
      })
      setAnswerState("correct")
      triggerToast(`✅ +${bonusPoints} punti!`)
    } else {
      // ── Risposta sbagliata o timeout ──
      setTotalDrinks(prev => prev + q.penalty)
      setStreak(0)
      setAnswerState(isTimeout ? "timeout" : "wrong")
      triggerToast(`🍺 Bevi ${q.penalty} sorsi!`)
    }
  }, [answerState, questions, currentIdx, timeLeft, triggerToast])

  // ────────────────────────────────────────
  // nextQuestion() — avanza o termina
  // ────────────────────────────────────────
  const nextQuestion = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      // Partita finita
      setPhase("end")
    } else {
      setCurrentIdx(prev => prev + 1)
      setAnswerState("unanswered")
      setChosenOption(-1)
      startTimer()
    }
  }, [currentIdx, questions.length, startTimer])

  // ────────────────────────────────────────
  // restartQuiz() — nuova partita
  // ────────────────────────────────────────
  const restartQuiz = useCallback(() => {
    setQuestions(shuffleArray(QUESTIONS).slice(0, TOTAL_QUESTIONS))
    setCurrentIdx(0)
    setAnswerState("unanswered")
    setChosenOption(-1)
    setScore(0)
    setCorrectCount(0)
    setTotalDrinks(0)
    setStreak(0)
    setBestStreak(0)
    setPhase("playing")
  }, [])

  // Avvia il timer quando cambia la domanda corrente
  useEffect(() => {
    if (phase === "playing") startTimer()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [currentIdx, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Calcolo colore timer in base al tempo rimasto ──
  const timerColor =
    timeLeft <= 5 ? "#f87171"    // rosso
    : timeLeft <= 9 ? "#f97316" // arancione
    : "#a78bfa"                 // viola

  // ── Offset SVG: 0 = cerchio pieno, CIRCUMFERENCE = cerchio vuoto ──
  const timerOffset = SVG_CIRCUMFERENCE * (1 - timeLeft / TIMER_SECONDS)

  // ── Domanda corrente ──
  const q = questions[currentIdx]

  // ────────────────────────────────────────
  // SCHERMATA FINE PARTITA
  // ────────────────────────────────────────
  if (phase === "end") {
    const pct = correctCount / questions.length
    const endEmoji = pct >= 0.8 ? "🏆" : pct >= 0.5 ? "🎉" : "😵"
    const endTitle = pct >= 0.8 ? "Genio assoluto!" : pct >= 0.5 ? "Non male!" : "Stavi già bevendo?"

    return (
      <div className="min-h-screen bg-background">
        <div className="px-5 pt-6 pb-24 lg:px-8 max-w-2xl mx-auto">

          <button
            onClick={onBack}
            className="flex items-center gap-2 text-foreground-muted text-sm mb-6 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Torna ai giochi
          </button>

          <div className="text-center py-6">
            <div className="text-6xl mb-4">{endEmoji}</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">{endTitle}</h2>
            <p className="text-foreground-muted mb-8">
              {correctCount}/{questions.length} risposte corrette
            </p>

            {/* Statistiche finali */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-card border border-white/5 rounded-2xl p-5">
                <p className="text-3xl font-black text-purple-400">{score}</p>
                <p className="text-xs text-foreground-muted mt-1">Punti totali</p>
              </div>
              <div className="bg-card border border-white/5 rounded-2xl p-5">
                <p className="text-3xl font-black text-green-400">{correctCount}/{questions.length}</p>
                <p className="text-xs text-foreground-muted mt-1">Corrette</p>
              </div>
              <div className="bg-card border border-white/5 rounded-2xl p-5">
                <p className="text-3xl font-black text-red-400">{totalDrinks}</p>
                <p className="text-xs text-foreground-muted mt-1">Sorsi bevuti 🍺</p>
              </div>
              <div className="bg-card border border-white/5 rounded-2xl p-5">
                <p className="text-3xl font-black text-orange-400">{bestStreak}</p>
                <p className="text-xs text-foreground-muted mt-1">Serie migliore 🔥</p>
              </div>
            </div>

            <button
              onClick={restartQuiz}
              className="w-full bg-purple-500 hover:bg-purple-600 active:scale-[0.98] text-white font-bold text-base rounded-2xl py-4 transition-all mb-3"
            >
              🔄 Gioca ancora
            </button>
            <button
              onClick={onBack}
              className="w-full bg-card border border-white/10 text-foreground-muted rounded-2xl py-3.5 text-sm font-medium hover:text-foreground transition-all"
            >
              ← Torna ai giochi
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────
  // SCHERMATA DI GIOCO
  // ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="px-5 pt-6 pb-24 lg:px-8 max-w-2xl mx-auto">

        <button
          onClick={onBack}
          className="flex items-center gap-2 text-foreground-muted text-sm mb-5 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Torna ai giochi
        </button>

        {/* ── Header: punteggio + timer ── */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[11px] text-foreground-muted uppercase tracking-wider mb-1">Punteggio</p>
            <p className="text-2xl font-black text-foreground">{score} <span className="text-base font-normal text-foreground-muted">pts</span></p>
          </div>

          {/* Timer SVG circolare */}
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 58 58" width="58" height="58" className="-rotate-90">
              {/* Traccia grigia di sfondo */}
              <circle
                cx="29" cy="29" r="26"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="3"
              />
              {/* Arco countdown animato */}
              <circle
                cx="29" cy="29" r="26"
                fill="none"
                stroke={timerColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={SVG_CIRCUMFERENCE}
                strokeDashoffset={timerOffset}
                style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
              />
            </svg>
            {/* Numero al centro */}
            <span
              className="absolute inset-0 flex items-center justify-center text-base font-black"
              style={{ color: timerColor }}
            >
              {timeLeft}
            </span>
          </div>
        </div>

        {/* ── Barra avanzamento domande ── */}
        <div className="h-1 bg-white/6 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentIdx / questions.length) * 100}%` }}
          />
        </div>

        {/* ── Card domanda ── */}
        <div className="bg-card border border-white/5 rounded-2xl p-5 mb-4 relative overflow-hidden">
          {/* Blob decorativo */}
          <div className="absolute -top-10 -left-8 w-40 h-40 rounded-full bg-purple-500/8 blur-3xl pointer-events-none" />

          <span className="inline-block text-[11px] font-semibold text-purple-400 bg-purple-500/15 px-2.5 py-1 rounded-full mb-3 relative z-10">
            {q.cat}
          </span>
          <p className="text-foreground font-bold text-[19px] leading-snug relative z-10">
            {q.q}
          </p>
        </div>

        {/* ── Opzioni risposta ── */}
        <div className="flex flex-col gap-2.5 mb-4">
          {q.opts.map((opt, i) => {
            // Determina lo stile del pulsante in base allo stato
            let optStyle = "bg-card border-white/5 text-foreground hover:border-white/15 hover:bg-card/80"

            if (answerState !== "unanswered") {
              if (i === q.ans) {
                // La risposta corretta → sempre verde
                optStyle = "bg-green-500/15 border-green-500/30 text-green-400"
              } else if (i === chosenOption) {
                // La scelta sbagliata dell'utente → rossa
                optStyle = "bg-red-500/15 border-red-500/30 text-red-400"
              } else {
                // Altre opzioni → opache
                optStyle = "bg-card border-white/5 text-foreground-muted opacity-50"
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={answerState !== "unanswered"}
                className={`
                  w-full text-left border rounded-xl px-4 py-3.5
                  text-[15px] font-medium
                  transition-all active:scale-[0.98]
                  disabled:cursor-not-allowed
                  ${optStyle}
                `}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* ── Feedback dopo la risposta ── */}
        {answerState !== "unanswered" && (
          <div className={`
            rounded-2xl p-4 text-center mb-4
            ${answerState === "correct"
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-red-500/10 border border-red-500/20"
            }
          `}>
            <p className="text-2xl mb-1">
              {answerState === "correct"
                ? (streak >= 3 ? "🔥" : "🎉")
                : (answerState === "timeout" ? "⏰" : "❌")
              }
            </p>
            <p className={`font-bold text-base mb-0.5 ${answerState === "correct" ? "text-green-400" : "text-red-400"}`}>
              {answerState === "correct"
                ? (streak >= 3 ? `Serie di ${streak}! Inarrestabile!` : "Corretto!")
                : (answerState === "timeout" ? "Tempo scaduto!" : "Sbagliato!")
              }
            </p>
            <p className="text-foreground-muted text-sm">
              {answerState === "correct"
                ? `+${Math.max(10, timeLeft * 10)} punti${streak >= 3 ? " — sei in fiamme!" : ""}`
                : `Bevi ${q.penalty} sorso${q.penalty > 1 ? "i" : ""}! Risposta: ${q.opts[q.ans]}`
              }
            </p>
          </div>
        )}

        {/* ── Pulsante "Prossima domanda" (visibile solo dopo risposta) ── */}
        {answerState !== "unanswered" && (
          <button
            onClick={nextQuestion}
            className="
              w-full bg-purple-500 hover:bg-purple-600 active:scale-[0.98]
              text-white font-bold text-base rounded-2xl py-4
              transition-all
            "
          >
            {currentIdx + 1 >= questions.length ? "Vedi risultati 🏆" : "Prossima domanda →"}
          </button>
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