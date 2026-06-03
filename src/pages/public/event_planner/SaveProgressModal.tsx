import { X, Save, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { trackEvent } from '../../../lib/analytics';
import { useState } from 'react';
import { supabase } from '../../../lib/supabase';

interface SaveProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'register' | 'login';
    initialView?: 'options' | 'email_form';
}

export default function SaveProgressModal({ isOpen, onClose, initialMode = 'register', initialView = 'options' }: SaveProgressModalProps) {
    const [view, setView] = useState<'options' | 'email_form'>(initialView);
    // For mode, we add 'forgot_password'
    const [mode, setMode] = useState<'register' | 'login' | 'forgot_password'>(initialMode);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    if (!isOpen) return null;


    const migrateLocalDataToSupabase = async (userId: string) => {
        try {
            const savedData = localStorage.getItem('eventpix_data');
            if (!savedData) return;
            const eventData = JSON.parse(savedData);

            // Fetch existing events first to avoid creating duplicates on login
            const { data: existingEvents } = await supabase
                .from('events')
                .select('id')
                .eq('owner_id', userId)
                .limit(1);

            if (existingEvents && existingEvents.length > 0) {
                console.log('El usuario ya tiene un evento en la nube. No migramos datos locales para no duplicar.');
                return;
            }

            const eventDate = eventData.date ? eventData.date : new Date().toISOString().split('T')[0];

            // Create Event
            const { data: event, error: eventError } = await supabase.from('events').insert({
                owner_id: userId,
                name: `Evento de ${name || email.split('@')[0]}`,
                date: eventDate,
                guest_count_total: eventData.guests?.length || 0,
                status: 'pending',
                planner_data: eventData // Guardamos toda la configuración aquí
            }).select().single();

            if (eventError) throw eventError;

            // Optional: Insert guests if any exist
            if (eventData.guests && eventData.guests.length > 0 && event) {
                const guestsToInsert = eventData.guests.map((g: any) => {
                    const nameParts = g.name ? g.name.split(' ') : ['Invitado'];
                    const firstName = nameParts[0];
                    const lastName = nameParts.slice(1).join(' ');
                    
                    return {
                        event_id: event.id,
                        first_name: firstName,
                        last_name: lastName || '',
                        status: 'pending'
                    };
                });
                await supabase.from('guests').insert(guestsToInsert);
            }

            console.log('Migración a Supabase completada');
        } catch (err) {
            console.error('Error migrando datos a Supabase:', err);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');
        setIsLoading(true);

        try {
            if (mode === 'forgot_password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });
                if (error) throw error;
                setErrorMsg('');
                alert('Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.');
                setMode('login');
            } else if (mode === 'register') {
                if (password !== confirmPassword) {
                    setErrorMsg('Las contraseñas no coinciden.');
                    setIsLoading(false);
                    return;
                }
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                            phone: phone
                        }
                    }
                });
                if (error) throw error;
                if (data.user) {
                    await migrateLocalDataToSupabase(data.user.id);
                }
                trackEvent('user_registered', { method: 'email_supabase' });
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
                if (data.user) {
                    await migrateLocalDataToSupabase(data.user.id);
                }
                trackEvent('user_logged_in', { method: 'email_supabase' });
            }
            
            localStorage.setItem('eventpix_auth', 'true');
            onClose();
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            setErrorMsg(error.message || 'Ocurrió un error. Intenta nuevamente.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-8 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-200 relative overflow-hidden">
                
                {/* Decorative background glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

                <button onClick={() => {
                    setView('options');
                    onClose();
                }} className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors z-10">
                    <X size={20} />
                </button>

                {view === 'options' ? (
                    <>
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400 border border-blue-500/20 relative z-10">
                            <Save size={32} />
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">Guardemos tu progreso 🎉</h3>
                        <p className="text-slate-400 text-sm mb-8 relative z-10">Creá tu cuenta para no perder tu trabajo y acceder a los planes de suscripción pronto.</p>
                        
                        <div className="space-y-3 relative z-10"> 
                            <div className="flex gap-4 w-full">
                                <button 
                                    onClick={async () => {
                                        setIsLoading(true);
                                        try {
                                            const { error } = await supabase.auth.signInWithOAuth({
                                                provider: 'google',
                                                options: {
                                                    redirectTo: `${window.location.origin}/planificador`
                                                }
                                            });
                                            if (error) throw error;
                                        } catch (err) {
                                            console.error(err);
                                            setError('Error al iniciar sesión con Google');
                                            setIsLoading(false);
                                        }
                                    }}
                                    className="flex-1 bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                    </svg>
                                    Google
                                </button>
                                
                                <button 
                                    onClick={async () => {
                                        setIsLoading(true);
                                        try {
                                            const { error } = await supabase.auth.signInWithOAuth({
                                                provider: 'facebook',
                                                options: {
                                                    redirectTo: `${window.location.origin}/planificador`
                                                }
                                            });
                                            if (error) throw error;
                                        } catch (err) {
                                            console.error(err);
                                            setError('Error al iniciar sesión con Facebook');
                                            setIsLoading(false);
                                        }
                                    }}
                                    className="flex-1 bg-[#1877F2] hover:bg-[#1865F2] text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-3"
                                >
                                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                    Facebook
                                </button>
                            </div>

                            <button 
                                onClick={() => {
                                    setMode('register');
                                    setView('email_form');
                                }}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3.5 px-4 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-3"
                            >
                                <Mail size={20} /> Registrarse con Email
                            </button>
                        </div>
                        
                        <p className="text-center text-sm text-slate-400 mt-6 relative z-10">
                            ¿Ya tenés cuenta?{' '}
                            <button onClick={() => { setMode('login'); setView('email_form'); }} className="text-blue-400 font-medium hover:text-blue-300">
                                Iniciar sesión
                            </button>
                        </p>
                    </>
                ) : (
                    <>
                        <button 
                            onClick={() => setView('options')} 
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium relative z-10"
                        >
                            <ArrowLeft size={16} /> Volver
                        </button>
                        
                        <h3 className="text-2xl font-bold text-white mb-2 relative z-10">
                            {mode === 'register' ? 'Crear Cuenta' : mode === 'forgot_password' ? 'Recuperar Contraseña' : 'Ingresar a EventPix'}
                        </h3>
                        <p className="text-slate-400 text-sm mb-6 relative z-10">
                            {mode === 'register' ? 'Completá tus datos para guardar el progreso y acceder a tu evento desde cualquier lado.' : mode === 'forgot_password' ? 'Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.' : 'Ingresá tus datos para continuar donde lo dejaste.'}
                        </p>

                        <form onSubmit={handleEmailSubmit} className="space-y-4 relative z-10">
                            {mode === 'register' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Nombre Completo</label>
                                        <input 
                                            type="text" 
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="Juan Pérez"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Teléfono / WhatsApp</label>
                                        <input 
                                            type="tel" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                            placeholder="+54 11 1234 5678"
                                        />
                                    </div>
                                </>
                            )}
                            
                            <div>
                                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Email</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="tu@email.com"
                                />
                            </div>
                            
                            {mode !== 'forgot_password' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Contraseña</label>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            {mode === 'register' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">Confirmar Contraseña</label>
                                    <input 
                                        type="password" 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                                        placeholder="••••••••"
                                    />
                                </div>
                            )}

                            {errorMsg && (
                                <p className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">{errorMsg}</p>
                            )}

                            <button 
                                type="submit"
                                disabled={isLoading}
                                className="w-full mt-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3.5 px-4 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : (mode === 'register' ? 'Crear Cuenta' : mode === 'forgot_password' ? 'Enviar Enlace' : 'Ingresar')}
                            </button>

                            {mode === 'login' && (
                                <button 
                                    type="button"
                                    onClick={() => setMode('forgot_password')}
                                    className="w-full mt-2 text-slate-400 hover:text-white text-sm font-medium transition-colors"
                                >
                                    ¿Olvidaste tu contraseña?
                                </button>
                            )}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
