export class DrinkModel {
  constructor(
    public Id: number,
    public IdCategory: number,
    public Category: string,
    public Name: string,
    public ABV: number,
    public ImageUrl: string,
    public Description?: string,
    public Garnish?: string,
    public Alcoholic?: boolean,
    public Ingredients?: Ingredient[]
  ) { }
}

export class Ingredient {
  constructor(
    public Id: number,
    public Name: string,
    public ABV: number,
    public Quantity: string,
    public UM?: string,
  ) { }
}