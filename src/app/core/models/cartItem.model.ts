import { ProductBundle } from "./productBundle.model";
import { ProductVariantSkuModel } from "./productVariantSku.model";

export interface CartItemModel {

    id:string;
    cartId?:string;
    product_id:string;
    product_name:string;
    quantity:number;
    price:number;
    image?:string;
    product_bundle:ProductBundle|null;
    variant?:ProductVariantSkuModel;

}