export type UserRole = 'superadmin' | 'provider' | 'admin' | 'disabled';

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
    after_party_time?: string; // Hora de trasnoche
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
    is_after_party?: boolean; // Es invitado de trasnoche
    has_puff?: boolean; // Tiene puff asignado
    passes?: number;
    companions?: string[]; // Array de strings (nombres)
}

export interface InvitationSection {
    show: boolean;
    title?: string;
    description?: string;
    [key: string]: any;
}

export interface InvitationData {
    id: string;
    event_id: string;
    theme_id: string;
    cover_image_url?: string;
    hero_section: InvitationSection & { subtitle?: string; date_format?: string };
    countdown_section: InvitationSection & { target_date?: string };
    ceremony_section: InvitationSection & { location_name?: string; location_url?: string; time?: string };
    party_section: InvitationSection & { location_name?: string; location_url?: string; time?: string };
    gallery_section: InvitationSection & { images: string[] };
    dress_code_section: InvitationSection & { code?: string; note?: string };
    gifts_section: InvitationSection & { cbu?: string; alias?: string; bank?: string };
    // Nuevas secciones
    extra_info_section?: {
        show: boolean;
        title: string;
        subtitle: string;
        blocks: any;
    };
    social_section?: {
        show: boolean;
        title: string;
        subtitle: string;
        hashtag: string;
        background_url: string;
        buttons: any[];
    };
    footer_section?: {
        show: boolean;
        show_branding: boolean;
        links: any;
    };

    // Tipografía
    font_family?: string;
    custom_font_url?: string;
    font_size?: number;
    font_weight?: string;
    letter_spacing?: number;

    // Configuración Avanzada (Solo Super Admin)
    advanced_settings?: {
        typography: {
            heading_scale: number; // Multiplicador de tamaño (ej: 1.2)
            body_scale: number;    // Multiplicador de tamaño
            line_height: number;
            weight_titles: '300' | '400' | '600' | '700'; // light, regular, semibold, bold
            alignment: 'center' | 'left';
        };
        colors: {
            background_override?: string;
            text_override?: string;
            accent_override?: string;
            overlay_opacity: number; // 0 a 1
        };
        decorations: Array<{
            id: string;
            type: 'image';
            url: string;
            position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
            offset_x: number;
            offset_y: number;
            scale: number;
            opacity: number;
            rotation: number;
            z_index: number;
            filters?: string; // CSS filters (blur, grayscale, etc.)
        }>;
        animations: {
            enabled: boolean;
            intensity: 'soft' | 'normal'; // Afecta la distancia y duración
            entry_effect?: 'fade' | 'slide-up' | 'zoom-in' | 'bounce' | 'none';
        };
    };

    created_at: string;
    updated_at: string;
}

export interface InvitationResponse {
    id: string;
    event_id: string;
    invitation_id: string;
    full_name: string;
    attending: boolean;
    type: 'ceremony' | 'party' | 'song';
    message?: string;
    created_at: string;
}



export interface TriviaQuestion {
    id: string;
    event_id: string;
    question: string;
    options: string[];
    correct_answer: number;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export interface TriviaResponse {
    id: string;
    event_id: string;
    guest_name: string;
    answers: number[];
    score: number;
    completed_at: string;
    created_at: string;
}
