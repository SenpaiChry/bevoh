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
      // 1) LBM + TBW (come in calcolaBacGL ma qui ci serve TBW per sommare per drink)
      const lbm =
        sesso === "maschio"
          ? 0.407 * pesoKg + 0.267 * altezzaCm - 19.2
          : 0.252 * pesoKg + 0.473 * altezzaCm - 48.3

      if (lbm <= 0 || lbm >= pesoKg) {
        throw new Error("Dati non realistici: controlla altezza e peso nel profilo")
      }

      const tbw = 0.73 * lbm // litri

      const now = Date.now()

      const bacNow = drinkItems.reduce((sum, it) => {
        const ml = Number(String((it as any).pureAlcoholMl ?? 0).replace(",", "."))
        if (!Number.isFinite(ml) || ml <= 0) return sum

        const d = parseAnyDateTime(String((it as any).time ?? ""))
        if (!d) return sum

        const hours = Math.max(0, (now - d.getTime()) / (1000 * 60 * 60))

        const bac0 = (ml * 0.8) / tbw
        const bac = Math.max(0, bac0 - ELIMINATION_GL_PER_H * hours)

        return sum + bac
      }, 0)

      setCurrentBAC(bacNow)

      if (bacNow >= LEGAL_LIMIT_GL) {
        setCanDrive(false)
        const hoursToLegal = (bacNow - LEGAL_LIMIT_GL) / ELIMINATION_GL_PER_H
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
      <div className={`bg-card rounded-2xl overflow-hidden transition-all ${isOverLimit ? "ring-2 ring-red-500/50" : ""}`}>
        {/* Collapsed View */}
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverLimit ? "bg-red-500/20" : "bg-primary/20"}`}>
              <Shield className={`w-5 h-5 ${isOverLimit ? "text-red-500" : "text-primary"}`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Safety Status</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${bacStatus.color}`}>{bacStatus.label}</span>
                {isOverLimit && <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-500">Over Limit</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!canDrive && (
              <div className="flex items-center gap-1 text-orange-400">
                <Car className="w-4 h-4" />
                <X className="w-3 h-3" />
              </div>
            )}
            {isExpanded ? <ChevronUp className="w-5 h-5 text-foreground-muted" /> : <ChevronDown className="w-5 h-5 text-foreground-muted" />}
          </div>
        </button>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
            {/* Profilo (read-only) + input ml */}
            <div className="bg-white/5 rounded-xl p-4 space-y-3">
              <p className="text-sm text-foreground-muted">Dati profilo (solo lettura)</p>

              {profileLoading && <p className="text-xs text-foreground-muted">Caricamento profilo...</p>}
              {!profileLoading && profileError && <p className="text-xs text-red-400">{profileError}</p>}

              {!profileLoading && !profileError && (
                <>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="rounded-lg bg-black/20 p-2">
                      <p className="text-foreground-muted">Altezza</p>
                      <p className="text-foreground font-medium">{altezzaCm ?? "—"}</p>
                    </div>

                    <div className="rounded-lg bg-black/20 p-2">
                      <p className="text-foreground-muted">Peso</p>
                      <p className="text-foreground font-medium">{pesoKg ?? "—"}</p>
                    </div>

                    <div className="rounded-lg bg-black/20 p-2">
                      <p className="text-foreground-muted">Sesso</p>
                      <p className="text-foreground font-medium">{sesso ?? "—"}</p>
                    </div>

                    <div className="rounded-lg bg-black/20 p-2">
                      <p className="text-foreground-muted">Alcol puro (ml)</p>
                      <input
                        type="number"
                        value={alcolMlPuro}
                        onChange={(e) => {
                          setHasUserEditedMl(true)
                          setAlcolMlPuro(Number(e.target.value))
                        }}
                        className="mt-1 w-full bg-transparent text-foreground font-medium outline-none"
                        min={0}
                        step={1}
                      />
                    </div>
                  </div>

                  {profileMissing && (
                    <p className="text-xs text-yellow-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Inserisci altezza, peso e sesso in “Edit Profile” per abilitare il calcolo.
                    </p>
                  )}
                </>
              )}

              {calcError && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {calcError}
                </p>
              )}
            </div>

            {/* BAC Meter */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-foreground-muted">Tasso alcolemico stimato</span>
                <span className={`text-2xl font-bold ${getBACColor()}`}>{currentBAC.toFixed(2)} g/L</span>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${currentBAC < 0.5 ? "bg-primary" : currentBAC < 0.8 ? "bg-orange-400" : "bg-red-500"}`}
                  style={{ width: `${Math.min((currentBAC / 1.2) * 100, 100)}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-foreground-muted mt-1">
                <span>0</span>
                <span>0.5</span>
                <span>0.8</span>
                <span>1.2+</span>
              </div>

              <p className="text-xs text-foreground-muted mt-2">* Stima fisiologica. Non usare per decisioni legali.</p>
            </div>

            {/* Sobriety Timer */}
            {soberTime && (
              <div className="bg-orange-500/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="font-medium text-foreground">Timer (stima)</p>
                    <p className="text-sm text-foreground-muted">Tempo per scendere sotto 0.5 g/L</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-orange-400">{soberTime}</span>
              </div>
            )}

            {/* Drive Status */}
            <div className={`rounded-xl p-4 flex items-center gap-3 ${canDrive ? "bg-primary/10" : "bg-red-500/10"}`}>
              <Car className={`w-6 h-6 ${canDrive ? "text-primary" : "text-red-500"}`} />
              <div>
                <p className={`font-medium ${canDrive ? "text-primary" : "text-red-500"}`}>{canDrive ? "Sotto il limite" : "Oltre il limite"}</p>
                <p className="text-sm text-foreground-muted">{canDrive ? "BAC stimato < 0.5 g/L" : "BAC stimato ≥ 0.5 g/L: non guidare"}</p>
              </div>
            </div>

            {/* Drink Limit */}
            {/* <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-muted">Limite Drink</span>
                <button onClick={() => setShowLimitModal(true)} className="text-primary text-sm">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${totalDrinks >= drinkLimit ? "bg-red-500" : totalDrinks >= drinkLimit - 2 ? "bg-yellow-400" : "bg-primary"
                      }`}
                    style={{ width: `${Math.min((totalDrinks / drinkLimit) * 100, 100)}%` }}
                  />
                </div>
                <span className="text-foreground font-medium">
                  {totalDrinks}/{drinkLimit}
                </span>
              </div>
              {isOverLimit && (
                <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Hai superato il limite impostato
                </p>
              )}
            </div> */}

            {/* Emergency Contact */}
            {/* <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Contatto Emergenza</p>
                    <p className="text-sm text-foreground-muted">{emergencyContact.name}</p>
                  </div>
                </div>
                <a href={`tel:${emergencyContact.phone}`} className="px-4 py-2 bg-primary text-background rounded-xl font-medium text-sm">
                  Chiama
                </a>
              </div>
            </div> */}

            {/* Quick Actions */}
            {/* <div className="grid grid-cols-2 gap-3">
              <a
                href="tel:112"
                className="bg-red-500/20 text-red-500 rounded-xl p-3 text-center font-medium text-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Emergenza 112
              </a>
              <button className="bg-primary/20 text-primary rounded-xl p-3 text-center font-medium text-sm flex items-center justify-center gap-2">
                <Bell className="w-4 h-4" />
                Alert Amici
              </button>
            </div> */}
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
