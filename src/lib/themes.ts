export interface Theme {
    id: string;
    name: string;
    category: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
    backgroundImage?: string;
    description?: string;
}

export const themes: Theme[] = [
    // NEON THEME
    {
        id: 'neon',
        name: 'Neón',
        category: 'Moderno',
        colors: {
            primary: '#00D9FF',    // Cyan eléctrico
            secondary: '#FF006E',  // Rosa neón
            accent: '#FFBE0B',     // Amarillo brillante
            background: '#0a0e27'  // Azul oscuro
        },
        description: 'Estilo futurista con colores neón brillantes'
    },

    // TECNO THEME
    {
        id: 'tecno',
        name: 'Tecnológico',
        category: 'Moderno',
        colors: {
            primary: '#4169E1',    // Azul eléctrico
            secondary: '#8B5CF6',  // Morado
            accent: '#10B981',     // Verde tech
            background: '#0d1117'  // Negro azulado
        },
        description: 'Diseño tech moderno y elegante'
    },

    // BODA THEME
    {
        id: 'boda',
        name: 'Boda Elegante',
        category: 'Evento',
        colors: {
            primary: '#C4A661',    // Dorado elegante
            secondary: '#2C3E50',  // Azul marino
            accent: '#ECF0F1',     // Blanco perla
            background: '#1a1a2e'  // Azul oscuro
        },
        description: 'Elegancia y sofisticación para bodas'
    },

    // 15 AÑOS THEME
    {
        id: '15-anos',
        name: '15 Años',
        category: 'Celebración',
        colors: {
            primary: '#FF69B4',    // Rosa vibrante
            secondary: '#9D4EDD',  // Morado
            accent: '#FFD700',     // Dorado
            background: '#1a1030'  // Morado oscuro
        },
        description: 'Celebración juvenil y colorida'
    },

    // QUINCE (QUINCEAÑERA) THEME
    {
        id: 'quince',
        name: 'Quinceañera',
        category: 'Celebración',
        colors: {
            primary: '#E91E63',    // Rosa fuerte
            secondary: '#9C27B0',  // Morado
            accent: '#FFB6C1',     // Rosa claro
            background: '#1a0828'  // Morado muy oscuro
        },
        description: 'Elegancia rosa para quinceañeras'
    },

    // INFANTIL THEME
    {
        id: 'infantil',
        name: 'Infantil',
        category: 'Celebración',
        colors: {
            primary: '#FF6B9D',    // Rosa pastel
            secondary: '#4ECDC4',  // Turquesa
            accent: '#FFE66D',     // Amarillo suave
            background: '#2C1F3F'  // Morado suave
        },
        description: 'Colores alegres y divertidos para niños'
    },

    // RUSTIC THEME
    {
        id: 'rustic',
        name: 'Rústico',
        category: 'Natural',
        colors: {
            primary: '#8B7355',    // Marrón cálido
            secondary: '#556B2F',  // Verde oliva
            accent: '#DEB887',     // Beige
            background: '#1a1410'  // Marrón oscuro
        },
        description: 'Estilo campestre y natural'
    },

    // DEFAULT (Ingreso VIP Original)
    {
        id: 'default',
        name: 'Ingreso VIP',
        category: 'Default',
        colors: {
            primary: '#4169E1',
            secondary: '#6B21A8',
            accent: '#FBBF24',
            background: '#0a0e27'
        },
        description: 'Tema predeterminado de Ingreso VIP'
    }
];

export function getThemeById(id: string): Theme | undefined {
    return themes.find(theme => theme.id === id);
}

export function getThemesByCategory(category: string): Theme[] {
    return themes.filter(theme => theme.category === category);
}
