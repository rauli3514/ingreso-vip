export interface PlannerGuest {
    id: string;
    first_name: string;
    last_name: string;
    display_name: string;
    table_id?: string;
    table_info?: string;
    group?: string;
    status: 'pending' | 'confirmed';
    is_after_party?: boolean;
    has_puff?: boolean;
    note?: string;
}

export interface PlannerTable {
    id: string;
    type: 'round' | 'rect';
    x: number;
    y: number;
    rotation: number;
    radius?: number;
    width?: number;
    height?: number;
    label: string;
    capacity: number;
}

export type PlannerServiceStatus = 'pending' | 'viewing' | 'ready';

export interface PlannerService {
    id: string;
    category: string;
    name: string;
    status: PlannerServiceStatus;
    cost: number;
    note: string;
    group: 'imprescindible' | 'muy_importante' | 'opcional' | 'eventpix_premium';
}

export interface EventData {
    cloudEventId?: string;
    name: string;
    date: string;
    guests: PlannerGuest[];
    tables: PlannerTable[];
    services: PlannerService[];
    estimatedBudget: number;
    includesIva?: boolean;
}
