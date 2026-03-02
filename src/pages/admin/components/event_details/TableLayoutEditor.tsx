import { useState, useEffect, useRef, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Transformer, Line } from 'react-konva';
import { supabase } from '../../../../lib/supabase';
import { Event, Guest } from '../../../../types';
import { getUpdatedChairs } from '../../../../lib/layout-utils';
import { Plus, Trash2, Save, Printer, ZoomIn, ZoomOut, Move, MousePointer2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface TableLayoutEditorProps {
    event: Event;
    guests: Guest[];
    onUpdateGuests: (guests: Guest[]) => void;
}

interface LayoutObject {
    id: string;
    type: 'round' | 'rect';
    x: number;
    y: number;
    rotation: number;
    radius?: number; // for round
    width?: number; // for rect
    height?: number; // for rect
    label: string;
    capacity: number;
}

interface LayoutData {
    id?: string;
    width: number;
    height: number;
    objects: LayoutObject[];
}

export default function TableLayoutEditor({ event, guests, onUpdateGuests }: TableLayoutEditorProps) {
    const [layout, setLayout] = useState<LayoutData>({ width: 1500, height: 1000, objects: [] });
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [scale, setScale] = useState(0.4);
    const [position, setPosition] = useState({ x: 50, y: 50 });
    const stageRef = useRef<any>(null);
    const [showGrid] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    useEffect(() => {
        fetchLayout();

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
                // Check if we are focusing an input
                if (document.activeElement?.tagName === 'INPUT') return;
                deleteObject(selectedId);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [event.id]);

    const fetchLayout = async () => {
        try {
            const { data, error } = await supabase
                .from('event_layouts')
                .select('*')
                .eq('event_id', event.id)
                .order('updated_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const layoutData = data[0];
                setLayout({
                    id: layoutData.id,
                    width: Number(layoutData.width),
                    height: Number(layoutData.height),
                    objects: typeof layoutData.objects === 'string' ? JSON.parse(layoutData.objects) : layoutData.objects
                });
            }
        } catch (err) {
            console.error('Error loading layout:', err);
        }
    };

    const saveLayout = async () => {
        try {
            const payload = {
                event_id: event.id,
                width: layout.width,
                height: layout.height,
                objects: layout.objects,
                updated_at: new Date().toISOString()
            };

            let error;
            let resultData;

            if (layout.id) {
                const { error: updateError } = await supabase
                    .from('event_layouts')
                    .update(payload)
                    .eq('id', layout.id);
                error = updateError;
            } else {
                const { data, error: insertError } = await supabase
                    .from('event_layouts')
                    .insert(payload)
                    .select()
                    .single();
                error = insertError;
                if (data) resultData = data;
            }

            if (error) {
                throw error;
            }

            if (resultData) {
                setLayout(prev => ({ ...prev, id: resultData.id }));
            }

            setHasUnsavedChanges(false);
            alert('Layout guardado correctamente');
        } catch (err: any) {
            console.error('Error saving layout:', err);
            alert(`Error al guardar: ${err.message || 'Error desconocido'}`);
        }
    };

    const addTable = (type: 'round' | 'rect') => {
        const id = crypto.randomUUID();
        // Calculate new position (center of current view)
        const centerX = (-position.x + (window.innerWidth / 2)) / scale;
        const centerY = (-position.y + (window.innerHeight / 2)) / scale;

        const newObj: LayoutObject = type === 'round'
            ? { id, type, x: centerX, y: centerY, rotation: 0, radius: 75, label: `Mesa ${layout.objects.length + 1}`, capacity: getUpdatedChairs('round', { width: 0, height: 0, radius: 75 }) }
            : { id, type, x: centerX, y: centerY, rotation: 0, width: 200, height: 100, label: `Mesa ${layout.objects.length + 1}`, capacity: getUpdatedChairs('rect', { width: 200, height: 100, radius: 0 }) };

        setLayout(prev => ({ ...prev, objects: [...prev.objects, newObj] }));
        setSelectedId(id);
        setHasUnsavedChanges(true);
    };

    const updateObject = (id: string, attrs: Partial<LayoutObject>) => {
        setLayout(prev => ({
            ...prev,
            objects: prev.objects.map(obj => obj.id === id ? { ...obj, ...attrs } : obj)
        }));
        setHasUnsavedChanges(true);
    };

    const deleteObject = async (id: string) => {
        const objToDelete = layout.objects.find(o => o.id === id);
        if (!confirm('¿Eliminar esta mesa?')) return;

        // Remove table assignment from guests sitting at this table
        if (objToDelete) {
            const updatedGuests = guests.map(g => g.table_info === objToDelete.label ? { ...g, table_info: undefined } : g);
            onUpdateGuests(updatedGuests);
            // Also update DB for these guests
            const affectedGuestIds = guests.filter(g => g.table_info === objToDelete.label).map(g => g.id);
            if (affectedGuestIds.length > 0) {
                await supabase.from('guests').update({ table_info: null }).in('id', affectedGuestIds);
            }
        }

        setLayout(prev => ({ ...prev, objects: prev.objects.filter(o => o.id !== id) }));
        setSelectedId(null);
        setHasUnsavedChanges(true);
    };

    const selectedObject = layout.objects.find(o => o.id === selectedId);

    // Guests assigned to selected table (by label matching)
    const assignedGuests = useMemo(() => {
        if (!selectedObject) return [];
        return guests.filter(g => g.table_info === selectedObject.label);
    }, [guests, selectedObject]);

    const unassignedGuests = useMemo(() => {
        return guests.filter(g => !g.table_info);
    }, [guests]);

    const handleAssignGuest = async (guestId: string, tableName: string) => {
        // Optimistic UI
        const updatedGuests = guests.map(g => g.id === guestId ? { ...g, table_info: tableName } : g);
        onUpdateGuests(updatedGuests);
        await supabase.from('guests').update({ table_info: tableName }).eq('id', guestId);
    };

    const handleUnassignGuest = async (guestId: string) => {
        const updatedGuests = guests.map(g => g.id === guestId ? { ...g, table_info: undefined } : g);
        onUpdateGuests(updatedGuests);
        await supabase.from('guests').update({ table_info: null }).eq('id', guestId);
    };

    const maxChairs = selectedObject?.capacity || 0;

    const handleDownload = async () => {
        if (!stageRef.current) return;
        setSelectedId(null);
        setTimeout(() => {
            const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
            const pdf = new jsPDF('l', 'mm', 'a4');
            const width = pdf.internal.pageSize.getWidth();
            const height = pdf.internal.pageSize.getHeight();
            pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
            pdf.save(`layout-${event.name}.pdf`);
        }, 100);
    };

    // Calculate background grid
    const gridLines = useMemo(() => {
        const lines = [];
        // Vertical
        for (let i = 0; i <= layout.width; i += 100) {
            lines.push(<Line key={`v-${i}`} points={[i, 0, i, layout.height]} stroke="#e2e8f0" strokeWidth={1} />);
        }
        // Horizontal
        for (let i = 0; i <= layout.height; i += 100) {
            lines.push(<Line key={`h-${i}`} points={[0, i, layout.width, i]} stroke="#e2e8f0" strokeWidth={1} />);
        }
        return lines;
    }, [layout.width, layout.height]);

    return (
        <div className="flex h-[calc(100vh-240px)] border rounded-xl overflow-hidden bg-slate-50 shadow-inner">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r flex flex-col z-20 shadow-xl">
                <div className="p-4 border-b">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Move size={16} /> Organizar Mesas
                        </h3>
                        {hasUnsavedChanges && (
                            <span className="flex h-3 w-3 relative" title="Hay cambios sin guardar">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Arrastra y suelta mesas en el plano.</p>

                    {/* Room Dimensions */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Ancho Salón (cm)</label>
                            <input
                                type="number"
                                value={layout.width}
                                onChange={(e) => setLayout(prev => ({ ...prev, width: Number(e.target.value) }))}
                                className="w-full text-sm border-slate-200 rounded px-2 py-1 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Largo Salón (cm)</label>
                            <input
                                type="number"
                                value={layout.height}
                                onChange={(e) => setLayout(prev => ({ ...prev, height: Number(e.target.value) }))}
                                className="w-full text-sm border-slate-200 rounded px-2 py-1 bg-white text-slate-900 focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 grid grid-cols-2 gap-3 border-b bg-slate-50/50">
                    <button onClick={() => addTable('round')} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all group bg-white shadow-sm">
                        <div className="w-10 h-10 rounded-full border-2 border-slate-300 mb-2 group-hover:border-blue-400"></div>
                        <span className="text-xs font-semibold">Redonda</span>
                    </button>
                    <button onClick={() => addTable('rect')} className="flex flex-col items-center justify-center p-3 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all group bg-white shadow-sm">
                        <div className="w-10 h-8 border-2 border-slate-300 mb-2 group-hover:border-blue-400"></div>
                        <span className="text-xs font-semibold">Rectangular</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col relative">
                    {selectedObject ? (
                        <div className="flex flex-col min-h-0">
                            <div className="p-4 border-b bg-blue-50/30">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="font-bold text-sm text-slate-700">Mesa Seleccionada</h4>
                                    <button onClick={(e) => { e.stopPropagation(); deleteObject(selectedId!); }} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors" title="Eliminar Mesa">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nombre</label>
                                        <input
                                            type="text"
                                            value={selectedObject.label}
                                            onChange={(e) => updateObject(selectedObject.id, { label: e.target.value })}
                                            className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>

                                    {selectedObject.type === 'round' ? (
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Radio (cm)</label>
                                            <input
                                                type="number"
                                                value={selectedObject.radius}
                                                onChange={(e) => {
                                                    const newRadius = Number(e.target.value);
                                                    const newCapacity = getUpdatedChairs('round', { radius: newRadius, width: 0, height: 0 });
                                                    updateObject(selectedObject.id, { radius: newRadius, capacity: newCapacity });
                                                }}
                                                className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                                            />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Ancho</label>
                                                <input
                                                    type="number"
                                                    value={selectedObject.width}
                                                    onChange={(e) => {
                                                        const newWidth = Number(e.target.value);
                                                        const newCapacity = getUpdatedChairs('rect', { width: newWidth, height: selectedObject.height || 0, radius: 0 });
                                                        updateObject(selectedObject.id, { width: newWidth, capacity: newCapacity });
                                                    }}
                                                    className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Alto</label>
                                                <input
                                                    type="number"
                                                    value={selectedObject.height}
                                                    onChange={(e) => {
                                                        const newHeight = Number(e.target.value);
                                                        const newCapacity = getUpdatedChairs('rect', { width: selectedObject.width || 0, height: newHeight, radius: 0 });
                                                        updateObject(selectedObject.id, { height: newHeight, capacity: newCapacity });
                                                    }}
                                                    className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Capacidad (Sillas)</label>
                                        <input
                                            type="number"
                                            value={selectedObject.capacity || 0}
                                            onChange={(e) => updateObject(selectedObject.id, { capacity: Number(e.target.value) })}
                                            className="w-full text-sm border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex-col p-4 space-y-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">Invitados ({assignedGuests.length}/{maxChairs})</h4>
                                </div>
                                <div className="space-y-1 mb-4 pr-1">
                                    {assignedGuests.map(g => (
                                        <div key={g.id} className="text-sm flex justify-between items-center bg-green-50 px-3 py-2 rounded-lg border border-green-100 group">
                                            <span className="truncate w-32 font-medium text-green-800">{g.first_name} {g.last_name}</span>
                                            <button onClick={() => handleUnassignGuest(g.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                                        </div>
                                    ))}
                                    {assignedGuests.length === 0 && <div className="text-xs text-slate-400 italic text-center py-2">Mesa vacía</div>}
                                </div>

                                <div className="border-t pt-2">
                                    <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider mb-2">Sin Asignar</h4>
                                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar show-scrollbar">
                                        {unassignedGuests.map(g => (
                                            <div key={g.id} onClick={() => handleAssignGuest(g.id, selectedObject.label)} className="text-sm flex justify-between items-center bg-white px-3 py-2 rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                                                <span className="truncate text-slate-700 flex items-center gap-1">
                                                    {g.first_name} {g.last_name} {g.is_after_party && <span title="Trasnoche" className="text-xs">🌙</span>}
                                                </span>
                                                <Plus size={14} className="text-blue-500" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            <h4 className="font-bold text-slate-700 text-sm border-b pb-2">Resumen de Ocupación</h4>
                            <div className="space-y-2">
                                {layout.objects.map(obj => {
                                    const tableGuests = guests.filter(g => g.table_info === obj.label);
                                    const count = tableGuests.length;
                                    const max = obj.capacity || 0;
                                    const isFull = count >= max && max > 0;
                                    const isOverfull = count > max && max > 0;
                                    return (
                                        <div key={obj.id} className="flex justify-between items-center text-sm p-2 bg-white rounded-lg border border-slate-100 shadow-sm cursor-pointer hover:border-blue-300 transition-all" onClick={() => setSelectedId(obj.id)}>
                                            <span className="font-medium text-slate-700">{obj.label}</span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${isOverfull ? 'bg-red-100 text-red-700' : isFull ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {count} / {max}
                                            </span>
                                        </div>
                                    );
                                })}
                                {layout.objects.length === 0 && (
                                    <div className="text-center text-slate-400 text-xs italic py-4">No hay mesas en el plano. Agrega una para comenzar.</div>
                                )}
                            </div>

                            {event.has_after_party && (
                                <div className="mt-6">
                                    <h4 className="font-bold text-slate-700 text-sm border-b pb-2 mb-2">Trasnoche</h4>
                                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex justify-between items-center shadow-sm">
                                        <span className="text-sm font-medium text-purple-900 flex items-center gap-2">🌙 Total Trasnoche</span>
                                        <span className="text-xs font-bold bg-purple-200 text-purple-800 px-2 py-1 rounded-full">
                                            {guests.filter(g => g.is_after_party).length}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-purple-600/70 mt-1 italic text-center">Tienen el icono 🌙 en la lista de invitados</p>
                                </div>
                            )}

                            <div className="mt-8 text-center p-4">
                                <MousePointer2 size={32} className="mx-auto mb-3 opacity-20 text-slate-600" />
                                <p className="text-xs text-slate-500">Selecciona una mesa en la lista o en el plano para editarla detalladamente.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 flex gap-2">
                    <button onClick={saveLayout} className={`flex-1 rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${hasUnsavedChanges ? 'bg-orange-500 hover:bg-orange-600 text-white animate-pulse-slow' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                        <Save size={16} /> {hasUnsavedChanges ? 'Guardar Cambios*' : 'Guardar'}
                    </button>
                    <button onClick={handleDownload} className="px-3 bg-white border border-slate-200 text-slate-700 rounded-lg py-2 hover:bg-slate-50 transition-colors shadow-sm" title="Descargar PDF">
                        <Printer size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative bg-[#e5e5f7] overflow-hidden cursor-move select-none" style={{ backgroundImage: 'radial-gradient(#444cf7 0.5px, #e5e5f7 0.5px)', backgroundSize: '10px 10px' }}>
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                    <div className="bg-white p-1 rounded-lg shadow-lg border border-slate-200 flex flex-col gap-1">
                        <button onClick={() => setScale(s => Math.min(2, s + 0.1))} className="p-2 hover:bg-slate-100 rounded-md transition-colors"><ZoomIn size={18} className="text-slate-600" /></button>
                        <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-2 hover:bg-slate-100 rounded-md transition-colors"><ZoomOut size={18} className="text-slate-600" /></button>
                    </div>
                    <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200 text-xs font-mono text-slate-500">
                        Zoom: {(scale * 100).toFixed(0)}%
                    </div>
                </div>

                <Stage
                    width={window.innerWidth}
                    height={window.innerHeight}
                    scaleX={scale}
                    scaleY={scale}
                    x={position.x}
                    y={position.y}
                    draggable
                    onDragEnd={(e) => {
                        if (e.target === e.target.getStage()) {
                            setPosition({ x: e.target.x(), y: e.target.y() });
                        }
                    }}
                    ref={stageRef}
                >
                    <Layer>
                        {/* Room Floor */}
                        <Rect
                            x={0}
                            y={0}
                            width={layout.width}
                            height={layout.height}
                            fill="white"
                            shadowColor="black"
                            shadowBlur={20}
                            shadowOpacity={0.1}
                        />
                        {/* Border of Room */}
                        <Rect
                            x={0}
                            y={0}
                            width={layout.width}
                            height={layout.height}
                            stroke="#94a3b8"
                            strokeWidth={2}
                        />

                        {/* Grid on Floor */}
                        {showGrid && gridLines}

                        {/* Tables */}
                        {layout.objects.map((obj) => (
                            <TableGroup
                                key={obj.id}
                                obj={obj}
                                isSelected={selectedId === obj.id}
                                onSelect={() => setSelectedId(obj.id)}
                                onChange={(newAttrs: any) => updateObject(obj.id, newAttrs)}
                                guests={guests.filter(g => g.table_info === obj.label)}
                            />
                        ))}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
}

const TableGroup = ({ obj, isSelected, onSelect, onChange, guests }: any) => {
    const groupRef = useRef<any>(null);
    const trRef = useRef<any>(null);

    useEffect(() => {
        if (isSelected && trRef.current && groupRef.current) {
            trRef.current.nodes([groupRef.current]);
            trRef.current.getLayer().batchDraw();
        }
    }, [isSelected]);

    const chairsCount = obj.capacity || getUpdatedChairs(obj.type, { radius: obj.radius, width: obj.width, height: obj.height });
    const chairs = useMemo(() => {
        const c = [];
        if (obj.type === 'round') {
            const radius = obj.radius;
            // chairs separation
            for (let i = 0; i < chairsCount; i++) {
                const angle = (i * 2 * Math.PI) / chairsCount;
                const chairX = (radius + 20) * Math.cos(angle);
                const chairY = (radius + 20) * Math.sin(angle);
                c.push({ x: chairX, y: chairY, occupied: i < guests.length });
            }
        } else {
            // Simple visual distribution logic
            // distribute evenly along perimeter
            const w = obj.width;
            const h = obj.height;
            const count = chairsCount;
            const perimeter = 2 * (w + h);
            // distance walker
            let dist = 0;
            const step = perimeter / count;
            for (let i = 0; i < count; i++) {
                // Determine pos based on dist
                let x = 0, y = 0;
                let d = dist;
                if (d < w) { // Top edge
                    x = -w / 2 + d; y = -h / 2 - 20;
                } else if (d < w + h) { // Right edge
                    x = w / 2 + 20; y = -h / 2 + (d - w);
                } else if (d < 2 * w + h) { // Bottom edge
                    x = w / 2 - (d - (w + h)); y = h / 2 + 20;
                } else { // Left edge
                    x = -w / 2 - 20; y = h / 2 - (d - (2 * w + h));
                }
                c.push({ x, y, occupied: i < guests.length });
                dist += step;
            }
        }
        return c;
    }, [obj.width, obj.height, obj.radius, obj.type, chairsCount, guests.length]);

    return (
        <>
            <Group
                ref={groupRef}
                x={obj.x}
                y={obj.y}
                draggable
                onClick={(e) => { e.cancelBubble = true; onSelect(); }}
                onTap={(e) => { e.cancelBubble = true; onSelect(); }}
                onDragEnd={(e) => {
                    e.cancelBubble = true;
                    const node = groupRef.current;
                    if (node) {
                        onChange({ x: node.x(), y: node.y() });
                    }
                }}
                onTransformEnd={(e) => {
                    e.cancelBubble = true;
                    const node = groupRef.current;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);

                    if (obj.type === 'round') {
                        onChange({
                            x: node.x(),
                            y: node.y(),
                            radius: Math.max(20, Math.round(obj.radius * scaleX)),
                            capacity: getUpdatedChairs('round', { radius: Math.max(20, Math.round(obj.radius * scaleX)), width: 0, height: 0 })
                        });
                    } else {
                        onChange({
                            x: node.x(),
                            y: node.y(),
                            width: Math.max(30, Math.round(obj.width * scaleX)),
                            height: Math.max(30, Math.round(obj.height * scaleY)),
                            capacity: getUpdatedChairs('rect', { width: Math.max(30, Math.round(obj.width * scaleX)), height: Math.max(30, Math.round(obj.height * scaleY)), radius: 0 })
                        });
                    }
                }}
            >
                {/* Chairs */}
                {chairs.map((c, i) => (
                    <Circle
                        key={i}
                        x={c.x}
                        y={c.y}
                        radius={12}
                        fill={c.occupied ? "#4ade80" : "#ffffff"}
                        stroke={c.occupied ? "#16a34a" : "#94a3b8"}
                        strokeWidth={2}
                        shadowBlur={2}
                        opacity={0.9}
                    />
                ))}

                {/* Table Top */}
                {obj.type === 'round' ? (
                    <Circle
                        radius={obj.radius}
                        fill={isSelected ? '#eff6ff' : 'white'}
                        stroke="#2563eb"
                        strokeWidth={isSelected ? 3 : 1}
                        shadowColor="black"
                        shadowBlur={10}
                        shadowOpacity={0.15}
                    />
                ) : (
                    <Rect
                        x={-obj.width / 2}
                        y={-obj.height / 2}
                        width={obj.width}
                        height={obj.height}
                        fill={isSelected ? '#eff6ff' : 'white'}
                        stroke="#2563eb"
                        strokeWidth={isSelected ? 3 : 1}
                        cornerRadius={4}
                        shadowColor="black"
                        shadowBlur={10}
                        shadowOpacity={0.15}
                    />
                )}

                <Text
                    text={obj.label}
                    fontSize={Math.max(12, Math.min(obj.width || obj.radius, 20))}
                    fontStyle="bold"
                    align="center"
                    verticalAlign="middle"
                    width={obj.type === 'round' ? obj.radius * 2 : obj.width}
                    height={obj.type === 'round' ? obj.radius * 2 : obj.height}
                    x={obj.type === 'round' ? -obj.radius : -obj.width / 2}
                    y={obj.type === 'round' ? -obj.radius : -obj.height / 2}
                    fill="#1e293b"
                />
            </Group>
            {isSelected && (
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        if (newBox.width < 50 || newBox.height < 50) return oldBox;
                        return newBox;
                    }}
                    enabledAnchors={obj.type === 'round' ? ['top-left', 'top-right', 'bottom-left', 'bottom-right'] : ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'middle-left', 'middle-right', 'top-center', 'bottom-center']}
                />
            )}
        </>
    );
};
