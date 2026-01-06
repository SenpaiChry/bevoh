"use client"

import { useState } from "react"
import { MapPin, ChevronRight, Filter, Clock, TrendingUp } from "lucide-react"
import { DrinkSession } from "./models/history-models"
import React from "react"
import { getHistory } from "./ReadData"

const monthlyStats = {
  totalDrinks: 48,
  totalSessions: 12,
  avgPerSession: 4,
  favoriteDrink: "Aperol Spritz",
  favoriteLocation: "Sky Lounge",
}

export default function HistoryPage() {
  const [history, setHistory] = useState<DrinkSession[]>([])

  React.useEffect(() => {
    setHistory(getHistory())
  }, [])
  
  const [selectedSession, setSelectedSession] = useState<DrinkSession | null>(null)
  const [filterPeriod, setFilterPeriod] = useState<"week" | "month" | "all">("month")

  if (selectedSession) {
    return (
      <div className="min-h-screen bg-background">
        {/* Session Detail Header */}
        <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 px-5 pt-6 pb-4 border-b border-white/5">
          <button onClick={() => setSelectedSession(null)} className="flex items-center gap-2 text-primary mb-4">
            <ChevronRight className="w-5 h-5 rotate-180" />
            <span>Back to History</span>
          </button>
          <h1 className="text-2xl font-bold text-foreground">{selectedSession.dateLabel}</h1>
          <p className="text-foreground-muted">{selectedSession.date}</p>
        </header>

        <main className="px-5 pb-24 pt-4">
          {/* Session Summary Card */}
          <div className="bg-card rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{selectedSession.totalDrinks}</p>
                <p className="text-xs text-foreground-muted">Drinks</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{selectedSession.duration}</p>
                <p className="text-xs text-foreground-muted">Duration</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{selectedSession.friends.length}</p>
                <p className="text-xs text-foreground-muted">Friends</p>
              </div>
            </div>

            {selectedSession.location && (
              <div className="flex items-center gap-2 text-foreground-muted pt-4 border-t border-white/5">
                <MapPin className="w-4 h-4" />
                <span>{selectedSession.location}</span>
              </div>
            )}

            {selectedSession.highlights && (
              <div className="mt-3 px-3 py-2 bg-primary/10 rounded-xl text-primary text-sm">
                {selectedSession.highlights}
              </div>
            )}
          </div>

          {/* Friends Present */}
          {selectedSession.friends.length > 0 && (
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">With Friends</h3>
              <div className="flex gap-3">
                {selectedSession.friends.map((friend, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full overflow-hidden mb-1">
                      <img
                        src={friend.avatar || "/placeholder.svg"}
                        alt={friend.name}
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs text-foreground-muted">{friend.name}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Drink Timeline */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-3">Timeline</h3>
            <div className="space-y-3">
              {selectedSession.drinks.map((drink, i) => (
                <div key={i} className="bg-card rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{drink.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{drink.name}</p>
                      <p className="text-sm text-foreground-muted">x{drink.quantity}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-foreground-muted">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{drink.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-lg z-10 px-5 pt-6 pb-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">History</h1>
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
            <Filter className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>

        {/* Period Filter */}
        <div className="flex gap-2">
          {(["week", "month", "all"] as const).map((period) => (
            <button
              key={period}
              onClick={() => setFilterPeriod(period)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filterPeriod === period ? "bg-primary text-background" : "bg-card text-foreground-muted"
              }`}
            >
              {period === "week" ? "This Week" : period === "month" ? "This Month" : "All Time"}
            </button>
          ))}
        </div>
      </header>

      <main className="px-5 pb-24 pt-4">
        {/* Monthly Stats */}
        <div className="bg-card rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Monthly Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-2xl font-bold text-foreground">{monthlyStats.totalDrinks}</p>
              <p className="text-xs text-foreground-muted">Total Drinks</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-2xl font-bold text-foreground">{monthlyStats.totalSessions}</p>
              <p className="text-xs text-foreground-muted">Sessions</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-2xl font-bold text-primary">{monthlyStats.favoriteDrink}</p>
              <p className="text-xs text-foreground-muted">Favorite Drink</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-2xl font-bold text-foreground">{monthlyStats.avgPerSession}</p>
              <p className="text-xs text-foreground-muted">Avg per Session</p>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        <h3 className="text-lg font-semibold text-foreground mb-3">Recent Sessions</h3>
        <div className="space-y-3">
          {history.map((session) => (
            <button
              key={session.id}
              onClick={() => setSelectedSession(session)}
              className="w-full bg-card rounded-2xl p-4 text-left hover:bg-card/80 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-foreground">{session.dateLabel}</p>
                  <div className="flex items-center gap-2 text-sm text-foreground-muted">
                    {session.location && (
                      <>
                        <MapPin className="w-3 h-3" />
                        <span>{session.location}</span>
                        <span>•</span>
                      </>
                    )}
                    <Clock className="w-3 h-3" />
                    <span>{session.duration}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{session.totalDrinks}</p>
                  <p className="text-xs text-foreground-muted">drinks</p>
                </div>
              </div>

              {/* Drink Icons */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {session.drinks.slice(0, 5).map((drink, i) => (
                    <span key={i} className="text-xl">
                      {drink.icon}
                    </span>
                  ))}
                  {session.drinks.length > 5 && (
                    <span className="text-foreground-muted text-sm ml-1">+{session.drinks.length - 5}</span>
                  )}
                </div>

                {/* Friend Avatars */}
                {session.friends.length > 0 && (
                  <div className="flex -space-x-2">
                    {session.friends.slice(0, 3).map((friend, i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-card overflow-hidden">
                        <img
                          src={friend.avatar || "/placeholder.svg"}
                          alt={friend.name}
                          width={28}
                          height={28}
                          className="object-cover"
                        />
                      </div>
                    ))}
                    {session.friends.length > 3 && (
                      <div className="w-7 h-7 rounded-full border-2 border-card bg-white/10 flex items-center justify-center text-xs text-foreground-muted">
                        +{session.friends.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  )
}
