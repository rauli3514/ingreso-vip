import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { User, Plus, Search, Trash2, CheckCircle2, XCircle, Shield, Calendar, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { UserProfile, Event } from '../../types';

interface ExtendedUser extends UserProfile {
    assigned_event_ids?: string[]; // Array of event IDs
}

export default function UsersList() {
    const [users, setUsers] = useState<ExtendedUser[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        role: 'provider' as 'superadmin' | 'provider',
        assigned_event_ids: [] as string[]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersResponse, eventsResponse] = await Promise.all([
                supabase.from('profiles').select('*').order('created_at', { ascending: false }),
                supabase.from('events').select('*').order('date', { ascending: false })
            ]);

            if (usersResponse.error) throw usersResponse.error;
            if (eventsResponse.error) throw eventsResponse.error;

            setUsers(usersResponse.data || []);
            setEvents(eventsResponse.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClick = () => {
        setEditingUser(null);
        setFormData({ email: '', role: 'provider', assigned_event_ids: [] });
        setIsModalOpen(true);
    };

    const handleEditClick = (user: ExtendedUser) => {
        setEditingUser(user);
        setFormData({
            email: user.email || '',
            role: (user.role as any) || 'provider',
            assigned_event_ids: user.assigned_event_ids || []
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // Update existing user logic
                // NOTE: We cannot update email directly in auth from here without backend functions
                // We update the profile data
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        role: formData.role,
                        assigned_event_ids: formData.assigned_event_ids
                    })
                    .eq('id', editingUser.id);

                if (error) throw error;
            } else {
                // Create new user (Profile only simulation as we can't create Auth users client-side easily without admin API)
                // In a real app, this would call a Supabase Edge Function to create the auth user.
                const fakeId = crypto.randomUUID();
                const { error } = await supabase
                    .from('profiles')
                    .insert({
                        id: fakeId,
                        email: formData.email,
                        role: formData.role,
                        assigned_event_ids: formData.assigned_event_ids
                    });

                if (error) throw error;
                alert('Usuario creado (Perfil). El usuario debe registrarse con este email para acceder.');
            }

            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error al guardar usuario');
        }
    };

    const toggleEventAssignment = (eventId: string) => {
        setFormData(prev => {
            const current = prev.assigned_event_ids || [];
            if (current.includes(eventId)) {
                return { ...prev, assigned_event_ids: current.filter(id => id !== eventId) };
            } else {
                return { ...prev, assigned_event_ids: [...current, eventId] };
            }
        });
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            const { error } = await supabase.from('profiles').delete().eq('id', userId);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        }
    };

    // Filter users
    const filteredUsers = users.filter(u =>
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-display mb-2">Gestión de Usuarios</h1>
                    <p className="text-slate-500 text-sm">Administra proveedores y asigna accesos a eventos.</p>
                </div>
                <button
                    onClick={handleCreateClick}
                    className="btn btn-primary shadow-lg shadow-amber-500/20"
                >
                    <Plus size={18} /> Nuevo Usuario
                </button>
            </div>

            {/* Content */}
            <div className="glass-card bg-white border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 delay-150">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar usuarios por email o rol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-white border-slate-200 focus:border-amber-500"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Eventos Asignados</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">Cargando usuarios...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">No hay usuarios registrados.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{user.email?.split('@')[0]}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`badge ${user.role === 'superadmin' ? 'badge-neutral bg-slate-800 text-white border-slate-700' : 'badge-neutral bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                {user.role === 'superadmin' ? 'Super Admin' : 'Proveedor'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.role === 'superadmin' ? (
                                                    <span className="text-xs text-slate-400 italic">Acceso Total</span>
                                                ) : user.assigned_event_ids && user.assigned_event_ids.length > 0 ? (
                                                    user.assigned_event_ids.map(evtId => {
                                                        const evt = events.find(e => e.id === evtId);
                                                        return (
                                                            <span key={evtId} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                                {evt ? evt.name : 'Evento Desconocido'}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Sin asignación</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.is_active !== false ? (
                                                <span className="badge badge-success gap-1"><CheckCircle2 size={10} /> Activo</span>
                                            ) : (
                                                <span className="badge badge-error gap-1"><XCircle size={10} /> Inactivo</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <h3 className="text-lg font-bold text-slate-900 font-display">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Email del Usuario</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!!editingUser}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full"
                                        placeholder="usuario@ejemplo.com"
                                    />
                                    {editingUser && <p className="text-xs text-slate-400">El email no se puede cambiar.</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Rol de Sistema</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'provider' ? 'border-amber-500 bg-amber-50 text-amber-900' : 'border-slate-200 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value="provider"
                                                    checked={formData.role === 'provider'}
                                                    onChange={() => setFormData({ ...formData, role: 'provider' as any })}
                                                    className="hidden"
                                                />
                                                <User size={16} />
                                                <span className="font-bold text-sm">Proveedor</span>
                                            </div>
                                            <p className="text-xs opacity-70">Acceso limitado a eventos asignados.</p>
                                        </label>

                                        <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'superadmin' ? 'border-purple-500 bg-purple-50 text-purple-900' : 'border-slate-200 hover:bg-slate-50'}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <input
                                                    type="radio"
                                                    name="role"
                                                    value="superadmin"
                                                    checked={formData.role === 'superadmin'}
                                                    onChange={() => setFormData({ ...formData, role: 'superadmin' as any })}
                                                    className="hidden"
                                                />
                                                <Shield size={16} />
                                                <span className="font-bold text-sm">Super Admin</span>
                                            </div>
                                            <p className="text-xs opacity-70">Control total del sistema.</p>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Event Assignment Section */}
                            <div className="pt-6 border-t border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        <Calendar size={18} className="text-amber-500" /> Asignación de Eventos
                                    </h4>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                        {formData.assigned_event_ids.length} Seleccionados
                                    </span>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                    {events.length === 0 ? (
                                        <p className="text-center text-slate-400 py-4">No hay eventos disponibles.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {events.map(event => (
                                                <label
                                                    key={event.id}
                                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.assigned_event_ids.includes(event.id)
                                                        ? 'bg-white border-amber-400 shadow-sm'
                                                        : 'border-transparent hover:bg-white hover:border-slate-200'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${formData.assigned_event_ids.includes(event.id)
                                                        ? 'bg-amber-500 border-amber-500 text-white'
                                                        : 'border-slate-300 bg-white'
                                                        }`}>
                                                        {formData.assigned_event_ids.includes(event.id) && <CheckCircle2 size={12} />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.assigned_event_ids.includes(event.id)}
                                                        onChange={() => toggleEventAssignment(event.id)}
                                                    />
                                                    <span className={`text-sm ${formData.assigned_event_ids.includes(event.id) ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
                                                        {event.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    * Los Super Admins tienen acceso a todos los eventos por defecto.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="btn btn-outline"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                >
                                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
