import { LogOut } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { logout } from "@/controllers/UserController"
import { YesNoModal } from "./YesNoModal"

export default function AdminLogoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogout() {
    try {
      setLoading(true)
      setError(null)
      await logout()
      await queryClient.invalidateQueries({ queryKey: ["me"] })
      navigate("/auth", { replace: true })
    } catch (e: any) {
      setError(e?.message || "Errore logout")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <YesNoModal
        title="Conferma logout"
        description="Sei sicuro di voler uscire dall'area admin?"
        open={showConfirm}
        loading={loading}
        error={error}
        onCancel={() => { setShowConfirm(false); setError(null) }}
        onConfirm={handleLogout}
      />

      <button
        onClick={() => setShowConfirm(true)}
        className="w-full max-w-sm bg-red-500/10 rounded-2xl p-4 flex items-center gap-3"
      >
        <LogOut className="w-5 h-5 text-red-400" />
        <span className="text-red-400">Log Out</span>
      </button>
    </div>
  )
}