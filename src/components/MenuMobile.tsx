import { useMemo } from "react"
import { Link, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { MenuTabModel } from "../models/menu-tab-models"
import { getMenuTabs } from "./ReadData"
import { UserModel } from "@/models/auth-models"
import { loadMeSafe } from "@/controllers/UserController"
const FALLBACK_AVATAR = "/assets/avatars/male_1.png"

const MenuMobile = () => {
  const location = useLocation()
  const isActive = (href: string) => location.pathname === href

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: loadMeSafe,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const isLoading = meQuery.isLoading
  const me: UserModel | null = meQuery.data?.ok ? meQuery.data.user : null
  const isLoggedIn = me !== null

  const menuTabs: MenuTabModel[] = useMemo(() => {
    const all = getMenuTabs().filter((x) => x.mobile)
    if (!isLoggedIn) {
      return all.filter((x) => !x.auth)
    }
    return all.filter((x) => x.name.toLowerCase() !== "login")
  }, [isLoggedIn])

  const avatarSrc = useMemo(() => {
    if (!me?.ImageUrl) return FALLBACK_AVATAR
    const url = me.ImageUrl.trim()
    if (!url) return FALLBACK_AVATAR
    if (url.startsWith("http") || url.startsWith("/")) return url
    return `/${url}`
  }, [me?.ImageUrl])

  if (isLoading) return null

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

            if (isProfile) {
              return (
                <Link key={name} to={href} aria-label={name} className="flex flex-col items-center justify-center gap-1">
                  <div className={[
                    "w-8 h-8 rounded-full overflow-hidden",
                    active ? "ring-2 ring-foreground" : "ring-1 ring-border",
                  ].join(" ")}>
                    <img
                      src={avatarSrc}
                      alt="User avatar"
                      className="w-full h-full object-cover"
                      draggable={false}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_AVATAR }}
                    />
                  </div>
                </Link>
              )
            }

            if (isCenter) {
              return (
                <Link key={name} to={href} aria-label={name} className="flex items-center justify-center">
                  <div className={[
                    "w-12 h-12 rounded-2xl flex items-center justify-center",
                    active ? "bg-foreground text-background" : "bg-foreground/10 text-foreground",
                  ].join(" ")}>
                    <Icon className="w-6 h-6" />
                  </div>
                </Link>
              )
            }

            return (
              <Link key={name} to={href} aria-label={name} className="flex flex-col items-center justify-center gap-1">
                <Icon className={[
                  "w-6 h-6 transition-colors",
                  active ? "text-foreground" : "text-foreground/60",
                ].join(" ")} />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default MenuMobile