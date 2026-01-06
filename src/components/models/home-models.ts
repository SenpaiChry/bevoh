export interface DrinkLog {
  id: number
  name: string
  icon: string
  timestamp: Date
  location?: string
  quantity?: number
  friends?: string[]
}