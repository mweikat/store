import { ProductModel } from "./product.model";

export interface CategoryModel {
    
    id:string;
    business_id:string;
    parent:string;
    name:string;
    desc?:string;
    seoDesc?:string;
    seoTitle?:string;
    gshop?:string;
    img?:string;
    url_name:string;
    status:string;
    order:number;
    products:ProductModel[];
    subcategories:CategoryModel[];
    deleted_at:string|null;
}


