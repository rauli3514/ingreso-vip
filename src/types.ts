export type UserRole = 'superadmin' | 'provider' | 'admin';

export interface UserProfile {
    id: string;
    email?: string;
    username?: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
}

export type EventStatus = 'pending' | 'active' | 'disabled' | 'closed';

export interface Event {
    id: string;
    name: string;
    date: string;
    owner_id?: string;
    guest_count_total: number;
    table_assignment_type: 'none' | 'partial' | 'full';
    table_count: number;
    guests_per_table_default: number;
    has_living_room: boolean;
    has_after_party: boolean; // Trasnoche
    status: EventStatus;
    created_at?: string;

    // Customization - from DB can be JSON column or separate columns
    theme_background_url?: string;
    theme_font_family?: string;
    theme_custom_logo_url?: string;
}

export interface Guest {
    id: string;
    event_id: string;
    first_name: string;
    last_name: string;
    display_name?: string;
    table_info?: string; // e.g. "Mesa 1", "Living", etc.
    assigned_video_url?: string;
    status: 'pending' | 'confirmed' | 'arrived';
}
