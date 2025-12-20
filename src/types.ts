export type UserRole = 'superadmin' | 'provider' | 'admin';

export interface UserProfile {
    id: string;
    email?: string;
    username?: string;
    role: UserRole;
    is_active: boolean;
    assigned_event_ids?: string[]; // Array of UUIDs for assigned events
    created_at: string;
}

export type EventStatus = 'pending' | 'active' | 'disabled' | 'closed';

export interface Event {
    id: string;
    name: string;
    date: string;
    owner_id?: string;
    guest_count_total: number;
    table_assignment: 'none' | 'partial' | 'full';
    table_count: number;
    guests_per_table_default: number;
    has_living_room: boolean;
    has_after_party: boolean; // Trasnoche
    status: EventStatus;
    created_at?: string;

    // Theme selection
    theme_id?: string; // ID del tema seleccionado (neon, boda, tecno, etc.)

    // Customization - from DB can be JSON column or separate columns
    theme_background_url?: string;
    theme_font_family?: string;
    theme_custom_logo_url?: string;

    // New fields
    description?: string;
    video_url_default?: string;
    video_configuration?: Record<string, string>; // Map table_name -> video_url
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
