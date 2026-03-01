import React from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { UserModel } from "./models/auth-models"

type MeResponse = { ok: true; user: UserModel } | { ok: false; error: string }

const API_BASE = "https://bevoh.altervista.org/api"

async function fetchMe(): Promise<MeResponse> {
    const res = await fetch(`${API_BASE}/auth/me.php`, {
        credentials: "include",
        headers: { Accept: "application/json" },
    })

    const text = await res.text()
    if (!text.trim()) return { ok: false, error: "Empty response" }

    try {
        const data: MeResponse = JSON.parse(text)
        if (!res.ok || !data.ok) return { ok: false, error: "Not authenticated" }
        return data
    } catch {
        return { ok: false, error: "Invalid JSON" }
    }
}

export default function RequireAuth({ children }: { children: React.ReactNode }) {
    const location = useLocation()

    const meQuery = useQuery({
        queryKey: ["me"],
        queryFn: fetchMe,
        retry: false,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
    })

    if (meQuery.isLoading) {
        return <div className="min-h-screen bg-background" />
    }

    const isAuthed = meQuery.data?.ok === true

    if (!isAuthed) {
        return <Navigate to="/auth" replace state={{ from: location.pathname }} />
    }

    return <>{children}</>
}
