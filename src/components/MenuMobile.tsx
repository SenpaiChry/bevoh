import React, { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { MenuTabModel } from "../models/menu-tab-models"
import { getMenuTabs } from "./ReadData"
import { UserModel } from "@/models/auth-models"

type MeResponse = { ok: true; user: UserModel } | { ok: false; error: string }

const API_BASE = "https://bevoh.altervista.org"

async function fetchMe(): Promise<MeResponse> {
  const res = await fetch(`${API_BASE}/api/auth/me.php`, {
    credentials: "include",
    headers: { Accept: "application/json" },
  })

  const text = await res.text()
  if (!text.trim()) return { ok: false, error: "Empty response" }

  let data: MeResponse
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: "Invalid JSON" }
  }

  // se il backend risponde con ok:false o status non-ok -> non loggato / errore
  if (!res.ok || !data.ok) return { ok: false, error: "Not authenticated" }
  return data
}

const MenuMobile = () => {
  const location = useLocation()
  const isActive = (href: string) => location.pathname === href

  // UNICA fonte di verità: React Query
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const me: UserModel | null = meQuery.data?.ok ? meQuery.data.user : null

  const [menuTabs, setMenuTabs] = useState<MenuTabModel[]>([])

  // Tabs sempre derivati da `me`
  useEffect(() => {
    const tabs = getMenuTabs().filter((x) => x.forMobile && x.isActive)

    if (me == null) {
      // NON loggato: mostra solo tab pubbliche (authentication:false)
      setMenuTabs(tabs.filter((x) => !x.authentication))
    } else {
      // loggato: togli Login (e tieni tutto il resto, incluso auth)
      setMenuTabs(tabs.filter((x) => x.name.toLowerCase() !== "login"))
    }
  }, [me])

  const avatarSrc = useMemo(() => me?.ImageUrl, [me])

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-lg">
        <div
          className="grid items-center h-16 px-2"
          style={{ gridTemplateColumns: `repeat(${menuTabs.length}, minmax(0, 1fr))` }}
        >
          {menuTabs.map(({ name, href, icon, isCenter, isProfile }) => {
            const active = isActive(href)
            const Icon = icon as any

            // Profile con avatar
            if (isProfile) {
              return (
                <Link
                  key={name}
                  to={href}
                  aria-label={name}
                  className="flex flex-col items-center justify-center gap-1"
                >
                  <div
                    className={[
                      "w-8 h-8 rounded-full overflow-hidden",
                      active ? "ring-2 ring-foreground" : "ring-1 ring-border",
                    ].join(" ")}
                  >
                    <img
                      src={avatarSrc}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  </div>
                </Link>
              )
            }

            // Add centrale
            if (isCenter) {
              return (
                <Link
                  key={name}
                  to={href}
                  aria-label={name}
                  className="flex items-center justify-center"
                >
                  <div
                    className={[
                      "w-12 h-12 rounded-2xl flex items-center justify-center",
                      active
                        ? "bg-foreground text-background"
                        : "bg-foreground/10 text-foreground",
                    ].join(" ")}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </Link>
              )
            }

            // Tab normali
            return (
              <Link
                key={name}
                to={href}
                aria-label={name}
                className="flex flex-col items-center justify-center gap-1"
              >
                <Icon
                  className={[
                    "w-6 h-6 transition-colors",
                    active ? "text-foreground" : "text-foreground/60",
                  ].join(" ")}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default MenuMobile
