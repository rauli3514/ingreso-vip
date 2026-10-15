import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Loader2, X } from 'lucide-react';

// Invitado que entró con su link personal (?i=<id>): responde sin escribir su
// nombre y la respuesta queda atada a su fila en la lista de invitados.
export interface PersonalGuest {
    id: string;
    name: string;
    passes: number;
    rsvp_response?: 'yes' | 'no' | null;
    attending_count?: number | null;
    dietary?: string | null;
    rsvp_message?: string | null;
}

interface Props {
    sectionData: any;
    eventId: string;
    invitationRowId: string;
    names: string;
    eventData?: any;
    guest?: PersonalGuest | null;
    onGuestRsvp?: (update: Partial<PersonalGuest>) => void;
    demo?: boolean;
}

export const DIETARY_OPTIONS = ['Vegetariano', 'Vegano', 'Celíaco (sin TACC)', 'Otro'];

// Otras secciones (la tarjeta "Música") abren el formulario de canción con este evento.
export const SUGGEST_SONG_EVENT = 'invitation:suggest-song';

export default function FooterRenderer({ sectionData, eventId, invitationRowId, names, guest, onGuestRsvp, demo = false }: Props) {
    const [modalType, setModalType] = useState<'ceremony' | 'party' | 'song' | null>(null);

    useEffect(() => {
        const openSong = () => setModalType('song');
        window.addEventListener(SUGGEST_SONG_EVENT, openSong);
        return () => window.removeEventListener(SUGGEST_SONG_EVENT, openSong);
    }, []);

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
                <div className="flex flex-col items-center gap-4 max-w-md mx-auto mb-16 w-full px-4">

                    {/* Modo Simplificado: Configuración desde components_config */}
                    {sectionData.rsvp_enabled !== false ? (
                        <div className="w-full space-y-4">
                            {guest?.rsvp_response && (
                                <p className="text-sm text-slate-600">
                                    {guest.rsvp_response === 'yes'
                                        ? `✅ Ya confirmaste${guest.passes > 1 ? ` (van ${guest.attending_count ?? guest.passes})` : ''}. ¡Te esperamos!`
                                        : 'Nos avisaste que no podés venir.'}
                                </p>
                            )}
                            <button
                                onClick={() => {
                                    const waNumber = sectionData.whatsapp_number;
                                    if (waNumber && !guest && !demo) {
                                        window.open(`https://wa.me/${waNumber.replace(/[^0-9]/g, '')}?text=Hola!%20Te%20escribo%20para%20confirmar%20mi%20asistencia.`, '_blank');
                                    } else {
                                        handleConfirm('party'); // Usamos 'party' como confirmación genérica
                                    }
                                }}
                                className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200 text-base md:text-lg font-medium flex justify-center items-center gap-2"
                            >
                                {guest?.rsvp_response ? '✏️ Cambiar mi respuesta' : '✨ Confirmar Asistencia'}
                            </button>

                            {/* Botón Sugerir Canción en Modo Simplificado */}
                            {sectionData.suggest_song_enabled !== false && (
                                <button
                                    onClick={() => handleConfirm('song')}
                                    className="w-full bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all border border-slate-200 text-sm md:text-base font-medium flex justify-center items-center gap-2"
                                >
                                    🎵 Sugerir Canción
                                </button>
                            )}
                        </div>
                    ) : (
                        // Botones Legacy VIP solo si el modo rsvp simplificado está desactivado explícitamente (o no existe pero hay links viejos)
                        <>
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
                        </>
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
                    guest={modalType === 'song' ? null : guest}
                    onGuestRsvp={onGuestRsvp}
                    demo={demo}
                    onClose={() => setModalType(null)}
                />
            )}
        </footer>
    );
}

function ConfirmationModal({ type, eventId, invitationRowId, guest, onGuestRsvp, demo = false, onClose }: {
    type: 'ceremony' | 'party' | 'song';
    eventId: string;
    invitationRowId: string;
    guest?: PersonalGuest | null;
    onGuestRsvp?: (update: Partial<PersonalGuest>) => void;
    demo?: boolean;
    onClose: () => void;
}) {
    const initialDietary = guest?.dietary || '';
    const knownDietary = DIETARY_OPTIONS.includes(initialDietary) ? initialDietary : (initialDietary ? 'Otro' : '');

    const [name, setName] = useState(guest?.name || '');
    const [status, setStatus] = useState<'yes' | 'no' | null>(guest?.rsvp_response || null);
    const [attendingCount, setAttendingCount] = useState<number>(guest?.attending_count || guest?.passes || 1);
    const [dietary, setDietary] = useState(knownDietary);
    const [dietaryDetail, setDietaryDetail] = useState(knownDietary === 'Otro' ? initialDietary : '');
    const [message, setMessage] = useState(guest?.rsvp_message || '');
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);

    const title = type === 'ceremony' ? '¿Asistes a la ceremonia?' : type === 'party' ? '¿Asistes a la fiesta?' : 'Sugerir Canción';
    const passes = guest?.passes || 1;
    const dietaryValue = dietary === 'Otro' ? (dietaryDetail.trim() || 'Otro') : dietary;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validación básica
        if (type !== 'song' && !status) return;

        setSubmitting(true);

        try {
            if (demo) {
                // Invitación de muestra: se muestra igual que la real, sin guardar nada.
                await new Promise(resolve => setTimeout(resolve, 500));
                if (guest && type !== 'song') {
                    onGuestRsvp?.({
                        rsvp_response: status,
                        attending_count: status === 'yes' ? attendingCount : 0,
                        dietary: status === 'yes' ? (dietaryValue || null) : null,
                    });
                }
            } else if (guest) {
                // Link personal: la respuesta queda en su fila de la lista de invitados
                // (y también en invitation_responses, lo hace la función de la base).
                const { error } = await supabase.rpc('submit_guest_rsvp', {
                    p_guest_id: guest.id,
                    p_attending: status === 'yes',
                    p_attending_count: status === 'yes' ? attendingCount : 0,
                    p_dietary: status === 'yes' ? dietaryValue : null,
                    p_message: message,
                });
                if (error) throw error;

                onGuestRsvp?.({
                    rsvp_response: status,
                    attending_count: status === 'yes' ? attendingCount : 0,
                    dietary: status === 'yes' ? (dietaryValue || null) : null,
                    rsvp_message: message || null,
                });
            } else {
                // Link general: se guarda el nombre que escribe el invitado.
                const fullMessage = [
                    type !== 'song' && status === 'yes' && dietaryValue ? `Menú especial: ${dietaryValue}` : '',
                    message,
                ].filter(Boolean).join(' · ');

                const { error } = await supabase
                    .from('invitation_responses')
                    .insert({
                        event_id: eventId,
                        invitation_id: invitationRowId,
                        full_name: name,
                        attending: type === 'song' ? true : (status === 'yes'), // Si es canción, attending=true por defecto (o irrelevante)
                        type: type,
                        message: fullMessage
                    });

                if (error) throw error;
            }

            // El aviso por mail al dueño del evento lo manda la base
            // (trigger on_new_invitation_response → función send-notification-email).
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
                    <p className="text-slate-500 mb-6">
                        {guest && status === 'yes' ? '¡Gracias por confirmar! Te esperamos.' : 'Gracias por tu respuesta.'}
                    </p>
                    {demo && (
                        <p className="text-xs text-slate-400 -mt-3 mb-6">
                            En tu invitación, esta respuesta te llega al panel con cuántos van y su menú especial.
                        </p>
                    )}
                    <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-full text-sm">Cerrar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="bg-white w-full max-w-lg rounded-2xl p-8 relative z-10 animate-in zoom-in-95 shadow-2xl max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>

                <div className="text-center mb-8">
                    {/* Icono decorativo */}
                    <div className="w-20 h-20 mx-auto bg-white border-2 border-slate-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        {type === 'song' ? (
                            <span className="text-3xl">🎵</span>
                        ) : (
                            <span className="text-3xl">💌</span>
                        )}
                    </div>
                    {guest && <p className="text-slate-500 mb-1">Hola <span className="font-semibold text-slate-700 capitalize">{guest.name}</span></p>}
                    <h3 className="text-2xl font-serif text-slate-800">{title}</h3>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">

                    {type !== 'song' && (
                        <div className="flex justify-center gap-6 mb-6">
                            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full border transition-all ${status === 'yes' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600'}`}>
                                <input type="radio" name="status" className="hidden" checked={status === 'yes'} onChange={() => setStatus('yes')} required />
                                <span className={status === 'yes' ? 'font-bold' : ''}>Sí, confirmo!</span>
                            </label>
                            <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full border transition-all ${status === 'no' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600'}`}>
                                <input type="radio" name="status" className="hidden" checked={status === 'no'} onChange={() => setStatus('no')} required />
                                <span className={status === 'no' ? 'font-bold' : ''}>No puedo :(</span>
                            </label>
                        </div>
                    )}

                    {!guest && (
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
                    )}

                    {type !== 'song' && status === 'yes' && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            {guest && passes > 1 && (
                                <div className="text-center">
                                    <label className="block text-sm text-slate-500 mb-2">¿Cuántos van? (tenés {passes} lugares)</label>
                                    <div className="flex justify-center flex-wrap gap-2">
                                        {Array.from({ length: passes }, (_, i) => i + 1).map(n => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() => setAttendingCount(n)}
                                                className={`w-11 h-11 rounded-full border font-semibold transition-all ${attendingCount === n ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="text-center">
                                <label className="block text-sm text-slate-500 mb-2">¿Alguien necesita menú especial?</label>
                                <select
                                    value={dietary}
                                    onChange={(e) => setDietary(e.target.value)}
                                    className="w-full border-b border-slate-300 py-2 text-center text-slate-800 focus:border-indigo-500 outline-none bg-transparent"
                                >
                                    <option value="">No, ninguno</option>
                                    {DIETARY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                {dietary === 'Otro' && (
                                    <input
                                        type="text"
                                        value={dietaryDetail}
                                        onChange={(e) => setDietaryDetail(e.target.value)}
                                        maxLength={200}
                                        placeholder="Contanos cuál (ej: alergia al maní)"
                                        className="w-full mt-3 border-b border-slate-300 py-2 text-center text-slate-800 focus:border-indigo-500 outline-none bg-transparent placeholder:text-slate-400"
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={type === 'song' ? 2 : 3}
                            maxLength={500}
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
