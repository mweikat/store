export interface ProductBundle {

    id:number,
    bundled_product_id: string,
    discount_type: 'percentage' | 'fixed' | 'free'
    discount_price: 0,
    desc: string,
    percentage:number,
    name_budle: string,
    selling_price: number,
    quantity:number,
    img:string

}