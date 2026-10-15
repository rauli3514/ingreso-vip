// @ts-nocheck
import { Users, LayoutGrid, Plus, MoreVertical, GripVertical, CheckCircle2, Clock, Upload, Download, Save, Info, Settings, Trash2, Edit, Crown, FileText } from 'lucide-react';
import { EventData, PlannerGuest, PlannerTable } from './types';
import { trackEvent } from '../../../lib/analytics';
import { importGuestFile, exportGuestsXlsx, downloadGuestTemplate, GUEST_FILE_ACCEPT } from '../../../lib/guestSpreadsheet';
import PlannerGuestModal from './PlannerGuestModal';
import MyEventTab from './MyEventTab';
import TablesCanvas from './TablesCanvas';
import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import MobileHero from './components/MobileHero';
import MobileStats from './components/MobileStats';
import UpsellBanner from './components/UpsellBanner';
import PremiumUpgradeModal from './PremiumUpgradeModal';
import NextStepCard from './components/NextStepCard';
import GuestMobileCard from './components/GuestMobileCard';
import { Star, Calendar, Cloud, UserCheck, AlertCircle, Play, X, LogOut, ArrowRight, Table2, CheckSquare, ListTodo, HelpCircle, DollarSign, Wallet, Percent, AlertTriangle } from 'lucide-react';
import ProServicesTab from './ProServicesTab';
import type { SyncStatus } from '../EventPlanner';
import { hasPaidPlan } from '../../../lib/plans';

interface DashboardProps {
    eventData: EventData;
    onChange: (data: EventData) => void;
    initialOpenManualGuest?: boolean;
    onSaveRequest?: () => void;
    syncStatus?: SyncStatus;
}

type TabType = 'list' | 'kanban' | 'my_event' | 'pro';

export default function Dashboard({ eventData, onChange, initialOpenManualGuest = false, onSaveRequest, syncStatus = 'idle' }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<TabType>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(initialOpenManualGuest || false);
    const [guestToEdit, setGuestToEdit] = useState<PlannerGuest | null>(null);
    const [defaultTableCapacity, setDefaultTableCapacity] = useState(10);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [tableMode, setTableMode] = useState<'list' | 'canvas'>('list');
    const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
    const [justExported, setJustExported] = useState(false);
    const hasInvitationPlan = eventData.active_modules?.includes('invitation_pro');
    const hasReceptionPlan = eventData.active_modules?.includes('vip_access');
    
    // Auto-save UI states
    const [isSaving, setIsSaving] = useState(false);
    const [showSavedBadge, setShowSavedBadge] = useState(false);

    // Watch for syncStatus changes to show save badge
    React.useEffect(() => {
        if (syncStatus === 'saving') {
            setIsSaving(true);
            setShowSavedBadge(false);
        } else if (syncStatus === 'saved') {
            setIsSaving(false);
            setShowSavedBadge(true);
        } else if (syncStatus === 'idle') {
            setIsSaving(false);
            setShowSavedBadge(false);
        } else if (syncStatus === 'error') {
            setIsSaving(false);
            setShowSavedBadge(false);
        }
    }, [syncStatus]);

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

    const exportGuestListToPDF = () => {
        const doc = new jsPDF();
        
        // Add Title
        doc.setFontSize(18);
        doc.setTextColor(15, 23, 42); // slate-900
        doc.text(`Lista de Invitados - ${eventData.name}`, 14, 22);
        
        // Add Meta Info
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Total de Invitados: ${eventData.guests.length} | Confirmados: ${eventData.guests.filter(g => g.status === 'confirmed').length}`, 14, 30);
        
        // Table Data
        const tableColumn = ["Nombre", "Grupo", "Mesa", "Estado", "Observaciones"];
        const tableRows: any[] = [];

        // Sort guests by group, then name for better reading
        const sortedGuests = [...eventData.guests].sort((a, b) => {
            if ((a.group || '') < (b.group || '')) return -1;
            if ((a.group || '') > (b.group || '')) return 1;
            return a.display_name.localeCompare(b.display_name);
        });

        sortedGuests.forEach(guest => {
            let tableName = 'Sin asignar';
            if (guest.table_id) {
                const table = eventData.tables.find(t => t.id === guest.table_id);
                if (table) tableName = table.label;
            }

            const guestData = [
                guest.display_name,
                guest.group || '-',
                tableName,
                guest.status === 'confirmed' ? 'Confirmado' : 'Pendiente',
                guest.note || '-'
            ];
            tableRows.push(guestData);
        });

        (doc as any).autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235], textColor: 255 }, // blue-600
            alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
            margin: { top: 40 },
        });

        doc.save(`Invitados_${eventData.name.replace(/ /g, '_')}.pdf`);
        setJustExported(true);
    };

    // --- GUEST MANAGEMENT ---

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // Reset input
        if (!file) return;

        setUploading(true);
        try {
            const { guests, tables } = await importGuestFile(file, eventData.tables, defaultTableCapacity);
            trackEvent('excel_uploaded', { guest_count: guests.length });
            onChange({ ...eventData, guests: [...eventData.guests, ...guests], tables });
        } catch (error: any) {
            alert(error.message || 'No pudimos leer el archivo. Probá con la plantilla.');
        } finally {
            setUploading(false);
        }
    };

    const handleExportExcel = () => {
        trackEvent('excel_exported', { guest_count: eventData.guests.length });
        exportGuestsXlsx(eventData.name, eventData.guests, eventData.tables);
        setJustExported(true);
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
        downloadGuestTemplate();
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
        <div className="min-h-screen bg-slate-950 flex flex-col relative pb-20 md:pb-0">
            
            {/* TOP HEADER (Simulating Ingreso VIP Panel) */}
            <div className="hidden md:flex bg-slate-900 border-b border-slate-800 p-6 flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <input 
                            type="text" 
                            className="bg-transparent text-3xl font-bold text-white focus:outline-none focus:border-b-2 focus:border-blue-500 placeholder-slate-600 transition-all w-full max-w-sm"
                            placeholder="Nombre de tu Evento..."
                            value={eventData.name}
                            onChange={handleNameChange}
                        />
                        {hasPaidPlan(eventData) ? (
                            <span className="text-xs font-bold px-3 py-1 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-500 border border-amber-500/30 rounded-full flex-shrink-0 flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                <Crown size={14} className="text-amber-500" /> EventPix Pro
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
                        {/* Sync Status Badge */}
                        {syncStatus === 'error' ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/10 text-red-500 rounded-full border border-red-500/20">
                                <AlertTriangle size={12} className="animate-pulse" />
                                <span className="text-[10px] font-bold tracking-wider">Error de Sync</span>
                            </div>
                        ) : isSaving ? (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full">
                                <Cloud size={12} className="animate-pulse" />
                                <span className="text-[10px] font-medium tracking-wider">Guardando...</span>
                            </div>
                        ) : showSavedBadge && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
                                <CheckCircle2 size={12} />
                                <span className="text-[10px] font-bold tracking-wider">Sincronizado</span>
                            </div>
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
                            className="px-5 py-2.5 border border-blue-500/50 text-blue-300 hover:bg-blue-500/10 rounded-xl font-medium flex items-center justify-center gap-2 transition-all mr-2"
                        >
                            <Save size={18} /> Guardar Progreso
                        </button>
                    )}
                    <div className="relative z-10 group/tooltip">
                        {/* Tooltip con flecha en el header de Dashboard */}
                        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 text-center bg-blue-600 text-white text-xs font-medium py-2 px-3 rounded-xl shadow-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50">
                            💡 Podés descargarla y armar tu lista tranquilo en tu compu ☕
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-600 rotate-45"></div>
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
                            accept={GUEST_FILE_ACCEPT}
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

            {/* MOBILE TOP BAR (Save/Exit) */}
            <div className="flex md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 items-center justify-between">
                <div className="flex items-center gap-2">
                    {isSaving ? (
                        <span className="text-slate-400 text-xs font-medium flex items-center gap-1.5">
                            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            Guardando...
                        </span>
                    ) : showSavedBadge ? (
                        <span className="text-emerald-400 text-xs font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                            <CheckCircle2 size={12} /> Guardado
                        </span>
                    ) : (
                        <span className="text-slate-500 text-xs font-medium flex items-center gap-1">
                            <CheckCircle2 size={12} /> Sincronizado
                        </span>
                    )}
                </div>

                <div>
                    {isLoggedIn ? (
                        <button 
                            onClick={async () => {
                                await supabase.auth.signOut();
                                localStorage.removeItem('eventpix_auth');
                                localStorage.removeItem('eventpix_data');
                                window.location.reload();
                            }}
                            className="text-slate-400 hover:text-white text-xs font-medium transition-colors border border-slate-700 px-3 py-1.5 rounded-lg bg-slate-800"
                        >
                            Salir
                        </button>
                    ) : (
                        <button 
                            onClick={handlePremiumFeature}
                            className="px-3 py-1.5 border border-blue-500/50 text-blue-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
                        >
                            <Save size={14} /> Guardar
                        </button>
                    )}
                </div>
            </div>

            {/* MOBILE: el hero grande solo cuando todavía no hay invitados */}
            {eventData.guests.length === 0 && (
                <MobileHero
                    onAddGuest={() => {
                        setGuestToEdit(null);
                        setIsGuestModalOpen(true);
                    }}
                    onImportExcel={() => document.getElementById('mobile-upload-input')?.click()}
                    onDownloadTemplate={downloadTemplate}
                />
            )}
            <input type="file" id="mobile-upload-input" accept={GUEST_FILE_ACCEPT} className="hidden" onChange={handleFileUpload} />
            <MobileStats eventData={eventData} />

            {/* DASHBOARD SUMMARY CARDS */}
            <div className="p-6 hidden md:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950">
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
                        <p className="text-2xl font-bold text-white">{eventData.guests.filter(g => g.status === 'confirmed').length}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Confirmados</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{eventData.guests.filter(g => g.status === 'pending').length}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Pendientes</p>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                        <LayoutGrid size={24} />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-white">{eventData.tables.length}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Mesas</p>
                    </div>
                </div>
            </div>

            <NextStepCard eventData={eventData} onAction={setActiveTab} />

            {/* TAB NAVIGATION */}
            <div className="px-4 md:px-6 mt-0 md:mt-2 bg-slate-950">
                <div className="grid grid-cols-4 md:flex bg-slate-900 p-1.5 rounded-2xl w-full md:w-fit border border-slate-800 gap-1 shadow-lg shadow-black/20">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-5 py-2 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'list' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                    >
                        <Users size={18} /> <span>Invitados</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('kanban')}
                        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-5 py-2 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'kanban' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                    >
                        <LayoutGrid size={18} /> <span>Mesas</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('my_event')}
                        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-5 py-2 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'my_event' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                    >
                        <Star size={18} /> <span>Mi Evento</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('pro')}
                        className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-1 md:px-5 py-2 md:py-3 rounded-xl text-[11px] md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'pro' ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/10 text-amber-400 shadow-md border border-amber-500/30' : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-500/10'}`}
                    >
                        <Crown size={18} className={activeTab === 'pro' ? 'fill-amber-400/30' : ''} /> <span><span className="md:hidden">Pro</span><span className="hidden md:inline">Servicios Pro</span></span>
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
                        onNavigateToPro={() => setActiveTab('pro')}
                    />
                )}

                {/* OFERTAS EN EL MOMENTO JUSTO (dorado = pago) */}
                {activeTab === 'list' && justExported && !hasReceptionPlan && (
                    <UpsellBanner
                        id="reception_after_export"
                        title="Para la puerta del evento"
                        text="¿Vas a imprimir la lista para la entrada? Con la Recepcionista Virtual cada invitado busca su nombre en una pantalla y ve su mesa. Usa esta misma lista."
                        cta="Ver planes"
                        onCta={() => setIsPremiumModalOpen(true)}
                    />
                )}
                {activeTab === 'list' && !justExported && eventData.guests.length >= 20 && !hasInvitationPlan && (
                    <UpsellBanner
                        id="invitation_20_guests"
                        title="Invitación Digital"
                        text={`Ya tenés ${eventData.guests.length} invitados. Mandale a cada uno su invitación con link personal: confirman solos, te dicen cuántos van y si necesitan menú especial.`}
                        cta="Ver planes"
                        onCta={() => setIsPremiumModalOpen(true)}
                        secondary={{ label: 'Ver una muestra', href: '/invitacion/muestra' }}
                    />
                )}
                {activeTab === 'kanban' && eventData.guests.length > 0 && eventData.tables.length > 0 && unassignedGuests.length === 0 && !searchQuery && !hasReceptionPlan && (
                    <UpsellBanner
                        id="reception_all_seated"
                        title="¡Todos tienen mesa!"
                        text="El día del evento, que cada invitado encuentre su mesa solo: la Recepcionista Virtual muestra su mesa y un video de bienvenida en la entrada."
                        cta="Ver planes"
                        onCta={() => setIsPremiumModalOpen(true)}
                    />
                )}

                {/* SEARCH BAR (Only show if list or kanban) */}
                {(activeTab === 'list' || activeTab === 'kanban') && (
                    <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
                        <input
                            type="text"
                            placeholder="Buscar invitado por nombre o grupo..."
                            className="w-full sm:w-auto sm:flex-1 max-w-md bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                        
                        {activeTab === 'list' && eventData.guests.length > 0 && (
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={handleExportExcel}
                                    className="px-3 md:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors border border-slate-700"
                                    title="Excel con Mesa, Nombre, Apellido, Grupo, Confirmado, Trasnoche y Living"
                                >
                                    <Download size={16} /> Excel
                                </button>
                                <button
                                    onClick={exportGuestListToPDF}
                                    className="px-3 md:px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 transition-colors border border-slate-700"
                                >
                                    <Download size={16} /> PDF
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* --- LIST VIEW --- */}
                {activeTab === 'list' && (
                    <div className="bg-slate-950 md:bg-white md:rounded-2xl md:border md:border-slate-200 shadow-sm overflow-hidden flex-1 overflow-y-auto">
                        
                        {/* MOBILE CARDS VIEW */}
                        <div className="md:hidden">
                            {filteredGuests.map(guest => {
                                const assignedTable = eventData.tables.find(t => t.id === guest.table_id);
                                return (
                                    <GuestMobileCard 
                                        key={guest.id}
                                        guest={guest}
                                        tableName={assignedTable?.label || ''}
                                        onEdit={openEditModal}
                                        onDelete={handleDeleteGuest}
                                    />
                                );
                            })}
                            
                            {filteredGuests.length === 0 && eventData.guests.length > 0 && (
                                <div className="p-8 text-center text-slate-500">
                                    No se encontraron invitados.
                                </div>
                            )}
                        </div>

                        {/* DESKTOP TABLE VIEW */}
                        <table className="hidden md:table w-full text-left border-collapse">
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
                                                {guest.status === 'confirmed' ? (
                                                    <span className="text-emerald-500 text-sm font-medium">Confirmado</span>
                                                ) : (
                                                    <span className="text-slate-500 text-sm">Pendiente</span>
                                                )}
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
                                                            accept={GUEST_FILE_ACCEPT}
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
                        {/* PC TIP */}
                        <div className="md:hidden mt-0 mb-4 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex items-start gap-3 shadow-lg">
                            <span className="text-xl">💻</span>
                            <div>
                                <p className="text-sm text-slate-300 font-medium">Tip: Para organizar mesas grandes y mover invitados visualmente, la computadora suele ser más cómoda 😉</p>
                            </div>
                        </div>

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

                {/* --- PRO SERVICES VIEW --- */}
                {activeTab === 'pro' && (
                    <ProServicesTab 
                        eventData={eventData} 
                        onUpdateEvent={(data) => {
                            // Update local state immutably
                            const newData = { ...eventData, ...data };
                            onChange(newData);
                        }}
                        onSaveRequest={onSaveRequest} 
                    />
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
                guestToEdit={guestToEdit || undefined}
                onGuestAdded={handleAddManualGuest} 
                onGuestUpdated={handleUpdateGuest}
                existingGroups={[...new Set(eventData.guests.map(g => g.group || '').filter(Boolean))]}
                tables={eventData.tables}
            />

            {/* FLOATING MOBILE CTA */}
            <div className="md:hidden fixed bottom-6 right-6 z-[60]">
                <button 
                    onClick={() => {
                        setGuestToEdit(null);
                        setIsGuestModalOpen(true);
                    }}
                    className="w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(37,99,235,0.4)] active:scale-95 transition-transform"
                >
                    <Plus size={24} strokeWidth={3} />
                </button>
            </div>
            <PremiumUpgradeModal
                isOpen={isPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
                onSuccess={() => setIsPremiumModalOpen(false)}
                onSaveRequest={onSaveRequest}
            />
        </div>
    );
}
