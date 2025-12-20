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
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white font-bold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-100 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Ingresando...
                            </>
                        ) : (
                            'Ingresar'
                        )}
                    </button>

                    <div className="text-center pt-4">
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
