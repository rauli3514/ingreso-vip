export type UserRole = 'superadmin' | 'provider' | 'admin';

export interface UserProfile {
    id: string;
    username: string; // "Registro sin email" implies username based
    role: UserRole;
    is_active: boolean;
    created_at: string;
}

export type EventStatus = 'pending' | 'active' | 'disabled' | 'closed';

export interface Event {
    id: string;
    name: string;
    date: string;
    provider_id: string;
    guest_count_total: number;
    table_assignment_type: 'none' | 'partial' | 'full';
    table_count: number;
    guests_per_table_default: number;
    has_living_room: boolean;
    has_after_party: boolean; // Trasnoche
    status: EventStatus;

    // Customization
    theme_config?: {
        background_type: 'image' | 'video';
        background_url: string;
        font_family: string;
        custom_logo_url?: string;
    };
}

export interface Guest {
    id: string;
    event_id: string;
    first_name: string;
    last_name: string;
    table_number?: string | number; // "Mesa X", "Living", "Trasnoche"
    assigned_video_url?: string;
    status: 'pending' | 'arrived';
}
