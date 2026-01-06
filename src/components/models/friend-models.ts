export interface Friend {
  id: number
  name: string
  avatar: string
  drinksTonight: number
  status: "online" | "offline" | "drinking"
  lastDrink?: string
  lastDrinkTime?: string
}

export interface Group {
  id: number
  name: string
  members: { avatar: string }[]
  activeDrinks: number
  isActive: boolean
}

export interface FriendsFeed {
  id: number
  user: { name: string; avatar: string }
  action: string
  drink: string
  drinkIcon: string
  location?: string
  time: string
  likes: number
  comments: number
  liked?: boolean
}
