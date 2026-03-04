import { LucideIcon } from "lucide-react"

export interface MenuTabModel {
    order: number
    name: string
    href: string
    icon: LucideIcon
    isCenter?: boolean
    isProfile?: boolean
    mobile?: boolean
    auth?: boolean
    header?: boolean
}