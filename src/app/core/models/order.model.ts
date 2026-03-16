import { OrderItemModel } from "./orderItem.model";
import { OrderShippedModel } from "./orderShipped.model";

export interface OrderModel {
   
   id:string;
   status:string;
   total_amount:number;
   created_at:string;
   order_number:string;
   shipping_cost:number;
   items:OrderItemModel[];
   shipped:OrderShippedModel;
 }