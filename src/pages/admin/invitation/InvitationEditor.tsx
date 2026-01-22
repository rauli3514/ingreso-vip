import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { InvitationData } from '../../../types';

import GeneralSectionEditor from './sections/GeneralSectionEditor';
import CountdownSectionEditor from './sections/CountdownSectionEditor';
import EventSectionEditor from './sections/EventSectionEditor';
import GallerySectionEditor from './sections/GallerySectionEditor';
import GiftsSectionEditor from './sections/GiftsSectionEditor';
import ExtraInfoSectionEditor from './sections/ExtraInfoSectionEditor';
import SocialSectionEditor from './sections/SocialSectionEditor';
import FooterSectionEditor from './sections/FooterSectionEditor';
import ResponsesList from './components/ResponsesList';
import GuestsManager from './components/GuestsManager';
import AdvancedEditor from './components/AdvancedEditor';
import TriviaEditor from './components/TriviaEditor';
import TriviaResponses from './components/TriviaResponses';

import DashboardLayout from '../../../layouts/DashboardLayout';

export default function InvitationEditor() {
    const { id } = useParams<{ id: string }>(); // Event ID
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<Partial<InvitationData>>({});
    const [activeTab, setActiveTab] = useState('general');
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        fetchInvitation();
    }, [id]);

    const fetchInvitation = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('event_invitations')
                .select('*')
                .eq('event_id', id)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching invitation:', error);
            }

            if (data) {
                setInvitation(data);
            } else {
                setInvitation({
                    event_id: id,
                    theme_id: 'elegant',
                    hero_section: { show: true, title: 'Nuestra Boda', subtitle: '¡Nos casamos!', show_date: true },
                    countdown_section: { show: true, title: 'Cuenta Regresiva' },
                });
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!id || !invitation) return;
        setSaving(true);
        setErrorMsg(null); // Limpiar error previo
        try {
            // Limpiamos el objeto
            const { created_at, id: invId, ...updates } = invitation as any;

            const { error } = await supabase
                .from('event_invitations')
                .upsert({
                    event_id: id,
                    ...updates,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'event_id' });

            if (error) throw error;

            // Éxito - Usamos alert para éxito, ese no importa si es molesto
            alert('¡Guardado exitoso!');

        } catch (error: any) {
            console.error('Error saving:', error);
            // Mostrar error persistente en pantalla
            const message = error.message || error.details || JSON.stringify(error);
            setErrorMsg(`Error: ${message}`);
        } finally {
            setSaving(false);
        }
    };

    const updateInvitation = (updates: Partial<InvitationData>) => {
        setInvitation(prev => ({ ...prev, ...updates }));
    };

    const openMobilePreview = () => {
        // Abre una ventana con dimensiones de iPhone
        window.open(`/invitacion/${id}`, 'MobilePreview', 'width=390,height=844,resizable=yes,scrollbars=yes,status=yes');
    };

    const openDesktopPreview = () => {
        window.open(`/invitacion/${id}`, '_blank');
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <DashboardLayout>
            <div className="p-6 max-w-6xl mx-auto h-[calc(100vh-80px)] flex flex-col">
                {/* Header */}
                <div className="flex flex-col mb-6 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors">
                                <ArrowLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">Editor de Invitación</h1>
                                <p className="text-slate-400">Personaliza el diseño y gestiona tu evento.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {/* Botones de Previsualización */}
                            <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 mr-2">
                                <button
                                    onClick={openMobilePreview}
                                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                    title="Vista Móvil"
                                >
                                    <Smartphone size={18} />
                                </button>
                                <div className="w-px bg-white/10 mx-1"></div>
                                <button
                                    onClick={openDesktopPreview}
                                    className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors"
                                    title="Vista Escritorio"
                                >
                                    <Monitor size={18} />
                                </button>
                            </div>

                            <button
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-wider transition-all border ${showAdvanced ? 'bg-indigo-900 border-indigo-500 text-white shadow-inner' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                            >
                                <Sparkles size={16} className={showAdvanced ? 'text-yellow-400 animate-pulse' : ''} />
                                {showAdvanced ? 'Modo Experto ON' : 'Modo Experto'}
                            </button>

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-105"
                            >
                                {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                    {/* MENSAJE DE ERROR PERSISTENTE */}
                    {errorMsg && (
                        <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 flex items-center justify-between">
                            <span>{errorMsg}</span>
                            <button onClick={() => setErrorMsg(null)} className="text-sm bg-red-500/20 px-2 py-1 rounded hover:bg-red-500/40">Cerrar</button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-xl shadow-xl overflow-hidden flex border border-slate-700/50">

                    {/* Sidebar Tabs */}
                    <div className="w-64 bg-slate-50 border-r border-slate-200 p-4 flex flex-col gap-1 overflow-y-auto">
                        <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Secciones</p>
                        {['General', 'Cuenta Regresiva', 'Ceremonia', 'Fiesta', 'Galería', 'Regalos', 'Detalles', 'Redes', 'Final', 'Invitados'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.toLowerCase()
                                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 ring-1 ring-black/5'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}

                        <div className="my-2 border-t border-slate-200"></div>
                        <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gestión</p>

                        <button
                            onClick={() => setActiveTab('respuestas')}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'respuestas'
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            📋 Lista de Invitados
                        </button>

                        <button
                            onClick={() => setActiveTab('trivia-preguntas')}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'trivia-preguntas'
                                ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            🎮 Trivia - Preguntas
                        </button>

                        <button
                            onClick={() => setActiveTab('trivia-ranking')}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'trivia-ranking'
                                ? 'bg-yellow-50 text-yellow-700 shadow-sm border border-yellow-100'
                                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            🏆 Trivia - Ranking
                        </button>
                    </div>

                    {/* Editor Content - Usamos invitation={invitation} para compatibilidad */}
                    <div className="flex-1 p-8 bg-slate-50/50 overflow-y-auto relative">
                        <div className="max-w-4xl mx-auto space-y-8">

                            {/* ADVANCED EDITOR PANEL */}
                            {showAdvanced && (
                                <div className="animate-in slide-in-from-top-4 duration-500 mb-8 z-10 relative">
                                    <AdvancedEditor
                                        invitation={invitation as InvitationData}
                                        onChange={updateInvitation}
                                        onClose={() => setShowAdvanced(false)}
                                    />
                                </div>
                            )}

                            {activeTab === 'general' && (
                                <GeneralSectionEditor invitation={invitation} onChange={updateInvitation} />
                            )}
                            {activeTab === 'cuenta regresiva' && (
                                <CountdownSectionEditor invitation={invitation} onChange={updateInvitation} />
                            )}
                            {activeTab === 'ceremonia' && (
                                <EventSectionEditor sectionKey="ceremony_section" title="Ceremonia Religiosa / Civil" invitation={invitation} onChange={updateInvitation} />
                            )}
                            {activeTab === 'fiesta' && (
                                <EventSectionEditor sectionKey="party_section" title="Fiesta / Recepción" invitation={invitation} onChange={updateInvitation} />
                            )}
                            {activeTab === 'galería' && (
                                <GallerySectionEditor invitation={invitation} onChange={updateInvitation} />
                            )}
                            {activeTab === 'regalos' && (
                                <GiftsSectionEditor invitation={invitation} onChange={updateInvitation} />
                            )}
                            {activeTab === 'detalles' && (
                                <ExtraInfoSectionEditor invitation={invitation} onChange={updateInvitation} />
                            )}
                            {activeTab === 'redes' && (
                                <SocialSectionEditor invitation={invitation} onChange={updateInvitation} />
                            )}
                            {activeTab === 'final' && (
                                <FooterSectionEditor invitation={invitation} onChange={updateInvitation} />
                            )}

                            {/* PESTAÑA DE RESPUESTAS */}
                            {activeTab === 'respuestas' && id && (
                                <ResponsesList eventId={id} />
                            )}

                            {/* PESTAÑA DE INVITADOS */}
                            {activeTab === 'invitados' && id && (
                                <GuestsManager eventId={id} />
                            )}

                            {/* TRIVIA - PREGUNTAS */}
                            {activeTab === 'trivia-preguntas' && id && (
                                <TriviaEditor eventId={id} />
                            )}

                            {/* TRIVIA - RANKING */}
                            {activeTab === 'trivia-ranking' && id && (
                                <TriviaResponses eventId={id} />
                            )}

                            {/* Default */}
                            {!['general', 'cuenta regresiva', 'ceremonia', 'fiesta', 'galería', 'regalos', 'detalles', 'redes', 'final', 'respuestas', 'invitados', 'trivia-preguntas', 'trivia-ranking'].includes(activeTab) && (
                                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                                    <p>Selecciona una sección para comenzar.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
