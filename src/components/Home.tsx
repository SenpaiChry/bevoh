import { Bell, RotateCcw, Trash2, MapPin } from "lucide-react"
import SafetyCard from "./SafetyCard"
import { DrinkLog } from "../models/home-models"

import pic from "../assets/drinks/male-avatar-1.png"

interface HomePageProps {
  tonightDrinks: DrinkLog[]
  totalDrinks: number
  onRemoveDrink: (id: number) => void
  onResetNight: () => void
  onQuickAdd: () => void
}

export default function HomePage({
  tonightDrinks,
  totalDrinks,
  onRemoveDrink,
  onResetNight,
  onQuickAdd,
}: HomePageProps) {
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60)
    if (diff < 1) return "Just now"
    if (diff < 60) return `${diff}m ago`
    return `${Math.floor(diff / 60)}h ago`
  }

  const getDrinkLevel = () => {
    if (totalDrinks === 0) return { label: "Sober", color: "text-foreground-muted" }
    if (totalDrinks <= 2) return { label: "Warming up", color: "text-primary" }
    if (totalDrinks <= 4) return { label: "Feeling good", color: "text-yellow-400" }
    if (totalDrinks <= 6) return { label: "Party mode", color: "text-orange-400" }
    return { label: "Legend", color: "text-red-400" }
  }

  const level = getDrinkLevel()
  const firstDrinkTime = tonightDrinks.length > 0 ? tonightDrinks[tonightDrinks.length - 1].timestamp : undefined

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 lg:px-8 lg:pt-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-200 overflow-hidden">
              <img src={pic} alt="User avatar" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-foreground-muted text-sm">Good Evening</p>
              <p className="text-foreground font-semibold">Alex Johnson</p>
            </div>
          </div>
          <div className="flex gap-2">
            {totalDrinks > 0 && (
              <button
                onClick={onResetNight}
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center"
                title="Reset night"
              >
                <RotateCcw className="w-5 h-5 text-foreground-muted" />
              </button>
            )}
            <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
              <Bell className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-5 lg:px-8">
        {/* Tonight Stats Card */}
        <section className="bg-card rounded-3xl p-6 mb-4">
          <div className="text-center mb-6">
            <p className="text-foreground-muted text-sm mb-2">Tonight</p>
            <div className="text-7xl font-bold text-foreground mb-2">{totalDrinks}</div>
            <p className={`text-lg font-medium ${level.color}`}>{level.label}</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {tonightDrinks.filter((d) => d.name === "Beer").length}
              </p>
              <p className="text-xs text-foreground-muted">Beers</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {
                  tonightDrinks.filter((d) =>
                    ["Cocktail", "Mojito", "Spritz", "Margarita", "Gin Tonic"].includes(d.name),
                  ).length
                }
              </p>
              <p className="text-xs text-foreground-muted">Cocktails</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">
                {tonightDrinks.filter((d) => ["Shot", "Whiskey", "Vodka"].includes(d.name)).length}
              </p>
              <p className="text-xs text-foreground-muted">Shots</p>
            </div>
          </div>
        </section>

        <SafetyCard totalDrinks={totalDrinks} firstDrinkTime={firstDrinkTime} />

        {/* Desktop Quick Add */}
        <button
          onClick={onQuickAdd}
          className="hidden lg:flex w-full bg-primary/10 hover:bg-primary/20 border-2 border-dashed border-primary/50 rounded-2xl p-6 items-center justify-center gap-3 transition-colors my-4"
        >
          <span className="text-3xl">+</span>
          <span className="text-lg font-semibold text-primary">Add a drink</span>
        </button>

        {/* Drink History */}
        <section className="mt-4">
          <h2 className="text-xl font-bold text-foreground mb-4">Tonight's Log</h2>

          {tonightDrinks.length === 0 ? (
            <div className="bg-card rounded-2xl p-8 text-center">
              <div className="text-5xl mb-4">🍻</div>
              <p className="text-foreground-muted">No drinks yet tonight</p>
              <p className="text-sm text-foreground-muted/70">Tap + to start tracking</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tonightDrinks.map((drink) => (
                <div key={drink.id} className="bg-card rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{drink.icon}</span>
                    <div>
                      <p className="font-semibold text-foreground">{drink.name}</p>
                      <div className="flex items-center gap-2 text-sm text-foreground-muted">
                        <span>{getTimeAgo(drink.timestamp)}</span>
                        {drink.location && (
                          <>
                            <span>•</span>
                            <MapPin className="w-3 h-3" />
                            <span>{drink.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onRemoveDrink(drink.id)}
                    className="w-8 h-8 rounded-full bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-foreground-muted hover:text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
