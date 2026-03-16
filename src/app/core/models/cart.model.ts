import { CartItemModel } from "./cartItem.model";

export interface CartModel {

    id:string;
    user_id?:string;
    user_agent:string;
    ip:string
    items:CartItemModel[]


}
