import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, Users, MoreVertical, Clock, Edit2, Trash2 } from 'lucide-react';
import { Event, Guest } from '../../../../types';

interface GuestsTabProps {
    event: Event;
    guests: Guest[];
    onUpdateStatus: (guestId: string, status: string) => void;
    onDelete: (guestId: string) => void;
    onEdit: (guest: Guest) => void;
    onImport: () => void;
}

export default function GuestsTab({ event, guests, onUpdateStatus, onDelete, onEdit, onImport }: GuestsTabProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTable, setFilterTable] = useState<string>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const filteredGuests = useMemo(() => {
        return guests.filter(g => {
            const matchesSearch = (g.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                g.last_name.toLowerCase().includes(searchQuery.toLowerCase()));

            if (filterTable === 'all') return matchesSearch;
            if (filterTable === 'unassigned') return matchesSearch && !g.table_info;
            return matchesSearch && g.table_info === filterTable;
        });
    }, [guests, searchQuery, filterTable]);

    const uniqueTables = useMemo(() => {
        return Array.from(new Set(guests.map(g => g.table_info).filter(Boolean))).sort();
    }, [guests]);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {/* Search and Filter Bar */}
            <div className="flex gap-3">
                <div className="bg-white border border-slate-200 p-1.5 rounded-xl flex-1 flex items-center gap-3 shadow-sm placeholder:text-slate-400">
                    <div className="pl-4 text-slate-400"><Search size={18} /></div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar invitado por nombre..."
                        className="bg-transparent border-none shadow-none focus:shadow-none p-2 text-sm placeholder:text-slate-400 w-full text-slate-900 focus:outline-none"
                    />
                </div>
                <div className="relative z-20">
                    <button
                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                        className={`h-full px-4 rounded-xl border flex items-center gap-2 transition-all ${filterTable !== 'all'
                            ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
                    >
                        <Filter size={16} />
                        <span className="text-sm font-medium">
                            {filterTable === 'all' ? 'Filtrar' : filterTable === 'unassigned' ? 'Sin Asignar' : filterTable}
                        </span>
                    </button>

                    {showFilterMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
                            <div className="absolute right-0 top-full mt-2 z-30 w-56 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <div className="p-1.5 max-h-64 overflow-y-auto custom-scrollbar">
                                    <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        Filtrar por Ubicación
                                    </div>
                                    <button
                                        onClick={() => { setFilterTable('all'); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all flex justify-between items-center ${filterTable === 'all' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Ver Todos
                                        {filterTable === 'all' && <CheckCircle2 size={14} />}
                                    </button>
                                    <button
                                        onClick={() => { setFilterTable('unassigned'); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all flex justify-between items-center ${filterTable === 'unassigned' ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        Sin Asignar
                                        {filterTable === 'unassigned' && <CheckCircle2 size={14} />}
                                    </button>

                                    {uniqueTables.length > 0 && <div className="h-px bg-slate-100 my-1.5 mx-1" />}

                                    {uniqueTables.map(table => (
                                        <button
                                            key={table}
                                            onClick={() => { setFilterTable(table as string); setShowFilterMenu(false); }}
                                            className={`w-full text-left px-3 py-2 text-xs font-medium rounded-lg transition-all flex justify-between items-center ${filterTable === table ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {table}
                                            {filterTable === table && <CheckCircle2 size={14} />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {guests.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="text-center py-12 text-slate-500">
                        <Users size={32} className="mx-auto mb-3 opacity-30 text-slate-400" />
                        <p className="text-sm">Aún no hay invitados cargados.</p>
                        {event.status !== 'closed' && (
                            <button
                                onClick={onImport}
                                className="text-amber-600 text-sm font-semibold mt-2 hover:underline"
                            >
                                Importar lista CSV
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-bold tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Invitado</th>
                                <th className="px-6 py-4">Mesa / Ubicación</th>
                                <th className="px-6 py-4 text-center">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredGuests.map((guest, index) => {
                                const isLastItem = index >= filteredGuests.length - 2 && filteredGuests.length > 3;
                                return (
                                    <tr key={guest.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-slate-900 font-semibold">{guest.last_name}, {guest.first_name}</p>
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {guest.is_after_party && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 border border-purple-200">Trasnoche</span>}
                                                    {guest.has_puff && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">Puff</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">
                                            {guest.table_info ? (
                                                <span className="flex items-center gap-2">
                                                    { /* Icono MapPin se puede importar si se quiere usar */}
                                                    <span className="font-semibold text-amber-600">{guest.table_info}</span>
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 italic">Sin asignar</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`badge ${guest.status === 'confirmed' ? 'badge-success' :
                                                guest.status === 'arrived' ? 'badge-info bg-blue-50 text-blue-600 border-blue-100' :
                                                    'badge-neutral'
                                                } inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold`}>
                                                {guest.status === 'pending' ? 'Pendiente' : guest.status === 'confirmed' ? 'Confirmado' : guest.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === guest.id ? null : guest.id);
                                                }}
                                                className={`p-2 rounded-lg transition-colors ${openMenuId === guest.id ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                            >
                                                <MoreVertical size={16} />
                                            </button>

                                            {/* Dropdown Menu */}
                                            {openMenuId === guest.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-20 cursor-default"
                                                        onClick={() => setOpenMenuId(null)}
                                                    />
                                                    <div className={`absolute right-10 z-30 w-40 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${isLastItem ? 'bottom-0 mb-0 origin-bottom-right' : 'top-0 origin-top-right'}`}>
                                                        <div className="p-1 flex flex-col gap-1">
                                                            {event.status !== 'closed' && (
                                                                <>
                                                                    {guest.status === 'pending' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onUpdateStatus(guest.id, 'confirmed');
                                                                                setOpenMenuId(null);
                                                                            }}
                                                                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-md transition-colors flex items-center gap-2"
                                                                        >
                                                                            <CheckCircle2 size={14} className="text-slate-400 hover:text-emerald-500" />
                                                                            Confirmar
                                                                        </button>
                                                                    )}

                                                                    {guest.status === 'confirmed' && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                onUpdateStatus(guest.id, 'pending');
                                                                                setOpenMenuId(null);
                                                                            }}
                                                                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-600 rounded-md transition-colors flex items-center gap-2"
                                                                        >
                                                                            <Clock size={14} className="text-slate-400 hover:text-amber-500" />
                                                                            Marcar Pendiente
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onEdit(guest);
                                                                            setOpenMenuId(null);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-md transition-colors flex items-center gap-2"
                                                                    >
                                                                        <Edit2 size={14} className="text-slate-400" />
                                                                        Editar
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            onDelete(guest.id);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-colors flex items-center gap-2"
                                                                    >
                                                                        <Trash2 size={14} className="text-slate-400 hover:text-rose-500" />
                                                                        Eliminar
                                                                    </button>
                                                                </>
                                                            )}
                                                            {event.status === 'closed' && <p className="px-3 py-2 text-xs text-slate-400 italic text-center">Solo Lectura</p>}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
