export class ReviewModel {
    constructor(
        public id: string | number,
        public text: string,
        public rating: number,
        public username: string,
        public userId: number,
    ) { }
}