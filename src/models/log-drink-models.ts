export class DrinkLogModel {
    constructor(
        public Id: number,
        public IdDrink: number,
        public DrinkName: string | null,
        public IdCategory: number | null,
        public CategoryName: string | null,
        public DrinkImageUrl: string | null,
        public DateLog: string,
        public Quantity: number,
        public Notes: string | null,
    ) { }
}