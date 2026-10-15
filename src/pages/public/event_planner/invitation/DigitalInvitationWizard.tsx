import React, { useState } from 'react';
import { Palette, Calendar, Layout, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Wand2 } from 'lucide-react';
import { EventData } from '../types';
import { supabase } from '../../../../lib/supabase';

interface DigitalInvitationWizardProps {
    eventData: EventData;
    onComplete: (settings: any) => void;
    onCancel: () => void;
}

export default function DigitalInvitationWizard({ eventData, onComplete, onCancel }: DigitalInvitationWizardProps) {
    const [step, setStep] = useState(1);
    
    // Default initial settings
    const [settings, setSettings] = useState({
        theme_id: 'romantic',
        event_name: eventData.name || '',
        event_date: eventData.date || '',
        event_time: '21:00',
        location_name: '',
        location_address: '',
        // Ceremonia (iglesia / civil), aparte de la fiesta
        has_ceremony: false,
        ceremony_time: '',
        ceremony_location_name: '',
        ceremony_address: '',
        // Datos de cada módulo
        dress_code: 'Elegante',
        dress_code_note: '',
        gifts_alias: '',
        gifts_cbu: '',
        gifts_owner: '',
        gifts_bank: '',
        gifts_mercadopago_link: '',
        music_url: '',
        playlist_spotify_url: '',
        modules: {
            rsvp: true,
            dress_code: false,
            gifts: false,
            gallery: false,
            music: false,
            playlist: false
        }
    });

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const toggleModule = (module: keyof typeof settings.modules) => {
        setSettings(prev => ({
            ...prev,
            modules: {
                ...prev.modules,
                [module]: !prev.modules[module]
            }
        }));
    };

    const [saving, setSaving] = useState(false);

    const handleFinish = async () => {
        setSaving(true);
        try {
            // Estructura que lee la invitación pública (InvitationRenderer)
            const partyStart = `${settings.event_date}T${settings.event_time}:00`;
            const ceremonyStart = settings.has_ceremony && settings.ceremony_time
                ? `${settings.event_date}T${settings.ceremony_time}:00`
                : partyStart;
            const invitationData = {
                event_id: eventData.cloudEventId || 'preview',
                theme_id: settings.theme_id,
                hero_section: {
                    show: true,
                    title: settings.event_name,
                    subtitle: '¡Estás Invitado!',
                    show_date: true,
                    ...(settings.modules.music && settings.music_url.trim()
                        ? { music: { url: settings.music_url.trim(), start: 0 } }
                        : {})
                },
                ceremony_section: {
                    show: settings.has_ceremony,
                    title: 'Ceremonia',
                    start_time: ceremonyStart,
                    location_name: settings.ceremony_location_name,
                    address: settings.ceremony_address
                },
                party_section: {
                    show: true,
                    title: 'Fiesta',
                    start_time: partyStart,
                    location_name: settings.location_name,
                    address: settings.location_address
                },
                countdown_section: {
                    show: true,
                    title: 'Faltan',
                    target_date: settings.has_ceremony ? ceremonyStart : partyStart
                },
                gallery_section: { show: settings.modules.gallery, title: 'Galería', images: [] },
                gifts_section: {
                    show: settings.modules.gifts,
                    title: 'Regalos',
                    subtitle: 'Tu presencia es nuestro mejor regalo. Si además querés hacernos un presente:',
                    alias: settings.gifts_alias.trim(),
                    cbu: settings.gifts_cbu.trim(),
                    owner: settings.gifts_owner.trim(),
                    bank: settings.gifts_bank.trim(),
                    mercadopago_link: settings.gifts_mercadopago_link.trim()
                },
                extra_info_section: {
                    show: settings.modules.dress_code,
                    title: 'Información Importante',
                    subtitle: settings.dress_code_note.trim(),
                    blocks: {
                        dress_code: { show: true, title: 'Dress Code', content: settings.dress_code },
                        music: { show: settings.modules.playlist, title: 'Música' },
                        tips: { show: false, title: 'Tips y Notas', content: '' }
                    }
                },
                components_config: {
                    playlist: {
                        show: settings.modules.playlist,
                        spotify_url: settings.playlist_spotify_url.trim()
                    }
                }
            };

            // Solo guardar si hay ID de evento real
            if (eventData.cloudEventId) {
                const { error } = await supabase
                    .from('event_invitations')
                    .upsert(invitationData, { onConflict: 'event_id' });
                
                if (error) throw error;
            }

            onComplete(settings);
        } catch (error) {
            console.error('Error guardando invitación:', error);
            alert('Hubo un error al crear la invitación. Reintentá.');
        } finally {
            setSaving(false);
        }
    };

    const themes = [
        { id: 'classic', name: 'Clásico', desc: 'Elegancia atemporal con tipografía serif', colors: ['bg-[#8B7355]', 'bg-[#E8E1D9]', 'bg-[#D4C3A3]'] },
        { id: 'rustic', name: 'Rústico', desc: 'Hojas, estilo campo con tonos madera', colors: ['bg-[#654321]', 'bg-[#F4F1EA]', 'bg-[#8B7355]'] },
        { id: 'romantic', name: 'Romántico', desc: 'Suave y delicado con rosas y pastel', colors: ['bg-[#DDA0DD]', 'bg-[#FFF0F5]', 'bg-[#FFB6C1]'] },
        { id: 'ocean', name: 'Oceánico', desc: 'Azules y arena para bodas en la costa', colors: ['bg-[#2C5F7A]', 'bg-[#F2EFE9]', 'bg-[#D4C3A3]'] },
        { id: 'forest', name: 'Bosque', desc: 'Romántico y natural con verdes florales', colors: ['bg-[#2E8B57]', 'bg-[#F0FFF0]', 'bg-[#8FBC8F]'] },
        { id: 'modern', name: 'Moderno', desc: 'Minimalista y contemporáneo con líneas', colors: ['bg-[#1A1A24]', 'bg-[#F8F9FA]', 'bg-[#D4AF37]'] },
        { id: 'boho', name: 'Boho', desc: 'Tonos tierra, acuarelas y vegetación', colors: ['bg-[#A0522D]', 'bg-[#FAF0E6]', 'bg-[#CD853F]'] },
        { id: 'elegant', name: 'Elegante', desc: 'Serif dorado sobre fondo oscuro de lujo', colors: ['bg-[#D4AF37]', 'bg-[#1A1A1A]', 'bg-[#C0C0C0]'] },
        { id: 'burgundy', name: 'Invernal', desc: 'Tonos burdeos y cálidos de invierno', colors: ['bg-[#800020]', 'bg-[#FFF5EE]', 'bg-[#DAA520]'] }
    ];

    return (
        <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col p-4 md:p-8 relative">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <Wand2 className="text-purple-400" size={20} />
                        </div>
                        Creador Mágico
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">Configurá tu invitación digital en 3 simples pasos</p>
                </div>
                <button 
                    onClick={onCancel}
                    className="text-slate-500 hover:text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-full transition-all text-sm font-medium border border-slate-800"
                >
                    Cancelar
                </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between relative mb-10 max-w-3xl mx-auto w-full px-4">
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-800/80 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-700 ease-out"
                        style={{ width: `${((step - 1) / 2) * 100}%` }}
                    ></div>
                </div>
                
                {[1, 2, 3].map(i => (
                    <div 
                        key={i} 
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold relative z-10 transition-all duration-500 ${
                            step >= i 
                            ? 'bg-slate-900 border-2 border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                            : 'bg-slate-900 border-2 border-slate-800 text-slate-600'
                        }`}
                    >
                        {step > i ? <CheckCircle2 size={24} className="text-purple-400" /> : i}
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-[2rem] p-6 md:p-10 shadow-2xl overflow-y-auto custom-scrollbar">
                
                {/* STEP 1: STYLE */}
                {step === 1 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                                <Palette size={32} />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Elegí tu Estilo</h3>
                            <p className="text-slate-400 text-sm">Seleccioná el tema base. Podrás personalizarlo a fondo más adelante.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                            {themes.map(theme => (
                                <button
                                    key={theme.id}
                                    onClick={() => updateSetting('theme_id', theme.id)}
                                    className={`relative flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 overflow-hidden ${
                                        settings.theme_id === theme.id 
                                        ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(168,85,247,0.15)] scale-[1.02]' 
                                        : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-900 hover:border-slate-700'
                                    }`}
                                >
                                    {settings.theme_id === theme.id && (
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none"></div>
                                    )}
                                    <div className="flex items-center gap-2 mb-5">
                                        <div className={`w-14 h-8 rounded-lg shadow-inner ${theme.colors[0]}`}></div>
                                        <div className={`w-6 h-8 rounded-lg shadow-inner ${theme.colors[1]}`}></div>
                                        <div className={`w-6 h-8 rounded-lg shadow-inner ${theme.colors[2]}`}></div>
                                    </div>
                                    <h4 className={`font-bold text-lg mb-1 ${settings.theme_id === theme.id ? 'text-white' : 'text-slate-200'}`}>{theme.name}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">{theme.desc}</p>
                                    
                                    {settings.theme_id === theme.id && (
                                        <div className="absolute top-5 right-5 text-amber-400 animate-in zoom-in duration-300">
                                            <CheckCircle2 size={22} className="fill-amber-500/20" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: DETAILS */}
                {step === 2 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-500/10 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                                <Calendar size={32} />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Datos del Evento</h3>
                            <p className="text-slate-400 text-sm">¿Cuándo y dónde será el gran día?</p>
                        </div>

                        <div className="space-y-6 max-w-2xl mx-auto">
                            <div>
                                <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Nombre del Evento</label>
                                <input 
                                    type="text"
                                    value={settings.event_name}
                                    onChange={(e) => updateSetting('event_name', e.target.value)}
                                    className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                    placeholder="Ej: Mis 15, Boda de Ana & Juan"
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Fecha</label>
                                    <input 
                                        type="date"
                                        value={settings.event_date}
                                        onChange={(e) => updateSetting('event_date', e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Hora de Inicio</label>
                                    <input 
                                        type="time"
                                        value={settings.event_time}
                                        onChange={(e) => updateSetting('event_time', e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner [color-scheme:dark]"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Nombre del Salón</label>
                                    <input 
                                        type="text"
                                        value={settings.location_name}
                                        onChange={(e) => updateSetting('location_name', e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        placeholder="Ej: Salón Las Palmas"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Dirección</label>
                                    <input 
                                        type="text"
                                        value={settings.location_address}
                                        onChange={(e) => updateSetting('location_address', e.target.value)}
                                        className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner"
                                        placeholder="Ej: Av. San Martín 1234"
                                    />
                                </div>
                            </div>

                            {/* Ceremonia (opcional) */}
                            <div className={`rounded-2xl border p-5 transition-all ${settings.has_ceremony ? 'border-purple-500/40 bg-purple-500/5' : 'border-slate-800/80 bg-slate-950/40'}`}>
                                <label className="flex items-center justify-between gap-4 cursor-pointer">
                                    <div>
                                        <p className="font-bold text-slate-200">¿Hay ceremonia (iglesia o civil) antes de la fiesta?</p>
                                        <p className="text-sm text-slate-500">Se muestra como un evento aparte, con su hora y su mapa.</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={settings.has_ceremony}
                                        onChange={(e) => updateSetting('has_ceremony', e.target.checked)}
                                        className="w-6 h-6 accent-purple-500 shrink-0"
                                    />
                                </label>
                                {settings.has_ceremony && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 animate-in fade-in slide-in-from-top-2">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Hora</label>
                                            <input type="time" value={settings.ceremony_time} onChange={(e) => updateSetting('ceremony_time', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner [color-scheme:dark]" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Lugar</label>
                                            <input type="text" value={settings.ceremony_location_name} onChange={(e) => updateSetting('ceremony_location_name', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="Ej: Parroquia San José" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">Dirección</label>
                                            <input type="text" value={settings.ceremony_address} onChange={(e) => updateSetting('ceremony_address', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="Ej: Belgrano 450" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3: MODULES */}
                {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
                                <Layout size={32} />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Módulos Extra</h3>
                            <p className="text-slate-400 text-sm">Activá las secciones adicionales que necesites en tu web.</p>
                        </div>

                        <div className="space-y-4 max-w-2xl mx-auto">
                            <ModuleCard
                                title="Dress Code"
                                description="Indicá el código de vestimenta"
                                active={settings.modules.dress_code}
                                onToggle={() => toggleModule('dress_code')}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <select value={settings.dress_code} onChange={(e) => updateSetting('dress_code', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner">
                                        {['Elegante', 'Elegante Sport', 'Formal / Etiqueta', 'Casual', 'Temático'].map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    <input type="text" value={settings.dress_code_note} onChange={(e) => updateSetting('dress_code_note', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="Nota (opcional). Ej: evitar el blanco" />
                                </div>
                            </ModuleCard>

                            <ModuleCard
                                title="Regalos"
                                description="Tus datos para recibir regalos en dinero"
                                active={settings.modules.gifts}
                                onToggle={() => toggleModule('gifts')}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input type="text" value={settings.gifts_alias} onChange={(e) => updateSetting('gifts_alias', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="Alias (ej: boda.ana.juan)" />
                                    <input type="text" value={settings.gifts_cbu} onChange={(e) => updateSetting('gifts_cbu', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="CBU / CVU (opcional)" />
                                    <input type="text" value={settings.gifts_owner} onChange={(e) => updateSetting('gifts_owner', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="Titular de la cuenta" />
                                    <input type="text" value={settings.gifts_bank} onChange={(e) => updateSetting('gifts_bank', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="Banco (opcional)" />
                                    <input type="url" value={settings.gifts_mercadopago_link} onChange={(e) => updateSetting('gifts_mercadopago_link', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner md:col-span-2" placeholder="Link de pago de MercadoPago (opcional)" />
                                </div>
                            </ModuleCard>

                            <ModuleCard
                                title="Música de Fondo"
                                description="Suena tu canción cuando abren la invitación"
                                active={settings.modules.music}
                                onToggle={() => toggleModule('music')}
                            >
                                <input type="url" value={settings.music_url} onChange={(e) => updateSetting('music_url', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="Link de YouTube de la canción" />
                            </ModuleCard>

                            <ModuleCard
                                title="Playlist Colaborativa"
                                description="Los invitados sugieren canciones para la fiesta"
                                active={settings.modules.playlist}
                                onToggle={() => toggleModule('playlist')}
                            >
                                <input type="url" value={settings.playlist_spotify_url} onChange={(e) => updateSetting('playlist_spotify_url', e.target.value)} className="w-full bg-slate-950/80 border border-slate-800/80 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all shadow-inner" placeholder="Link de tu playlist de Spotify (opcional)" />
                                <p className="text-xs text-slate-500 mt-2">Las canciones sugeridas las ves en el Editor Avanzado.</p>
                            </ModuleCard>
                        </div>

                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div className="flex items-center justify-between mt-8 max-w-3xl mx-auto w-full px-2">
                <button 
                    onClick={() => setStep(step > 1 ? step - 1 : 1)}
                    className={`px-8 py-3.5 rounded-full font-bold flex items-center gap-2 transition-all ${step === 1 ? 'opacity-0 pointer-events-none' : 'bg-slate-900 border border-slate-800 text-white hover:bg-slate-800'}`}
                >
                    <ChevronLeft size={20} /> Atrás
                </button>

                {step < 3 ? (
                    <button 
                        onClick={() => setStep(step + 1)}
                        className="px-10 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-full font-bold flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                    >
                        Siguiente <ChevronRight size={20} />
                    </button>
                ) : (
                    <button 
                        onClick={handleFinish}
                        disabled={saving}
                        className="px-10 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-900 rounded-full font-bold flex items-center gap-2 transition-all shadow-[0_0_30px_rgba(245,158,11,0.5)] disabled:opacity-70"
                    >
                        {saving ? <span className="animate-spin text-slate-900">⏳</span> : <Sparkles size={20} />}
                        Crear Invitación VIP
                    </button>
                )}
            </div>
        </div>
    );
}

function ModuleCard({ title, description, active, onToggle, children }: {
    title: string;
    description: string;
    active: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}) {
    return (
        <div className={`rounded-2xl border transition-all duration-300 ${active
            ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
            : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-900 hover:border-slate-700'
            }`}>
            <div onClick={onToggle} className="p-5 flex items-center justify-between cursor-pointer">
                <div>
                    <h4 className={`font-bold text-lg mb-1 ${active ? 'text-amber-400' : 'text-slate-200'}`}>{title}</h4>
                    <p className="text-sm text-slate-500">{description}</p>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors shrink-0 ${active ? 'border-amber-500 bg-amber-500 text-slate-900' : 'border-slate-700 text-transparent'}`}>
                    <CheckCircle2 size={16} />
                </div>
            </div>
            {active && <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2">{children}</div>}
        </div>
    );
}
