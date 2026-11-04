export interface DeliveryScheduleSettings {
    min_advance_minutes: number;
    max_days_ahead: number;
    reservation_timeout_minutes?: number;
}

export interface DeliveryScheduleSlot {
    id: number | string;
    date: string; // YYYY-MM-DD
    start_time: string; // HH:mm
    end_time: string; // HH:mm
    available_quota: number;
}

export interface DeliveryScheduleDay {
    date: string; // YYYY-MM-DD
    day_name?: string;
    slots: DeliveryScheduleSlot[];
}
