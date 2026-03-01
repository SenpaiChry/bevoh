import { useState } from "react"
import { Trophy, Medal, TrendingUp, Calendar } from "lucide-react"
import { LeaderboardEntry } from "../models/leaderboard-models"
import React from "react"
import { getLeaderboard } from "./ReadData"

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  React.useEffect(() => {
    setLeaderboard(getLeaderboard())
  }, [])
  
  const [period, setPeriod] = useState<"week" | "month">("week")

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-400" />
      case 2: return <Medal className="w-6 h-6 text-gray-300" />
      case 3: return <Medal className="w-6 h-6 text-amber-600" />
      default: return <span className="w-6 h-6 flex items-center justify-center text-foreground-muted font-bold">{rank}</span>
    }
  }

  const sortedLeaderboard = [...leaderboard].sort((a, b) =>
    period === "week" ? b.drinksWeek - a.drinksWeek : b.drinksMonth - a.drinksMonth,
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background z-10 px-5 pt-6 pb-4 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>

        {/* Period Toggle */}
        <div className="flex gap-2 bg-card rounded-2xl p-1">
          <button
            onClick={() => setPeriod("week")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              period === "week" ? "bg-primary text-background" : "text-foreground-muted"
            }`}
          >
            <Calendar className="w-4 h-4" />
            This Week
          </button>
          <button
            onClick={() => setPeriod("month")}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              period === "month" ? "bg-primary text-background" : "text-foreground-muted"
            }`}
          >
            <Calendar className="w-4 h-4" />
            This Month
          </button>
        </div>
      </header>

      {/* Top 3 Podium */}
      <div className="mt-8 px-5 lg:px-8 mb-6">
        <div className="flex items-end justify-center gap-4">
          {/* 2nd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden mb-2 ring-4 ring-gray-400">
              <img
                src={sortedLeaderboard[1]?.avatar}
                alt={sortedLeaderboard[1]?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold text-foreground text-center">
              {sortedLeaderboard[1]?.name.split(" ")[0]}
            </p>
            <div className="bg-gray-400 text-background font-bold text-lg px-4 py-2 rounded-xl mt-2">
              {period === "week" ? sortedLeaderboard[1]?.drinksWeek : sortedLeaderboard[1]?.drinksMonth}
            </div>
          </div>

          {/* 1st Place */}
          <div className="flex flex-col items-center -mt-6">
            <div className="w-20 h-20 rounded-full bg-gray-300 overflow-hidden mb-2 ring-4 ring-yellow-400">
              <img
                src={sortedLeaderboard[0]?.avatar}
                alt={sortedLeaderboard[0]?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <Trophy className="w-6 h-6 text-yellow-400 -mt-1 mb-1" />
            <p className="text-sm font-semibold text-foreground text-center">
              {sortedLeaderboard[0]?.name.split(" ")[0]}
            </p>
            <div className="bg-yellow-400 text-background font-bold text-lg px-4 py-2 rounded-xl mt-2">
              {period === "week" ? sortedLeaderboard[0]?.drinksWeek : sortedLeaderboard[0]?.drinksMonth}
            </div>
          </div>

          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden mb-2 ring-4 ring-amber-600">
              <img
                src={sortedLeaderboard[2]?.avatar}
                alt={sortedLeaderboard[2]?.name}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-sm font-semibold text-foreground text-center">
              {sortedLeaderboard[2]?.name.split(" ")[0]}
            </p>
            <div className="bg-amber-600 text-background font-bold text-lg px-4 py-2 rounded-xl mt-2">
              {period === "week" ? sortedLeaderboard[2]?.drinksWeek : sortedLeaderboard[2]?.drinksMonth}
            </div>
          </div>
        </div>
      </div>

      {/* Full List */}
      <main className="px-5 pb-24 lg:px-8">
        <div className="space-y-3">
          {sortedLeaderboard.slice(3).map((entry) => (
            <div
              key={entry.id}
              className={`rounded-2xl p-4 flex items-center justify-between ${
                entry.isCurrentUser ? "bg-primary/10 border border-primary/30" : "bg-card"
              }`}
            >
              <div className="flex items-center gap-4">
                {getRankIcon(entry.rank)}
                <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                  <img
                    src={entry.avatar}
                    alt={entry.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className={`font-semibold ${entry.isCurrentUser ? "text-primary" : "text-foreground"}`}>
                    {entry.name} {entry.isCurrentUser && "(You)"}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    {period === "week" ? entry.drinksWeek : entry.drinksMonth} drinks
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
