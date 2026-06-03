import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ArrowLeft, Loader2, Zap } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let email = username.trim().toLowerCase();
            if (!email.includes('@')) {
                email = `${email}@ingreso-vip.app`;
            }

            const { error: authError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (authError) throw authError;
            navigate('/admin/dashboard');
        } catch (err: any) {
            console.error(err);
            setError(err.message === 'Invalid login credentials'
                ? 'Credenciales incorrectas'
                : 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-[#0a0e27] via-[#0d1117] to-[#0a0e27]">
            {/* Efectos de fondo sutiles */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />

            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 p-2.5 text-slate-400 hover:text-white transition-colors z-10 rounded-lg hover:bg-white/5"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="glass-card w-full max-w-md p-10 relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <Zap size={32} className="text-white" strokeWidth={2.5} />
                    </div>
                </div>

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white mb-1">
                        Ingreso VIP
                    </h1>
                    <p className="text-sm text-slate-400">Acceso Administrativo</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Correo Electrónico
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 focus:bg-white/8"
                                placeholder="usuario@correo.com"
                                required
                                autoCapitalize="none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Contraseña
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-600 focus:bg-white/8"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Ingresando...
                            </>
                        ) : (
                            'Ingresar con Email'
                        )}
                    </button>

                    <div className="relative flex items-center py-2">
                        <div className="flex-grow border-t border-white/10"></div>
                        <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-medium uppercase tracking-wider">O continuar con</span>
                        <div className="flex-grow border-t border-white/10"></div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            setLoading(true);
                            try {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${window.location.origin}/admin/dashboard`
                                    }
                                });
                                if (error) throw error;
                            } catch (err: any) {
                                console.error(err);
                                setError('Error al iniciar sesión con Google');
                                setLoading(false);
                            }
                        }}
                        disabled={loading}
                        className="w-full bg-white hover:bg-slate-50 text-slate-900 font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Google
                    </button>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            ¿No tienes cuenta? <span className="text-blue-400 font-semibold">Solicitar acceso</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Footer branding */}
            <div className="absolute bottom-6 text-xs text-slate-600 font-medium tracking-wider">
                Powered by <span className="text-slate-400">Tecno Eventos</span>
            </div>
        </div>
    );
}
