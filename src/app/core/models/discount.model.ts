export interface DiscountModel{

    "id": number,
    "discount_type_id": number,
    "business_id": string,
    "init_date": Date,
    "end_date": Date,
    "status": boolean,
    "discount": number,
    "name": string,
    "description": string,
    "min_amount": number

}