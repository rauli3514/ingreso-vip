import { useRef } from 'react';
import { EventData } from './types';
import { motion } from 'framer-motion';

interface TablesCanvasProps {
    eventData: EventData;
    onChange: (data: EventData) => void;
}

export default function TablesCanvas({ eventData, onChange }: TablesCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleDragEnd = (_e: any, info: any, tableId: string) => {
        const table = eventData.tables.find(t => t.id === tableId);
        if (!table) return;
        
        // Calculate new position
        const newX = table.x + info.offset.x;
        const newY = table.y + info.offset.y;

        const updatedTables = eventData.tables.map(t => 
            t.id === tableId ? { ...t, x: newX, y: newY } : t
        );
        
        onChange({ ...eventData, tables: updatedTables });
    };

    return (
        <div id="tables-canvas-container" className="flex-1 w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden relative shadow-inner flex items-center justify-center min-h-[600px] z-0">
            <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none"></div>
            
            {eventData.tables.length === 0 ? (
                <div className="text-center z-10">
                    <p className="text-slate-400 font-medium">Aún no agregaste mesas.</p>
                    <p className="text-slate-500 text-sm mt-2">Agrega mesas desde la vista "Lista" para organizarlas aquí.</p>
                </div>
            ) : (
                <div ref={canvasRef} className="absolute inset-0 overflow-hidden">
                    {eventData.tables.map(table => {
                        const guestsInTable = eventData.guests.filter(g => g.table_id === table.id);
                        const isFull = guestsInTable.length >= table.capacity;

                        // Escala: 1 metro = 120 pixels
                        // 10 sillas = 1.2m, 6 sillas = 0.8m -> 0.1m extra por silla a partir de 6
                        const PIXELS_PER_METER = 120;
                        const baseMeters = 0.8;
                        const extraChairs = Math.max(0, table.capacity - 6);
                        const sizeInMeters = baseMeters + (extraChairs * 0.1);
                        const tableSize = sizeInMeters * PIXELS_PER_METER;
                        const containerSize = tableSize + 60; // 30px padding on each side for chairs

                        return (
                            <motion.div
                                key={table.id}
                                drag
                                dragMomentum={false}
                                dragConstraints={canvasRef}
                                onDragEnd={(e, info) => handleDragEnd(e, info, table.id)}
                                initial={{ x: table.x || 0, y: table.y || 0 }}
                                // Ensure that if the parent state changes (e.g. initial load), it respects it
                                animate={{ x: table.x || 0, y: table.y || 0 }}
                                // Suppress the layout animation during drag to avoid fighting with user input
                                layout={false}
                                transition={{ duration: 0 }}
                                className="absolute flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
                                style={{
                                    width: containerSize,
                                    height: containerSize,
                                }}
                            >
                                {/* The actual table circle */}
                                <div 
                                    className={`absolute flex flex-col items-center justify-center rounded-full shadow-lg border-4
                                        ${isFull ? 'bg-amber-900/40 border-amber-500/50' : 'bg-blue-900/40 border-blue-500/50'}
                                        hover:bg-blue-800/40 hover:border-blue-500 transition-colors backdrop-blur-sm z-10`}
                                    style={{ width: tableSize, height: tableSize }}
                                >
                                    <span className="font-bold text-white text-center px-2 truncate w-full z-10 text-sm">{table.label}</span>
                                    <span className="text-xs text-slate-300 font-medium mt-1">
                                        {guestsInTable.length} / {table.capacity}
                                    </span>
                                </div>

                                {/* Chairs */}
                                {Array.from({ length: table.capacity }).map((_, i) => {
                                    const angle = (i * 360) / table.capacity;
                                    const distance = (tableSize / 2) + 15; // table radius + chair gap
                                    const x = Math.cos((angle * Math.PI) / 180) * distance;
                                    const y = Math.sin((angle * Math.PI) / 180) * distance;
                                    const isOccupied = i < guestsInTable.length;
                                    
                                    return (
                                        <div 
                                            key={i} 
                                            className={`absolute w-6 h-6 rounded-full border-2 transition-colors shadow-sm
                                                ${isOccupied ? 'bg-emerald-500 border-emerald-400 shadow-emerald-500/50' : 'bg-slate-800 border-slate-600'}`}
                                            style={{
                                                transform: `translate(${x}px, ${y}px)`,
                                                zIndex: 0
                                            }}
                                        ></div>
                                    );
                                })}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
