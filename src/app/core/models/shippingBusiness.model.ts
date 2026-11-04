export interface ShippingBusiness {
    id: number;
    name: string;
    desc: string;
    price: number;
    price_for_free: number;
    shipping_type_id?: number; // 1: Retiro, 2: Despacho Local, 4: Despacho Programado
    shipping_type?: 'store_pickup' | 'local_delivery' | 'scheduled_local_delivery' | string;
}
