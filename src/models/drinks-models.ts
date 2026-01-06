export interface DrinkModel {
  id: number
  name: string
  category: "cocktail" | "beer" | "wine" | "shot" | "coffee" | "soft drink"
  alcoholic: boolean
  rating: number
  description: string
}
