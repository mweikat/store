import { CategoryModel } from "./category.model";
import { ProductImgModel } from "./productImg.model";
import { ProductVideoModel } from "./productVideo.model";

export interface ProductModel {
    
    id:string;
    name:string;
    price:number;
    priceSale:number;
    status:string;
    action_link:string;
    stock:number;
    imgP:string;
    video?:ProductVideoModel;
    categories?:CategoryModel[];
    imgs:ProductImgModel[];
    url:string;
    brand?:string;
}
