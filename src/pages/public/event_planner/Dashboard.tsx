// @ts-nocheck
import { Users, LayoutGrid, Plus, MoreVertical, GripVertical, CheckCircle2, Clock, Upload, Download, Save, Info, Settings, Trash2, Edit, Crown } from 'lucide-react';
import { EventData, PlannerGuest, PlannerTable } from './types';
import { trackEvent } from '../../../lib/analytics';
import Papa from 'papaparse';
import PlannerGuestModal from './PlannerGuestModal';
import MyEventTab from './MyEventTab';
import TablesCanvas from './TablesCanvas';
import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DashboardProps {
    eventData: EventData;
    onChange: (data: EventData) => void;
    initialOpenManualGuest?: boolean;
    onSaveRequest?: () => void;
}

type TabType = 'list' | 'kanban' | 'my_event';

export default function Dashboard({ eventData, onChange, initialOpenManualGuest, onSaveRequest }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(initialOpenManualGuest || false);
    const [guestToEdit, setGuestToEdit] = useState<PlannerGuest | null>(null);
    const [defaultTableCapacity, setDefaultTableCapacity] = useState(10);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [tableMode, setTableMode] = useState<'list' | 'canvas'>('list');
    
    // Auto-save UI states
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedBadge, setShowSavedBadge] = useState(false);

    // Watch for eventData changes to show save badge
    React.useEffect(() => {
        setIsSaving(true);
        setShowSavedBadge(false);
        const saveTimer = setTimeout(() => {
            setIsSaving(false);
            setShowSavedBadge(true);
            const hideTimer = setTimeout(() => {
                setShowSavedBadge(false);
            }, 3000);
            return () => clearTimeout(hideTimer);
        }, 800); // simulate saving delay
        return () => clearTimeout(saveTimer);
    }, [eventData]);

    // Check auth status
    const isLoggedIn = typeof window !== 'undefined' && localStorage.getItem('eventpix_auth') === 'true';

    // If the wizard requested the modal to open on load, make sure we open it
    React.useEffect(() => {
        if (initialOpenManualGuest) {
            setIsGuestModalOpen(true);
        }
    }, [initialOpenManualGuest]);

    const handlePremiumFeature = () => {
        trackEvent('contact_capture_shown');
        if (onSaveRequest) {
            onSaveRequest();
        }
    };

    const handleDownloadPdf = async () => {
        const input = document.getElementById('tables-canvas-container');
        if (!input) return;

        try {
            const canvas = await html2canvas(input, {
                scale: 2,
                backgroundColor: '#0f172a', // Tailwind slate-900
            });
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
            pdf.save('plano-de-mesas.pdf');
        } catch (error) {
            console.error("Error generating PDF", error);
        }
    };

    // --- GUEST MANAGEMENT ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                let newTables = [...eventData.tables];
                const parsedGuests: PlannerGuest[] = results.data.map((row: any) => {
                    const first = row.first_name || row.Nombre || row.nombre || '';
                    const last = row.last_name || row.Apellido || row.apellido || '';
                    const confirmadoStr = (row.Confirmado || row.confirmado || '').toLowerCase();
                    const statusVal = (confirmadoStr === 'sí' || confirmadoStr === 'si' || confirmadoStr === 'yes') ? 'confirmed' : 'pending';
                    const mesaVal = row.Mesa || row.mesa || '';
                    
                    return {
                        id: Math.random().toString(36).substr(2, 9),
                        first_name: first,
                        last_name: last,
                        display_name: `${first} ${last}`.trim() || 'Invitado',
                        status: statusVal as 'pending' | 'confirmed',
                        group: row.group || row.Grupo || row.grupo || '',
                        table_info: mesaVal,
                        note: row.Nota || row.nota || ''
                    };
                }).filter(g => g.first_name || g.last_name);

                // Auto-create tables for CSV guests
                const finalGuests = parsedGuests.map(g => {
                    if (g.table_info && g.table_info.trim() !== '') {
                        let label = g.table_info.trim();
                        if (/^\d+$/.test(label)) label = `Mesa ${label}`;
                        
                        let table = newTables.find(t => t.label.toLowerCase() === label.toLowerCase());
                        if (!table) {
                            table = {
                                id: Math.random().toString(36).substr(2, 9),
                                type: 'round', x: 0, y: 0, rotation: 0,
                                label: label,
                                capacity: defaultTableCapacity
                            };
                            newTables.push(table);
                        }
                        return { ...g, table_id: table.id };
                    }
                    return g;
                });

                trackEvent('excel_uploaded', { guest_count: finalGuests.length });
                onChange({ ...eventData, guests: [...eventData.guests, ...finalGuests], tables: newTables });
                setUploading(false);
            }
        });
        e.target.value = ''; // Reset input
    };

    const assignTableIfProvided = (guest: PlannerGuest, tables: PlannerTable[]): { updatedGuest: PlannerGuest, updatedTables: PlannerTable[] } => {
        let updatedTables = [...tables];
        let updatedGuest = { ...guest };

        if (guest.table_info && guest.table_info.trim() !== '') {
            let label = guest.table_info.trim();
            // Automatically prefix with "Mesa " if they just type a number like "1"
            if (/^\d+$/.test(label)) {
                label = `Mesa ${label}`;
            }

            // Find if table exists
            let table = updatedTables.find(t => t.label.toLowerCase() === label.toLowerCase());
            
            if (!table) {
                // Create table
                table = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: 'round',
                    x: 0,
                    y: 0,
                    rotation: 0,
                    label: label,
                    capacity: defaultTableCapacity
                };
                updatedTables.push(table);
            }
            updatedGuest.table_id = table.id;
        } else {
            // They cleared it
            updatedGuest.table_id = undefined;
        }

        return { updatedGuest, updatedTables };
    };

    const handleAddManualGuest = (newGuest: PlannerGuest) => {
        trackEvent('manual_guest_added');
        const { updatedGuest, updatedTables } = assignTableIfProvided(newGuest, eventData.tables);
        onChange({ ...eventData, guests: [...eventData.guests, updatedGuest], tables: updatedTables });
    };

    const handleUpdateGuest = (updatedGuest: PlannerGuest) => {
        trackEvent('manual_guest_updated');
        const { updatedGuest: processedGuest, updatedTables } = assignTableIfProvided(updatedGuest, eventData.tables);
        
        const newGuests = eventData.guests.map(g => g.id === processedGuest.id ? processedGuest : g);
        onChange({ ...eventData, guests: newGuests, tables: updatedTables });
    };

    const handleDeleteGuest = (guestId: string) => {
        const newGuests = eventData.guests.filter(g => g.id !== guestId);
        onChange({ ...eventData, guests: newGuests });
        setActiveDropdown(null);
    };

    const openEditModal = (guest: PlannerGuest) => {
        setGuestToEdit(guest);
        setIsGuestModalOpen(true);
        setActiveDropdown(null);
    };

    const downloadTemplate = () => {
        trackEvent('excel_downloaded');
        const csvContent = "\uFEFFNombre;Apellido;Mesa;Grupo;Confirmado;Nota\nJuan;Pérez;1;Familia Novio;Sí;Vegetariano\nAna;Gómez;VIP;Amigos;Pendiente;\nLuis;García;;Trabajo;Sí;";
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "plantilla_invitados.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...eventData, name: e.target.value });
    };

    // --- KANBAN DRAG & DROP HANDLERS ---
    
    const handleDragStart = (e: React.DragEvent, guestId: string) => {
        e.dataTransfer.setData('guestId', guestId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
    };

    const handleDrop = (e: React.DragEvent, tableId: string | undefined) => {
        e.preventDefault();
        const guestId = e.dataTransfer.getData('guestId');
        if (!guestId) return;

        const updatedGuests = eventData.guests.map(g => {
            if (g.id === guestId) {
                return { ...g, table_id: tableId };
            }
            return g;
        });

        trackEvent('guest_assigned', { table_id: tableId || 'unassigned' });
        onChange({ ...eventData, guests: updatedGuests });
    };

    // --- TABLE MANAGEMENT ---

    const handleAddTable = () => {
        const newTable: PlannerTable = {
            id: Math.random().toString(36).substr(2, 9),
            type: 'round',
            x: 0,
            y: 0,
            rotation: 0,
            label: `Mesa ${eventData.tables.length + 1}`,
            capacity: defaultTableCapacity
        };
        trackEvent('tables_created', { count: eventData.tables.length + 1 });
        onChange({ ...eventData, tables: [...eventData.tables, newTable] });
    };

    const handleUpdateTableLabel = (tableId: string, newLabel: string) => {
        onChange({
            ...eventData,
            tables: eventData.tables.map(t => t.id === tableId ? { ...t, label: newLabel } : t)
        });
    };

    const handleDeleteTable = (tableId: string) => {
        const updatedGuests = eventData.guests.map(g => g.table_id === tableId ? { ...g, table_id: undefined } : g);
        const updatedTables = eventData.tables.filter(t => t.id !== tableId);
        onChange({ ...eventData, guests: updatedGuests, tables: updatedTables });
    };

    // --- FILTERING ---

    const filteredGuests = eventData.guests.filter(g => 
        g.display_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (g.group && g.group.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const unassignedGuests = filteredGuests.filter(g => !g.table_id);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col">
            
            {/* TOP HEADER (Simulating Ingreso VIP Panel) */}
            <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <input 
                            type="text" 
                            className="bg-transparent text-3xl font-bold text-white focus:outline-none focus:border-b-2 focus:border-blue-500 placeholder-slate-600 transition-all w-full max-w-sm"
                            placeholder="Nombre de tu Evento..."
                            value={eventData.name}
                            onChange={handleNameChange}
                        />
                        {eventData.services?.some(s => s.group === 'eventpix_premium' && s.status === 'ready') ? (
                            <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/30 rounded-full flex-shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                <Crown size={14} className="text-amber-500" /> EventPix Premium
                            </span>
                        ) : (
                            <span className="text-xs font-semibold px-3 py-1 bg-slate-800 text-slate-300 rounded-full flex-shrink-0 border border-slate-700">EventPix Gratis</span>
                        )}
                    </div>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                        <span>👥 {eventData.guests.length} Invitados Totales</span>
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Dynamic Auto-save Indicator */}
                    <div className="flex items-center gap-2 mr-2 transition-all duration-300 min-w-[140px] justify-end">
                        {isSaving ? (
                            <span className="text-slate-400 text-sm font-medium flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                                Guardando...
                            </span>
                        ) : showSavedBadge ? (
                            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 size={16} /> Progreso guardado 😄
                            </span>
                        ) : (
                            <span className="text-slate-500 text-sm font-medium flex items-center gap-1.5 px-3 py-1.5">
                                <CheckCircle2 size={16} /> Sincronizado
                            </span>
                        )}
                    </div>

                    {isLoggedIn ? (
                        <>
                            <button 
                                onClick={async () => {
                                    await supabase.auth.signOut();
                                    localStorage.removeItem('eventpix_auth');
                                    localStorage.removeItem('eventpix_data'); // Ensure cache is strictly cleared
                                    window.location.reload();
                                }}
                                className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
                            >
                                Salir
                            </button>
                        </>
                    ) : (
                        <button 
                            onClick={handlePremiumFeature}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg mr-2"
                        >
                            <Save size={18} /> Guardar Progreso
                        </button>
                    )}
                    <div className="relative z-10 group/tooltip">
                        {/* Tooltip con flecha en el header de Dashboard */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max bg-blue-600 text-white text-xs font-medium py-1.5 px-3 rounded-lg shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                            💡 Podés descargarla y armar tu lista tranquilo en tu compu ☕
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-600 rotate-45"></div>
                        </div>
                        <button 
                            onClick={downloadTemplate}
                            className="text-slate-400 hover:text-blue-400 text-sm font-medium flex items-center gap-1 transition-colors h-[42px] px-2"
                            title="Descargar plantilla de ejemplo"
                        >
                            <Download size={16} /> Plantilla
                        </button>
                    </div>
                    <div className="relative group overflow-hidden rounded-xl">
                        <button className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center justify-center gap-2 transition-all border border-slate-700">
                            <Upload size={18} /> {uploading ? 'Procesando...' : 'Importar Excel'}
                        </button>
                        <input 
                            type="file" 
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            disabled={uploading}
                        />
                    </div>
                    
                    <button 
                        onClick={() => {
                            setGuestToEdit(null);
                            setIsGuestModalOpen(true);
                        }}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg"
                    >
                        <Plus size={18} /> Nuevo Invitado
                    </button>
                </div>
            </div>

            {/* HUMAN ASSISTANT MICRO-COPY */}
            <div className="bg-slate-900 border-b border-slate-800 p-4">
                <div className="max-w-4xl mx-auto flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-500/30">
                        <Info size={16} />
                    </div>
                    <div>
                        {eventData.guests.length === 0 ? (
                            <>
                                <p className="text-white font-medium">Tu fiesta todavía está muy tranquila 😅</p>
                                <p className="text-slate-400 text-sm mt-0.5">Empecemos agregando invitados para darle forma real al evento. Usa el botón azul o sube tu Excel.</p>
                            </>
                        ) : eventData.guests.length <= 20 ? (
                            <>
                                <p className="text-white font-medium">¡Ya empezaste! 🎉</p>
                                <p className="text-slate-400 text-sm mt-0.5">Todavía faltan algunos, pero ya avanzaste más de lo que parece. Tip EventPix: no hace falta resolver todo hoy, tu progreso se guarda.</p>
                            </>
                        ) : eventData.guests.length > 20 && eventData.tables.length === 0 ? (
                            <>
                                <p className="text-white font-medium">Esto ya parece una fiesta de verdad 😄</p>
                                <p className="text-slate-400 text-sm mt-0.5">Pero nadie sabe dónde sentarse todavía 😅. Ve a la pestaña "Organización de Mesas" para evitar caos el día del evento.</p>
                            </>
                        ) : (
                            <>
                                <p className="text-white font-medium">¡Excelente trabajo! 🎉</p>
                                <p className="text-slate-400 text-sm mt-0.5">Paso a paso se organiza una gran fiesta. Tip EventPix: separar familia y amigos en grupos distintos suele ayudar mucho.</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* DASHBOARD SUMMARY CARDS */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{eventData.guests.length}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Total Invitados</p>
                    </div>
                </div>
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">0</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Confirmados</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{eventData.guests.length}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">En Espera</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{eventData.tables.length}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Mesas Asignadas</p>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="px-6 mt-2">
                <div className="flex bg-slate-900 p-1 rounded-xl w-fit border border-slate-800 overflow-x-auto custom-scrollbar">
                    <button 
                        onClick={() => setActiveTab('list')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <Users size={16} /> Invitados
                    </button>
                    <button 
                        onClick={() => setActiveTab('kanban')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'kanban' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        <LayoutGrid size={16} /> Mesas
                    </button>
                    <button 
                        onClick={() => setActiveTab('my_event')}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'my_event' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        ⭐ Mi Evento
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 p-6 overflow-hidden flex flex-col">
                
                {activeTab === 'my_event' && (
                    <MyEventTab 
                        eventData={eventData} 
                        onChange={onChange} 
                        onSaveRequest={() => {
                            if (onSaveRequest) onSaveRequest();
                        }}
                    />
                )}

                {/* TAB MICRO-MESSAGES */}
                {activeTab === 'list' && (
                    <div className="mb-4 bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start sm:items-center gap-3">
                        <Users size={20} className="text-blue-400 mt-0.5 sm:mt-0 shrink-0" />
                        <p className="text-sm text-blue-200 font-medium">Armar la lista es el primer gran paso. No te preocupes por tener todo perfecto ahora, podés editarlo después.</p>
                    </div>
                )}
                {activeTab === 'kanban' && (
                    <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-start sm:items-center gap-3">
                        <LayoutGrid size={20} className="text-emerald-400 mt-0.5 sm:mt-0 shrink-0" />
                        <p className="text-sm text-emerald-200 font-medium">Llevemos esto a la realidad. Organizá quién se sienta con quién arrastrando a tus invitados a las mesas.</p>
                    </div>
                )}

                {/* SEARCH BAR (Only show if list or kanban) */}
                {(activeTab === 'list' || activeTab === 'kanban') && (
                    <div className="mb-6 flex gap-4 items-center justify-between">
                        <input 
                            type="text"
                            placeholder="Buscar invitado por nombre o grupo..."
                            className="flex-1 max-w-md bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        
                        {activeTab === 'kanban' && (
                            <button 
                                onClick={handleAddTable}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors shadow-lg flex-shrink-0"
                            >
                                <Plus size={16} /> Agregar Mesa
                            </button>
                        )}
                    </div>
                )}

                {/* --- LIST VIEW --- */}
                {activeTab === 'list' && (
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1 overflow-y-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50">
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invitado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Grupo</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mesa / Ubicación</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredGuests.map(guest => {
                                    const assignedTable = eventData.tables.find(t => t.id === guest.table_id);
                                    
                                    return (
                                        <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-slate-900">{guest.display_name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {guest.group ? (
                                                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                                                        {guest.group}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 text-sm italic">Sin grupo</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {assignedTable ? (
                                                    <span className="font-semibold text-amber-600">{assignedTable.label}</span>
                                                ) : (
                                                    <span className="text-slate-400 text-sm italic">Sin asignar</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-slate-500 text-sm">Pendiente</span>
                                            </td>
                                            <td className="px-6 py-4 text-right relative">
                                                <button 
                                                    onClick={() => setActiveDropdown(activeDropdown === guest.id ? null : guest.id)}
                                                    className="text-slate-400 hover:text-blue-500 transition-colors p-1"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>

                                                {/* Action Dropdown */}
                                                {activeDropdown === guest.id && (
                                                    <div className="absolute right-6 top-10 mt-2 w-48 bg-slate-800 rounded-xl border border-slate-700 shadow-xl z-50 overflow-hidden">
                                                        <button 
                                                            onClick={() => openEditModal(guest)}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition-colors"
                                                        >
                                                            <Edit size={14} /> Editar Invitado
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteGuest(guest.id)}
                                                            className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-2 transition-colors border-t border-slate-700/50"
                                                        >
                                                            <Trash2 size={14} /> Eliminar
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredGuests.length === 0 && eventData.guests.length > 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No se encontraron invitados para esta búsqueda.
                                        </td>
                                    </tr>
                                )}
                                {eventData.guests.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center">
                                            <div className="max-w-sm mx-auto">
                                                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Users size={32} />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800 mb-2">Todo evento empieza con una persona</h3>
                                                <p className="text-slate-500 text-sm mb-6">
                                                    Sumá a tu primer invitado para empezar a darle forma a la fiesta. No hace falta que estén confirmados todavía.
                                                </p>
                                                <div className="flex flex-col gap-3">
                                                    <button 
                                                        onClick={() => setIsGuestModalOpen(true)}
                                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-colors shadow-lg"
                                                    >
                                                        + Agregar Manualmente
                                                    </button>
                                                    <label className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors cursor-pointer text-center">
                                                        <span>Importar desde Excel</span>
                                                        <input 
                                                            type="file" 
                                                            accept=".csv"
                                                            className="hidden"
                                                            onChange={handleFileUpload}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- KANBAN / TABLES VIEW --- */}
                {activeTab === 'kanban' && (
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {/* Sub-header for Tables (Lista vs Visual) */}
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex bg-slate-900 p-1 rounded-xl w-fit border border-slate-800">
                                <button 
                                    onClick={() => setTableMode('list')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tableMode === 'list' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    📝 Lista
                                </button>
                                <button 
                                    onClick={() => setTableMode('canvas')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tableMode === 'canvas' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                                >
                                    🪑 Plano visual
                                </button>
                            </div>
                            
                            {tableMode === 'canvas' && (
                                <button 
                                    onClick={handleDownloadPdf}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
                                    id="download-canvas-btn"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Descargar PDF
                                </button>
                            )}
                        </div>

                        {tableMode === 'list' ? (
                            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 custom-scrollbar items-start">
                                {/* UNASSIGNED COLUMN */}
                                <div 
                                    className="w-80 flex-shrink-0 bg-white rounded-2xl border border-slate-200 flex flex-col max-h-full"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, undefined)}
                                >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-2xl">
                                <h3 className="font-bold text-slate-800">Sin Asignar</h3>
                                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">
                                    {unassignedGuests.length}
                                </span>
                            </div>
                            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-50/50">
                                {unassignedGuests.map(guest => (
                                    <div 
                                        key={guest.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, guest.id)}
                                        className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="text-slate-300 group-hover:text-blue-400">
                                                <GripVertical size={16} />
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800">{guest.display_name}</p>
                                                {guest.group && <p className="text-xs text-slate-500 mt-0.5">{guest.group}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {unassignedGuests.length === 0 && eventData.guests.length > 0 && (
                                    <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-slate-400 text-sm">¡Excelente! Todos tus invitados ya tienen una silla asegurada 🎉</p>
                                    </div>
                                )}
                                {unassignedGuests.length === 0 && eventData.guests.length === 0 && (
                                    <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
                                        <p className="text-slate-400 text-sm">Todavía no agregaste invitados. Ve a la vista de "Lista" para empezar.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* TABLE COLUMNS */}
                        {eventData.tables.map(table => {
                            const tableGuests = filteredGuests.filter(g => g.table_id === table.id);
                            
                            return (
                                <div 
                                    key={table.id}
                                    className="w-80 flex-shrink-0 bg-white rounded-2xl border border-slate-200 flex flex-col max-h-full"
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, table.id)}
                                >
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2 flex-1 mr-2">
                                            <input 
                                                type="text"
                                                value={table.label}
                                                onChange={(e) => handleUpdateTableLabel(table.id, e.target.value)}
                                                className="font-bold text-slate-800 bg-transparent border-b border-transparent focus:border-blue-500 focus:outline-none w-full max-w-[130px]"
                                                title="Clic para editar nombre"
                                                placeholder="Nombre mesa"
                                            />
                                            <button 
                                                onClick={() => handleDeleteTable(table.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                title="Eliminar mesa"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <span className={`flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full ${tableGuests.length > table.capacity ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {tableGuests.length} / {table.capacity}
                                        </span>
                                    </div>
                                    <div className="p-4 flex-1 overflow-y-auto space-y-3">
                                        {tableGuests.map(guest => (
                                            <div 
                                                key={guest.id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, guest.id)}
                                                className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="text-slate-300 group-hover:text-blue-400">
                                                        <GripVertical size={16} />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-slate-800">{guest.display_name}</p>
                                                        {guest.group && <p className="text-xs text-slate-500 mt-0.5">{guest.group}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {tableGuests.length === 0 && (
                                            <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl">
                                                <p className="text-slate-400 text-sm">Arrastra invitados aquí</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                            </div>
                        ) : (
                            <TablesCanvas eventData={eventData} onChange={onChange} />
                        )}
                        {/* ADD NEW TABLE BUTTON */}
                        <div className="w-80 flex-shrink-0 flex flex-col gap-4">
                            <button 
                                onClick={handleAddTable}
                                className="w-full border-2 border-dashed border-slate-700 hover:border-blue-500 hover:bg-slate-900 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-blue-400 transition-colors h-32"
                            >
                                <Plus size={24} />
                                <span className="font-medium">Agregar nueva mesa</span>
                            </button>
                            
                            {/* Table Settings Box */}
                            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                                <h4 className="text-white font-medium flex items-center gap-2 mb-4">
                                    <Settings size={16} className="text-blue-400" /> Ajustes por Defecto
                                </h4>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400">Capacidad de nuevas mesas</label>
                                    <input 
                                        type="number"
                                        min="2"
                                        max="50"
                                        value={defaultTableCapacity}
                                        onChange={(e) => setDefaultTableCapacity(Number(e.target.value))}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-blue-500"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Las mesas creadas al importar o agregar manualmente tendrán esta capacidad.</p>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>

            {/* Modals */}
            <PlannerGuestModal 
                isOpen={isGuestModalOpen} 
                onClose={() => {
                    setIsGuestModalOpen(false);
                    // Slight delay to avoid flicker while closing
                    setTimeout(() => setGuestToEdit(null), 200);
                }} 
                guestToEdit={guestToEdit}
                onGuestAdded={handleAddManualGuest} 
                onGuestUpdated={handleUpdateGuest}
            />
        </div>
    );
}
