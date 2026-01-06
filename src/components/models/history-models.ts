export interface DrinkSession {
    id: number
    date: string
    dateLabel: string
    location?: string
    totalDrinks: number
    friends: { name: string; avatar: string }[]
    drinks: { name: string; icon: string; time: string; quantity: number }[]
    duration: string
    highlights?: string
}