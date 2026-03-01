import React, { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { MenuTabModel } from "../models/menu-tab-models"
import { getMenuTabs } from "./ReadData"
import profilepic from "@/assets/drinks/male-avatar-cartoon.jpg"
import logo from "@/assets/logo/bevoh_logo.png"
import { UserModel } from "@/models/auth-models"

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

const Header = () => {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const isActive = (href: string) => location.pathname === href

  // ✅ Unica fonte di verità: me da React Query
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const me: UserModel | null = meQuery.data?.ok ? meQuery.data.user : null

  // ✅ Tabs sempre derivati da me
  const menuTabs: MenuTabModel[] = useMemo(() => {
    const all = getMenuTabs().filter((x) => x.isActive)

    if (me == null) {
      // non loggato: nascondi quelli che richiedono auth
      return all.filter((x) => !x.authentication)
    }

    // loggato: togli Login (e lascia gli auth-only)
    return all.filter((x) => x.name.toLowerCase() !== "login")
  }, [me])

  const avatarSrc = useMemo(() => me?.ImageUrl || profilepic, [me])

  // chiudi drawer quando cambi pagina
  useEffect(() => {
    setIsMobileMenuOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src={logo} draggable={false} className="h-8 mx-auto select-none" alt='Bevoh' />
          </Link>

          {/* Desktop Navigation */}
          <div className="items-center gap-20 hidden md:flex">
            {menuTabs.map((item) => {
              const active = isActive(item.href)

              if (item.name === "Profile") {
                return (
                  <Link key={item.name} to={item.href} aria-label="Profile">
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

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${active ? "active" : ""}`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Drawer + Overlay */}
        <div
          className={`md:hidden fixed inset-0 z-50 transition ${
            isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
          aria-hidden={!isMobileMenuOpen}
        >
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity duration-300 ${
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer */}
          <div
            className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-background border-l border-border/50 shadow-2xl transition-transform duration-300 ease-out ${
              isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header drawer */}
            <div className="flex items-center justify-between px-5 h-14 border-b border-border/50">
              <span className="text-sm tracking-wide text-foreground/70">Menu</span>
              <button
                type="button"
                aria-label="Close menu"
                className="inline-flex items-center justify-center rounded-xl p-2 text-foreground/90 hover:text-primary hover:bg-foreground/5 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={22} />
              </button>
            </div>

            {/* Links */}
            <div className="px-5 py-4 m-1 bg-black rounded-xl">
              <div className="flex flex-col gap-2">
                {menuTabs.map((item) => {
                  const active = isActive(item.href)

                  if (item.name === "Profile") {
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={[
                          "relative flex items-center gap-3 rounded-xl px-4 py-3 backdrop-blur-sm text-white text-sm font-medium transition-colors",
                          active ? "ring-2 ring-white/20" : "hover:bg-black",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "w-8 h-8 rounded-full overflow-hidden",
                            active ? "ring-2 ring-white" : "ring-1 ring-white/20",
                          ].join(" ")}
                        >
                          <img
                            src={avatarSrc}
                            alt="User avatar"
                            className="w-full h-full object-cover"
                            draggable={false}
                          />
                        </div>
                        <span>{item.name}</span>

                        {active && (
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white" />
                        )}
                      </Link>
                    )
                  }

                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={[
                        "relative rounded-xl px-4 py-3 backdrop-blur-sm text-white text-sm font-medium transition-colors",
                        active ? "ring-2 ring-white/20" : "hover:bg-black",
                      ].join(" ")}
                    >
                      {item.name}
                      {active && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white" />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
