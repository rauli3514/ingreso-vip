import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Loader2, X } from 'lucide-react';

interface Props {
    sectionData: any;
    eventId: string;
    invitationRowId: string;
    names: string;
    eventData?: any;
}

export default function FooterRenderer({ sectionData, eventId, invitationRowId, names }: Props) {
    const [modalType, setModalType] = useState<'ceremony' | 'party' | 'song' | null>(null);

    // Si la sección está marcada como oculta, no renderizamos nada
    if (sectionData.show === false) return null;

    const links = sectionData.links || { confirm_ceremony: true, confirm_party: true, suggest_song: true };

    const handleConfirm = (type: 'ceremony' | 'party' | 'song') => {
        setModalType(type);
    };

    return (
        <footer id="rsvp-section" className="bg-slate-50 py-24 border-t border-slate-200">
            <div className="container mx-auto px-4 text-center">

                {sectionData.show_branding && (
                    <h2 className="text-4xl md:text-5xl text-slate-400 mb-16 font-serif opacity-50" style={{ fontFamily: '"Great Vibes", cursive' }}>
                        {names}
                    </h2>
                )}

                {/* Título de la sección */}
                <h3 className="text-2xl md:text-3xl font-semibold text-slate-800 mb-12">
                    Tu RSVP
                </h3>

                {/* Botones mejorados con cards */}
                <div className="flex flex-col items-center gap-4 max-w-md mx-auto mb-16">

                    {links.confirm_ceremony && (
                        <button
                            onClick={() => handleConfirm('ceremony')}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 py-5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200 text-base md:text-lg font-medium"
                        >
                            ✨ Confirmar Asistencia a Ceremonia
                        </button>
                    )}

                    {links.confirm_party && (
                        <button
                            onClick={() => handleConfirm('party')}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 py-5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200 text-base md:text-lg font-medium"
                        >
                            🎉 Confirmar Asistencia a Fiesta
                        </button>
                    )}

                    {links.suggest_song && (
                        <button
                            onClick={() => handleConfirm('song')}
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 py-5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200 text-base md:text-lg font-medium"
                        >
                            🎵 Sugerir Canción
                        </button>
                    )}

                    {(links.calendar_ceremony || links.calendar_party) && (
                        <div className="pt-4 flex flex-col md:flex-row gap-3 w-full">
                            {links.calendar_ceremony && <span className="cursor-pointer hover:text-slate-900 text-sm text-slate-500">📅 Agendar Ceremonia</span>}
                            {links.calendar_party && <span className="cursor-pointer hover:text-slate-900 text-sm text-slate-500">📅 Agendar Fiesta</span>}
                        </div>
                    )}
                </div>

                <div className="mt-20 text-xs text-slate-400">
                    <p>Diseñado con ❤️ en EventPix</p>
                </div>
            </div>

            {/* MODAL GENÉRICO DE CONFIRMACIÓN */}
            {modalType && (
                <ConfirmationModal
                    type={modalType}
                    eventId={eventId}
                    invitationRowId={invitationRowId}
                    onClose={() => setModalType(null)}
                />
            )}
        </footer>
    );
}

function ConfirmationModal({ type, eventId, invitationRowId, onClose }: { type: 'ceremony' | 'party' | 'song'; eventId: string; invitationRowId: string; onClose: () => void }) {
    const [name, setName] = useState('');
    const [status, setStatus] = useState<'yes' | 'no' | null>(null);
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const title = type === 'ceremony' ? '¿Asistes a la ceremonia?' : type === 'party' ? '¿Asistes a la fiesta?' : 'Sugerir Canción';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación básica
        if (type !== 'song' && !status) return;

        setSubmitting(true);

        try {
            // Insertar respuesta real en Supabase
            const { error } = await supabase
                .from('invitation_responses')
                .insert({
                    event_id: eventId,
                    invitation_id: invitationRowId,
                    full_name: name,
                    attending: type === 'song' ? true : (status === 'yes'), // Si es canción, attending=true por defecto (o irrelevante)
                    type: type,
                    message: message || ''
                });

            if (error) throw error;

            // Enviar email usando Resend API
            try {
                const typeLabel = type === 'ceremony' ? 'Ceremonia'
                    : type === 'party' ? 'Fiesta'
                        : 'Sugerencia de Canción';

                const attendingLabel = (type !== 'song' && status) ? (status === 'yes' ? 'SÍ asistirá' : 'NO asistirá') : '';

                await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer re_PNeK19Gy_6gSACDsLgfUFAoPnQ566bdtG',
                    },
                    body: JSON.stringify({
                        from: 'Invitaciones VIP <onboarding@resend.dev>',
                        to: ['bodalauyraul2026@gmail.com'],
                        subject: `📋 Nueva respuesta: ${name} - ${typeLabel}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                <h2 style="color: #4F46E5; border-bottom: 2px solid #4F46E5; padding-bottom: 10px;">
                                    Nueva Respuesta de Invitación
                                </h2>
                                
                                <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                    <p style="margin: 10px 0;"><strong>📝 Tipo:</strong> ${typeLabel}</p>
                                    <p style="margin: 10px 0;"><strong>👤 Nombre:</strong> ${name}</p>
                                    ${attendingLabel ? `<p style="margin: 10px 0;"><strong>✅ Asistencia:</strong> ${attendingLabel}</p>` : ''}
                                    ${message ? `<p style="margin: 10px 0;"><strong>💬 Mensaje:</strong><br>${message}</p>` : ''}
                                </div>
                                
                                <p style="color: #6B7280; font-size: 12px; margin-top: 30px;">
                                    Recibido el: ${new Date().toLocaleString('es-AR')}
                                </p>
                            </div>
                        `,
                    }),
                });

                console.log('Email enviado correctamente');
            } catch (emailError) {
                console.error('Error al enviar email:', emailError);
                // No bloqueamos el flujo si falla el email
            }

            setSent(true);
        } catch (error: any) {
            console.error(error);
            alert('Error al enviar respuesta: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (sent) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
                <div className="bg-white rounded-2xl p-8 relative z-10 max-w-sm w-full text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">¡Enviado!</h3>
                    <p className="text-slate-500 mb-6">Gracias por tu respuesta.</p>
                    <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm">Cerrar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="bg-white w-full max-w-lg rounded-2xl p-8 relative z-10 animate-in zoom-in-95 shadow-2xl">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    {/* Icono decorativo */}
                    <div className="w-20 h-20 mx-auto bg-white border-2 border-slate-100 rounded-full flex items-center justify-center mb-4 -mt-16 shadow-sm">
                        {type === 'song' ? (
                            <span className="text-3xl">🎵</span>
                        ) : (
                            <span className="text-3xl">💌</span>
                        )}
                    </div>
                    <h3 className="text-2xl font-serif text-slate-800">{title}</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {type !== 'song' && (
                        <div className="flex justify-center gap-6 mb-6">
                            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full border transition-all ${status === 'yes' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}>
                                <input type="radio" name="status" className="hidden" onChange={() => setStatus('yes')} required />
                                <span className={status === 'yes' ? 'font-bold' : ''}>Sí, confirmo!</span>
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full border transition-all ${status === 'no' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600'}`}>
                                <input type="radio" name="status" className="hidden" onChange={() => setStatus('no')} required />
                                <span className={status === 'no' ? 'font-bold' : ''}>No puedo :(</span>
                            </label>
                        </div>
                    )}

                    <div>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ingrese su nombre completo"
                            className="w-full border-b border-slate-300 py-2 text-center text-slate-800 focus:border-indigo-500 outline-none bg-transparent placeholder:text-slate-400"
                            required
                        />
                    </div>

                    <div>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={type === 'song' ? 2 : 3}
                            placeholder={type === 'song' ? "Autor y Nombre de la canción..." : "Observaciones"}
                            className="w-full border-b border-slate-300 py-2 text-center text-slate-800 focus:border-indigo-500 outline-none bg-transparent placeholder:text-slate-400 resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-4 text-center">
                        <button
                            type="submit"
                            disabled={submitting || (type !== 'song' && !status)}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-10 py-3 rounded-full text-sm font-bold tracking-wider transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                            {submitting ? <Loader2 className="animate-spin mx-auto" /> : 'ENVIAR'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
