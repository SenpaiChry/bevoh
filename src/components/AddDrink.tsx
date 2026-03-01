"use client"

import React from "react"
import { useState, useRef } from "react"
import { Search, Heart, Minus, Plus, Clock, Check, StickyNote, X } from "lucide-react"
import { FavoriteDrinkModel } from "../models/add-drink-models"

const drinkIcons = ["🍺", "🍻", "🍷", "🍸", "🥃", "🍹", "🥂", "🍾", "🧉", "☕"]

const API_BASE = "https://bevoh.altervista.org/api"

// pagination search
const SEARCH_PAGE_SIZE = 30

export default function AddDrinkPage() {
  const [drinks, setDrinks] = useState<FavoriteDrinkModel[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDrink, setSelectedDrink] = useState<FavoriteDrinkModel | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [location, setLocation] = useState("")
  const [showCustomDrink, setShowCustomDrink] = useState(false)
  const [customDrinkName, setCustomDrinkName] = useState("")
  const [customDrinkType, setCustomDrinkType] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("🍸")
  const [note, setNote] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [showNoteInput, setShowNoteInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [timeOpen, setTimeOpen] = useState(false)

  // valore finale salvato (quello che mandi in onLogDrink)
  const [selectedTime, setSelectedTime] = useState<string>("") // "" = non impostato

  // campi temporanei dentro al popover
  const [tempDate, setTempDate] = useState("")
  const [tempTime, setTempTime] = useState("")

  // ===== SEARCH MODAL (si apre SOLO quando scrivi) =====
  const searchOpen = searchQuery.trim().length > 0
  const [searchResults, setSearchResults] = useState<FavoriteDrinkModel[]>([])
  const [searchPage, setSearchPage] = useState(1)
  const [searchHasMore, setSearchHasMore] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)

  const searchAbortRef = useRef<AbortController | null>(null)
  const searchReqIdRef = useRef(0)
  const searchMoreRef = useRef<HTMLDivElement | null>(null)

  // focus (solo quando passi da testo -> vuoto)
  const headerSearchRef = useRef<HTMLInputElement>(null)
  const prevQueryRef = useRef("")

  async function removeFavoriteOnServer(drinkId: number, signal?: AbortSignal) {
    const url = `${API_BASE}/toggleFavoriteDrink.php`

    const res = await fetch(url, {
      method: "POST",
      signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
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
      // ricarica lista preferiti (oppure aggiorna localmente, vedi punto 3)
      await getFavouriteDrinks()
    } catch (e) {
      console.log(e)
    }
  }

  async function getFavouriteDrinks(signal?: AbortSignal): Promise<void> {
    try {
      // se è in /auth/ -> `${API_BASE}/auth/getFavoriteDrinks.php`
      const url = `${API_BASE}/getFavoriteDrinks.php`

      const res = await fetch(url, {
        signal,
        // se il backend usa PHP session cookie:
        credentials: "include",
        headers: { Accept: "application/json" },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const json = await res.json()

      if (!json?.ok) throw new Error(json?.error || "Errore API")

      // json.data: [{ Id, Name, Category, ImageUrl, ... }]
      const mapped: FavoriteDrinkModel[] = (json.data ?? []).map((r: any) => ({
        id: r.Id,
        name: r.Name,
        type: r.Category,
        image: r.ImageUrl,
      }))

      console.debug(mapped)
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

  // NOTE:
  // Server-side search using your PHP:
  // GET /getDrinks.php?page=1&pageSize=30&search=...
  async function getDrinksSearch(signal?: AbortSignal, opts?: { reset?: boolean }): Promise<void> {
    const reset = !!opts?.reset

    // prevent parallel fetches
    // (allow reset even if previous request is still "closing" due to abort)
    if (!reset && searchLoading) return
    if (!reset && !searchHasMore) return

    const q = searchQuery.trim()
    if (!q) return

    // request id to avoid out-of-order updates
    const reqId = ++searchReqIdRef.current

    try {
      setSearchLoading(true)

      const nextPage = reset ? 1 : searchPage
      const url = `${API_BASE}/getDrinkPage.php?page=${nextPage}&pageSize=${SEARCH_PAGE_SIZE}&search=${encodeURIComponent(
        q
      )}`

      const res = await fetch(url, {
        signal,
        // se bootstrap.php usa session cookie:
        credentials: "include",
        headers: { Accept: "application/json" },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "Errore API")

      // ignore stale requests
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

    // cancel previous list request
    searchAbortRef.current?.abort()

    if (!q) {
      setSearchResults([])
      setSearchPage(1)
      setSearchHasMore(true)
      setSearchLoading(false)

      // focus SOLO quando passi da non-vuoto -> vuoto
      if (prev.length > 0) {
        requestAnimationFrame(() => {
          headerSearchRef.current?.focus()
        })
      }

      return
    }

    const controller = new AbortController()
    searchAbortRef.current = controller

    // reset paging
    setSearchResults([])
    setSearchPage(1)
    setSearchHasMore(true)

    // micro debounce (evita spam su API mentre digiti)
    const t = window.setTimeout(() => {
      getDrinksSearch(controller.signal, { reset: true })
    }, 200)

    return () => {
      window.clearTimeout(t)
      controller.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  React.useEffect(() => {
    const el = searchMoreRef.current
    if (!el) return
    if (!searchOpen) return

    const obs = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (!first?.isIntersecting) return
        if (searchLoading) return
        if (!searchHasMore) return

        // load next page
        getDrinksSearch(searchAbortRef.current?.signal)
      },
      { rootMargin: "800px" } // load a bit before reaching the bottom
    )

    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchOpen, searchLoading, searchHasMore, searchPage])

  const closeSearch = () => setSearchQuery("")

  const onPickFromSearch = (drink: FavoriteDrinkModel) => {
    // seleziona drink e chiudi modal svuotando la query
    setSelectedDrink(drink)
    setSearchQuery("")
  }

  const clearSelectedDrink = () => {
    setSelectedDrink(null)
    // opzionale: rimetti focus sulla search header quando "clear"
    requestAnimationFrame(() => {
      headerSearchRef.current?.focus()
    })
  }

  const pad2 = (n: number) => String(n).padStart(2, "0")

  const initTempToNow = () => {
    const d = new Date()
    const yyyy = d.getFullYear()
    const mm = pad2(d.getMonth() + 1)
    const dd = pad2(d.getDate())
    const hh = pad2(d.getHours())
    const min = pad2(d.getMinutes())
    setTempDate(`${yyyy}-${mm}-${dd}`)
    setTempTime(`${hh}:${min}`)
  }

  const formatPretty = (iso: string) => {
    // iso: "YYYY-MM-DDTHH:MM"
    const [date, time] = iso.split("T")
    const [y, m, d] = date.split("-")
    return `${d}/${m}/${y} • ${time}`
  }

  const openTimePicker = () => {
    // se già settato, apri con quel valore; altrimenti con "adesso"
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

  const [showAllFavorites, setShowAllFavorites] = useState(false)

  // 3 su mobile, 10 da md in su
  const visibleFavorites = showAllFavorites ? drinks : drinks.slice(0, 3)
  const visibleFavoritesMdUp = showAllFavorites ? drinks : drinks.slice(0, 10)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhoto(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function addDrinkLogOnServer(payload: {
    drinkId: number
    quantity: number
    time: string // "" oppure "YYYY-MM-DDTHH:MM"
    notes?: string
    signal?: AbortSignal
  }) {
    const res = await fetch(`${API_BASE}/drink_log/addDrinkLog.php`, {
      method: "POST",
      signal: payload.signal,
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
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
    // per ora custom drink NO
    if (!selectedDrink?.id) return

    try {
      await addDrinkLogOnServer({
        drinkId: selectedDrink.id,
        quantity,
        time: selectedTime, // "" -> backend mette now()
        notes: note || undefined,
      })

      // reset UI
      setSelectedDrink(null)
      setQuantity(1)
      setSelectedTime("")
      setTempDate("")
      setTempTime("")
      setNote("")
      setShowNoteInput(false)

      // opzionale: ricarica lista preferiti (non necessario per il log, ma ok)
      // await getFavouriteDrinks()

      // feedback minimo
      // alert("Drink loggato ✅")
      console.log("Drink loggato ✅")
    } catch (e: any) {
      console.log(e)
      alert(e?.message || "Errore nel salvataggio")
    }
  }

  const canLog = showCustomDrink ? customDrinkName.length > 0 : selectedDrink !== null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 md:mt-14 bg-background/95 backdrop-blur-lg z-30 px-3 md:pt-3 pb-3 border-b border-white/5">
        {/* <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Log a Drink</h1>
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
            <Bell className="w-5 h-5 text-foreground-muted" />
          </button>
        </div> */}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
          <input
            ref={headerSearchRef}
            type="text"
            placeholder="Search tequila, beer, wine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-2xl py-3.5 pl-12 pr-12 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={closeSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* SEARCH MODAL / SHEET (apre solo quando scrivi) */}
      {searchOpen && (
        <>
          {/* backdrop */}
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm cursor-default"
            onClick={closeSearch}
            aria-label="Close search"
          />

          {/* sheet */}
          <div className="fixed inset-x-0 top-0 z-50 md:top-16 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[760px]">
            <div className="bg-background/95 backdrop-blur-lg border-b border-white/10 md:border md:rounded-3xl md:shadow-2xl overflow-hidden">
              {/* Search dentro modal (sembra “traslare”) */}
              <div className="p-3 border-b border-white/10">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search tequila, beer, wine..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-card rounded-2xl py-3.5 pl-12 pr-12 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-foreground-muted hover:text-foreground transition-colors"
                    aria-label="Clear search"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[70vh] md:max-h-[72vh] overflow-auto px-4 py-4">
                {searchResults.length === 0 && !searchLoading ? (
                  <div className="bg-card rounded-2xl p-8 text-center border border-white/5">
                    <p className="text-foreground-muted">No drinks found</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
                      {searchResults.map((drink) => (
                        <button
                          key={drink.id}
                          onClick={() => onPickFromSearch(drink)}
                          className={`relative bg-card rounded-2xl overflow-hidden transition-all ${
                            selectedDrink?.id === drink.id ? "ring-2 ring-primary" : ""
                          }`}
                        >
                          <div className="relative w-full aspect-[3/4] bg-white/5">
                            {drink.image ? (
                              <img
                                src={drink.image}
                                alt={drink.name}
                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                style={{ objectPosition: "50% 100%" }}
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-6xl opacity-70">
                                🍹
                              </div>
                            )}

                            {/* BOTTOM OVERLAY */}
                            <div className="absolute inset-x-0 bottom-0 z-10">
                              {/* 80% nero + 20% fading */}
                              <div className="absolute inset-x-0 bottom-0 h-[80%] bg-black" />
                              <div className="absolute inset-x-0 bottom-[80%] h-[20%] bg-gradient-to-t from-black to-transparent" />

                              {/* blocco contenuti: altezza fissa */}
                              <div className="relative px-4 h-16 flex items-center">
                                <div className="w-full flex gap-3">
                                  {/* NAME 75% - max 2 righe */}
                                  <p
                                    className="flex-[8] text-sm md:text-base font-medium tracking-wide text-white uppercase leading-snug pt-2"
                                    style={{
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {drink.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div ref={searchMoreRef} className="h-1" />

                    {searchLoading && (
                      <div className="mt-4 text-center text-sm text-foreground-muted">Loading more...</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <div className="px-4 py-4 mb-32">
        {/* <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowCustomDrink(false)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${!showCustomDrink ? "bg-primary text-background" : "bg-card text-foreground-muted"
              }`}
          >
            Favorites
          </button>
          <button
            onClick={() => setShowCustomDrink(true)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${showCustomDrink ? "bg-primary text-background" : "bg-card text-foreground-muted"
              }`}
          >
            <Sparkles className="w-4 h-4" />
            Custom Drink
          </button>
        </div> */}

        {!showCustomDrink ? (
          // NORMAL
          <>
            {/* SELECTED DRINK (quando selezionato nasconde Favorites e mostra solo lui) */}
            {selectedDrink ? (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Selected</h2>
                  <button onClick={clearSelectedDrink} className="text-sm text-primary font-medium nav-link">
                    Change
                  </button>
                </div>

                <button
                  onClick={clearSelectedDrink}
                  className="relative bg-card rounded-2xl overflow-hidden transition-all ring-2 ring-primary w-full"
                >
                  <div className="relative w-full aspect-[3/2] bg-white/5">
                    {selectedDrink.image ? (
                      <img
                        src={selectedDrink.image}
                        alt={selectedDrink.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        style={{ objectPosition: "50% 100%" }}
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-6xl opacity-70">
                        🍹
                      </div>
                    )}

                    {/* BOTTOM OVERLAY */}
                    <div className="absolute inset-x-0 bottom-0 z-10">
                      {/* 80% nero + 20% fading */}
                      <div className="absolute inset-x-0 bottom-0 h-[80%] bg-black" />
                      <div className="absolute inset-x-0 bottom-[80%] h-[20%] bg-gradient-to-t from-black to-transparent" />

                      {/* blocco contenuti: altezza fissa */}
                      <div className="relative px-4 h-16 flex items-center">
                        <div className="w-full flex gap-3">
                          {/* NAME 75% - max 2 righe */}
                          <p
                            className="flex-[8] text-base md:text-lg font-semibold tracking-wide text-white uppercase leading-snug pt-2"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {selectedDrink.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <>
                {/* Recent Favorites */}
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Favorites</h2>
                  <button
                    onClick={() => setShowAllFavorites(!showAllFavorites)}
                    className="text-sm text-primary font-medium nav-link"
                  >
                    {showAllFavorites ? "Show less" : "View all"}
                  </button>
                </div>

                {/* Mobile: 3 */}
                <div className="grid grid-cols-3 gap-3 mb-6 md:hidden">
                  {visibleFavorites.map((drink) => (
                    <button
                      key={drink.id}
                      onClick={() => setSelectedDrink(selectedDrink?.id === drink.id ? null : drink)}
                      className={`relative bg-card rounded-2xl overflow-hidden transition-all ${
                        selectedDrink?.id === drink.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="relative w-full aspect-[3/4] bg-white/5">
                        {drink.image ? (
                          <img
                            src={drink.image}
                            alt={drink.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            style={{ objectPosition: "50% 100%" }}
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-6xl opacity-70">
                            🍹
                          </div>
                        )}

                        {/* ❤️ HEART */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFavorite(drink.id)
                          }}
                          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 backdrop-blur border border-white/20 text-white hover:bg-black/70 transition-colors"
                          aria-label="Remove from favorites"
                          title="Remove from favorites"
                        >
                          <Heart size={18} className="fill-white" />
                        </button>

                        {/* BOTTOM OVERLAY */}
                        <div className="absolute inset-x-0 bottom-0 z-10">
                          {/* 80% nero + 20% fading */}
                          <div className="absolute inset-x-0 bottom-0 h-[80%] bg-black" />
                          <div className="absolute inset-x-0 bottom-[80%] h-[20%] bg-gradient-to-t from-black to-transparent" />

                          {/* blocco contenuti: altezza fissa */}
                          <div className="relative px-4 h-16 flex items-center">
                            <div className="w-full flex gap-3">
                              {/* NAME 75% - max 2 righe */}
                              <p
                                className="flex-[8] text-sm md:text-base font-medium tracking-wide text-white uppercase leading-snug pt-2"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {drink.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* md+: 8 */}
                <div className="hidden md:grid grid-cols-2 md:grid-cols-10 gap-3 mb-6">
                  {visibleFavoritesMdUp.map((drink) => (
                    <button
                      key={drink.id}
                      onClick={() => setSelectedDrink(selectedDrink?.id === drink.id ? null : drink)}
                      className={`relative bg-card rounded-2xl overflow-hidden transition-all ${
                        selectedDrink?.id === drink.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="relative w-full aspect-[3/4] bg-white/5">
                        {drink.image ? (
                          <img
                            src={drink.image}
                            alt={drink.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                            style={{ objectPosition: "50% 100%" }}
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-6xl opacity-70">
                            🍹
                          </div>
                        )}

                        {/* ❤️ HEART */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveFavorite(drink.id)
                          }}
                          className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/55 backdrop-blur border border-white/20 text-white hover:bg-black/70 transition-colors"
                          aria-label="Remove from favorites"
                          title="Remove from favorites"
                        >
                          <Heart size={18} className="fill-white" />
                        </button>

                        {/* BOTTOM OVERLAY */}
                        <div className="absolute inset-x-0 bottom-0 z-10">
                          {/* 80% nero + 20% fading */}
                          <div className="absolute inset-x-0 bottom-0 h-[80%] bg-black" />
                          <div className="absolute inset-x-0 bottom-[80%] h-[20%] bg-gradient-to-t from-black to-transparent" />

                          {/* blocco contenuti: altezza fissa */}
                          <div className="relative px-4 h-16 flex items-center">
                            <div className="w-full flex gap-3">
                              {/* NAME 75% - max 2 righe */}
                              <p
                                className="flex-[8] text-sm md:text-base font-medium tracking-wide text-white uppercase leading-snug pt-2"
                                style={{
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  overflow: "hidden",
                                }}
                              >
                                {drink.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          // CUSTOM
          <>
            <div className="bg-card rounded-2xl p-4 mb-6">
              <h3 className="font-semibold text-foreground mb-4">Create Custom Drink</h3>

              {/* Icon Selector */}
              <div className="mb-4">
                <label className="text-sm text-foreground-muted mb-2 block">Choose Icon</label>
                <div className="flex flex-wrap gap-2">
                  {drinkIcons.map((icon) => (
                    <button
                      key={icon}
                      onClick={() => setSelectedIcon(icon)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${
                        selectedIcon === icon ? "bg-primary/20 ring-2 ring-primary" : "bg-white/5"
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="mb-4">
                <label className="text-sm text-foreground-muted mb-2 block">Drink Name *</label>
                <input
                  type="text"
                  placeholder="Es: Negroni Sbagliato"
                  value={customDrinkName}
                  onChange={(e) => setCustomDrinkName(e.target.value)}
                  className="w-full bg-white/5 rounded-xl py-3 px-4 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              {/* Type Input */}
              <div>
                <label className="text-sm text-foreground-muted mb-2 block">Type (optional)</label>
                <input
                  type="text"
                  placeholder="Es: Cocktail, Beer, Wine..."
                  value={customDrinkType}
                  onChange={(e) => setCustomDrinkType(e.target.value)}
                  className="w-full bg-white/5 rounded-xl py-3 px-4 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
          </>
        )}

        {/* Details Section */}
        <h2 className="text-lg font-semibold text-foreground mb-1">Details</h2>

        <div className="space-y-3">
          {/* QTY */}
          <div className="bg-card rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-lg">🍺</span>
              </div>
              <div>
                <h3 className="font-medium text-foreground">Quantity</h3>
                {/* <p className="text-sm text-foreground-muted">How many drinks?</p> */}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={quantity}
                onChange={(e) => {
                  const val = Number(e.target.value)
                  if (!Number.isNaN(val)) {
                    setQuantity(Math.max(1, val))
                  }
                }}
                onBlur={() => {
                  if (!quantity || quantity < 1) setQuantity(1)
                }}
                className="w-10 text-center font-semibold text-foreground text-lg bg-transparent Focus:outline-none focus:ring-0 appearance-none"
              />

              {/* <span className="w-10 text-center font-semibold text-foreground text-lg">{quantity}</span> */}
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* FRIENDS */}
          {/* <div className="bg-card rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Friends</h3>
                <p className="text-sm text-foreground-muted">Who are you with?</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {friendsList.slice(0, 3).map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => toggleFriend(friend.id)}
                    className={`relative w-9 h-9 rounded-full border-2 overflow-hidden ${
                      selectedFriends.includes(friend.id) ? "border-primary" : "border-card"
                    }`}
                  >
                    <img src={friend.avatar || "/placeholder.svg"} alt={friend.name} className="object-cover" />
                    {selectedFriends.includes(friend.id) && (
                      <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center ml-2">
                <Plus className="w-4 h-4 text-foreground-muted" />
              </button>
            </div>
          </div> */}

          {/* TIME */}
          <div className="bg-card rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Time</h3>
                {/* <p className="text-sm text-foreground-muted">When did you drink this?</p> */}
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={openTimePicker}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  selectedTime ? "bg-white/10 text-foreground hover:bg-white/15" : "bg-primary/20 text-primary hover:bg-primary/25"
                }`}
              >
                {selectedTime ? formatPretty(selectedTime) : "Set"}
              </button>
              {timeOpen && (
                <>
                  {/* backdrop */}
                  <button
                    type="button"
                    className="fixed inset-0 z-30 cursor-default"
                    onClick={() => setTimeOpen(false)}
                    aria-label="Close time picker"
                  />

                  <div className="absolute right-0 bottom-full mb-2 w-72 z-40 rounded-2xl bg-card border border-white/10 shadow-xl overflow-hidden">
                    {/* <div className="absolute right-0 mt-2 w-72 z-40 rounded-2xl bg-card border border-white/10 shadow-xl overflow-hidden">  FARLO COMPARIRE SOTTO*/}
                    {/* body */}
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 rounded-xl p-2">
                          <label className="text-xs text-foreground-muted">Date</label>
                          <input
                            type="date"
                            value={tempDate}
                            onChange={(e) => setTempDate(e.target.value)}
                            className="mt-1 w-full bg-transparent text-sm text-foreground focus:outline-none"
                          />
                        </div>

                        <div className="bg-white/5 rounded-xl p-2">
                          <label className="text-xs text-foreground-muted">Time</label>
                          <input
                            type="time"
                            value={tempTime}
                            onChange={(e) => setTempTime(e.target.value)}
                            className="mt-1 w-full bg-transparent text-sm text-foreground focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* actions */}
                    <div className="p-3 border-t border-white/10 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setTimeOpen(false)}
                        className="flex-1 py-2 rounded-xl bg-white/10 text-foreground text-sm font-medium hover:bg-white/15 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={applyTime}
                        className="flex-1 py-2 rounded-xl bg-primary text-background text-sm font-semibold hover:bg-primary/90 transition"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* LOCATION */}
          {/* <div className="bg-card rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Location</h3>
                <p className="text-sm text-foreground-muted">Where are you?</p>
              </div>
            </div>
            <input
              type="text"
              placeholder="Tap to add"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="text-right bg-transparent text-foreground-muted text-sm focus:outline-none w-32"
            />
          </div> */}

          {/* NOTE */}
          <div className="bg-card rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <StickyNote className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Note</h3>
                  {/* <p className="text-sm text-foreground-muted">Add a memory</p> */}
                </div>
              </div>
              <button
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-foreground-muted text-sm"
              >
                {showNoteInput ? "Hide" : "Add"}
              </button>
            </div>
            {showNoteInput && (
              <textarea
                placeholder="Best cocktail ever! The bartender was amazing..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full bg-white/5 rounded-xl mt-3 p-4 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[80px] resize-none"
              />
            )}
          </div>

          {/* PHOTO */}
          {/* <div className="bg-card rounded-2xl p-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">Photo</h3>
                  <p className="text-sm text-foreground-muted">Capture the moment</p>
                </div>
              </div>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-foreground-muted text-sm flex items-center gap-2"
              >
                <ImageIcon className="w-4 h-4" />
                {photo ? "Change" : "Add"}
              </button>
            </div>
            {photo && (
              <div className="relative rounded-xl overflow-hidden">
                <img src={photo || "/placeholder.svg"} alt="Drink photo" className="w-full h-40 object-cover" />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div> */}
        </div>
      </div>

      {/* LOG DRINK */}
      <div className="fixed bottom-20 lg:bottom-6 left-0 right-0 px-4 lg:pl-68">
        <div className="max-w-md mx-auto lg:max-w-none">
          <button
            onClick={handleLogDrink}
            disabled={!canLog}
            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
              canLog ? "bg-primary text-background hover:bg-primary/90" : "bg-black/90 text-foreground-muted cursor-not-allowed"
            }`}
          >
            <Check className="w-5 h-5" />
            Log Drink
          </button>
        </div>
      </div>
    </div>
  )
}
