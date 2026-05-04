// ============================================================
// game-data.ts — Dati e tipi condivisi tra tutti i giochi
// ============================================================
// Esporta:
//   - Tipi TypeScript per ogni gioco
//   - KINGS_RULES  → regole del Kings Cup
//   - DARES        → sfide per Bevi o Fai
//   - QUESTIONS    → domande per il Quiz Ubriaco
//   - DEFAULT_PLAYERS → giocatori predefiniti
//   - shuffleArray → Fisher-Yates shuffle
// ============================================================

// ──────────────────────────────────────────
// TIPI
// ──────────────────────────────────────────

export interface KingsRule {
  emoji: string
  title: string
  text: string
}

export interface Dare {
  emoji: string
  text: string
  penalty: string
  diff: "easy" | "medium" | "hard"
}

export interface Question {
  q: string
  opts: string[]
  ans: number      // indice (0-based) della risposta corretta
  cat: string
  penalty: number  // sorsi da bere se si sbaglia
}

export interface Player {
  name: string
  color: string    // stringa CSS gradient
}

// ──────────────────────────────────────────
// KINGS CUP — Mapping valore carta → regola
// ──────────────────────────────────────────
export const KINGS_RULES: Record<string, KingsRule> = {
  A:    { emoji: "🍹", title: "Cascata!", text: "Chi pesca inizia a bere. Tutti devono bere finché chi è alla propria sinistra non smette. Non puoi fermarti prima di chi è alla tua sinistra." },
  "2":  { emoji: "👆", title: "Scegli tu!", text: "Indica una persona qualsiasi al tavolo: deve bere un sorso." },
  "3":  { emoji: "🪞", title: "Sei tu!", text: "Tocca a te. Nessun appello, nessuna scusa — bevi un sorso." },
  "4":  { emoji: "🏔️", title: "Floor is floor!", text: "Tutti toccano il pavimento. L'ultimo a toccare beve un sorso." },
  "5":  { emoji: "👨", title: "Maschi bevono!", text: "Tutti i maschi al tavolo devono bere un sorso." },
  "6":  { emoji: "👩", title: "Femmine bevono!", text: "Tutte le femmine al tavolo devono bere un sorso." },
  "7":  { emoji: "☁️", title: "Cielo!", text: "Tutti puntano un dito verso l'alto. L'ultimo a farlo beve." },
  "8":  { emoji: "👫", title: "Compagno di bevuta!", text: "Scegli qualcuno come tuo compagno. Da ora in poi, ogni volta che uno di voi beve, beve anche l'altro. La regola dura fino alla fine del gioco." },
  "9":  { emoji: "🎵", title: "Rima!", text: "Di' una parola qualsiasi. Il giro deve continuare con parole che rimano. Chi si blocca o si ripete, beve." },
  "10": { emoji: "📦", title: "Categoria!", text: "Scegli una categoria (es: 'marche di birra'). Il giro nomina elementi della categoria. Chi non riesce, beve." },
  J:    { emoji: "📜", title: "Regola!", text: "Inventa una nuova regola per tutto il resto del gioco. Es: 'niente nomi propri', 'bevi con la mano sinistra'. Chi viola la regola, beve." },
  Q:    { emoji: "👑", title: "Question Master!", text: "Chiunque risponda a una tua domanda direttamente (invece di ributtare una domanda) deve bere. Dura finché non esce un'altra Regina." },
  K:    { emoji: "🍺", title: "Re!", text: "Versa parte della tua bevanda nel bicchiere comune. Quando viene pescato il 4° Re, chi lo ha pescato deve bere tutto il bicchiere." },
}

// Valori e semi per costruire il mazzo
export const CARD_VALUES = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"]
export const CARD_SUITS  = ["♠️","♥️","♦️","♣️"]

// ──────────────────────────────────────────
// BEVI O FAI — Lista sfide
// ──────────────────────────────────────────
export const DARES: Dare[] = [
  { emoji: "🐓", text: "Imita un gallo per 10 secondi",                                      penalty: "o bevi 2 sorsi",   diff: "easy" },
  { emoji: "😳", text: "Confessa la tua figuraccia più epica della vita",                    penalty: "o bevi 3 sorsi",   diff: "medium" },
  { emoji: "🕺", text: "Balla da solo per 15 secondi (il gruppo sceglie la musica)",         penalty: "o bevi 2 sorsi",   diff: "easy" },
  { emoji: "📞", text: "Chiama qualcuno a caso e di' solo \"So tutto\". Poi riattacca.",      penalty: "o bevi 5 sorsi",   diff: "hard" },
  { emoji: "🦆", text: "Parla come un papero per i prossimi 2 turni",                        penalty: "o bevi 2 sorsi",   diff: "easy" },
  { emoji: "💌", text: "Leggi ad alta voce il tuo ultimo messaggio inviato",                 penalty: "o bevi 3 sorsi",   diff: "medium" },
  { emoji: "🤸", text: "Fai 10 jumping jack senza fermarti",                                 penalty: "o bevi 3 sorsi",   diff: "easy" },
  { emoji: "😘", text: "Manda un cuore ❤️ all'ultimo contatto con cui hai litigato",         penalty: "o bevi 5 sorsi",   diff: "hard" },
  { emoji: "🎤", text: "Canta l'inizio di una canzone a scelta del gruppo",                  penalty: "o bevi 2 sorsi",   diff: "medium" },
  { emoji: "🤫", text: "Non parlare per i prossimi 3 minuti. Ogni volta che parli, bevi.",   penalty: "",                 diff: "hard" },
  { emoji: "🦁", text: "Ruggisci come un leone 3 volte con la massima intensità",            penalty: "o bevi 2 sorsi",   diff: "easy" },
  { emoji: "🤳", text: "Il gruppo sceglie la tua foto profilo per i prossimi 10 min",        penalty: "o bevi 4 sorsi",   diff: "hard" },
  { emoji: "🤣", text: "Non ridere mentre il gruppo ti fa le facce per 30 secondi",          penalty: "o bevi 2 sorsi",   diff: "medium" },
  { emoji: "🍋", text: "Fai la faccia da limone per 20 secondi senza ridere",                penalty: "o bevi 1 sorso",   diff: "easy" },
  { emoji: "🧎", text: "Implora il giocatore alla tua sinistra di farti continuare a giocare", penalty: "o bevi 3 sorsi", diff: "medium" },
  { emoji: "🤐", text: "Di' qualcosa di imbarazzante sulla persona alla tua destra",         penalty: "o bevi 3 sorsi",   diff: "hard" },
  { emoji: "🐒", text: "Cammina come una scimmia fino all'altro capo della stanza",          penalty: "o bevi 2 sorsi",   diff: "easy" },
  { emoji: "🎭", text: "Imita qualcuno del gruppo finché non indovinano chi sei",            penalty: "o bevi 3 sorsi",   diff: "medium" },
  { emoji: "📸", text: "Fai una smorfia e mandala allo stato WhatsApp per 5 min",            penalty: "o bevi 4 sorsi",   diff: "hard" },
  { emoji: "🤜", text: "Fai un complimento sincero a ogni persona del gruppo",               penalty: "o bevi 1 sorso per persona saltata", diff: "easy" },
]

// ──────────────────────────────────────────
// QUIZ UBRIACO — Domande
// ──────────────────────────────────────────
export const QUESTIONS: Question[] = [
  { q: "Qual è la capitale dell'Australia?",                      opts: ["Sydney","Melbourne","Canberra","Perth"],                              ans: 2, cat: "Geografia",   penalty: 2 },
  { q: "Quante stagioni ha avuto Game of Thrones?",               opts: ["6","7","8","9"],                                                      ans: 2, cat: "Serie TV",    penalty: 1 },
  { q: "Cosa fa principalmente un panda tutto il giorno?",        opts: ["Dorme e mangia","Corre","Nuota","Scala montagne"],                    ans: 0, cat: "Animali",     penalty: 1 },
  { q: "Chi ha affrescato la volta della Cappella Sistina?",      opts: ["Da Vinci","Raffaello","Michelangelo","Botticelli"],                   ans: 2, cat: "Arte",        penalty: 2 },
  { q: "Quante ossa ha il corpo umano adulto?",                   opts: ["187","206","230","256"],                                              ans: 1, cat: "Scienza",     penalty: 2 },
  { q: "In che anno è nato ARPANET (il precursore di Internet)?", opts: ["1965","1969","1972","1981"],                                          ans: 1, cat: "Tecnologia",  penalty: 3 },
  { q: "Qual è l'animale terrestre più veloce del mondo?",        opts: ["Leone","Ghepardo","Aquila","Pronghorn"],                              ans: 1, cat: "Animali",     penalty: 1 },
  { q: "Quanti pianeti ha il sistema solare?",                    opts: ["7","8","9","10"],                                                     ans: 1, cat: "Spazio",      penalty: 1 },
  { q: "Chi ha scritto \"La Divina Commedia\"?",                  opts: ["Petrarca","Manzoni","Dante","Boccaccio"],                             ans: 2, cat: "Letteratura", penalty: 2 },
  { q: "Quanti secondi ci sono in un'ora?",                       opts: ["3.200","3.600","4.000","6.000"],                                      ans: 1, cat: "Matematica",  penalty: 1 },
  { q: "Quale nazione ha vinto più Mondiali di calcio?",          opts: ["Argentina","Germania","Brasile","Italia"],                            ans: 2, cat: "Sport",       penalty: 2 },
  { q: "Cosa significa l'acronimo \"LOL\"?",                      opts: ["Lots of Love","Laugh Out Loud","Load of Lies","Level of Life"],       ans: 1, cat: "Internet",    penalty: 1 },
  { q: "Quanti lati ha un esagono?",                              opts: ["5","6","7","8"],                                                      ans: 1, cat: "Matematica",  penalty: 1 },
  { q: "In quale città si trova la Torre Eiffel?",                opts: ["Lione","Bordeaux","Parigi","Marsiglia"],                              ans: 2, cat: "Geografia",   penalty: 1 },
  { q: "Quale pianeta è conosciuto come il \"pianeta rosso\"?",   opts: ["Venere","Giove","Saturno","Marte"],                                   ans: 3, cat: "Spazio",      penalty: 1 },
  { q: "Chi ha diretto il film \"Inception\" (2010)?",            opts: ["Ridley Scott","Christopher Nolan","James Cameron","Denis Villeneuve"],ans: 1, cat: "Cinema",      penalty: 2 },
]

// ──────────────────────────────────────────
// GIOCATORI PREDEFINITI
// ──────────────────────────────────────────
export const DEFAULT_PLAYERS: Player[] = [
  { name: "Marco",    color: "linear-gradient(135deg, #60a5fa, #3b82f6)" },
  { name: "Sara",     color: "linear-gradient(135deg, #f97316, #ef4444)" },
  { name: "Luca",     color: "linear-gradient(135deg, #a78bfa, #7c3aed)" },
  { name: "Rebecca",  color: "linear-gradient(135deg, #34d399, #0ea5e9)" },
]

// ──────────────────────────────────────────
// UTILITÀ
// ──────────────────────────────────────────

/**
 * shuffleArray — Fisher-Yates in-place shuffle
 * NON muta l'originale, restituisce una copia mescolata
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}