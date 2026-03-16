import { ProductVariantItemModel } from "./productVariantItem.model";

export interface ProductVariantTypeModel {
        id: number;
        code:string;
        name: string;
        productId?:string;
        attr?:ProductVariantItemModel[];
}