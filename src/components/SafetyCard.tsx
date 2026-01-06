"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, Clock, Phone, Car, Shield, X, ChevronDown, ChevronUp, Settings, Bell } from "lucide-react"

interface SafetyCardProps {
  totalDrinks: number
  firstDrinkTime?: Date
  onCallEmergency?: () => void
}

// BAC calculation constants (simplified Widmark formula)
const METABOLISM_RATE = 0.015 // BAC reduction per hour
const DRINK_BAC = 0.02 // Average BAC increase per standard drink

export default function SafetyCard({ totalDrinks, firstDrinkTime, onCallEmergency }: SafetyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [drinkLimit, setDrinkLimit] = useState(6)
  const [emergencyContact, setEmergencyContact] = useState({ name: "Marco Rossi", phone: "+39 333 1234567" })
  const [currentBAC, setCurrentBAC] = useState(0)
  const [soberTime, setSoberTime] = useState<string | null>(null)
  const [canDrive, setCanDrive] = useState(true)

  // Calculate BAC and sobriety timer
  useEffect(() => {
    if (totalDrinks === 0 || !firstDrinkTime) {
      setCurrentBAC(0)
      setSoberTime(null)
      setCanDrive(true)
      return
    }

    const calculateBAC = () => {
      const now = new Date()
      const hoursSinceFirst = (now.getTime() - firstDrinkTime.getTime()) / (1000 * 60 * 60)

      // Simplified BAC calculation
      const rawBAC = totalDrinks * DRINK_BAC - hoursSinceFirst * METABOLISM_RATE
      const bac = Math.max(0, rawBAC)
      setCurrentBAC(bac)

      // Calculate time until sober (BAC < 0.02 for safety margin)
      if (bac > 0.02) {
        const hoursToSober = (bac - 0.02) / METABOLISM_RATE
        const soberDate = new Date(now.getTime() + hoursToSober * 60 * 60 * 1000)
        const hours = Math.floor(hoursToSober)
        const minutes = Math.round((hoursToSober - hours) * 60)
        setSoberTime(`${hours}h ${minutes}m`)
        setCanDrive(false)
      } else {
        setSoberTime(null)
        setCanDrive(true)
      }
    }

    calculateBAC()
    const interval = setInterval(calculateBAC, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [totalDrinks, firstDrinkTime])

  const getBACColor = () => {
    if (currentBAC < 0.03) return "text-primary"
    if (currentBAC < 0.05) return "text-yellow-400"
    if (currentBAC < 0.08) return "text-orange-400"
    return "text-red-500"
  }

  const getBACStatus = () => {
    if (currentBAC < 0.03) return { label: "Sobrio", color: "bg-primary/20 text-primary" }
    if (currentBAC < 0.05) return { label: "Leggero", color: "bg-yellow-400/20 text-yellow-400" }
    if (currentBAC < 0.08) return { label: "Moderato", color: "bg-orange-400/20 text-orange-400" }
    return { label: "Elevato", color: "bg-red-500/20 text-red-500" }
  }

  const isOverLimit = totalDrinks >= drinkLimit
  const bacStatus = getBACStatus()

  return (
    <>
      <div
        className={`bg-card rounded-2xl overflow-hidden transition-all ${isOverLimit ? "ring-2 ring-red-500/50" : ""}`}
      >
        {/* Collapsed View */}
        <button onClick={() => setIsExpanded(!isExpanded)} className="w-full p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverLimit ? "bg-red-500/20" : "bg-primary/20"}`}
            >
              <Shield className={`w-5 h-5 ${isOverLimit ? "text-red-500" : "text-primary"}`} />
            </div>
            <div className="text-left">
              <p className="font-medium text-foreground">Safety Status</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs ${bacStatus.color}`}>{bacStatus.label}</span>
                {isOverLimit && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-500">Over Limit</span>
                )}
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
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-foreground-muted" />
            ) : (
              <ChevronDown className="w-5 h-5 text-foreground-muted" />
            )}
          </div>
        </button>

        {/* Expanded View */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4">
            {/* BAC Meter */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-foreground-muted">Stima Tasso Alcolemico</span>
                <span className={`text-2xl font-bold ${getBACColor()}`}>{(currentBAC * 100).toFixed(2)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    currentBAC < 0.05 ? "bg-primary" : currentBAC < 0.08 ? "bg-orange-400" : "bg-red-500"
                  }`}
                  style={{ width: `${Math.min(currentBAC * 1000, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-foreground-muted mt-1">
                <span>0</span>
                <span>0.05</span>
                <span>0.08</span>
                <span>0.1+</span>
              </div>
              <p className="text-xs text-foreground-muted mt-2">
                * Stima approssimativa. Non usare per decisioni legali.
              </p>
            </div>

            {/* Sobriety Timer */}
            {soberTime && (
              <div className="bg-orange-500/10 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="font-medium text-foreground">Timer Sobrietà</p>
                    <p className="text-sm text-foreground-muted">Tempo stimato per guidare</p>
                  </div>
                </div>
                <span className="text-xl font-bold text-orange-400">{soberTime}</span>
              </div>
            )}

            {/* Drive Status */}
            <div className={`rounded-xl p-4 flex items-center gap-3 ${canDrive ? "bg-primary/10" : "bg-red-500/10"}`}>
              <Car className={`w-6 h-6 ${canDrive ? "text-primary" : "text-red-500"}`} />
              <div>
                <p className={`font-medium ${canDrive ? "text-primary" : "text-red-500"}`}>
                  {canDrive ? "Puoi guidare" : "Non guidare"}
                </p>
                <p className="text-sm text-foreground-muted">
                  {canDrive ? "Il tuo BAC è sotto il limite" : "Aspetta o chiama qualcuno"}
                </p>
              </div>
            </div>

            {/* Drink Limit */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-foreground-muted">Limite Drink</span>
                <button onClick={() => setShowLimitModal(true)} className="text-primary text-sm">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      totalDrinks >= drinkLimit
                        ? "bg-red-500"
                        : totalDrinks >= drinkLimit - 2
                          ? "bg-yellow-400"
                          : "bg-primary"
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
            </div>

            {/* Emergency Contact */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">Contatto Emergenza</p>
                    <p className="text-sm text-foreground-muted">{emergencyContact.name}</p>
                  </div>
                </div>
                <a
                  href={`tel:${emergencyContact.phone}`}
                  className="px-4 py-2 bg-primary text-background rounded-xl font-medium text-sm"
                >
                  Chiama
                </a>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
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
            </div>
          </div>
        )}
      </div>

      {/* Limit Setting Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-foreground mb-4">Imposta Limite Drink</h3>
            <p className="text-sm text-foreground-muted mb-4">Riceverai un avviso quando raggiungi questo limite</p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <button
                onClick={() => setDrinkLimit(Math.max(1, drinkLimit - 1))}
                className="w-12 h-12 rounded-full bg-white/10 text-foreground text-2xl"
              >
                -
              </button>
              <span className="text-4xl font-bold text-primary w-16 text-center">{drinkLimit}</span>
              <button
                onClick={() => setDrinkLimit(drinkLimit + 1)}
                className="w-12 h-12 rounded-full bg-primary text-background text-2xl"
              >
                +
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/10 text-foreground font-medium"
              >
                Annulla
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 py-3 rounded-xl bg-primary text-background font-medium"
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
