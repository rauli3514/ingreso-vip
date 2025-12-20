import { themes } from '../lib/themes';

interface ThemeSelectorProps {
    selectedThemeId?: string;
    onThemeSelect: (themeId: string) => void;
    compact?: boolean;
}

export default function ThemeSelector({ selectedThemeId = 'default', onThemeSelect, compact = false }: ThemeSelectorProps) {
    if (compact) {
        // Compact version for the Design tab
        return (
            <div className="space-y-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Tema del Evento
                </label>

                <div className="grid grid-cols-3 gap-2">
                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            type="button"
                            onClick={() => onThemeSelect(theme.id)}
                            className={`
                                relative group rounded-lg p-3 border transition-all text-left
                                ${selectedThemeId === theme.id
                                    ? 'border-[#FBBF24] bg-[#FBBF24]/10 shadow-md'
                                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                                }
                            `}
                        >
                            {/* Color Preview - Smaller */}
                            <div className="flex gap-1 mb-2">
                                <div
                                    className="w-5 h-5 rounded shadow-sm"
                                    style={{ backgroundColor: theme.colors.primary }}
                                />
                                <div
                                    className="w-5 h-5 rounded shadow-sm"
                                    style={{ backgroundColor: theme.colors.secondary }}
                                />
                                <div
                                    className="w-5 h-5 rounded shadow-sm"
                                    style={{ backgroundColor: theme.colors.accent }}
                                />
                            </div>

                            {/* Theme Info - Compact */}
                            <h3 className="text-xs font-bold text-white mb-0.5 truncate">
                                {theme.name}
                            </h3>
                            <p className="text-[10px] text-muted truncate">
                                {theme.category}
                            </p>

                            {/* Selected Indicator - Smaller */}
                            {selectedThemeId === theme.id && (
                                <div className="absolute top-1.5 right-1.5">
                                    <div className="w-4 h-4 rounded-full bg-[#FBBF24] flex items-center justify-center">
                                        <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Theme Description - Compact */}
                {selectedThemeId && (
                    <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-xs text-muted">
                            {themes.find(t => t.id === selectedThemeId)?.description}
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Full version (original)
    return (
        <div className="space-y-4">
            <label className="block text-sm font-semibold text-foreground mb-3">
                Tema Visual
            </label>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {themes.map((theme) => (
                    <button
                        key={theme.id}
                        type="button"
                        onClick={() => onThemeSelect(theme.id)}
                        className={`
              relative group rounded-xl p-4 border-2 transition-all
              ${selectedThemeId === theme.id
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                                : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
                            }
            `}
                    >
                        {/* Color Preview */}
                        <div className="flex gap-1.5 mb-3">
                            <div
                                className="w-8 h-8 rounded-lg shadow-md"
                                style={{ backgroundColor: theme.colors.primary }}
                            />
                            <div
                                className="w-8 h-8 rounded-lg shadow-md"
                                style={{ backgroundColor: theme.colors.secondary }}
                            />
                            <div
                                className="w-8 h-8 rounded-lg shadow-md"
                                style={{ backgroundColor: theme.colors.accent }}
                            />
                        </div>

                        {/* Theme Info */}
                        <h3 className="text-sm font-bold text-white mb-1">
                            {theme.name}
                        </h3>
                        <p className="text-xs text-muted">
                            {theme.category}
                        </p>

                        {/* Selected Indicator */}
                        {selectedThemeId === theme.id && (
                            <div className="absolute top-2 right-2">
                                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Theme Description */}
            {selectedThemeId && (
                <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-sm text-muted">
                        {themes.find(t => t.id === selectedThemeId)?.description}
                    </p>
                </div>
            )}
        </div>
    );
}
