import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, Lock, ArrowLeft, Loader2 } from 'lucide-react';

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
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#030712]">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500/5 rounded-full blur-[100px]" />

            <button
                onClick={() => navigate('/')}
                className="absolute top-6 left-6 p-2 text-slate-400 hover:text-white transition-colors z-10"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="glass-card w-full max-w-[360px] p-8 relative z-20">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-white tracking-tight">INGRESO<span className="text-[#FBBF24]">VIP</span></h2>
                    <p className="text-xs text-slate-400 mt-2">by Tecno Eventos</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Usuario</label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#FBBF24] transition-colors" size={16} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#FBBF24]/50 focus:bg-black/60 transition-all placeholder:text-slate-600"
                                placeholder="usuario o email"
                                required
                                autoCapitalize="none"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#FBBF24] transition-colors" size={16} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#FBBF24]/50 focus:bg-black/60 transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full mt-2 justify-center py-2.5 text-sm shadow-lg shadow-yellow-500/20"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Ingresar al Sistema'}
                    </button>
                </form>
            </div>

            <div className="absolute bottom-6 text-[10px] text-slate-600 font-medium tracking-widest uppercase">
                Powered by Tecno Eventos
            </div>
        </div>
    );
}
