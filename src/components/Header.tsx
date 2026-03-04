import { useEffect, useMemo, useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { MenuTabModel } from "../models/menu-tab-models"
import { getMenuTabs } from "./ReadData"
import logo from "@/assets/logo/bevoh_logo.png"
import { UserModel } from "@/models/auth-models"
import { loadMeSafe } from "@/controllers/UserController"
const FALLBACK_AVATAR = "/assets/avatars/male_1.png"

const Header = () => {
  const location = useLocation()
  const isActive = (href: string) => location.pathname === href

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: loadMeSafe,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const me: UserModel | null = meQuery.data?.ok ? meQuery.data.user : null

  const menuTabs: MenuTabModel[] = useMemo(() => {
    const all = getMenuTabs().filter((x) => x.header)
    if (me == null) return all.filter((x) => !x.auth)
    return all.filter((x) => x.name.toLowerCase() !== "login")
  }, [me])

  const avatarSrc = useMemo(() => {
    if (!me?.ImageUrl) return FALLBACK_AVATAR
    const url = me.ImageUrl.trim()
    if (!url) return FALLBACK_AVATAR
    if (url.startsWith("http") || url.startsWith("/")) return url
    return `/${url}`
  }, [me?.ImageUrl])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex-shrink-0">
            <img src={logo} draggable={false} className="h-8 mx-auto select-none" alt="Bevoh" />
          </Link>

          <div className="items-center gap-20 hidden md:flex">
            {menuTabs.map((item) => {
              const active = isActive(item.href)

              if (item.name === "Profile") {
                return (
                  <Link key={item.name} to={item.href} aria-label="Profile">
                    <div className={[
                      "w-8 h-8 rounded-full overflow-hidden",
                      active ? "ring-2 ring-foreground" : "ring-1 ring-border",
                    ].join(" ")}>
                      <img src={avatarSrc} alt="User avatar" className="w-full h-full object-cover" draggable={false} />
                    </div>
                  </Link>
                )
              }

              return (
                <Link key={item.name} to={item.href} className={`nav-link ${active ? "active" : ""}`}>
                  {item.name}
                </Link>
              )
            })}
          </div>

          <button className="md:hidden text-foreground hover:text-primary transition-colors"
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Drawer + Overlay */}
        <div aria-hidden={!isMobileMenuOpen}
          className={`md:hidden fixed inset-0 z-50 transition ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        >
          <div onClick={() => setIsMobileMenuOpen(false)}
            className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
          />

          <div role="dialog" aria-modal="true"
            className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-background border-l border-border/50 shadow-2xl transition-transform duration-300 ease-out ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`} >
            <div className="flex items-center justify-between px-5 h-14 border-b border-border/50">
              <span className="text-sm tracking-wide text-foreground/70">Menu</span>
              <button type="button" aria-label="Close menu" onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex items-center justify-center rounded-xl p-2 text-foreground/90 hover:text-primary hover:bg-foreground/5 transition-colors" >
                <X size={22} />
              </button>
            </div>

            <div className="px-5 py-4 m-1 bg-black rounded-xl">
              <div className="flex flex-col gap-2">
                {menuTabs.map((item) => {
                  const active = isActive(item.href)

                  if (item.name === "Profile") {
                    return (
                      <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)}
                        className={[
                          "relative flex items-center gap-3 rounded-xl px-4 py-3 backdrop-blur-sm text-white text-sm font-medium transition-colors",
                          active ? "ring-2 ring-white/20" : "hover:bg-black",
                        ].join(" ")}
                      >
                        <div className={[
                          "w-8 h-8 rounded-full overflow-hidden",
                          active ? "ring-2 ring-white" : "ring-1 ring-white/20",
                        ].join(" ")}>
                          <img src={avatarSrc} alt="User avatar" className="w-full h-full object-cover" draggable={false} />
                        </div>
                        <span>{item.name}</span>
                        {active && <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white" />}
                      </Link>
                    )
                  }

                  return (
                    <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)}
                      className={[
                        "relative rounded-xl px-4 py-3 backdrop-blur-sm text-white text-sm font-medium transition-colors",
                        active ? "ring-2 ring-white/20" : "hover:bg-black",
                      ].join(" ")}
                    >
                      {item.name}
                      {active && <span className="absolute right-4 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-white" />}
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