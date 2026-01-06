"use client"

import React from "react"
import { useState, useRef } from "react"
import { Search, Heart, Minus, Plus, Clock, Check, StickyNote } from "lucide-react"
import { getFavouriteDrinks } from "./ReadData"
import { FavoriteDrinkModel } from "./models/add-drink-models"

interface LogDrinkPageProps {
  onLogDrink: (drink: {
    name: string
    type: string
    quantity: number
    // friends: string[]
    time: string
    // location?: string
    note?: string
    // photo?: string
  }) => void
  onBack: () => void
}

const drinkIcons = ["🍺", "🍻", "🍷", "🍸", "🥃", "🍹", "🥂", "🍾", "🧉", "☕"]

export default function AddDrinkPage({ onLogDrink, onBack }: LogDrinkPageProps) {

  const [drinks, setDrinks] = useState<FavoriteDrinkModel[]>([])

  React.useEffect(() => {
    setDrinks(getFavouriteDrinks())
  }, [])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDrink, setSelectedDrink] = useState<FavoriteDrinkModel>(null)
  const [quantity, setQuantity] = useState(1)
  const [selectedFriends, setSelectedFriends] = useState<number[]>([])
  // const [selectedTime, setSelectedTime] = useState("now")
  const [location, setLocation] = useState("")
  const [favorites, setFavorites] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])
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
  const visibleFavorites = showAllFavorites
    ? drinks
    : drinks.slice(0, 3)

  const visibleFavoritesMdUp = showAllFavorites
    ? drinks
    : drinks.slice(0, 10)


  const toggleFavorite = (id: number) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

  const toggleFriend = (id: number) => {
    setSelectedFriends((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
  }

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

  const handleLogDrink = () => {
    const drinkToLog = showCustomDrink ? { name: customDrinkName, type: customDrinkType || "Custom" } : selectedDrink

    if (!drinkToLog || !drinkToLog.name) return

    onLogDrink({
      name: drinkToLog.name,
      type: drinkToLog.type,
      quantity,
      // friends: selectedFriends.map((id) => friendsList.find((f) => f.id === id)?.name || ""),
      time: selectedTime,
      // location: location || undefined,
      note: note || undefined,
      // photo: photo || undefined,
    })
  }

  const canLog = showCustomDrink ? customDrinkName.length > 0 : selectedDrink !== null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 md:mt-14 bg-background/95 backdrop-blur-lg z-20 px-3 md:pt-3 pb-3 border-b border-white/5">
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
            type="text"
            placeholder="Search tequila, beer, wine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card rounded-2xl py-3.5 pl-12 pr-12 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="px-4 py-4">
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
            {/* Recent Favorites */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Favorites</h2>
              <button onClick={() => setShowAllFavorites(!showAllFavorites)} className="text-sm text-primary font-medium nav-link">
                {showAllFavorites ? "Show less" : "View all"}
              </button>
            </div>

            {/* Mobile: 3 */}
            <div className="grid grid-cols-3 gap-3 mb-6 md:hidden">
              {visibleFavorites.map((drink) => (
                <button
                  key={drink.id}
                  onClick={() => setSelectedDrink(selectedDrink?.id === drink.id ? null : drink)}
                  className={`relative bg-card rounded-2xl overflow-hidden transition-all ${selectedDrink?.id === drink.id ? "ring-2 ring-primary" : ""}`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(drink.id) }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10 ${favorites.includes(drink.id) ? "bg-primary" : "bg-black/40 backdrop-blur-sm"}`}
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(drink.id) ? "text-background fill-background" : "text-white"}`} />
                  </button>

                  {selectedDrink?.id === drink.id && (
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="w-4 h-4 text-background" />
                    </div>
                  )}

                  <div className="aspect-square relative">
                    <img src={drink.image || "/placeholder.svg"} alt={drink.name} className="object-cover" />
                  </div>
                  <div className="p-3 text-left">
                    <h3 className="font-semibold text-foreground">{drink.name}</h3>
                    <p className="text-sm text-foreground-muted">{drink.type}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* md+: 8 */}
            <div className="hidden md:grid md:grid-cols-10 gap-3 mb-6">
              {visibleFavoritesMdUp.map((drink) => (
                <button
                  key={drink.id}
                  onClick={() => setSelectedDrink(selectedDrink?.id === drink.id ? null : drink)}
                  className={`relative bg-card rounded-2xl overflow-hidden transition-all ${selectedDrink?.id === drink.id ? "ring-2 ring-primary" : ""}`}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(drink.id) }}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10 ${favorites.includes(drink.id) ? "bg-primary" : "bg-black/40 backdrop-blur-sm"}`}
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(drink.id) ? "text-background fill-background" : "text-white"}`} />
                  </button>

                  {selectedDrink?.id === drink.id && (
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="w-4 h-4 text-background" />
                    </div>
                  )}

                  <div className="aspect-square relative">
                    <img src={drink.image || "/placeholder.svg"} alt={drink.name} className="object-cover" />
                  </div>
                  <div className="p-3 text-left">
                    <h3 className="font-semibold text-foreground">{drink.name}</h3>
                    <p className="text-sm text-foreground-muted">{drink.type}</p>
                  </div>
                </button>
              ))}
            </div>
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
                    <button key={icon} onClick={() => setSelectedIcon(icon)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${selectedIcon === icon ? "bg-primary/20 ring-2 ring-primary" : "bg-white/5"}`}
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
              <input type="number" inputMode="numeric" min={1} value={quantity}
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
                className={`px-3 py-1.5 rounded-lg text-sm transition ${selectedTime ? "bg-white/10 text-foreground hover:bg-white/15" : "bg-primary/20 text-primary hover:bg-primary/25"
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
      <div className="fixed bottom-4 lg:bottom-6 left-0 right-0 px-4 lg:pl-68">
        <div className="max-w-md mx-auto lg:max-w-none">
          <button
            onClick={handleLogDrink}
            disabled={!canLog}
            className={`w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${canLog
              ? "bg-primary text-background hover:bg-primary/90"
              : "bg-black/90 text-foreground-muted cursor-not-allowed"
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
