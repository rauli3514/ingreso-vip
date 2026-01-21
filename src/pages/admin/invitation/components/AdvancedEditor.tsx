import { useState, useRef, useEffect } from 'react';
import { InvitationData } from '../../../../types';
import { Type, Palette, Trash2, MousePointer2, Move, Sun, X, Upload, Layers, Play, Check } from 'lucide-react';
import InvitationRenderer from '../../../public/invitation/InvitationRenderer';
import { createPortal } from 'react-dom';

interface Props {
    invitation: InvitationData;
    onChange: (updates: Partial<InvitationData>) => void;
    onClose: () => void;
}

const DEFAULT_ADVANCED_SETTINGS: NonNullable<InvitationData['advanced_settings']> = {
    typography: {
        heading_scale: 1,
        body_scale: 1,
        line_height: 1.5,
        weight_titles: '400',
        alignment: 'center'
    },
    colors: {
        overlay_opacity: 0.4
    },
    decorations: [],
    animations: {
        enabled: true,
        intensity: 'soft',
        entry_effect: 'fade'
    }
};

const FILTERS = [
    { name: 'Normal', value: 'none' },
    { name: 'B&W', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Blur', value: 'blur(4px)' },
    { name: 'Brillo', value: 'brightness(1.5)' },
    { name: 'Contraste', value: 'contrast(1.5)' },
];

export default function AdvancedEditor({ invitation, onChange, onClose }: Props) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [localData, setLocalData] = useState<InvitationData>(invitation);
    const [selectedElement, setSelectedElement] = useState<{ id: string, type: 'text' | 'decoration', index?: number } | null>(null);
    const [activeTab, setActiveTab] = useState<'layers' | 'styles' | 'animation'>('layers');

    useEffect(() => {
        setLocalData(invitation);
    }, [invitation]);

    const updateGlobal = (newData: InvitationData) => {
        setLocalData(newData);
        onChange({
            advanced_settings: newData.advanced_settings,
            hero_section: newData.hero_section,
            // @ts-ignore
            primary_color: newData.primary_color,
            // @ts-ignore
            secondary_color: newData.secondary_color,
            // @ts-ignore
            font_family: newData.font_family
        });
    };

    const handleSave = () => {
        // Trigger final save manually if needed, though onChange updates parent state.
        // We can just close, assuming parent handles 'onChange' effectively.
        // Or we could have a dedicated onSave prop. For now, we trust onChange + Close.
        onClose();
    };

    // --- DECORACIONES ---

    const addDecoration = (url: string) => {
        const currentSettings = localData.advanced_settings || DEFAULT_ADVANCED_SETTINGS;
        const currentDecos = currentSettings.decorations || [];
        const newDeco = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'image' as const,
            url,
            position: 'center' as const,
            offset_x: 0,
            offset_y: 0,
            scale: 1,
            opacity: 1,
            rotation: 0,
            z_index: 10,
            filters: 'none'
        };

        const newSettings = {
            ...currentSettings,
            decorations: [...currentDecos, newDeco]
        };
        // @ts-ignore
        updateGlobal({ ...localData, advanced_settings: newSettings });
        setSelectedElement({ id: newDeco.id, type: 'decoration', index: currentDecos.length });
        setActiveTab('layers');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 1. Mostrar preview inmediato
        const objectUrl = URL.createObjectURL(file);
        addDecoration(objectUrl);

        // TODO: Implementar subida real a Supabase Storage 'assets'
        // const { data, error } = await supabase.storage.from('assets').upload(...)
    };

    const updateSelectedDecoration = (updates: any) => {
        if (!selectedElement || selectedElement.type !== 'decoration' || selectedElement.index === undefined) return;

        const currentDecos = [...(localData.advanced_settings?.decorations || [])];
        currentDecos[selectedElement.index] = { ...currentDecos[selectedElement.index], ...updates };

        const newSettings = { ...localData.advanced_settings!, decorations: currentDecos };
        // @ts-ignore
        updateGlobal({ ...localData, advanced_settings: newSettings });
    };

    const removeSelectedDecoration = () => {
        if (!selectedElement || selectedElement.type !== 'decoration' || selectedElement.index === undefined) return;
        const currentDecos = localData.advanced_settings?.decorations?.filter((_, i) => i !== selectedElement.index) || [];
        const newSettings = { ...localData.advanced_settings!, decorations: currentDecos };
        // @ts-ignore
        updateGlobal({ ...localData, advanced_settings: newSettings });
        setSelectedElement(null);
    };

    const handleElementUpdate = (id: string, updates: any) => {
        let index = -1;
        const currentDecos = [...(localData.advanced_settings?.decorations || [])];

        // Intentar encontrar por ID o por índice simulado 'deco-X'
        if (id.startsWith('deco-')) {
            index = parseInt(id.split('-')[1]);
        } else {
            index = currentDecos.findIndex(d => d.id === id);
        }

        if (index !== -1 && currentDecos[index]) {
            currentDecos[index] = { ...currentDecos[index], ...updates };

            // Actualizar estado local y global sin cambiar selección necesariamente (para drag suave)
            const newSettings = { ...localData.advanced_settings!, decorations: currentDecos };
            setLocalData({ ...localData, advanced_settings: newSettings } as InvitationData);

            // Debounce global update si fuera necesario, aqui directo
            // @ts-ignore
            onChange({
                advanced_settings: newSettings,
                hero_section: localData.hero_section
            });

            // Si arrastramos algo que no estaba seleccionado, lo seleccionamos
            if (selectedElement?.index !== index) {
                setSelectedElement({ id: currentDecos[index].id || `deco-${index}`, type: 'decoration', index });
            }
        }
    };

    // --- TEXTO ---
    const updateTypography = (key: string, value: any) => {
        const currentSettings = localData.advanced_settings || DEFAULT_ADVANCED_SETTINGS;
        const newSettings = {
            ...currentSettings,
            typography: { ...currentSettings.typography, [key]: value }
        };
        // @ts-ignore
        updateGlobal({ ...localData, advanced_settings: newSettings });
    };

    // --- ESTILOS GLOBALES ---
    const updateColors = (key: string, value: string) => {
        // @ts-ignore
        updateGlobal({ ...localData, [key]: value });
    }

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-900 text-white flex overflow-hidden animate-in fade-in duration-300">

            {/* 1. LEFT SIDEBAR NAVIGATION */}
            <div className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
                {/* Header Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-950">
                    <button
                        onClick={() => setActiveTab('layers')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 ${activeTab === 'layers' ? 'text-indigo-400 bg-slate-900 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Layers size={18} /> Capas
                    </button>
                    <button
                        onClick={() => setActiveTab('styles')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 ${activeTab === 'styles' ? 'text-indigo-400 bg-slate-900 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Palette size={18} /> Estilos
                    </button>
                    <button
                        onClick={() => setActiveTab('animation')}
                        className={`flex-1 py-4 text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 ${activeTab === 'animation' ? 'text-indigo-400 bg-slate-900 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Play size={18} /> Anim
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                    {/* --- TAB: LAYERS (CAPAS) --- */}
                    {activeTab === 'layers' && (
                        <>
                            {/* Librería Rápida */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex justify-between">
                                    Agregar Elementos
                                </p>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full aspect-[3/1] bg-indigo-600/20 hover:bg-indigo-600/40 rounded-lg border border-dashed border-indigo-500 flex flex-col items-center justify-center text-indigo-300 hover:text-white transition-all active:scale-95 group"
                                    >
                                        <Upload size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                                        <span className="text-xs font-bold">Subir Imagen PNG</span>
                                        <span className="text-[10px] opacity-70">Fondos, Flores, Marcos...</span>
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/png,image/jpeg,image/gif,image/webp"
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            </div>

                            {/* Lista de Capas */}
                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Orden de Capas</p>
                                <div className="space-y-1">
                                    <div
                                        onClick={() => setSelectedElement({ id: 'title', type: 'text' })}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedElement?.id === 'title' ? 'bg-indigo-900/50 border border-indigo-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                    >
                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-slate-800 text-white font-serif font-bold text-xs">T</div>
                                        <span className="text-xs text-slate-300">Título Principal</span>
                                    </div>
                                    <div
                                        onClick={() => setSelectedElement({ id: 'subtitle', type: 'text' })}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedElement?.id === 'subtitle' ? 'bg-indigo-900/50 border border-indigo-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                    >
                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-slate-800 text-slate-400 text-xs text-center">t</div>
                                        <span className="text-xs text-slate-300">Subtítulo</span>
                                    </div>
                                    <div
                                        onClick={() => setSelectedElement({ id: 'date', type: 'text' })}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedElement?.id === 'date' ? 'bg-indigo-900/50 border border-indigo-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                    >
                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-slate-800 text-slate-400 text-xs">Cal</div>
                                        <span className="text-xs text-slate-300">Fecha</span>
                                    </div>
                                    <div
                                        onClick={() => setSelectedElement({ id: 'location', type: 'text' })}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedElement?.id === 'location' ? 'bg-indigo-900/50 border border-indigo-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                    >
                                        <div className="w-8 h-8 rounded flex items-center justify-center bg-slate-800 text-slate-400 text-xs"><Move size={12} /></div>
                                        <span className="text-xs text-slate-300">Ubicación</span>
                                    </div>

                                    {localData.advanced_settings?.decorations?.map((deco: any, i: number) => (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                setSelectedElement({ id: deco.id || `deco-${i}`, type: 'decoration', index: i });
                                                // No cambiar tab automáticamente para permitir gestión de capas
                                            }}
                                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${selectedElement?.index === i ? 'bg-indigo-900/50 border border-indigo-500/50' : 'hover:bg-slate-800 border border-transparent'}`}
                                        >
                                            <div className="w-8 h-8 bg-slate-800 rounded overflow-hidden">
                                                <img src={deco.url} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs truncate text-slate-300">Decoración {i + 1}</p>
                                            </div>
                                            {selectedElement?.index === i && (
                                                <button onClick={(e) => { e.stopPropagation(); removeSelectedDecoration(); }} className="text-slate-500 hover:text-red-400">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* --- TAB: STYLES (ESTILOS) --- */}
                    {activeTab === 'styles' && (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-200">
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Colores Principales</label>

                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-300">Color Primario</div>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            // @ts-ignore
                                            value={localData.primary_color || '#000000'}
                                            onChange={(e) => updateColors('primary_color', e.target.value)}
                                            className="w-8 h-8 rounded overflow-hidden border-0 p-0 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            // @ts-ignore
                                            value={localData.primary_color || '#000000'}
                                            onChange={(e) => updateColors('primary_color', e.target.value)}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between text-xs mb-1 text-slate-300">Color Secundario</div>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            // @ts-ignore
                                            value={localData.secondary_color || '#666666'}
                                            onChange={(e) => updateColors('secondary_color', e.target.value)}
                                            className="w-8 h-8 rounded overflow-hidden border-0 p-0 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            // @ts-ignore
                                            value={localData.secondary_color || '#666666'}
                                            onChange={(e) => updateColors('secondary_color', e.target.value)}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fondo de Pantalla</label>
                                <p className="text-[10px] text-slate-500 mb-2">Color sólido o transparencia sobre la imagen de fondo.</p>

                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={localData.advanced_settings?.colors?.background_override || '#ffffff'}
                                        // @ts-ignore
                                        onChange={(e) => updateGlobal({ ...localData, advanced_settings: { ...localData.advanced_settings, colors: { ...localData.advanced_settings?.colors, background_override: e.target.value } } })}
                                        className="w-8 h-8 rounded overflow-hidden border-0 p-0 cursor-pointer"
                                    />
                                    {/* Opacidad slider could go here */}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: ANIMATION (ANIMACION) --- */}
                    {activeTab === 'animation' && (
                        <div className="space-y-6 animate-in slide-in-from-left-4 duration-200">
                            <div className="p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
                                <p className="text-xs text-indigo-300 mb-2 font-bold">Animación de Entrada</p>
                                <p className="text-[10px] text-slate-400 leading-relaxed">
                                    Controla cómo aparecen los elementos cuando se abre la invitación.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Efecto Principal</label>
                                <select
                                    className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-xs text-white"
                                    // @ts-ignore
                                    value={localData.advanced_settings?.animations?.entry_effect || 'fade'}
                                    // @ts-ignore
                                    onChange={(e) => updateGlobal({ ...localData, advanced_settings: { ...localData.advanced_settings, animations: { ...localData.advanced_settings?.animations, entry_effect: e.target.value } } })}
                                >
                                    <option value="fade">Desvanecer (Fade In)</option>
                                    <option value="slide-up">Deslizar Arriba</option>
                                    <option value="zoom-in">Zoom In</option>
                                    <option value="bounce">Rebote</option>
                                    <option value="none">Sin Animación</option>
                                </select>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* 2. CENTER CANVAS */}
            <div className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden p-8">
                {/* Mobile Frame */}
                <div className="relative w-[375px] h-[812px] bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-800 overflow-hidden ring-1 ring-slate-700 group transition-all duration-300">
                    <div className="w-full h-full overflow-y-auto no-scrollbar relative">
                        <InvitationRenderer
                            isEditable={true}
                            previewData={localData}
                            onElementUpdate={handleElementUpdate}
                            onElementClick={(id) => {
                                setSelectedElement({ id, type: 'text' });
                                // Keep current tab or switch to layers? Let's stay context aware but allow manual switch
                            }}
                        />
                    </div>
                    {/* Status Bar */}
                    <div className="absolute top-0 w-full h-6 bg-black z-50 flex justify-between px-6 items-center pointer-events-none opacity-50">
                        <div className="text-[10px] text-white font-medium">9:41</div>
                        <div className="flex gap-1">
                            <div className="w-3 h-3 rounded-full bg-white/20"></div>
                            <div className="w-3 h-3 rounded-full bg-white/20"></div>
                        </div>
                    </div>
                </div>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-800/90 text-slate-400 px-4 py-2 rounded-full text-xs backdrop-blur-sm border border-slate-700 flex items-center gap-2 pointer-events-none">
                    <MousePointer2 size={12} /> Arrastra elementos para editar
                </div>

                {/* SAVE & CLOSE BUTTONS */}
                <div className="absolute top-6 right-6 flex gap-2 z-50">
                    <button
                        onClick={handleSave}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Check size={16} /> Guardar y Salir
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-full transition-colors active:scale-95"
                        title="Cancelar / Cerrar"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* 3. RIGHT SIDEBAR - PROPERTIES */}
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-20">
                <div className="p-4 border-b border-slate-800 bg-slate-950">
                    <h3 className="font-bold tracking-wider text-slate-200 flex items-center gap-2 text-xs uppercase">
                        {selectedElement ? `Propiedades` : 'Seleccione un elemento'}
                    </h3>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                    {!selectedElement && (
                        <div className="text-center py-10 text-slate-600">
                            <MousePointer2 size={40} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">Selecciona una capa o elemento en la vista previa para editar sus propiedades.</p>
                        </div>
                    )}

                    {selectedElement?.type === 'decoration' && selectedElement.index !== undefined && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                            {/* Transformación con SLIDERS */}
                            <div className="space-y-6 border-b border-slate-800 pb-6">
                                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                    <Move size={12} /> Transformación
                                </label>

                                <div className="space-y-4">
                                    {/* Removed X/Y manual sliders as user uses drag & drop. Keeping Scale/Rotation */}

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Escala */}
                                        <div>
                                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                <span>Tamaño</span>
                                            </div>
                                            <input
                                                type="range" min="0.1" max="3" step="0.1"
                                                value={localData.advanced_settings?.decorations?.[selectedElement.index]?.scale || 1}
                                                onChange={(e) => updateSelectedDecoration({ scale: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                                            />
                                        </div>
                                        {/* Rotación */}
                                        <div>
                                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                <span>Rotación</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="360"
                                                value={localData.advanced_settings?.decorations?.[selectedElement.index]?.rotation || 0}
                                                onChange={(e) => updateSelectedDecoration({ rotation: parseInt(e.target.value) })}
                                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                                            />
                                        </div>

                                        {/* Opacidad Filter */}
                                        <div className="col-span-2">
                                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                <span>Opacidad</span>
                                            </div>
                                            <input
                                                type="range" min="0" max="1" step="0.1"
                                                value={localData.advanced_settings?.decorations?.[selectedElement.index]?.opacity ?? 1}
                                                onChange={(e) => updateSelectedDecoration({ opacity: parseFloat(e.target.value) })}
                                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-pink-500"
                                            />
                                        </div>
                                    </div>

                                    {/* POSITION PRESETS */}
                                    <div className="flex justify-between bg-slate-800 rounded p-1.5 mt-2">
                                        {['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'].map((pos) => (
                                            <button
                                                key={pos}
                                                onClick={() => updateSelectedDecoration({ position: pos, offset_x: 0, offset_y: 0 })}
                                                className="p-1.5 hover:bg-white/10 rounded-md text-[10px] text-slate-400 hover:text-white transition-colors"
                                                title={`Mover a ${pos}`}
                                            >
                                                {pos === 'center' ? '●' : '↗'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2"><Sun size={12} /> Filtros</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {FILTERS.map(f => (
                                        <button key={f.name} onClick={() => updateSelectedDecoration({ filters: f.value })} className="text-[10px] py-1 bg-slate-800 border border-slate-700 rounded hover:border-pink-500">{f.name}</button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {selectedElement?.type === 'text' && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-200">
                            {/* EDITAR CONTENIDO */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    {selectedElement.id === 'title' ? 'Nombres' : selectedElement.id === 'subtitle' ? 'Subtítulo' : 'Texto'}
                                </label>

                                {['title', 'subtitle'].includes(selectedElement.id) ? (
                                    <textarea rows={3}
                                        value={selectedElement.id === 'title' ? (localData.hero_section?.title || '') : (localData.hero_section?.subtitle || '')}
                                        onChange={(e) => {
                                            const field = selectedElement.id === 'title' ? 'title' : 'subtitle';
                                            const newHero = { ...localData.hero_section, [field]: e.target.value };
                                            // @ts-ignore
                                            updateGlobal({ ...localData, hero_section: newHero });
                                        }}
                                        className="w-full bg-slate-800 border-slate-700 rounded p-3 text-white focus:border-indigo-500 outline-none resize-none font-serif text-lg"
                                    />
                                ) : (
                                    <div className="text-xs text-slate-500 italic p-2 border border-dashed border-slate-800 rounded">
                                        Este campo se genera automáticamente (Fecha/Lugar). <br />
                                        Puedes cambiar el estilo global abajo.
                                    </div>
                                )}
                            </div>

                            {/* ESTILOS GLOBALES */}
                            <div className="space-y-4 pt-4 border-t border-slate-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <Type size={14} className="text-indigo-400" />
                                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">Tipografía Global</label>
                                </div>

                                <select
                                    value={localData.font_family || 'Great Vibes'}
                                    onChange={(e) => updateGlobal({ ...localData, font_family: e.target.value } as InvitationData)}
                                    className="w-full bg-slate-800 border border-slate-700 text-sm p-2 rounded text-white mb-2"
                                >
                                    <option value="Great Vibes">Great Vibes</option>
                                    <option value="Cinzel">Cinzel</option>
                                    <option value="Montserrat">Montserrat</option>
                                    <option value="Playfair Display">Playfair Display</option>
                                </select>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Tamaño</span>
                                        <input type="range" min="0.5" max="2" step="0.1" value={localData.advanced_settings?.typography?.heading_scale || 1} onChange={(e) => updateTypography('heading_scale', parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-indigo-500" />
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block">Cuerpo</span>
                                        <input type="range" min="0.5" max="1.5" step="0.1" value={localData.advanced_settings?.typography?.body_scale || 1} onChange={(e) => updateTypography('body_scale', parseFloat(e.target.value))} className="w-full h-1 bg-slate-700 rounded accent-indigo-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>,
        document.body
    );
}
