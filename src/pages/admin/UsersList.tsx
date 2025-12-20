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
                const { error } = await supabase
                    .from('profiles')
                    .update({
                        role: formData.role,
                        assigned_event_ids: formData.assigned_event_ids
                    })
                    .eq('id', editingUser.id);

                if (error) throw error;
            } else {
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
                alert('Usuario creado (Perfil). El usuario debe registrarse con este email.');
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
                    <h1 className="text-3xl font-bold text-foreground tracking-tight font-display mb-2">Gestión de Usuarios</h1>
                    <p className="text-muted-foreground text-sm">Administra proveedores y asigna accesos a eventos.</p>
                </div>
                <button
                    onClick={handleCreateClick}
                    className="btn btn-primary"
                >
                    <Plus size={18} className="mr-2" /> Nuevo Usuario
                </button>
            </div>

            {/* Content */}
            <div className="glass-panel overflow-hidden animate-in fade-in duration-500 delay-150 rounded-xl">
                {/* Toolbar */}
                <div className="p-4 border-b border-border bg-surface/50 flex gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                        <input
                            type="text"
                            placeholder="Buscar usuarios por email o rol..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-surface/50 text-xs text-muted uppercase font-bold tracking-wider border-b border-border">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Eventos Asignados</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-muted">Cargando usuarios...</td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-muted">No hay usuarios registrados.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-surface/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-muted-foreground border border-border">
                                                    <User size={18} />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-foreground">{user.email?.split('@')[0]}</p>
                                                    <p className="text-xs text-muted">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`badge ${user.role === 'superadmin'
                                                ? 'bg-foreground text-background border-border'
                                                : 'bg-accent/10 text-accent-dark border-accent/20'
                                                } px-2 py-1 rounded text-xs font-medium border`}>
                                                {user.role === 'superadmin' ? 'Super Admin' : 'Proveedor'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.role === 'superadmin' ? (
                                                    <span className="text-xs text-muted italic">Acceso Total</span>
                                                ) : user.assigned_event_ids && user.assigned_event_ids.length > 0 ? (
                                                    user.assigned_event_ids.map(evtId => {
                                                        const evt = events.find(e => e.id === evtId);
                                                        return (
                                                            <span key={evtId} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-surface text-foreground border border-border">
                                                                {evt ? evt.name : 'Evento Desconocido'}
                                                            </span>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-xs text-muted italic">Sin asignación</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {user.is_active !== false ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    <CheckCircle2 size={10} /> Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                                                    <XCircle size={10} /> Inactivo
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent-dark hover:bg-accent/20 rounded-lg transition-colors text-xs font-semibold border border-transparent hover:border-accent/30"
                                                    title="Editar y Asignar Eventos"
                                                >
                                                    <Edit2 size={14} /> Asignar / Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
                        <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
                            <h3 className="text-lg font-bold text-foreground font-display">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-muted hover:text-foreground">
                                <XCircle size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-surface">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Email del Usuario</label>
                                    <input
                                        type="email"
                                        required
                                        disabled={!!editingUser}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="input-field"
                                        placeholder="usuario@ejemplo.com"
                                    />
                                    {editingUser && <p className="text-xs text-muted">El email no se puede cambiar.</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-foreground">Rol de Sistema</label>
                                    <div className="flex gap-4">
                                        <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'provider'
                                            ? 'border-accent bg-accent/5 text-accent-dark'
                                            : 'border-border hover:bg-surface/80'}`}>
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

                                        <label className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${formData.role === 'superadmin'
                                            ? 'border-purple-500 bg-purple-50 text-purple-900'
                                            : 'border-border hover:bg-surface/80'}`}>
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
                            <div className="pt-6 border-t border-border">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-foreground flex items-center gap-2">
                                        <Calendar size={18} className="text-accent" /> Asignación de Eventos
                                    </h4>
                                    <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full border border-border">
                                        {formData.assigned_event_ids.length} Seleccionados
                                    </span>
                                </div>

                                <div className="bg-background border border-border rounded-xl p-4 max-h-60 overflow-y-auto custom-scrollbar">
                                    {events.length === 0 ? (
                                        <p className="text-center text-muted py-4">No hay eventos disponibles.</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {events.map(event => (
                                                <label
                                                    key={event.id}
                                                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${formData.assigned_event_ids.includes(event.id)
                                                        ? 'bg-surface border-accent shadow-sm'
                                                        : 'border-transparent hover:bg-surface/50 hover:border-border'
                                                        }`}
                                                >
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${formData.assigned_event_ids.includes(event.id)
                                                        ? 'bg-accent border-accent text-white'
                                                        : 'border-muted bg-background'
                                                        }`}>
                                                        {formData.assigned_event_ids.includes(event.id) && <CheckCircle2 size={12} />}
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="hidden"
                                                        checked={formData.assigned_event_ids.includes(event.id)}
                                                        onChange={() => toggleEventAssignment(event.id)}
                                                    />
                                                    <span className={`text-sm ${formData.assigned_event_ids.includes(event.id) ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                                                        {event.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted mt-2">
                                    * Los Super Admins tienen acceso a todos los eventos por defecto.
                                </p>
                            </div>

                            <div className="pt-6 border-t border-border flex justify-end gap-3">
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
