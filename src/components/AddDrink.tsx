"use client"

import React from "react"
import { useState, useRef } from "react"
import { Search, Heart, Minus, Plus, Clock, Check, StickyNote, X, ChevronDown } from "lucide-react"
import { FavoriteDrinkModel } from "../models/add-drink-models"

const API_BASE = "https://bevoh.altervista.org/api"
const SEARCH_PAGE_SIZE = 30

export default function AddDrinkPage() {
  const [drinks, setDrinks] = useState<FavoriteDrinkModel[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDrink, setSelectedDrink] = useState<FavoriteDrinkModel | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [note, setNote] = useState("")
  const [showNoteInput, setShowNoteInput] = useState(false)

  // const [location, setLocation] = useState("")
  // const [photo, setPhoto] = useState<string | null>(null)
  // const fileInputRef = useRef<HTMLInputElement>(null)

  const [timeOpen, setTimeOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [tempDate, setTempDate] = useState("")
  const [tempTime, setTempTime] = useState("")

  const searchOpen = searchQuery.trim().length > 0
  const [searchResults, setSearchResults] = useState<FavoriteDrinkModel[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  const searchAbortRef = useRef<AbortController | null>(null)
  const searchReqIdRef = useRef(0)
  const searchMoreRef = useRef<HTMLDivElement | null>(null)
  const headerSearchRef = useRef<HTMLInputElement>(null)
  const prevQueryRef = useRef("")

  const [showAllFavorites, setShowAllFavorites] = useState(false)

  // ── API helpers ──────────────────────────────────────────────────────────────

  async function removeFavoriteOnServer(drinkId: number, signal?: AbortSignal) {
    const res = await fetch(`${API_BASE}/toggleFavoriteDrink.php`, {
      method: "POST",
      signal,
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ drinkId, action: "remove" }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (!json?.ok) throw new Error(json?.error || "Errore API")
    return true
  }

  const handleRemoveFavorite = async (drinkId: number) => {
    try {
      await removeFavoriteOnServer(drinkId)
      await getFavouriteDrinks()
    } catch (e) {
      console.log(e)
    }
  }

  async function getFavouriteDrinks(signal?: AbortSignal): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/getFavoriteDrinks.php`, {
        signal,
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Errore API")
      const mapped: FavoriteDrinkModel[] = (json.data ?? []).map((r: any) => ({
        id: r.Id,
        name: r.Name,
        type: r.Category,
        image: r.ImageUrl,
      }))
      setDrinks(mapped)
    } catch (e: any) {
      if (e?.name !== "AbortError") console.log(e)
    }
  }

  React.useEffect(() => {
    const controller = new AbortController()
    getFavouriteDrinks(controller.signal)
    return () => controller.abort()
  }, [])

  async function getDrinksSearch(signal?: AbortSignal, opts?: { reset?: boolean }): Promise<void> {
    const reset = !!opts?.reset
    if (!reset && searchLoading) return
    if (!reset && !searchHasMore) return
    const q = searchQuery.trim()
    if (!q) return
    const reqId = ++searchReqIdRef.current
    try {
      setSearchLoading(true)
      const nextPage = reset ? 1 : searchPage
      const url = `${API_BASE}/getDrinkPage.php?page=${nextPage}&pageSize=${SEARCH_PAGE_SIZE}&search=${encodeURIComponent(q)}`
      const res = await fetch(url, { signal, credentials: "include", headers: { Accept: "application/json" } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Errore API")
      if (reqId !== searchReqIdRef.current) return
      const mapped: FavoriteDrinkModel[] = (json.data ?? []).map((r: any) => ({
        id: Number(r.Id),
        name: r.Name,
        type: r.Category,
        image: r.ImageUrl,
      }))
      setSearchResults((prev) => (reset ? mapped : [...prev, ...mapped]))
      const hm = typeof json.hasMore === "boolean" ? json.hasMore : mapped.length === SEARCH_PAGE_SIZE
      setSearchHasMore(hm)
      setSearchPage(reset ? 2 : nextPage + 1)
    } catch (e: any) {
      if (e?.name !== "AbortError") console.log(e)
    } finally {
      setSearchLoading(false)
    }
  }

  React.useEffect(() => {
    const q = searchQuery.trim()
    const prev = prevQueryRef.current.trim()
    prevQueryRef.current = searchQuery
    searchAbortRef.current?.abort()
    if (!q) {
      setSearchResults([])
      setSearchPage(1)
      setSearchHasMore(true)
      setSearchLoading(false)
      if (prev.length > 0) requestAnimationFrame(() => headerSearchRef.current?.focus())
      return
    }
    const controller = new AbortController()
    searchAbortRef.current = controller
    setSearchResults([])
    setSearchPage(1)
    setSearchHasMore(true)
    const t = window.setTimeout(() => getDrinksSearch(controller.signal, { reset: true }), 200)
    return () => { window.clearTimeout(t); controller.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  React.useEffect(() => {
    const el = searchMoreRef.current
    if (!el || !searchOpen) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || searchLoading || !searchHasMore) return
        getDrinksSearch(searchAbortRef.current?.signal)
      },
      { rootMargin: "800px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen, searchLoading, searchHasMore, searchPage])

  // ── Time helpers ─────────────────────────────────────────────────────────────

  const pad2 = (n: number) => String(n).padStart(2, "0")

  const initTempToNow = () => {
    const d = new Date()
    setTempDate(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`)
    setTempTime(`${pad2(d.getHours())}:${pad2(d.getMinutes())}`)
  }

  const formatPretty = (iso: string) => {
    const [date, time] = iso.split("T")
    const [y, m, day] = date.split("-")
    return `${day}/${m}/${y} · ${time}`
  }

  const openTimePicker = () => {
    if (selectedTime) {
      const [date, time] = selectedTime.split("T")
      setTempDate(date)
      setTempTime(time)
    } else {
      initTempToNow()
    }
    setTimeOpen(true)
  }

  const applyTime = () => {
    if (!tempDate || !tempTime) return
    setSelectedTime(`${tempDate}T${tempTime}`)
    setTimeOpen(false)
  }

  // ── Log ──────────────────────────────────────────────────────────────────────

  async function addDrinkLogOnServer(payload: {
    drinkId: number
    quantity: number
    time: string
    notes?: string
    signal?: AbortSignal
  }) {
    const res = await fetch(`${API_BASE}/drink_log/addDrinkLog.php`, {
      method: "POST",
      signal: payload.signal,
      credentials: "include",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({
        drinkId: payload.drinkId,
        quantity: payload.quantity,
        time: payload.time,
        notes: payload.notes ?? null,
      }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    if (!json?.ok) throw new Error(json?.error || "Errore API")
    return json.data
  }

  const handleLogDrink = async () => {
    if (!selectedDrink?.id) return
    try {
      await addDrinkLogOnServer({ drinkId: selectedDrink.id, quantity, time: selectedTime, notes: note || undefined })
      setSelectedDrink(null)
      setQuantity(1)
      setSelectedTime("")
      setTempDate("")
      setTempTime("")
      setNote("")
      setShowNoteInput(false)
      console.log("Drink loggato ✅")
    } catch (e: any) {
      console.log(e)
      alert(e?.message || "Errore nel salvataggio")
    }
  }

  const canLog = selectedDrink !== null
  const visibleFavorites = showAllFavorites ? drinks : drinks.slice(0, 3)
  const visibleFavoritesMdUp = showAllFavorites ? drinks : drinks.slice(0, 10)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">

      {/* ── STICKY HEADER ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 md:mt-14 z-30 bg-background/80 backdrop-blur-xl border-b border-white/[0.06] px-4 pt-4 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
          <input
            ref={headerSearchRef}
            type="text"
            placeholder="Search spirits, beers, wines…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
          />
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-foreground-muted hover:text-foreground transition"
              aria-label="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── SEARCH MODAL ──────────────────────────────────────────────────────── */}
      {searchOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm cursor-default"
            onClick={() => setSearchQuery("")}
            aria-label="Close search"
          />

          <div className="fixed inset-x-0 top-0 z-50 md:top-16 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[800px]">
            <div className="bg-[#0e0e10]/95 backdrop-blur-2xl border-b border-white/[0.08] md:border md:rounded-2xl md:shadow-2xl overflow-hidden">

              {/* search inside modal */}
              <div className="p-3 border-b border-white/[0.07]">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search spirits, beers, wines…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/[0.08] rounded-xl py-3 pl-11 pr-10 text-sm text-foreground placeholder:text-foreground-muted/60 focus:outline-none focus:ring-1 focus:ring-primary/40 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-foreground-muted hover:text-foreground transition"
                    aria-label="Clear"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* results */}
              <div className="max-h-[72vh] overflow-auto px-3 py-3">
                {searchResults.length === 0 && !searchLoading ? (
                  <div className="py-16 text-center text-sm text-foreground-muted/50">No drinks found</div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                      {searchResults.map((drink) => (
                        <DrinkCard
                          key={drink.id}
                          drink={drink}
                          isSelected={selectedDrink?.id === drink.id}
                          onClick={() => { setSelectedDrink(drink); setSearchQuery("") }}
                          showHeart={false}
                        />
                      ))}
                    </div>
                    <div ref={searchMoreRef} className="h-1" />
                    {searchLoading && (
                      <p className="py-4 text-center text-xs text-foreground-muted/50">Loading…</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-36 space-y-6">

        {/* ── SELECTED DRINK ──────────────────────────────────────────────────── */}
        {selectedDrink ? (
          <section>
            <SectionHeader
              title="Selected drink"
              action={{ label: "Change", onClick: () => setSelectedDrink(null) }}
            />
            <SelectedDrinkBanner drink={selectedDrink} onClear={() => setSelectedDrink(null)} />
          </section>
        ) : (
          /* ── FAVORITES ─────────────────────────────────────────────────────── */
          <section>
            <SectionHeader
              title="Favorites"
              action={{
                label: showAllFavorites ? "Show less" : "View all",
                onClick: () => setShowAllFavorites(!showAllFavorites),
              }}
            />

            {drinks.length === 0 ? (
              <EmptyFavorites />
            ) : (
              <>
                {/* Mobile: 3 columns */}
                <div className="grid grid-cols-3 gap-2 md:hidden">
                  {visibleFavorites.map((drink) => (
                    <DrinkCard
                      key={drink.id}
                      drink={drink}
                      isSelected={selectedDrink?.id === drink.id}
                      onClick={() => setSelectedDrink(selectedDrink?.id === drink.id ? null : drink)}
                      showHeart
                      onRemove={() => handleRemoveFavorite(drink.id)}
                    />
                  ))}
                </div>

                {/* md+: 10 columns */}
                <div className="hidden md:grid grid-cols-10 gap-2">
                  {visibleFavoritesMdUp.map((drink) => (
                    <DrinkCard
                      key={drink.id}
                      drink={drink}
                      isSelected={selectedDrink?.id === drink.id}
                      onClick={() => setSelectedDrink(selectedDrink?.id === drink.id ? null : drink)}
                      showHeart
                      onRemove={() => handleRemoveFavorite(drink.id)}
                    />
                  ))}
                </div>

                {/* show more toggle – mobile only */}
                {drinks.length > 3 && (
                  <button
                    onClick={() => setShowAllFavorites(!showAllFavorites)}
                    className="md:hidden mt-3 w-full py-2.5 rounded-xl border border-white/[0.08] text-xs text-foreground-muted/70 flex items-center justify-center gap-1.5 hover:bg-white/[0.04] transition"
                  >
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAllFavorites ? "rotate-180" : ""}`} />
                    {showAllFavorites ? "Show less" : `Show ${drinks.length - 3} more`}
                  </button>
                )}
              </>
            )}
          </section>
        )}

        {/* ── DETAILS ─────────────────────────────────────────────────────────── */}
        <section>
          <SectionHeader title="Details" />

          <div className="space-y-2">

            {/* QUANTITY */}
            <DetailRow emoji="🍺" label="Quantity">
              <div className="flex items-center gap-2">
                <StepButton onClick={() => setQuantity(Math.max(1, quantity - 1))} icon={<Minus className="w-3.5 h-3.5" />} />
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={quantity}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!Number.isNaN(val)) setQuantity(Math.max(1, val))
                  }}
                  onBlur={() => { if (!quantity || quantity < 1) setQuantity(1) }}
                  className="w-9 text-center font-semibold text-foreground text-base bg-transparent focus:outline-none appearance-none"
                />
                <StepButton onClick={() => setQuantity(quantity + 1)} icon={<Plus className="w-3.5 h-3.5" />} />
              </div>
            </DetailRow>

            {/* TIME */}
            <DetailRow emoji={<Clock className="w-4 h-4 text-primary" />} label="Time">
              <div className="relative">
                <button
                  type="button"
                  onClick={openTimePicker}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    selectedTime
                      ? "bg-white/[0.08] text-foreground hover:bg-white/[0.12]"
                      : "bg-primary/15 text-primary hover:bg-primary/20"
                  }`}
                >
                  {selectedTime ? formatPretty(selectedTime) : "Set time"}
                </button>

                {timeOpen && (
                  <>
                    <button
                      type="button"
                      className="fixed inset-0 z-30 cursor-default"
                      onClick={() => setTimeOpen(false)}
                      aria-label="Close time picker"
                    />
                    <div className="absolute right-0 bottom-full mb-2 w-68 z-40 rounded-xl bg-[#18181b] border border-white/[0.10] shadow-2xl overflow-hidden">
                      <div className="p-3 grid grid-cols-2 gap-2">
                        <label className="block">
                          <span className="text-[10px] uppercase tracking-widest text-foreground-muted/60 mb-1 block">Date</span>
                          <input
                            type="date"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="w-full bg-white/[0.06] rounded-lg px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                        </label>
                        <label className="block">
                          <span className="text-[10px] uppercase tracking-widest text-foreground-muted/60 mb-1 block">Time</span>
                          <input
                            type="time"
                            value={tempTime}
                            onChange={(e) => setTempTime(e.target.value)}
                            className="w-full bg-white/[0.06] rounded-lg px-2.5 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                          />
                        </label>
                      </div>
                      <div className="px-3 pb-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTimeOpen(false)}
                          className="flex-1 py-2 rounded-lg bg-white/[0.06] text-sm text-foreground-muted hover:bg-white/10 transition"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={applyTime}
                          className="flex-1 py-2 rounded-lg bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </DetailRow>

            {/* NOTE */}
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-primary">
                    <StickyNote className="w-4 h-4" />
                  </span>
                  <span className="text-sm font-medium text-foreground">Note</span>
                </div>
                <button
                  onClick={() => setShowNoteInput(!showNoteInput)}
                  className="px-3 py-1 rounded-lg bg-white/[0.07] text-xs text-foreground-muted hover:bg-white/[0.11] transition"
                >
                  {showNoteInput ? "Hide" : "Add"}
                </button>
              </div>
              {showNoteInput && (
                <div className="px-4 pb-4">
                  <textarea
                    placeholder="Best cocktail ever…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full bg-white/[0.05] border border-white/[0.07] rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-foreground-muted/40 focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none transition"
                  />
                </div>
              )}
            </div>

            {/* LOCATION — commented out
            <DetailRow emoji="📍" label="Location">
              <input
                type="text"
                placeholder="Add place"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-right bg-transparent text-foreground-muted text-sm focus:outline-none w-32"
              />
            </DetailRow>
            */}

            {/* PHOTO — commented out
            <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <Camera className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Photo</span>
                </div>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-lg bg-white/[0.07] text-xs text-foreground-muted hover:bg-white/[0.11] transition flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  {photo ? "Change" : "Add"}
                </button>
              </div>
              {photo && (
                <div className="relative mx-4 mb-4 rounded-lg overflow-hidden">
                  <img src={photo} alt="Drink photo" className="w-full h-36 object-cover" />
                  <button
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              )}
            </div>
            */}

          </div>
        </section>
      </div>

      {/* ── LOG BUTTON ────────────────────────────────────────────────────────── */}
      <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 px-4 lg:pl-68">
        <div className="max-w-md mx-auto lg:max-w-none">
          <button
            onClick={handleLogDrink}
            disabled={!canLog}
            className={`w-full py-4 rounded-2xl text-base font-semibold flex items-center justify-center gap-2 transition-all ${
              canLog
                ? "bg-primary text-background hover:bg-primary/90 shadow-lg shadow-primary/20"
                : "bg-white/[0.05] text-foreground-muted/40 cursor-not-allowed"
            }`}
          >
            <Check className="w-5 h-5" />
            Log drink
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground-muted/60">{title}</h2>
      {action && (
        <button onClick={action.onClick} className="text-xs text-primary font-medium hover:opacity-80 transition">
          {action.label}
        </button>
      )}
    </div>
  )
}

function DrinkCard({
  drink,
  isSelected,
  onClick,
  showHeart,
  onRemove,
}: {
  drink: FavoriteDrinkModel
  isSelected: boolean
  onClick: () => void
  showHeart: boolean
  onRemove?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`relative bg-white/[0.04] rounded-xl overflow-hidden transition-all ${
        isSelected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : "hover:bg-white/[0.07]"
      }`}
    >
      <div className="relative w-full aspect-[3/4]">
        {drink.image ? (
          <img
            src={drink.image}
            alt={drink.name}
            className="h-full w-full object-cover"
            style={{ objectPosition: "50% 100%" }}
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-4xl opacity-50">🍹</div>
        )}

        {/* heart */}
        {showHeart && onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="absolute right-2 top-2 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 backdrop-blur border border-white/15 hover:bg-black/70 transition"
            aria-label="Remove from favorites"
          >
            <Heart size={13} className="fill-white text-white" />
          </button>
        )}

        {/* label overlay */}
        <div className="absolute inset-x-0 bottom-0 z-10">
          {/* gradiente doppio: base opaca + fade in alto */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/80" />
          <div className="absolute inset-x-0 bottom-1/2 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
          <p
            className="relative px-2 pb-2 pt-5 text-[10px] font-bold tracking-wide text-white uppercase leading-snug"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6)",
            }}
          >
            {drink.name}
          </p>
        </div>
      </div>
    </button>
  )
}

function SelectedDrinkBanner({ drink, onClear }: { drink: FavoriteDrinkModel; onClear: () => void }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.09] shadow-2xl">

      {/* ── IMAGE — taller on mobile, cinematic on md+ ── */}
      <div className="relative w-full aspect-[3/4] md:aspect-[16/9]">
        {drink.image ? (
          <>
            {/* blurred bg fill (evita bande nere su aspect ratio diversi) */}
            <div
              className="absolute inset-0 scale-110 blur-2xl opacity-60"
              style={{
                backgroundImage: `url(${drink.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <img
              src={drink.image}
              alt={drink.name}
              className="relative h-full w-full object-contain md:object-cover z-10"
              style={{ objectPosition: "50% 50%" }}
            />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-8xl opacity-30 bg-white/[0.03]">🍹</div>
        )}

        {/* vignette overlay */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/10 to-black/30" />

        {/* close button */}
        <button
          onClick={onClear}
          className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-black/80 transition-all hover:scale-105 active:scale-95"
          aria-label="Deselect drink"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>

        {/* name + type */}
        <div className="absolute bottom-0 inset-x-0 z-30 px-5 pb-5 pt-16">
          {drink.type && (
            <p
              className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/50"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
            >
              {drink.type}
            </p>
          )}
          <p
            className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase leading-none"
            style={{ textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 0 32px rgba(0,0,0,0.5)" }}
          >
            {drink.name}
          </p>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  emoji,
  label,
  children,
}: {
  emoji: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.07] rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="text-base leading-none">{emoji}</span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      {children}
    </div>
  )
}

function StepButton({ onClick, icon }: { onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 active:scale-95 transition"
    >
      {icon}
    </button>
  )
}

function EmptyFavorites() {
  return (
    <div className="py-10 text-center border border-dashed border-white/[0.08] rounded-xl">
      <p className="text-2xl mb-2">🍹</p>
      <p className="text-sm text-foreground-muted/50">No favorites yet — search a drink to add one</p>
    </div>
  )
}