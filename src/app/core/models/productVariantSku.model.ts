import { ProductVariantItemModel } from "./productVariantItem.model"

export interface ProductVariantSkuModel {

    product_variant_id:number,
    sku:string,
    stock:number,
    price_modifier:number
    Items?:ProductVariantItemModel[]
}