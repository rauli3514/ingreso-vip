import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, ArrowLeft, Loader2, Mail } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            // Optional: Create profile entry immediately if needed separately, 
            // but usually a trigger handles it or we do it here.
            // For now, assume Supabase handles creation or we rely on Auth ID.

            alert('Registro exitoso. Por favor inicia sesión.');
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al registrarse');
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
                onClick={() => navigate('/login')}
                className="absolute top-6 left-6 p-2 text-slate-400 hover:text-white transition-colors z-10"
            >
                <ArrowLeft size={20} />
            </button>

            <div className="glass-card w-full max-w-[360px] p-8 relative z-20">
                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-white tracking-tight">Registro <span className="text-[#FBBF24]">VIP</span></h2>
                    <p className="text-xs text-slate-400 mt-2">Crea tu cuenta en Tecno Eventos</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Email</label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#FBBF24] transition-colors" size={16} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#FBBF24]/50 focus:bg-black/60 transition-all placeholder:text-slate-600"
                                placeholder="tu@email.com"
                                required
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
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 ml-1">Confirmar Contraseña</label>
                        <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#FBBF24] transition-colors" size={16} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-[#FBBF24]/50 focus:bg-black/60 transition-all placeholder:text-slate-600"
                                placeholder="••••••••"
                                required
                                minLength={6}
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
                        {loading ? <Loader2 size={16} className="animate-spin" /> : 'Registrarse'}
                    </button>

                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            ¿Ya tienes cuenta? <span className="text-[#FBBF24]">Inicia Sesión</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
