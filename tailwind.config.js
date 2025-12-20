/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: 'rgb(var(--color-bg-primary) / <alpha-value>)',
                surface: 'rgb(var(--color-bg-secondary) / <alpha-value>)',
                sidebar: 'rgb(var(--color-bg-sidebar) / <alpha-value>)',

                foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
                muted: 'rgb(var(--color-text-secondary) / <alpha-value>)',
                'muted-foreground': 'rgb(var(--color-text-muted) / <alpha-value>)',

                accent: {
                    DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
                    light: 'rgb(var(--color-accent-light) / <alpha-value>)',
                    dark: 'rgb(var(--color-accent-dark) / <alpha-value>)',
                },

                border: 'rgb(var(--color-border) / <alpha-value>)',
                input: 'rgb(var(--color-input-bg) / <alpha-value>)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'sans-serif'],
                display: ['var(--font-heading)', 'sans-serif'],
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
    ],
}
