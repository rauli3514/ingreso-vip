import { InvitationTheme } from './types';

export const THEME_ELEGANT: InvitationTheme = {
    id: 'elegant',
    name: 'Elegancia Clásica',
    colors: {
        primary: '#1a1a1a',
        secondary: '#D4AF37', // Gold
        accent: '#f3f4f6',
        background: '#ffffff',
        text: '#1f2937',
        textLight: '#6b7280',
        surface: 'rgba(255, 255, 255, 0.9)',
    },
    fonts: {
        heading: '"Cormorant Garamond", serif',
        body: '"Montserrat", sans-serif',
        accent: '"Great Vibes", cursive',
    },
    assets: {
        divider: null,
        decorationValid: null,
    },
    styles: {
        heroOverlay: {
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))',
        },
        container: {
            maxWidth: '480px', // Mobile-first width constrain para desktop
            margin: '0 auto',
            boxShadow: '0 0 20px rgba(0,0,0,0.1)',
            minHeight: '100vh',
            overflow: 'hidden',
        },
        blockTransition: 'all 0.8s ease-in-out',
    }
};

export const THEME_HOJAS: InvitationTheme = {
    id: 'hojas',
    name: 'Naturaleza (Hojas)',
    colors: {
        primary: '#2F5233', // Forest Green
        secondary: '#B1D8B7', // Sage
        accent: '#94C973',
        background: '#FFFFF0', // Ivory
        text: '#1a2e1b',
        textLight: '#5c7a62',
        surface: 'rgba(255, 255, 240, 0.85)',
    },
    fonts: {
        heading: '"Playfair Display", serif',
        body: '"Lato", sans-serif',
        accent: '"Dancing Script", cursive',
    },
    assets: {
        divider: 'https://images.unsplash.com/photo-1596327318357-550917de9f8d?auto=format&fit=crop&w=500&q=60', // Placeholder leaf texture
        decorationValid: null,
    },
    styles: {
        heroOverlay: {
            background: 'linear-gradient(to bottom, rgba(47, 82, 51, 0.2), rgba(47, 82, 51, 0.5))',
        },
        container: {
            maxWidth: '100%',
            background: '#FFFFF0',
        },
        blockTransition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
    }
};

export const themes: Record<string, InvitationTheme> = {
    [THEME_ELEGANT.id]: THEME_ELEGANT,
    [THEME_HOJAS.id]: THEME_HOJAS,
};

export const getTheme = (id: string): InvitationTheme => {
    return themes[id] || THEME_ELEGANT;
};
