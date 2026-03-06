import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { Settings, LogOut, Trophy, Calendar, ChevronRight, Flame, Star, Award, Zap, Crown, Beer, Wine, GlassWater, Users, MapPin, X } from "lucide-react"
import profilepic from "@/assets/drinks/male-avatar-cartoon.jpg"
import { UserEditModel, UserModel } from "@/models/auth-models"
import { loadMe } from "@/controllers/UserController"
import SafetyCard from "@/components/SafetyCard"
import { logout } from "@/controllers/UserController"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"

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

type DrinkLogsStatsResponse =
  | {
    ok: true
    range: string
    fromDate: string | null
    total: number
    counts: {
      cocktail: number
      beer: number
      shot: number
      wine: number
      other: number
    }
  }
  | { ok: false; error: string }

const API_BASE = "https://bevoh.altervista.org/api"

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

const AVATAR_PRESETS = [
  "/assets/avatars/female_1.png",
  "/assets/avatars/female_2.png",
  "/assets/avatars/male_1.png",
  "/assets/avatars/male_2.png",
] as const


export default function ProfilePage() {
  const navigate = useNavigate()

  const RANGE_TABS = [
    { key: "24h", label: "24hr" },
    { key: "7d", label: "week" },
    { key: "month", label: "month" },
    { key: "all", label: "all time" },
  ] as const

  type RangeKey = (typeof RANGE_TABS)[number]["key"]

  const [rangeIdx, setRangeIdx] = useState(0)
  const activeRange = RANGE_TABS[rangeIdx].key

  const [rangeTotal, setRangeTotal] = useState(0)
  const [rangeCounts, setRangeCounts] = useState({
    cocktail: 0,
    beer: 0,
    shot: 0,
    wine: 0,
    other: 0,
  })

  useEffect(() => {
    const controller = new AbortController()

      ; (async () => {
        try {
          const stats = await fetchDrinkLogsStats(activeRange, controller.signal)

          setRangeTotal(Number(stats.total ?? 0))
          setRangeCounts({
            cocktail: Number(stats.counts?.cocktail ?? 0),
            beer: Number(stats.counts?.beer ?? 0),
            shot: Number(stats.counts?.shot ?? 0),
            wine: Number(stats.counts?.wine ?? 0),
            other: Number(stats.counts?.other ?? 0),
          })
        } catch (e: any) {
          if (e?.name !== "AbortError") console.log(e?.message || "Errore stats range")
          setRangeTotal(0)
          setRangeCounts({ cocktail: 0, beer: 0, shot: 0, wine: 0, other: 0 })
        } finally { }
      })()

    return () => controller.abort()
  }, [activeRange])

  const [activeTab, setActiveTab] = useState<"stats" | "achievements">("stats")

  const [showEditProfile, setShowEditProfile] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  async function fetchDrinkLogsStats(range: RangeKey, signal?: AbortSignal) {
    const url = `${API_BASE}/drink_log/getDrinkLogsStats.php?range=${range}`

    const res = await fetch(url, {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    })

    const text = await res.text()
    if (!text.trim()) throw new Error(`Empty stats response (HTTP ${res.status})`)

    const json: DrinkLogsStatsResponse = JSON.parse(text)

    if (!res.ok || !json.ok) {
      throw new Error("error" in json ? json.error : `HTTP ${res.status}`)
    }

    return json
  }

  const [form, setForm] = useState<UserEditModel>(new UserEditModel(0, "", "", "", "", "", "", null, ""));

  const [me, setMe] = useState<UserModel | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [meError, setMeError] = useState<string | null>(null)

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  useEffect(() => {
    if (!me) return

    setForm({
      Id: me.Id ?? 0,
      Name: me.Name ?? "",
      Surname: me.Surname ?? "",
      BirthDate: me.BirthDate ? String(me.BirthDate).slice(0, 10) : "",
      Weight: me.Weight != null ? String(me.Weight) : "",
      Height: me.Height != null ? String(me.Height) : "",
      Sex: (me.Sex ?? "") as any,
      Bio: me.Bio != null ? String(me.Bio) : "",
      ImageUrl: me.ImageUrl ?? "",
    })
  }, [me])

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((p) => ({ ...p, [key]: value }))
  }

  async function handleSaveProfile() {
    try {
      setEditLoading(true)
      setEditError(null)

      const payload = {
        Name: form.Name.trim(),
        Surname: form.Surname.trim(),
        BirthDate: form.BirthDate ? form.BirthDate : null,
        Weight: form.Weight !== "" ? Number(form.Weight) : null,
        Height: form.Height !== "" ? Number(form.Height) : null,
        Sex: form.Sex,
        Bio: form.Bio !== "" ? form.Bio : null,
        ImageUrl: form.ImageUrl ? form.ImageUrl : null,
      }

      if (!payload.Name) throw new Error("Name obbligatorio")
      if (!payload.Surname) throw new Error("Surname obbligatorio")
      if (payload.Weight != null && (Number.isNaN(payload.Weight) || payload.Weight <= 0)) throw new Error("Weight non valido")
      if (payload.Height != null && (Number.isNaN(payload.Height) || payload.Height <= 0)) throw new Error("Height non valido")

      const res = await fetch(`${API_BASE}/auth/update_profile.php`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      if (!text.trim()) throw new Error(`Empty response (HTTP ${res.status})`)
      const json = JSON.parse(text)

      if (!res.ok || json?.ok === false) throw new Error(json?.error || "Update failed")

      const meRes = await fetch(`${API_BASE}/auth/me.php`, {
        credentials: "include",
        headers: { Accept: "application/json" },
      })
      const meText = await meRes.text()
      const meJson = JSON.parse(meText)
      if (meRes.ok && meJson?.ok) setMe(meJson.user)

      setShowEditProfile(false)
    } catch (e: any) {
      setEditError(e?.message || "Errore salvataggio")
    } finally {
      setEditLoading(false)
    }
  }

  // CARICAMENTO USER
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setMeLoading(true);
      setMeError(null);

      try {
        const user = await loadMe();
        if (!cancelled) setMe(user);
      } catch (e: any) {
        if (!cancelled) setMeError(e?.message || "Errore profilo");
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const queryClient = useQueryClient()
  async function handleLogout() {
    try {
      setLogoutLoading(true)
      setLogoutError(null)
      await logout()
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      navigate("/auth", { replace: true })
    } catch (e: any) {
      setLogoutError(e?.message || "Errore logout")
    } finally {
      setLogoutLoading(false)
    }
  }

  const profileName = useMemo(() => {
    if (!me) return "Alex Johnson"
    const full = `${me.Name ?? ""} ${me.Surname ?? ""}`.trim()
    return full || me.Username || "User"
  }, [me])

  const profileHandle = useMemo(() => {
    if (!me) return "@alexj"
    return me.Username ? `@${me.Username}` : "@user"
  }, [me])

  const [statsTotals, setStatsTotals] = useState({
    last24h: 0,
    week: 0,
    month: 0,
    all: 0,
  })

  async function fetchTotal(range: "24h" | "7d" | "month" | "all", signal?: AbortSignal) {
    const res = await fetch(`${API_BASE}/drink_log/getDrinkLogsStats.php?range=${range}`, {
      credentials: "include",
      headers: { Accept: "application/json" },
      signal,
    })

    const text = await res.text()
    if (!text.trim()) throw new Error(`Empty response (HTTP ${res.status})`)
    const json: DrinkLogsStatsResponse = JSON.parse(text)

    if (!res.ok || !json.ok) throw new Error("error" in json ? json.error : `HTTP ${res.status}`)

    return Number(json.total ?? 0)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function loadStats() {
      try {
        const [a, b, c, d] = await Promise.all([
          fetchTotal("24h", controller.signal),
          fetchTotal("7d", controller.signal),
          fetchTotal("month", controller.signal),
          fetchTotal("all", controller.signal),
        ])

        setStatsTotals({ last24h: a, week: b, month: c, all: d })
      } catch (e: any) {
        if (e?.name !== "AbortError") console.log(e?.message || "Errore stats")
      } finally { }
    }

    loadStats()
    return () => controller.abort()
  }, [API_BASE])

  const stats = [
    { label: "Last 24 Hr", value: statsTotals.last24h, icon: Calendar },
    { label: "This Week", value: statsTotals.week, icon: Calendar },
    { label: "This Month", value: statsTotals.month, icon: Calendar },
    { label: "All Time", value: statsTotals.all, icon: Trophy },
  ]

  return (
    <div className="min-h-screen bg-background p-3 lg:px-10">
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Conferma logout
            </h3>

            <p className="text-sm text-foreground-muted mb-4">
              Sei sicuro di voler uscire?
            </p>

            {logoutError && (
              <p className="text-xs text-red-400 mb-2">{logoutError}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                disabled={logoutLoading}
                className="flex-1 bg-white/10 rounded-xl py-2 text-foreground"
              >
                Annulla
              </button>

              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex-1 bg-red-500 rounded-xl py-2 text-white font-medium"
              >
                {logoutLoading ? "Uscita..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-card rounded-2xl p-4 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Edit Profile</h3>
              <button
                onClick={() => setShowEditProfile(false)}
                disabled={editLoading}
                className="text-foreground-muted"
              >
                <X />
              </button>
            </div>

            <div className="mb-4">
              <div className="grid grid-cols-4 gap-2">
                {AVATAR_PRESETS.map((src) => {
                  const selected = (form.ImageUrl || me?.ImageUrl || "") === src

                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setField("ImageUrl", src)}
                      className={`relative aspect-square rounded-2xl overflow-hidden transition-all
                          ${selected ? "ring-2 ring-primary" : "ring-0"}
                        `}
                    >
                      <img
                        src={src}
                        alt="Avatar preset"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* info read-only */}
            {/* <div className="mb-4 space-y-1">
              <p className="text-xs text-foreground-muted">
                Username: <span className="text-foreground">{me?.Username ?? "-"}</span>
              </p>
              <p className="text-xs text-foreground-muted">
                Email: <span className="text-foreground">{me?.Email ?? "-"}</span>
              </p>
            </div> */}

            {editError && <p className="text-xs text-red-400 mb-3">{editError}</p>}

            <div className="space-y-3">
              <div>
                <label className="text-xs text-foreground-muted">Name</label>
                <input
                  value={form.Name}
                  onChange={(e) => setField("Name", e.target.value)}
                  className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none"
                  placeholder="Name"
                />
              </div>

              <div>
                <label className="text-xs text-foreground-muted">Surname</label>
                <input
                  value={form.Surname}
                  onChange={(e) => setField("Surname", e.target.value)}
                  className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none"
                  placeholder="Surname"
                />
              </div>

              <div>
                <label className="text-xs text-foreground-muted">Bio</label>
                <textarea
                  value={form.Bio}
                  onChange={(e) => setField("Bio", e.target.value)}
                  className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none"
                  placeholder="Bio"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-foreground-muted">BirthDate</label>
                  <input
                    type="date"
                    value={form.BirthDate}
                    onChange={(e) => setField("BirthDate", e.target.value)}
                    className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-foreground-muted">Sex</label>
                  <select
                    value={form.Sex}
                    onChange={(e) => setField("Sex", e.target.value as any)}
                    className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none"
                  >
                    <option value="">-</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-foreground-muted">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.Weight}
                    onChange={(e) => setField("Weight", e.target.value)}
                    className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none"
                    placeholder="es. 72.5"
                  />
                </div>

                <div>
                  <label className="text-xs text-foreground-muted">Height (cm)</label>
                  <input
                    type="number"
                    step="1"
                    value={form.Height}
                    onChange={(e) => setField("Height", e.target.value)}
                    className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none"
                    placeholder="es. 175"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditProfile(false)}
                disabled={editLoading}
                className="flex-1 bg-white/10 rounded-xl py-2 text-foreground"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveProfile}
                disabled={editLoading}
                className="flex-1 bg-primary rounded-xl py-2 text-background font-medium"
              >
                {editLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Card with Level */}
      <div className="bg-card rounded-3xl p-3 mb-4">
        <div className="relative">
          {/* Bottone in alto a destra */}
          <button onClick={() => setShowEditProfile(true)}
            className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-card rounded-xl p-2 flex items-center justify-center shadow-sm hover:bg-muted transition">
            <Settings className="w-5 h-5 text-foreground-muted" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-amber-200 overflow-hidden ring-2 ring-primary/30">
                <img
                  src={me?.ImageUrl || profilepic}
                  alt="User avatar"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{profileName}</h2>
              <p className="text-foreground-muted">{profileHandle}</p>

              <div className="mt-1">
                {!meLoading && !meError && me?.Email && (
                  <p className="text-xs text-foreground-muted">{me.Email}</p>
                )}
              </div>
            </div>
          </div>

          {!meLoading && !meError && me?.Bio?.trim() && (
            <p className="mt-2 text-sm text-foreground-muted leading-relaxed">
              {me.Bio}
            </p>
          )}
        </div>

        {/* XP Progress Bar */}
        {/* <div className="mb-4">
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
        </div> */}

        {/* Streak */}
        {/* <div className="flex items-center justify-between bg-orange-500/10 rounded-2xl p-4">
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
        </div> */}
      </div>

      {/* Tabs */}
      {/* <div className="flex gap-2 mb-4">
        {(["stats", "achievements", "leaderboards"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab ? "bg-primary text-background" : "bg-card text-foreground-muted"
              }`}
          >
            {tab === "stats" ? "Stats" : "Achievements"}
          </button>
        ))}
      </div> */}

      {/* Stats Tab */}
      {/* {activeTab === "stats" && (
        <div className="grid grid-cols-4 gap-3 mb-6">
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
      )} */}

      {/* Range Drink Summary (24hr/week/month/all) */}
      <section className="bg-card rounded-3xl p-5 mb-4 border border-white/5 shadow-lg">

        {/* Titolo e Range Selector (Stile compatto coerente) */}
        <div className="flex flex-col items-center justify-center mb-6">
          <h2 className="text-[20px] font-bold text-foreground-muted uppercase tracking-widest mb-3">
            Drink Summary
          </h2>
          <div className="flex items-center justify-between w-full bg-black/20 p-1.5 rounded-2xl border border-white/5">
            <button
              type="button"
              onClick={() => setRangeIdx((p) => (p - 1 + RANGE_TABS.length) % RANGE_TABS.length)}
              className="h-8 w-10 rounded-xl hover:bg-white/10 transition flex items-center justify-center"
              aria-label="Previous range"
            >
              <ChevronRight className="w-4 h-4 text-foreground-muted rotate-180" />
            </button>
            <p className="text-sm font-bold text-primary tracking-widest uppercase">
              {RANGE_TABS[rangeIdx].label}
            </p>
            <button
              type="button"
              onClick={() => setRangeIdx((p) => (p + 1) % RANGE_TABS.length)}
              className="h-8 w-10 rounded-xl hover:bg-white/10 transition flex items-center justify-center"
              aria-label="Next range"
            >
              <ChevronRight className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>
        </div>

        {/* Griglia Dati */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Totale Evidenziato */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex flex-col items-center justify-center sm:col-span-1">
            <p className="text-[10px] text-primary/80 font-bold mb-1 uppercase tracking-wider">Total</p>
            <p className="text-5xl font-black text-primary">{rangeTotal}</p>
          </div>

          {/* Sottocategorie */}
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5 flex flex-col justify-center transition-colors hover:bg-white/10">
              <p className="text-2xl font-bold text-foreground">{rangeCounts.cocktail}</p>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">Cocktails</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5 flex flex-col justify-center transition-colors hover:bg-white/10">
              <p className="text-2xl font-bold text-foreground">{rangeCounts.beer}</p>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">Beer</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5 flex flex-col justify-center transition-colors hover:bg-white/10">
              <p className="text-2xl font-bold text-foreground">{rangeCounts.shot}</p>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">Shots</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/5 flex flex-col justify-center transition-colors hover:bg-white/10">
              <p className="text-2xl font-bold text-foreground">{rangeCounts.wine}</p>
              <p className="text-[10px] text-foreground-muted uppercase tracking-wider mt-1">Wine</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <button
            type="button"
            onClick={() => { navigate("/mylogs") }}
            className="w-full bg-white/10 hover:bg-white/15 transition rounded-2xl p-3 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">View my logs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-foreground-muted" />
          </button>
        </div>
      </section>

      {/* Achievements Tab */}
      {/* {activeTab === "achievements" && (
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
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center ${achievement.unlocked
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

                  Progress bar for locked achievements
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
      )} */}

      <SafetyCard />

      <div className="space-y-2">
        <button onClick={() => setShowLogoutConfirm(true)} className="w-full bg-red-500/10 rounded-2xl p-4 flex items-center gap-3 mt-4">
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="text-red-400">Log Out</span>
        </button>
      </div>
    </div>
  )
}
