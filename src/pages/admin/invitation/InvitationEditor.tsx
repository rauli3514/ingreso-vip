import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { InvitationData } from '../../../types';
// Importaremos los editores de sección aquí

export default function InvitationEditor() {
    const { id } = useParams<{ id: string }>(); // Event ID
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [invitation, setInvitation] = useState<Partial<InvitationData>>({});
    const [activeTab, setActiveTab] = useState('general');

    useEffect(() => {
        fetchInvitation();
    }, [id]);

    const fetchInvitation = async () => {
        if (!id) return;
        try {
            // Verificar si existe la invitación
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
                // Si no existe, inicializamos con valores por defecto (pero no guardamos aún)
                setInvitation({
                    event_id: id,
                    theme_id: 'elegant',
                    hero_section: { show: true, title: 'Nuestra Boda', subtitle: '¡Nos casamos!', show_date: true },
                    countdown_section: { show: true, title: 'Cuenta Regresiva' },
                    // ... otros valores por defecto
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
        try {
            const { error } = await supabase
                .from('event_invitations')
                .upsert({
                    event_id: id,
                    ...invitation,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'event_id' });

            if (error) throw error;
            alert('¡Invitación guardada correctamente!');
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar la invitación.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/dashboard')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Editor de Invitación</h1>
                        <p className="text-gray-500 text-sm">Personaliza el diseño y contenido de la invitación web.</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.open(`/invitacion/${id}`, '_blank')}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 from-neutral-50"
                    >
                        <Eye size={18} />
                        Ver Previa
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Guardar Cambios
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[500px] flex">
                {/* Sidebar de Secciones */}
                <div className="w-64 border-r border-gray-200 p-4">
                    <nav className="space-y-1">
                        {['General', 'Portada', 'Cuenta Regresiva', 'Ceremonia', 'Fiesta', 'Regalos'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.toLowerCase()
                                    ? 'bg-indigo-50 text-indigo-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Área de Edición */}
                <div className="flex-1 p-8">
                    <div className="max-w-2xl">
                        {/* Placeholder para los editores reales */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                            Editando sección: <strong>{activeTab}</strong>
                            <p className="text-sm mt-1">Los formularios de edición se implementarán a continuación.</p>
                        </div>

                        <div className="mt-8 space-y-4">
                            <h3 className="tex-lg font-medium">Debug Data:</h3>
                            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                                {JSON.stringify(invitation, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
