export interface LeaderboardEntry {
  id: number
  rank: number
  name: string
  avatar: string
  drinksWeek: number
  drinksMonth: number
  isCurrentUser?: boolean
}