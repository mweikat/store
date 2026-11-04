export interface PickupLocationModel {
    id: number | string;
    name: string;
    address: string;
    city_name?: string;
    region_name?: string;
    schedule_desc?: string;
    contact_phone?: string;
    instructions?: string;
    is_active?: boolean;
}
