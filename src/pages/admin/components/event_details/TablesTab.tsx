import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MoreVertical, Shield } from 'lucide-react';
import { Event, Guest } from '../../../../types';

interface TablesTabProps {
    event: Event;
    guests: Guest[];
    onAssignTable: (guestId: string, newTableName: string | null) => void;
}

export default function TablesTab({ event, guests, onAssignTable }: TablesTabProps) {

    const normalizeTableName = (name: string | null | undefined) => {
        if (!name) return null;
        const trimmed = name.trim();
        // If it's just a number, prefix with "Mesa "
        if (/^\d+$/.test(trimmed)) {
            return `Mesa ${trimmed}`;
        }
        return trimmed;
    };

    const handleDragEnd = (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Destination droppableId is already the Normalized Table Name (e.g. "Mesa 5")
        const newTableInfo = destination.droppableId === 'unassigned' ? null : destination.droppableId;

        onAssignTable(draggableId, newTableInfo);
    };

    // Calculate tables to display
    const standardTables = Array.from({ length: event.table_count || 0 }, (_, i) => `Mesa ${i + 1}`);

    const customTables = new Set<string>();
    guests.forEach(g => {
        const normalized = normalizeTableName(g.table_info);
        if (normalized && !standardTables.includes(normalized)) {
            customTables.add(normalized);
        }
    });

    const allTables = [...standardTables, ...Array.from(customTables)].sort((a, b) => {
        const aMatch = a.match(/^Mesa (\d+)$/);
        const bMatch = b.match(/^Mesa (\d+)$/);
        if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
        return a.localeCompare(b);
    });

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            {event.status === 'closed' && (
                <div className="bg-amber-50 text-amber-800 px-4 py-2 rounded-lg mb-4 text-sm flex items-center gap-2 border border-amber-200">
                    <Shield size={14} /> La organización de mesas está deshabilitada porque el evento ha finalizado.
                </div>
            )}
            <div className="animate-in fade-in duration-300 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Unassigned Guests Card */}
                    <Droppable droppableId="unassigned" isDropDisabled={event.status === 'closed'}>
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-0 flex flex-col h-96"
                            >
                                <div className="p-4 border-b border-slate-200 bg-slate-100 rounded-t-xl">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-slate-700">Sin Asignar</h3>
                                        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full font-bold">
                                            {guests.filter(g => !g.table_info).length}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                    {guests.filter(g => !g.table_info).map((guest, index) => (
                                        <Draggable key={guest.id} draggableId={guest.id} index={index} isDragDisabled={event.status === 'closed'}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={`p-3 mb-2 rounded-lg flex items-center justify-between group cursor-grab active:cursor-grabbing border transition-shadow ${snapshot.isDragging ? 'bg-white shadow-lg border-amber-400 rotate-2' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                                                        }`}
                                                >
                                                    <span className="text-sm text-slate-700 font-medium">{guest.last_name}, {guest.first_name}</span>
                                                    <div className="text-slate-400">
                                                        <MoreVertical size={14} />
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                    {guests.filter(g => !g.table_info).length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
                                            Todos los invitados tienen ubicación
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </Droppable>

                    {/* Generated Tables */}
                    {allTables.map((tableName) => {
                        const tableGuests = guests.filter(g => normalizeTableName(g.table_info) === tableName);
                        return (
                            <Droppable key={tableName} droppableId={tableName} isDropDisabled={event.status === 'closed'}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="bg-white border border-slate-200 rounded-xl p-0 flex flex-col h-96 shadow-sm"
                                    >
                                        <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl">
                                            <div className="flex justify-between items-center">
                                                <h3 className="font-bold text-slate-900 truncate max-w-[70%]">{tableName}</h3>
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${tableGuests.length > (event.guests_per_table_default || 10) ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-700'}`}>
                                                    {tableGuests.length} / {event.guests_per_table_default || 10}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar bg-slate-50/50">
                                            {tableGuests.map((guest, index) => (
                                                <Draggable key={guest.id} draggableId={guest.id} index={index} isDragDisabled={event.status === 'closed'}>
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-3 mb-2 rounded-lg flex items-center justify-between group cursor-grab active:cursor-grabbing border transition-shadow ${snapshot.isDragging ? 'bg-white shadow-lg border-amber-400 rotate-2' : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                                                                }`}
                                                        >
                                                            <span className="text-sm text-slate-700 font-medium">{guest.last_name}, {guest.first_name}</span>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {tableGuests.length === 0 && (
                                                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs italic">
                                                    Mesa vacía
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        );
                    })}

                    {/* Living Card */}
                    {event.has_living_room && (
                        <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-0 flex flex-col h-96">
                            <div className="p-4 border-b border-indigo-200 bg-indigo-100 rounded-t-xl">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🛋️</span>
                                        <h3 className="font-bold text-indigo-900">Living</h3>
                                    </div>
                                    <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-1 rounded-full font-bold">
                                        {guests.filter(g => g.has_puff && !g.table_info).length}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {guests.filter(g => g.has_puff && !g.table_info).map((guest) => (
                                    <div
                                        key={guest.id}
                                        className="p-3 mb-2 rounded-lg bg-white border border-indigo-200 shadow-sm"
                                    >
                                        <span className="text-sm text-indigo-900 font-medium">{guest.last_name}, {guest.first_name}</span>
                                    </div>
                                ))}
                                {guests.filter(g => g.has_puff && !g.table_info).length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-indigo-400 text-xs italic">
                                        Sin invitados en Living
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Trasnoche Card */}
                    {event.has_after_party && (
                        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-0 flex flex-col h-96">
                            <div className="p-4 border-b border-purple-200 bg-purple-100 rounded-t-xl">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🌙</span>
                                        <h3 className="font-bold text-purple-900">Trasnoche</h3>
                                    </div>
                                    <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full font-bold">
                                        {guests.filter(g => g.is_after_party).length}
                                    </span>
                                </div>
                                {event.after_party_time && (
                                    <p className="text-xs text-purple-600 mt-2">Inicio: {event.after_party_time}</p>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                {guests.filter(g => g.is_after_party).map((guest) => (
                                    <div
                                        key={guest.id}
                                        className="p-3 mb-2 rounded-lg bg-white border border-purple-200 shadow-sm"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-purple-900 font-medium">{guest.last_name}, {guest.first_name}</span>
                                            {guest.table_info && (
                                                <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">{guest.table_info}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {guests.filter(g => g.is_after_party).length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-purple-400 text-xs italic">
                                        Sin invitados de trasnoche
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DragDropContext>
    );
}
