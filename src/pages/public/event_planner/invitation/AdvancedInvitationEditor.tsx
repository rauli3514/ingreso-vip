import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { EventData } from '../types';
import { X, Save, Loader2, LayoutTemplate, Type, Music, MapPin, Gift, CheckCircle2 } from 'lucide-react';

interface AdvancedEditorProps {
    eventData: EventData;
    onClose: () => void;
}

export default function AdvancedInvitationEditor({ eventData, onClose }: AdvancedEditorProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [invitation, setInvitation] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('design');

    const eventId = eventData.cloudEventId || 'preview';

    useEffect(() => {
        fetchInvitation();
    }, []);

    const fetchInvitation = async () => {
        try {
            const { data, error } = await supabase
                .from('event_invitations')
                .select('*')
                .eq('event_id', eventId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            
            if (data) {
                setInvitation(data);
            } else {
                alert("No se encontró la invitación. Por favor corré el asistente primero.");
                onClose();
            }
        } catch (error) {
            console.error('Error fetching invitation:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { id, created_at, ...updates } = invitation;
            const { error } = await supabase
                .from('event_invitations')
                .upsert({ ...updates, updated_at: new Date().toISOString() }, { onConflict: 'event_id' });

            if (error) throw error;
            alert('¡Cambios guardados con éxito!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Hubo un error al guardar.');
        } finally {
            setSaving(false);
        }
    };

    const updateSection = (section: string, updates: any) => {
        setInvitation((prev: any) => ({
            ...prev,
            [section]: { ...prev[section], ...updates }
        }));
    };

    const updateRoot = (updates: any) => {
        setInvitation((prev: any) => ({ ...prev, ...updates }));
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        </div>
    );

    if (!invitation) return null;

    const phoneData = (function() {
        const raw = invitation?.components_config?.whatsapp_number || '';
        const prefixes = ['+549', '+569', '+52', '+57', '+34', '+1'];
        const prefix = prefixes.find(p => raw.startsWith(p)) || '+549';
        const number = raw.startsWith(prefix) ? raw.slice(prefix.length) : raw;
        return { prefix, number };
    })();

    return (
        <div className="flex-1 w-full flex flex-col bg-slate-950 overflow-hidden relative z-50">
            {/* Toolbar */}
            <div className="h-16 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between shrink-0 relative z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                        <X size={18} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-white leading-tight flex items-center gap-2">
                            Editor Avanzado
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] uppercase tracking-widest border border-amber-500/20">VIP</span>
                        </h2>
                        <p className="text-xs text-slate-400 leading-tight">Ajustá cada detalle de tu invitación</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            const url = `${window.location.origin}/invitacion/${eventId}`;
                            const message = `¡Hola! Te invito a mi evento. Podés ver todos los detalles y confirmar tu asistencia en el siguiente link:\n\n${url}`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
                        }}
                        className="p-2 md:px-4 md:py-2 bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 border border-[#25D366]/50 text-sm font-bold rounded-xl transition-all flex items-center gap-2"
                        title="Compartir por WhatsApp"
                    >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                        <span className="hidden md:inline">Enviar</span>
                    </button>
                    <button 
                        onClick={() => window.open(`/invitacion/${eventId}`, '_blank')}
                        className="px-5 py-2 bg-slate-800 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-all hidden md:block border border-slate-700"
                    >
                        Previsualizar
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin text-slate-900" /> : <Save size={16} />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-sm overflow-y-auto hidden md:block">
                    <div className="p-4 space-y-1.5">
                        <button onClick={() => setActiveTab('design')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'design' ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}`}>
                            <LayoutTemplate size={18} className={activeTab === 'design' ? 'text-purple-200' : ''} /> Diseño y Tema
                        </button>
                        <button onClick={() => setActiveTab('texts')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'texts' ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}`}>
                            <Type size={18} className={activeTab === 'texts' ? 'text-purple-200' : ''} /> Textos Principales
                        </button>
                        <button onClick={() => setActiveTab('events')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'events' ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}`}>
                            <MapPin size={18} className={activeTab === 'events' ? 'text-purple-200' : ''} /> Eventos y Mapa
                        </button>
                        <button onClick={() => setActiveTab('music')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'music' ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}`}>
                            <Music size={18} className={activeTab === 'music' ? 'text-purple-200' : ''} /> Música de Fondo
                        </button>
                        <button onClick={() => setActiveTab('gifts')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'gifts' ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}`}>
                            <Gift size={18} className={activeTab === 'gifts' ? 'text-purple-200' : ''} /> Regalos
                        </button>
                        <button onClick={() => setActiveTab('extras')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ${activeTab === 'extras' ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'}`}>
                            <CheckCircle2 size={18} className={activeTab === 'extras' ? 'text-purple-200' : ''} /> Extras y Galería
                        </button>
                    </div>
                </div>

                {/* Mobile Tabs */}
                <div className="md:hidden w-full border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md overflow-x-auto flex shrink-0 custom-scrollbar">
                    {['design', 'texts', 'events', 'music', 'gifts', 'extras'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-4 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${activeTab === tab ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400'}`}
                        >
                            {tab === 'design' && 'Diseño'}
                            {tab === 'texts' && 'Textos'}
                            {tab === 'events' && 'Eventos'}
                            {tab === 'music' && 'Música'}
                            {tab === 'gifts' && 'Regalos'}
                            {tab === 'extras' && 'Extras'}
                        </button>
                    ))}
                </div>

                {/* Editor Panel */}
                <div className="flex-1 bg-slate-950 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-2xl mx-auto space-y-6">
                        
                        {/* DISEÑO */}
                        {activeTab === 'design' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-xl font-bold text-white mb-4">Diseño y Tema</h3>
                                
                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl">
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Tema Base</label>
                                    <select 
                                        value={invitation.theme_id || 'classic'}
                                        onChange={(e) => updateRoot({ theme_id: e.target.value })}
                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                    >
                                        <option value="classic">Clásico (Dorados y Beiges)</option>
                                        <option value="rustic">Rústico (Madera y Hojas)</option>
                                        <option value="romantic">Romántico (Rosas y Pasteles)</option>
                                        <option value="ocean">Oceánico (Azules y Arena)</option>
                                        <option value="modern">Moderno (Minimalista Oscuro)</option>
                                    </select>
                                </div>

                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl">
                                    <label className="block text-sm font-bold text-slate-300 mb-2">Tipografía Principal</label>
                                    <select 
                                        value={invitation.font_family || 'Great Vibes'}
                                        onChange={(e) => updateRoot({ font_family: e.target.value })}
                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                    >
                                        <option value="Great Vibes">Cursiva Elegante (Great Vibes)</option>
                                        <option value="Playfair Display">Serif Premium (Playfair)</option>
                                        <option value="Montserrat">Moderna (Montserrat)</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-2">Esta fuente se usará para los títulos grandes y nombres.</p>
                                </div>

                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl">
                                    <label className="block text-sm font-bold text-slate-300 mb-2">URL Imagen de Fondo (Portada)</label>
                                    <input 
                                        type="text"
                                        value={invitation.cover_image_url || ''}
                                        onChange={(e) => updateRoot({ cover_image_url: e.target.value })}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                    />
                                </div>
                            </div>
                        )}

                        {/* TEXTOS */}
                        {activeTab === 'texts' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-xl font-bold text-white mb-4">Textos Principales</h3>
                                
                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-2">Nombre Principal</label>
                                        <input 
                                            type="text"
                                            value={invitation.hero_section?.title || ''}
                                            onChange={(e) => updateSection('hero_section', { title: e.target.value })}
                                            className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-2">Frase / Subtítulo</label>
                                        <input 
                                            type="text"
                                            value={invitation.hero_section?.subtitle || ''}
                                            onChange={(e) => updateSection('hero_section', { subtitle: e.target.value })}
                                            className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* EVENTOS */}
                        {activeTab === 'events' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-xl font-bold text-white mb-4">Eventos y Ubicación</h3>
                                
                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-white">Ceremonia / Evento Principal</h4>
                                        <button 
                                            onClick={() => updateSection('ceremony_section', { show: !invitation.ceremony_section?.show })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${invitation.ceremony_section?.show ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none' : 'bg-slate-800'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${invitation.ceremony_section?.show ? 'left-6' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>
                                    
                                    {invitation.ceremony_section?.show && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-300 mb-2">Fecha y Hora</label>
                                                <input 
                                                    type="datetime-local"
                                                    value={invitation.ceremony_section?.start_time || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        // Guardamos el string crudo YYYY-MM-DDTHH:mm para evitar saltos de zona horaria en el input
                                                        updateSection('ceremony_section', { start_time: val });
                                                        updateSection('countdown_section', { target_date: val });
                                                    }}
                                                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-300 mb-2">Nombre del Lugar</label>
                                                <input 
                                                    type="text"
                                                    value={invitation.ceremony_section?.location_name || ''}
                                                    onChange={(e) => updateSection('ceremony_section', { location_name: e.target.value })}
                                                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-300 mb-2">Link de Google Maps</label>
                                                <input 
                                                    type="text"
                                                    value={invitation.ceremony_section?.map_url || ''}
                                                    onChange={(e) => updateSection('ceremony_section', { map_url: e.target.value })}
                                                    placeholder="https://maps.app.goo.gl/..."
                                                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* MUSIC */}
                        {activeTab === 'music' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-xl font-bold text-white mb-4">Música de Fondo</h3>
                                
                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-2">Enlace de YouTube</label>
                                        <input 
                                            type="text"
                                            value={invitation.hero_section?.music?.url || ''}
                                            onChange={(e) => updateSection('hero_section', { music: { ...invitation.hero_section?.music, url: e.target.value } })}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-2">Iniciar en el segundo:</label>
                                        <input 
                                            type="number"
                                            value={invitation.components_config?.music_start_time || 0}
                                            onChange={(e) => updateSection('components_config', { music_start_time: parseInt(e.target.value) || 0 })}
                                            placeholder="0"
                                            className="w-full max-w-[150px] bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        />
                                        <p className="text-xs text-slate-500 mt-1">Ej: Si ponés 30, la canción empezará en el segundo 30.</p>
                                    </div>
                                </div>

                                {/* Formulario Simple de Sugerencias */}
                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl flex items-center justify-between">
                                    <div>
                                        <h4 className="font-bold text-white text-lg">Botón "Sugerir Canción"</h4>
                                        <p className="text-sm text-slate-400">Agrega un botón al final para que los invitados recomienden canciones que irán a la tabla de Confirmaciones Web.</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={invitation.components_config?.suggest_song_enabled !== false}
                                            onChange={(e) => updateSection('components_config', { suggest_song_enabled: e.target.checked })}
                                        />
                                        <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r from-purple-600 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none"></div>
                                    </label>
                                </div>

                                {/* Playlist Colaborativa y Spotify */}
                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-white text-lg">Playlist Colaborativa & Spotify</h4>
                                            <p className="text-sm text-slate-400">Una sección entera donde los invitados pueden proponer temas y votarlos públicamente.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer"
                                                checked={invitation.components_config?.playlist?.show !== false}
                                                onChange={(e) => updateSection('components_config', { playlist: { ...invitation.components_config?.playlist, show: e.target.checked } })}
                                            />
                                            <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r from-purple-600 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none"></div>
                                        </label>
                                    </div>
                                    
                                    {invitation.components_config?.playlist?.show !== false && (
                                        <div className="pt-4 border-t border-slate-800">
                                            <label className="block text-sm font-bold text-slate-300 mb-2">Link de Playlist de Spotify (Opcional)</label>
                                            <input 
                                                type="text"
                                                value={invitation.components_config?.playlist?.spotify_url || ''}
                                                onChange={(e) => updateSection('components_config', { playlist: { ...invitation.components_config?.playlist, spotify_url: e.target.value } })}
                                                placeholder="https://open.spotify.com/playlist/..."
                                                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* GIFTS */}
                        {activeTab === 'gifts' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-xl font-bold text-white mb-4">Sección de Regalos</h3>
                                
                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-white">Mostrar Sección</h4>
                                        <button 
                                            onClick={() => updateSection('gifts_section', { show: !invitation.gifts_section?.show })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${invitation.gifts_section?.show ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none' : 'bg-slate-800'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${invitation.gifts_section?.show ? 'left-6' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>

                                    {invitation.gifts_section?.show && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-300 mb-2">Mensaje Sugerido</label>
                                                <textarea 
                                                    value={invitation.gifts_section?.content || ''}
                                                    onChange={(e) => updateSection('gifts_section', { content: e.target.value })}
                                                    rows={3}
                                                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-300 mb-2">Alias CBU</label>
                                                    <input 
                                                        type="text"
                                                        value={invitation.gifts_section?.alias || ''}
                                                        onChange={(e) => updateSection('gifts_section', { alias: e.target.value })}
                                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-300 mb-2">Titular de la Cuenta</label>
                                                    <input 
                                                        type="text"
                                                        value={invitation.gifts_section?.owner || ''}
                                                        onChange={(e) => updateSection('gifts_section', { owner: e.target.value })}
                                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* EXTRAS (Gallery, Social, Dress Code) */}
                        {activeTab === 'extras' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <h3 className="text-xl font-bold text-white mb-4">Galería, Redes y Extras</h3>
                                
                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-bold text-white">Galería de Imágenes</h4>
                                        <button 
                                            onClick={() => updateSection('gallery_section', { show: !invitation.gallery_section?.show })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${invitation.gallery_section?.show ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none' : 'bg-slate-800'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${invitation.gallery_section?.show ? 'left-6' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>
                                    {invitation.gallery_section?.show && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-300 mb-2">URLs de las imágenes (una por línea)</label>
                                            <textarea 
                                                value={(invitation.gallery_section?.images || []).join('\n')}
                                                onChange={(e) => updateSection('gallery_section', { images: e.target.value.split('\n').filter(url => url.trim() !== '') })}
                                                rows={4}
                                                placeholder="https://ejemplo.com/foto1.jpg&#10;https://ejemplo.com/foto2.jpg"
                                                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner text-sm whitespace-pre"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <h4 className="font-bold text-white">Dress Code e Información Extra</h4>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-sm text-slate-400">Mostrar Sección de Info</p>
                                        <button 
                                            onClick={() => updateSection('extra_info_section', { show: !invitation.extra_info_section?.show })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${invitation.extra_info_section?.show ? 'bg-gradient-to-r from-purple-600 to-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] border-none' : 'bg-slate-800'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${invitation.extra_info_section?.show ? 'left-6' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>
                                    {invitation.extra_info_section?.show && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-300 mb-2">Título de la Sección</label>
                                            <input 
                                                type="text"
                                                value={invitation.extra_info_section?.title || 'Información Importante'}
                                                onChange={(e) => updateSection('extra_info_section', { title: e.target.value })}
                                                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner mb-4"
                                            />
                                            <label className="block text-sm font-bold text-slate-300 mb-2">Texto (Dress Code, Tips, etc.)</label>
                                            <textarea 
                                                value={invitation.extra_info_section?.subtitle || ''}
                                                onChange={(e) => updateSection('extra_info_section', { subtitle: e.target.value })}
                                                rows={4}
                                                placeholder="Ej: Dress Code: Elegante Sport. Sugerimos calzado cómodo."
                                                className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <h4 className="font-bold text-white">Formulario de Asistencia (RSVP)</h4>
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-sm font-bold text-white">Habilitar Confirmación</p>
                                            <p className="text-xs text-slate-400">Tus invitados podrán confirmar desde la web</p>
                                        </div>
                                        <button 
                                            onClick={() => updateSection('components_config', { rsvp_enabled: !invitation.components_config?.rsvp_enabled })}
                                            className={`w-12 h-6 rounded-full transition-colors relative ${(invitation.components_config?.rsvp_enabled !== false) ? 'bg-emerald-600' : 'bg-slate-800'}`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${(invitation.components_config?.rsvp_enabled !== false) ? 'left-6' : 'left-0.5'}`}></div>
                                        </button>
                                    </div>
                                    {(invitation.components_config?.rsvp_enabled !== false) && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-300 mb-2">WhatsApp para recibir confirmaciones</label>
                                            <div className="flex gap-2">
                                                <select 
                                                    className="bg-slate-950/80 border border-slate-800/80 rounded-xl px-2 py-3 text-white focus:outline-none focus:border-purple-500 shadow-inner w-[100px] text-sm"
                                                    value={phoneData.prefix}
                                                    onChange={(e) => {
                                                        updateSection('components_config', { whatsapp_number: e.target.value + phoneData.number });
                                                    }}
                                                >
                                                    <option value="+549">🇦🇷 +54 9</option>
                                                    <option value="+569">🇨🇱 +56 9</option>
                                                    <option value="+52">🇲🇽 +52</option>
                                                    <option value="+57">🇨🇴 +57</option>
                                                    <option value="+34">🇪🇸 +34</option>
                                                    <option value="+1">🇺🇸 +1</option>
                                                </select>
                                                <input 
                                                    type="tel"
                                                    value={phoneData.number}
                                                    onChange={(e) => {
                                                        updateSection('components_config', { whatsapp_number: phoneData.prefix + e.target.value.replace(/\D/g, '') });
                                                    }}
                                                    placeholder="1123456789"
                                                    className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                                />
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">No incluyas el 0 del código de área ni el 15. Ej: si es 011 15-2345-6789, poné 1123456789.</p>
                                        </div>
                                    )}
                                </div>

                                <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800/80 shadow-xl space-y-4">
                                    <h4 className="font-bold text-white">Redes Sociales</h4>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-300 mb-2">Hashtag de Instagram</label>
                                        <input 
                                            type="text"
                                            value={invitation.social_section?.hashtag || ''}
                                            onChange={(e) => updateSection('social_section', { show: true, hashtag: e.target.value })}
                                            placeholder="#NuestraBoda2026"
                                            className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl px-5 shadow-inner py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
