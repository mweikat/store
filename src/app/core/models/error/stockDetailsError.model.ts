import { CartItemModel } from "@models/cartItem.model";

export interface StockDetailsError {
    
    id:string,
    product_id:string,
    status:string,
    stock:number,
    cartItem?:CartItemModel
}