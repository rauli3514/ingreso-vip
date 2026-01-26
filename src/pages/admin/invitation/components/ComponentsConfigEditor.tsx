import { InvitationData } from '../../../../types';
import { Shirt, Music, Users, Trophy, Trash2 } from 'lucide-react';

interface Props {
    invitation: Partial<InvitationData>;
    onChange: (field: string, value: any) => void;
}

export default function ComponentsConfigEditor({ invitation, onChange }: Props) {
    const config = invitation.components_config || {};

    const updateConfig = (section: string, field: string | null, value: any) => {
        const newConfig: any = { ...config };
        if (!newConfig[section]) newConfig[section] = {};

        if (field) {
            newConfig[section][field] = value;
        } else {
            // Actualizar objeto completo o toggle
            newConfig[section] = value;
        }

        onChange('components_config', newConfig);
    };

    const handleColorChange = (section: 'recommended_colors' | 'avoid_colors', index: number, value: string) => {
        const currentColors = config.dress_code?.[section] || [];
        const newColors = [...currentColors];
        newColors[index] = value;
        updateConfig('dress_code', section, newColors);
    };

    const addColor = (section: 'recommended_colors' | 'avoid_colors') => {
        const currentColors = config.dress_code?.[section] || [];
        const newColors = [...currentColors, '#000000'];
        updateConfig('dress_code', section, newColors);
    };

    const removeColor = (section: 'recommended_colors' | 'avoid_colors', index: number) => {
        const currentColors = config.dress_code?.[section] || [];
        const newColors = currentColors.filter((_, i) => i !== index);
        updateConfig('dress_code', section, newColors);
    };

    return (
        <div className="space-y-8">
            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-8">
                <h3 className="text-xl font-bold text-indigo-900 mb-2">Configuración de Componentes</h3>
                <p className="text-indigo-700">Personaliza los módulos extra de tu invitación.</p>
            </div>

            {/* DRESS CODE */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-stone-100 rounded-lg">
                        <Shirt className="text-stone-600" size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">Dress Code Modal</h4>
                        <p className="text-xs text-slate-500">Colores sugeridos y prohibidos</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Colores Recomendados</label>
                        <div className="flex flex-wrap gap-2">
                            {(config.dress_code?.recommended_colors || ['#C5A572', '#F4E4D7', '#8B7355']).map((color: string, i: number) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => handleColorChange('recommended_colors', i, e.target.value)}
                                        className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                                    />
                                    <button onClick={() => removeColor('recommended_colors', i)} className="text-xs text-red-500 hover:underline">Borrar</button>
                                </div>
                            ))}
                            <button
                                onClick={() => addColor('recommended_colors')}
                                className="w-12 h-12 rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Colores a Evitar</label>
                        <div className="flex flex-wrap gap-2">
                            {(config.dress_code?.avoid_colors || ['#FFFFFF', '#000000']).map((color: string, i: number) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => handleColorChange('avoid_colors', i, e.target.value)}
                                        className="w-12 h-12 rounded cursor-pointer border-0 p-0"
                                    />
                                    <button onClick={() => removeColor('avoid_colors', i)} className="text-xs text-red-500 hover:underline">Borrar</button>
                                </div>
                            ))}
                            <button
                                onClick={() => addColor('avoid_colors')}
                                className="w-12 h-12 rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Dress Code Images */}
                    <div className="pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700 mb-2">Imágenes de Inspiración (URLs)</label>
                        <div className="space-y-2">
                            {(config.dress_code?.inspiration_images || []).map((url: string, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => {
                                            const newImages = [...(config.dress_code?.inspiration_images || [])];
                                            newImages[i] = e.target.value;
                                            updateConfig('dress_code', 'inspiration_images', newImages);
                                        }}
                                        className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm"
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                    />
                                    <img src={url} alt="Preview" className="w-10 h-10 object-cover rounded bg-slate-100" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    <button
                                        onClick={() => {
                                            const newImages = (config.dress_code?.inspiration_images || []).filter((_: any, idx: number) => idx !== i);
                                            updateConfig('dress_code', 'inspiration_images', newImages);
                                        }}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => {
                                    const newImages = [...(config.dress_code?.inspiration_images || []), ''];
                                    updateConfig('dress_code', 'inspiration_images', newImages);
                                }}
                                className="text-sm text-indigo-600 font-medium hover:text-indigo-800 flex items-center gap-1"
                            >
                                + Agregar Imagen
                            </button>
                            <p className="text-xs text-slate-400 mt-1">Si dejas esto vacío, no se mostrará ninguna galería de inspiración.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* PLAYLIST */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                        <Music className="text-green-600" size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">Playlist Colaborativa</h4>
                        <p className="text-xs text-slate-500">Integración con Spotify</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.playlist?.show !== false}
                            onChange={(e) => updateConfig('playlist', 'show', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Mostrar sección de Playlist</span>
                    </label>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Spotify Playlist URL</label>
                        <input
                            type="text"
                            value={config.playlist?.spotify_url || ''}
                            onChange={(e) => updateConfig('playlist', 'spotify_url', e.target.value)}
                            placeholder="https://open.spotify.com/playlist/..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-slate-900 bg-white"
                        />
                        <p className="text-xs text-slate-500 mt-1">Copia el link de tu playlist de Spotify aquí.</p>
                    </div>
                </div>
            </div>

            {/* ATTENDEE COUNTER */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="text-blue-600" size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">Contador de Asistentes</h4>
                        <p className="text-xs text-slate-500">Widget flotante</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.attendee_counter?.show !== false}
                            onChange={(e) => updateConfig('attendee_counter', 'show', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Mostrar contador flotante</span>
                    </label>
                </div>
            </div>

            {/* TRIVIA */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                        <Trophy className="text-yellow-600" size={24} />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-slate-800">Trivia</h4>
                        <p className="text-xs text-slate-500">Juego de preguntas y respuestas</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={config.trivia?.show !== false}
                            onChange={(e) => updateConfig('trivia', 'show', e.target.checked)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Habilitar Trivia</span>
                    </label>
                </div>
            </div>
        </div>
    );
}
