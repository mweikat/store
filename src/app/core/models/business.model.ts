import { BusinessInfoModel } from "./businessInfo.model";
import { BusinessPaymentsModel } from "./businessPayments.model";
import { BusinessRrssModel } from "./businessRrss.model";
import { BusinessShippingModel } from "./businessShipping.model";
import { SnackMessageModel } from "./snack_message.model";

export interface BusinessModel {
    id:string;
    name:string;
    url:string;
    desc:string;
    info:BusinessInfoModel;
    /*
    front_cover:string;
    desc:string;
    shipping:BusinessShippingModel;
    payments:BusinessPaymentsModel;
    rrss: BusinessRrssModel;
    type:BusinessRrssModel;
    business_type:number;
    snack_message:SnackMessageModel;
    expired_date:Date;*/
}