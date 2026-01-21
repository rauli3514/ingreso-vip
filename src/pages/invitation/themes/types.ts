import { CSSProperties } from 'react';

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    textLight: string;
    surface: string; // Para tarjetas o fondos semi-transparentes
}

export interface ThemeFonts {
    heading: string;
    body: string;
    accent: string; // Para firmas o destacados
}

export interface ThemeAssets {
    divider: string | null; // URL imagen separador
    decorationValid: string | null; // Decoración general
    noiseTexture?: string; // Textura de fondo opcional
}

export interface InvitationTheme {
    id: string;
    name: string;
    colors: ThemeColors;
    fonts: ThemeFonts;
    assets: ThemeAssets;
    styles: {
        heroOverlay: CSSProperties;
        container: CSSProperties;
        blockTransition: string; // CSS transition string
    };
}
