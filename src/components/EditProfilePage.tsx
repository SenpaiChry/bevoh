import { useEffect, useState } from "react"
import { ArrowLeft, X } from "lucide-react"
import { UserEditModel, UserModel } from "@/models/auth-models"
import { loadMe } from "@/controllers/UserController"
import { useNavigate } from "react-router-dom"

const API_BASE = "https://bevoh.altervista.org/api"

const AVATAR_PRESETS = [
  "/assets/avatars/female_1.png",
  "/assets/avatars/female_2.png",
  "/assets/avatars/male_1.png",
  "/assets/avatars/male_2.png",
] as const

export default function EditProfilePage() {
  const navigate = useNavigate()

  const [me, setMe] = useState<UserModel | null>(null)
  const [meLoading, setMeLoading] = useState(true)

  const [form, setForm] = useState<UserEditModel>(
    new UserEditModel(0, "", "", "", "", "", "", null, "")
  )

  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  // Load user on mount
  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setMeLoading(true)
      try {
        const user = await loadMe()
        if (!cancelled) setMe(user)
      } catch (e: any) {
        // silently fail — form stays empty
      } finally {
        if (!cancelled) setMeLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Populate form once user is loaded
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
      if (payload.Weight != null && (Number.isNaN(payload.Weight) || payload.Weight <= 0))
        throw new Error("Weight non valido")
      if (payload.Height != null && (Number.isNaN(payload.Height) || payload.Height <= 0))
        throw new Error("Height non valido")

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

      navigate("/profile", { replace: true })
    } catch (e: any) {
      setEditError(e?.message || "Errore salvataggio")
    } finally {
      setEditLoading(false)
    }
  }

  if (meLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-3 lg:px-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-card rounded-xl p-2 flex items-center justify-center hover:bg-muted transition"
        >
          <ArrowLeft className="w-5 h-5 text-foreground-muted" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Edit Profile</h1>
      </div>

      <div className="bg-card rounded-3xl p-4">
        {/* Avatar Picker */}
        <div className="mb-6">
          <p className="text-xs text-foreground-muted mb-3 uppercase tracking-wider">Avatar</p>
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

        {editError && (
          <p className="text-xs text-red-400 mb-4 bg-red-500/10 rounded-xl px-3 py-2">{editError}</p>
        )}

        <div className="space-y-4">
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
              className="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-foreground outline-none resize-none"
              placeholder="Bio"
              rows={3}
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

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate(-1)}
            disabled={editLoading}
            className="flex-1 bg-white/10 rounded-xl py-3 text-foreground"
          >
            Cancel
          </button>

          <button
            onClick={handleSaveProfile}
            disabled={editLoading}
            className="flex-1 bg-primary rounded-xl py-3 text-background font-medium"
          >
            {editLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="h-16 md:hidden" />
    </div>
  )
}