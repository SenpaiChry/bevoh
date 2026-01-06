"use client"

import type React from "react"

import { useState } from "react"
import { Settings, LogOut, Trophy, Calendar, Target, ChevronRight, Flame, Star, Award, Zap, Crown, Beer, Wine, GlassWater, Users, MapPin, Lock, } from "lucide-react"

import profilepic from "@/assets/drinks/male-avatar-cartoon.jpg"

interface ProfilePageProps {
  totalDrinks: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  unlocked: boolean
  unlockedDate?: string
  progress?: number
  maxProgress?: number
  rarity: "common" | "rare" | "epic" | "legendary"
}

interface Level {
  level: number
  title: string
  minXP: number
  maxXP: number
  icon: React.ReactNode
}

const levels: Level[] = [
  { level: 1, title: "Novizio", minXP: 0, maxXP: 100, icon: <GlassWater className="w-5 h-5" /> },
  { level: 2, title: "Appassionato", minXP: 100, maxXP: 250, icon: <Beer className="w-5 h-5" /> },
  { level: 3, title: "Intenditore", minXP: 250, maxXP: 500, icon: <Wine className="w-5 h-5" /> },
  { level: 4, title: "Esperto", minXP: 500, maxXP: 1000, icon: <Star className="w-5 h-5" /> },
  { level: 5, title: "Maestro", minXP: 1000, maxXP: 2000, icon: <Award className="w-5 h-5" /> },
  { level: 6, title: "Leggenda", minXP: 2000, maxXP: 5000, icon: <Crown className="w-5 h-5" /> },
]

const achievements: Achievement[] = [
  {
    id: "first_drink",
    name: "Prima Bevuta",
    description: "Registra il tuo primo drink",
    icon: <Beer className="w-6 h-6" />,
    unlocked: true,
    unlockedDate: "15 Dec 2024",
    rarity: "common",
  },
  {
    id: "party_starter",
    name: "Party Starter",
    description: "5 drink in una serata",
    icon: <Zap className="w-6 h-6" />,
    unlocked: true,
    unlockedDate: "20 Dec 2024",
    rarity: "common",
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    description: "Bevi con 10 amici diversi",
    icon: <Users className="w-6 h-6" />,
    unlocked: true,
    unlockedDate: "22 Dec 2024",
    rarity: "rare",
  },
  {
    id: "explorer",
    name: "Esploratore",
    description: "Visita 5 locali diversi",
    icon: <MapPin className="w-6 h-6" />,
    unlocked: true,
    unlockedDate: "24 Dec 2024",
    rarity: "rare",
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "7 giorni streak",
    icon: <Flame className="w-6 h-6" />,
    unlocked: false,
    progress: 5,
    maxProgress: 7,
    rarity: "epic",
  },
  {
    id: "cocktail_master",
    name: "Cocktail Master",
    description: "Prova 20 cocktail diversi",
    icon: <Wine className="w-6 h-6" />,
    unlocked: false,
    progress: 12,
    maxProgress: 20,
    rarity: "epic",
  },
  {
    id: "legend",
    name: "Leggenda",
    description: "Raggiungi il livello 6",
    icon: <Crown className="w-6 h-6" />,
    unlocked: false,
    rarity: "legendary",
  },
  {
    id: "century",
    name: "Centenario",
    description: "100 drink totali",
    icon: <Trophy className="w-6 h-6" />,
    unlocked: false,
    progress: 48,
    maxProgress: 100,
    rarity: "legendary",
  },
]

const getRarityColor = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "common":
      return "from-gray-400 to-gray-500"
    case "rare":
      return "from-blue-400 to-blue-600"
    case "epic":
      return "from-purple-400 to-purple-600"
    case "legendary":
      return "from-yellow-400 to-amber-500"
  }
}

const getRarityBg = (rarity: Achievement["rarity"]) => {
  switch (rarity) {
    case "common":
      return "bg-gray-500/20"
    case "rare":
      return "bg-blue-500/20"
    case "epic":
      return "bg-purple-500/20"
    case "legendary":
      return "bg-yellow-500/20"
  }
}

export default function ProfilePage({ totalDrinks }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<"stats" | "achievements" | "leaderboards">("stats")

  // Calculate user XP and level
  const userXP = 720
  const currentLevel = levels.find((l) => userXP >= l.minXP && userXP < l.maxXP) || levels[0]
  const nextLevel = levels[levels.indexOf(currentLevel) + 1]
  const xpProgress = nextLevel ? ((userXP - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100 : 100
  const currentStreak = 5

  const stats = [
    { label: "This Week", value: 12, icon: Calendar },
    { label: "This Month", value: 48, icon: Calendar },
    { label: "All Time", value: 234, icon: Trophy },
  ]

  const thematicLeaderboards = [
    { name: "Cocktail King", rank: 2, icon: "🍸", category: "Most cocktails" },
    { name: "Beer Baron", rank: 5, icon: "🍺", category: "Most beers" },
    { name: "Night Owl", rank: 1, icon: "🦉", category: "Late night drinks" },
    { name: "Social Star", rank: 3, icon: "⭐", category: "Drinks with friends" },
  ]

  return (
    <div className="min-h-screen bg-background p-3 lg:px-10">
      {/* Header */}
      {/* <header className="px-5 pt-6 pb-4 lg:px-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>
          <button className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
            <Settings className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>
      </header> */}

      {/* <main className="pt-2 px-5 pb-24 lg:px-8"> */}
        {/* Profile Card with Level */}
        <div className="bg-card rounded-3xl p-3 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-200 overflow-hidden ring-2 ring-primary/30">
                <img
                  src={profilepic}
                  alt="User avatar"
                  width={65}
                  height={65}
                  className="object-cover"
                />
              </div>
              {/* Level Badge */}
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-background font-bold text-sm">
                {currentLevel.level}
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">Alex Johnson</h2>
              <p className="text-foreground-muted">@alexj</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-primary font-medium">{currentLevel.title}</span>
                <span className="text-foreground-muted">•</span>
                <span className="text-sm text-foreground-muted">Rank #4</span>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-foreground-muted">Level {currentLevel.level}</span>
              <span className="text-primary font-medium">{userXP} XP</span>
              {nextLevel && <span className="text-foreground-muted">Level {nextLevel.level}</span>}
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            {nextLevel && (
              <p className="text-xs text-foreground-muted mt-1 text-right">
                {nextLevel.minXP - userXP} XP to {nextLevel.title}
              </p>
            )}
          </div>

          {/* Streak */}
          <div className="flex items-center justify-between bg-orange-500/10 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{currentStreak} Day Streak</p>
                <p className="text-sm text-foreground-muted">Keep it going!</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-8 rounded-full ${i < currentStreak ? "bg-orange-500" : "bg-white/10"}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(["stats", "achievements", "leaderboards"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab ? "bg-primary text-background" : "bg-card text-foreground-muted"
              }`}
            >
              {tab === "stats" ? "Stats" : tab === "achievements" ? "Achievements" : "Rankings"}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {activeTab === "stats" && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="bg-card rounded-2xl p-4 text-center">
                    <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-foreground-muted">{stat.label}</p>
                  </div>
                )
              })}
            </div>

            {/* Tonight */}
            <div className="bg-card rounded-2xl p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Tonight</p>
                  <p className="text-sm text-foreground-muted">{totalDrinks} drinks so far</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-foreground-muted" />
            </div>
          </>
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-foreground-muted text-sm">
                {achievements.filter((a) => a.unlocked).length}/{achievements.length} Unlocked
              </p>
            </div>

            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-card rounded-2xl p-4 ${!achievement.unlocked ? "opacity-60" : ""}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      achievement.unlocked
                        ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} text-white`
                        : "bg-white/10 text-foreground-muted"
                    }`}
                  >
                    {achievement.unlocked ? achievement.icon : <Lock className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{achievement.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${getRarityBg(achievement.rarity)}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-muted">{achievement.description}</p>

                    {/* Progress bar for locked achievements */}
                    {!achievement.unlocked && achievement.progress !== undefined && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} rounded-full`}
                            style={{ width: `${(achievement.progress / (achievement.maxProgress || 1)) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-foreground-muted mt-1">
                          {achievement.progress}/{achievement.maxProgress}
                        </p>
                      </div>
                    )}

                    {achievement.unlocked && achievement.unlockedDate && (
                      <p className="text-xs text-primary mt-1">Unlocked {achievement.unlockedDate}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Leaderboards Tab */}
        {activeTab === "leaderboards" && (
          <div className="space-y-3">
            <p className="text-foreground-muted text-sm mb-2">Your rankings in different categories</p>

            {thematicLeaderboards.map((board) => (
              <div key={board.name} className="bg-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl">
                    {board.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{board.name}</p>
                    <p className="text-sm text-foreground-muted">{board.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${board.rank <= 3 ? "text-primary" : "text-foreground"}`}>
                    #{board.rank}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Menu Items */}
        <div className="space-y-2 mt-6">
          {[
            { label: "Edit Profile", icon: Settings },
            { label: "Notification Settings", icon: Settings },
            { label: "Privacy", icon: Settings },
          ].map((item) => {
            const Icon = item.icon
            return (
              <button key={item.label} className="w-full bg-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-foreground-muted" />
                  <span className="text-foreground">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-foreground-muted" />
              </button>
            )
          })}

          <button className="w-full bg-red-500/10 rounded-2xl p-4 flex items-center gap-3 mt-4">
            <LogOut className="w-5 h-5 text-red-400" />
            <span className="text-red-400">Log Out</span>
          </button>
        </div>
      {/* </main> */}
    </div>
  )
}
