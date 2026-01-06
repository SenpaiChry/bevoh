import { Home, Trophy, PlusSquare, Users, User, Wine, History } from "lucide-react"
import { FavoriteDrinkModel } from "../models/add-drink-models"
import { Friend, FriendsFeed, Group } from "../models/friend-models"
import { DrinkSession } from "../models/history-models"
import { LeaderboardEntry } from "../models/leaderboard-models"
import { MenuTabModel } from "../models/menu-tab-models"
import friendsData from "../data/friends.json"
import friendsGroupsData from "../data/friends-groups.json"
import friendsFeedData from "../data/friends-feed.json"
import drinksData from "../data/favorite-drinks.json"
import historyData from "../data/history.json"
import leaderboardData from "../data/leaderboard.json"
import menuData from "../data/menu.json"

export const getFavouriteDrinks = (): FavoriteDrinkModel[] => {
  return drinksData.map(item => ({
    id: Number(item.id),
    name: String(item.name),
    type: String(item.type),
    image: String(item.image)
  }))
}

export const getFriends = (): Friend[] => {
  return friendsData.map(item => ({
    id: Number(item.id),
    name: String(item.name),
    avatar: String(item.avatar),
    drinksTonight: Number(item.drinksTonight),
    status: item.status as Friend["status"],
    lastDrink: item.lastDrink,
    lastDrinkTime: item.lastDrinkTime
  }))
}

export const getFriendsGroups = (): Group[] => {
  return friendsGroupsData.map(g => ({
    id: Number(g.id),
    name: String(g.name),
    activeDrinks: Number(g.activeDrinks),
    isActive: Boolean(g.isActive),
    members: (g.members ?? []).map(m => ({
      avatar: String(m.avatar)
    }))
  }))
}

export const getFriendsFeed = (): FriendsFeed[] => {
  return friendsFeedData.map(item => ({
    id: Number(item.id),
    action: item.action,
    drink: item.drink,
    drinkIcon: item.drinkIcon,
    location: item.location,
    time: item.time,
    likes: Number(item.likes),
    comments: Number(item.comments),
    liked: Boolean(item.liked),
    user: {
      name: item.user.name,
      avatar: String(item.user.avatar)
    }
  }))
}

export const getHistory = (): DrinkSession[] => {
  return historyData.map(s => ({
    id: Number(s.id),
    date: String(s.date),
    dateLabel: String(s.dateLabel),
    location: String(s.location),
    totalDrinks: Number(s.totalDrinks),
    duration: String(s.duration),
    highlights: s.highlights,
    friends: (s.friends ?? []).map(f => ({
      name: String(f.name),
      avatar: String(f.avatar)
    })),
    drinks: (s.drinks ?? []).map(d => ({
      name: String(d.name),
      icon: String(d.icon),
      time: String(d.time),
      quantity: Number(d.quantity)
    }))
  }))
}

export const getLeaderboard = (): LeaderboardEntry[] => {
  return leaderboardData.map(e => ({
    id: Number(e.id),
    rank: Number(e.rank),
    name: String(e.name),
    drinksWeek: Number(e.drinksWeek),
    drinksMonth: Number(e.drinksMonth),
    isCurrentUser: Boolean(e.isCurrentUser),
    avatar: String(e.avatar)
  }))
}

const iconMap = {
  home: Home,
  trophy: Trophy,
  plus: PlusSquare,
  users: Users,
  user: User,
  drink: Wine,
  history: History
} as const
export const getMenuTabs = (): MenuTabModel[] => {
  return menuData
  .sort((a, b) => a.order - b.order)
  .map(t => ({
    order: t.order,
    name: t.name,
    href: t.href,
    isCenter: t.isCenter,
    isProfile: t.isProfile,
    forMobile: t.forMobile,
    icon: iconMap[t.icon as keyof typeof iconMap]
  }))
}