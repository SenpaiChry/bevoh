import { useState, useEffect } from "react"
import { AlertTriangle, Clock, Car, Shield, X, ChevronDown, ChevronUp, Settings } from "lucide-react"
import { UserModel } from "@/models/auth-models"

type Sesso = "maschio" | "femmina"
type MeResponse = { ok: true; user: UserModel } | { ok: false; error: string }
type DrinkItem = { pureAlcoholMl: number; time: string }

const API_BASE = "https://bevoh.altervista.org/api"

function mapSex(sex: UserModel["Sex"]): Sesso | null {
  if (sex === "MALE") return "maschio"
  if (sex === "FEMALE") return "femmina"
  return null
}

function parseItalianDateTime(s: string): Date | null {
  // accetta "DD/MM/YYYY, HH:mm:ss" oppure "DD/MM/YYYY HH:mm:ss"
  const cleaned = s.trim().replace(",", "")
  const m = cleaned.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/)
  if (!m) return null
  const [, dd, MM, yyyy, hh, mm, ss] = m
  const d = new Date(Number(yyyy), Number(MM) - 1, Number(dd), Number(hh), Number(mm), Number(ss))
  return Number.isNaN(d.getTime()) ? null : d
}

function parseAnyDateTime(s: string): Date | null {
  const raw = (s ?? "").trim()
  if (!raw) return null

  // 1) prova formato italiano
  const it = parseItalianDateTime(raw)
  if (it) return it

  // 2) prova "YYYY-MM-DD HH:mm:ss" o ISO
  const iso = raw.includes("T") ? raw : raw.replace(" ", "T")
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export default function SafetyCard() {
  const [hasUserEditedMl, setHasUserEditedMl] = useState(false)
  const [firstDrinkAt, setFirstDrinkAt] = useState<Date | null>(null)

  const [drinkItems, setDrinkItems] = useState<DrinkItem[]>([])

  const [isExpanded, setIsExpanded] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [drinkLimit, setDrinkLimit] = useState(6)

  // ---- dati profilo (non modificabili) ----
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [altezzaCm, setAltezzaCm] = useState<number | null>(null)
  const [pesoKg, setPesoKg] = useState<number | null>(null)
  const [sesso, setSesso] = useState<Sesso | null>(null)

  // ---- input rimasto ----
  const [alcolMlPuro, setAlcolMlPuro] = useState<number>(0)

  // ---- output BAC ----
  const [currentBAC, setCurrentBAC] = useState(0)
  const [soberTime, setSoberTime] = useState<string | null>(null)
  const [canDrive, setCanDrive] = useState(true)
  const [calcError, setCalcError] = useState<string | null>(null)

  const LEGAL_LIMIT_GL = 0.5
  const ELIMINATION_GL_PER_H = 0.15

  useEffect(() => {
    let cancelled = false

    async function loadMe() {
      try {
        setProfileLoading(true)
        setProfileError(null)

        const res = await fetch(`${API_BASE}/auth/me.php`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        })

        const text = await res.text()
        if (!text.trim()) throw new Error(`Empty response (HTTP ${res.status})`)

        const json: MeResponse = JSON.parse(text)
        if (!res.ok || !json.ok) throw new Error("error" in json ? json.error : `HTTP ${res.status}`)

        if (cancelled) return

        // coercizione: in caso arrivino come string
        const hRaw = (json.user as any).Height
        const wRaw = (json.user as any).Weight
        const sRaw = (json.user as any).Sex

        const h = hRaw != null && hRaw !== "" ? Number(hRaw) : null
        const w = wRaw != null && wRaw !== "" ? Number(wRaw) : null
        const s = mapSex(sRaw ?? null)

        setAltezzaCm(Number.isFinite(h as number) ? (h as number) : null)
        setPesoKg(Number.isFinite(w as number) ? (w as number) : null)
        setSesso(s)
      } catch (e: any) {
        if (!cancelled) setProfileError(e?.message || "Errore caricamento profilo")
      } finally {
        if (!cancelled) setProfileLoading(false)
      }
    }

    loadMe()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadMlForSafety() {
      try {
        // scegli tu il range: 24h / week / month / all / none
        const range = "24h"

        const res = await fetch(`${API_BASE}/drink_log/getMlForSafety.php?range=${encodeURIComponent(range)}`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        })

        const text = await res.text()
        if (!text.trim()) throw new Error(`Empty response (HTTP ${res.status})`)

        const json = JSON.parse(text) as
          | { ok: true; totalPureAlcoholMl: number; firstDrinkTime?: string | null }
          | { ok: false; error: string }

        if (!res.ok || !json.ok) throw new Error("error" in json ? json.error : `HTTP ${res.status}`)
        if (cancelled) return

        const rawMl = (json as any).totalPureAlcoholMl ?? 0
        const ml = Number(String(rawMl).replace(",", "."))
        const safeMl = Number.isFinite(ml) ? Math.max(0, ml) : 0

        const items = Array.isArray((json as any).items) ? (json as any).items : []
        setDrinkItems(items)
        console.log("items sample:", items?.[0], "len:", items?.length)

        const t = (json as any).firstDrinkTime

        if (t) {
          const s = String(t).trim()

          // 1) prova formato italiano "DD/MM/YYYY, HH:mm:ss"
          const it = parseItalianDateTime(s)
          if (it) {
            setFirstDrinkAt(it)
          } else {
            // 2) prova ISO / "YYYY-MM-DD HH:mm:ss"
            const iso = s.includes("T") ? s : s.replace(" ", "T")
            const d = new Date(iso)
            setFirstDrinkAt(Number.isNaN(d.getTime()) ? null : d)
          }
        } else {
          setFirstDrinkAt(null)
        }

        // Precompila SOLO se l’utente non ha ancora modificato a mano
        if (!hasUserEditedMl) {
          setAlcolMlPuro(Math.round(safeMl)) // o lascia decimali se vuoi
        }
      } catch (e: any) { }
      finally { }
    }

    loadMlForSafety()
    return () => {
      cancelled = true
    }
  }, [hasUserEditedMl])

  // Calcolo BAC live (solo se profilo completo)
  useEffect(() => {
    try {
      setCalcError(null)

      if (!drinkItems || drinkItems.length === 0) {
        setCurrentBAC(0)
        setSoberTime(null)
        setCanDrive(true)
        return
      }

      // profilo incompleto -> niente calcolo
      if (altezzaCm == null || pesoKg == null || sesso == null) {
        setCurrentBAC(0)
        setSoberTime(null)
        setCanDrive(true)
        setCalcError("Completa altezza, peso e sesso nel profilo per calcolare il BAC.")
        return
      }

      const lbm =
        sesso === "maschio"
          ? 0.407 * pesoKg + 0.267 * altezzaCm - 19.2
          : 0.252 * pesoKg + 0.473 * altezzaCm - 48.3

      if (lbm <= 0 || lbm >= pesoKg) {
        throw new Error("Dati non realistici: controlla altezza e peso nel profilo")
      }

      const tbw = 0.73 * lbm // litri

      // 1. Validazione e ordinamento cronologico (dal più vecchio al più recente)
      const validDrinks = drinkItems
        .map(it => {
          const ml = Number(String((it as any).pureAlcoholMl ?? 0).replace(",", "."))
          const d = parseAnyDateTime(String((it as any).time ?? ""))
          return { ml, time: d ? d.getTime() : 0 }
        })
        .filter(it => Number.isFinite(it.ml) && it.ml > 0 && it.time > 0)
        .sort((a, b) => a.time - b.time)

      if (validDrinks.length === 0) {
        setCurrentBAC(0)
        setSoberTime(null)
        setCanDrive(true)
        return
      }

      // 2. Calcolo progressivo del metabolismo epatico
      let bac = 0
      let lastDrinkTime = validDrinks[0].time
      const now = Date.now()

      for (const drink of validDrinks) {
        // Applica il decadimento avvenuto *esclusivamente* tra il drink precedente e questo
        const hoursPassed = Math.max(0, (drink.time - lastDrinkTime) / (1000 * 60 * 60))
        bac = Math.max(0, bac - ELIMINATION_GL_PER_H * hoursPassed)

        // Aggiungi la nuova dose di alcol nel sangue
        bac += (drink.ml * 0.8) / tbw

        lastDrinkTime = drink.time
      }

      // 3. Applica il decadimento dal momento dell'ultimo drink fino al momento attuale (now)
      const hoursSinceLastDrink = Math.max(0, (now - lastDrinkTime) / (1000 * 60 * 60))
      bac = Math.max(0, bac - ELIMINATION_GL_PER_H * hoursSinceLastDrink)

      setCurrentBAC(bac)

      if (bac >= LEGAL_LIMIT_GL) {
        setCanDrive(false)
        const hoursToLegal = (bac - LEGAL_LIMIT_GL) / ELIMINATION_GL_PER_H
        const h = Math.floor(hoursToLegal)
        const m = Math.round((hoursToLegal - h) * 60)
        setSoberTime(`${h}h ${m}m`)
      } else {
        setCanDrive(true)
        setSoberTime(null)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Errore nel calcolo"
      setCalcError(msg)
      setCurrentBAC(0)
      setSoberTime(null)
      setCanDrive(true)
    }
  }, [altezzaCm, pesoKg, sesso, drinkItems])

  const getBACColor = () => {
    if (currentBAC < 0.3) return "text-primary"
    if (currentBAC < 0.5) return "text-yellow-400"
    if (currentBAC < 0.8) return "text-orange-400"
    return "text-red-500"
  }

  const getBACStatus = () => {
    if (currentBAC < 0.3) return { label: "Basso", color: "bg-primary/20 text-primary" }
    if (currentBAC < 0.5) return { label: "Attenzione", color: "bg-yellow-400/20 text-yellow-400" }
    if (currentBAC < 0.8) return { label: "Alto", color: "bg-orange-400/20 text-orange-400" }
    return { label: "Molto alto", color: "bg-red-500/20 text-red-500" }
  }

  // SISTEMA
  const isOverLimit = 0 >= drinkLimit
  const bacStatus = getBACStatus()

  const profileMissing = !profileLoading && (altezzaCm == null || pesoKg == null || sesso == null)

  return (
    <>
      <div className="bg-card rounded-2xl overflow-hidden transition-all border border-white/5">
        
        {/* Collapsed View */}
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          aria-expanded={isExpanded}
          className="w-full p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-4">
            {/* Icona neutra: non ruba l'attenzione dai dati veri */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white/5 group-hover:bg-white/10 transition-colors">
              <Shield className="w-6 h-6 text-foreground-muted" />
            </div>
            
            {/* Informazioni testuali (Queste mantengono i loro colori dinamici) */}
            <div className="text-left">
              <h3 className="font-semibold text-foreground">Safety Status</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-sm font-medium ${bacStatus.color.split(' ')[1]}`}>
                  {bacStatus.label}
                </span>
                <span className="text-foreground-muted text-xs">•</span>
                <span className="text-foreground-muted text-sm font-mono">{currentBAC.toFixed(2)} g/L</span>
              </div>
            </div>
          </div>

          {/* Avvisi critici e Controlli (Unici elementi che si accendono di rosso) */}
          <div className="flex items-center gap-3">
            {!canDrive && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 shadow-sm">
                <Car className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-red-500 uppercase tracking-wider hidden sm:inline-block">
                  Non guidare
                </span>
              </div>
            )}
            <div className="p-1 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors">
              {isExpanded ? <ChevronUp className="w-5 h-5 text-foreground-muted" /> : <ChevronDown className="w-5 h-5 text-foreground-muted" />}
            </div>
          </div>
        </button>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">

            {/* 1. BAC Meter (Priorità Alta) */}
            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-foreground-muted">Tasso alcolemico stimato</span>
                <span className={`text-3xl font-bold tracking-tight ${getBACColor()}`}>
                  {currentBAC.toFixed(2)} <span className="text-lg font-medium opacity-70">g/L</span>
                </span>
              </div>

              <div className="h-3 bg-black/40 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${currentBAC < 0.5 ? "bg-primary" : currentBAC < 0.8 ? "bg-orange-400" : "bg-red-500"}`}
                  style={{ width: `${Math.min((currentBAC / 1.5) * 100, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-medium text-foreground-muted mt-2 px-1">
                <span>0.0</span>
                <span className={currentBAC >= 0.5 ? "text-red-400 font-bold" : ""}>0.5 (Limite)</span>
                <span>0.8</span>
                <span>1.5+</span>
              </div>

              <p className="text-[11px] text-foreground-muted/70 mt-3 text-center uppercase tracking-wider">
                * Stima fisiologica. Non ha validità legale.
              </p>
            </div>

            {/* 2. Actionable Alerts (Timer & Drive Status) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {soberTime && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex flex-col justify-center items-center text-center">
                  <Clock className="w-5 h-5 text-orange-400 mb-1" />
                  <p className="text-xs text-foreground-muted">Ritorno sotto 0.5g/L tra</p>
                  <p className="text-lg font-bold text-orange-400">{soberTime}</p>
                </div>
              )}
              
              <div className={`rounded-xl p-3 flex flex-col justify-center items-center text-center border transition-all ${!soberTime ? "sm:col-span-2" : ""} ${canDrive ? "bg-primary/10 border-primary/20" : "bg-red-500/10 border-red-500/20"}`}>
                <Car className={`w-5 h-5 mb-1 transition-colors ${canDrive ? "text-primary" : "text-red-500"}`} />
                <p className={`text-xs transition-colors ${canDrive ? "text-primary/70" : "text-red-500/70"}`}>Stato guida</p>
                <p className={`text-sm font-bold transition-colors ${canDrive ? "text-primary" : "text-red-500"}`}>
                  {canDrive ? "Consentita" : "Vietata"}
                </p>
              </div>
            </div>

            {/* 3. Dati Fisiologici (Sola Lettura) */}
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-sm font-medium text-foreground mb-4 flex items-center justify-between">
                <span>Parametri Fisiologici</span>
                {profileMissing && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
              </p>
              
              {profileLoading ? (
                <p className="text-xs text-foreground-muted animate-pulse">Caricamento in corso...</p>
              ) : profileError ? (
                <p className="text-xs text-red-400">{profileError}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-center mb-2">
                  <div className="bg-black/20 rounded-lg py-2 border border-white/5">
                    <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Altezza</p>
                    <p className="text-sm font-semibold text-foreground">{altezzaCm ? `${altezzaCm} cm` : "—"}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg py-2 border border-white/5">
                    <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Peso</p>
                    <p className="text-sm font-semibold text-foreground">{pesoKg ? `${pesoKg} kg` : "—"}</p>
                  </div>
                  <div className="bg-black/20 rounded-lg py-2 border border-white/5">
                    <p className="text-[10px] text-foreground-muted uppercase tracking-wider">Sesso</p>
                    <p className="text-sm font-semibold text-foreground capitalize">{sesso ?? "—"}</p>
                  </div>
                </div>
              )}

              {profileMissing && (
                <div className="mt-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
                  <p className="text-xs text-yellow-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Completa il profilo su AlterVista per abilitare il calcolo accurato del tasso alcolemico.</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Limit Setting Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">Imposta Limite Drink</h3>
            <p className="text-sm text-foreground-muted mb-4">Riceverai un avviso quando raggiungi questo limite</p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button onClick={() => setDrinkLimit(Math.max(1, drinkLimit - 1))} className="w-12 h-12 rounded-full bg-white/10 text-foreground text-2xl">
                -
              </button>
              <span className="text-4xl font-bold text-primary w-16 text-center">{drinkLimit}</span>
              <button onClick={() => setDrinkLimit(drinkLimit + 1)} className="w-12 h-12 rounded-full bg-primary text-background text-2xl">
                +
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowLimitModal(false)} className="flex-1 py-3 rounded-xl bg-white/10 text-foreground font-medium">
                Annulla
              </button>
              <button onClick={() => setShowLimitModal(false)} className="flex-1 py-3 rounded-xl bg-primary text-background font-medium">
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
