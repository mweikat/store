import { ProductModel } from "./product.model";

export interface OrderItemModel {

    id?:string;
    product_id?:string;
    price:number;
    name:string;
    img?:string;
    quantity:number;
    product:ProductModel;

}    