import { useState, useRef } from 'react';
import { X, Upload, AlertCircle, Check, Loader2, Download } from 'lucide-react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';
import { Event, Guest } from '../types';

interface GuestImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    onImportComplete: (newGuests?: Guest[]) => void;
}

interface ParsedGuest {
    nombre: string;
    apellido: string;
    mesa?: string;
    isValid: boolean;
    error?: string;
}

export default function GuestImportModal({ isOpen, onClose, event, onImportComplete }: GuestImportModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [step, setStep] = useState<'upload' | 'preview' | 'uploading'>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [parsedGuests, setParsedGuests] = useState<ParsedGuest[]>([]);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            parseFile(selectedFile);
        }
    };

    const parseFile = (file: File) => {
        setError(null);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setError('Error al leer el archivo CSV. Verifique el formato.');
                    return;
                }

                const rawData = results.data as any[];

                // Normalize keys to lowercase to find nombre/apellido
                const normalizedData = rawData.map(row => {
                    const newRow: any = {};
                    Object.keys(row).forEach(key => {
                        newRow[key.toLowerCase().trim()] = row[key];
                    });
                    return newRow;
                });

                const guests: ParsedGuest[] = normalizedData.map((row) => {
                    const nombre = row['nombre'] || row['first_name'] || row['name'] || '';
                    const apellido = row['apellido'] || row['last_name'] || row['surname'] || '';
                    const mesa = row['mesa'] || row['table'] || '';

                    return {
                        nombre,
                        apellido,
                        mesa,
                        isValid: !!nombre && !!apellido
                    };
                });

                if (guests.length === 0) {
                    setError('No se encontraron datos válidos en el archivo.');
                    return;
                }

                setParsedGuests(guests);
                setStep('preview');
            },
            error: (err) => {
                setError('Error al procesar el archivo: ' + err.message);
            }
        });
    };

    const simulateLoadForDev = () => {
        const dummyGuests: ParsedGuest[] = [
            { nombre: 'Lionel', apellido: 'Messi', mesa: 'Mesa 10', isValid: true },
            { nombre: 'Antonela', apellido: 'Roccuzzo', mesa: 'Mesa 10', isValid: true },
            { nombre: 'Sergio', apellido: 'Aguero', mesa: 'Mesa 9', isValid: true },
            { nombre: 'Diego', apellido: 'Maradona', mesa: 'Cielo', isValid: true },
            { nombre: '', apellido: 'Incompleto', mesa: '', isValid: false, error: 'Falta nombre' },
        ];
        setParsedGuests(dummyGuests);
        setStep('preview');
    };

    const handleImport = async () => {
        setStep('uploading');

        // Mock mode for UI verification
        if (event.id === '123') {
            setTimeout(() => {
                const mockGuests: any[] = parsedGuests.filter(g => g.isValid).map((g, idx) => ({
                    id: `mock-${Date.now()}-${idx}`,
                    event_id: '123',
                    first_name: g.nombre,
                    last_name: g.apellido,
                    display_name: `${g.nombre} ${g.apellido}`,
                    table_info: g.mesa || null,
                    status: 'pending',
                    created_at: new Date().toISOString()
                }));
                onImportComplete(mockGuests);
                handleClose();
            }, 1500);
            return;
        }

        try {
            const validGuests = parsedGuests.filter(g => g.isValid).map(g => ({
                event_id: event.id,
                first_name: g.nombre,
                last_name: g.apellido,
                display_name: `${g.nombre} ${g.apellido}`,
                table_info: g.mesa || null,
                status: 'pending'
            }));

            if (validGuests.length === 0) {
                throw new Error('No hay invitados válidos para importar.');
            }

            const { error } = await supabase.from('guests').insert(validGuests);

            if (error) throw error;

            onImportComplete();
            handleClose();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error al guardar los invitados.');
            setStep('preview');
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedGuests([]);
        setStep('upload');
        setError(null);
        onClose();
    };

    const downloadTemplate = () => {
        let csvContent = "data:text/csv;charset=utf-8,Mesa,Nombre,Apellido\n";
        const tableCount = event.table_count || 0;
        const guestsPerTable = event.guests_per_table_default || 10;

        if (tableCount > 0) {
            for (let i = 1; i <= tableCount; i++) {
                for (let j = 0; j < guestsPerTable; j++) {
                    csvContent += `Mesa ${i},,\n`;
                }
            }
        } else {
            csvContent += "Mesa 1,Juan,Perez\n";
            csvContent += "Mesa VIP,Maria,Gonzalez\n";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `plantilla_invitados_${event.name.replace(/\s+/g, '_').toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-card w-full max-w-lg bg-[#030712] relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-black/40">
                    <div>
                        <h2 className="text-lg font-bold text-white">Importar Invitados</h2>
                        <p className="text-[10px] text-slate-400">Desde archivo CSV / Excel</p>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white">
                        <X size={18} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                    {step === 'upload' && (
                        <div className="space-y-6">
                            <div
                                className="border-2 border-dashed border-white/10 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:border-[#FBBF24]/50 hover:bg-white/5 transition-all cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-500 group-hover:text-[#FBBF24] transition-colors">
                                    <Upload size={32} />
                                </div>
                                <h3 className="text-white font-medium mb-1">Haz click para subir</h3>
                                <p className="text-xs text-slate-500 mb-4">Soporta archivos .csv</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".csv"
                                    className="hidden"
                                />
                            </div>

                            <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                                <AlertCircle size={20} className="text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-1">Formato Requerido</h4>
                                    <p className="text-xs text-blue-200/80 mb-2">
                                        El archivo debe tener las columnas: <span className="font-mono bg-black/20 px-1 rounded">Nombre</span>, <span className="font-mono bg-black/20 px-1 rounded">Apellido</span>.
                                        Opcionalmente: <span className="font-mono bg-black/20 px-1 rounded">Mesa</span>.
                                    </p>
                                    <button onClick={downloadTemplate} className="flex items-center gap-1 text-[10px] font-bold text-blue-400 hover:text-blue-300 hover:underline">
                                        <Download size={12} /> Descargar Plantilla de Ejemplo
                                    </button>
                                </div>
                            </div>

                            {/* Dev Helper */}
                            <div className="flex justify-center mt-4">
                                <button
                                    id="dev-simulate-btn"
                                    onClick={simulateLoadForDev}
                                    className="text-[10px] bg-white/5 px-2 py-1 rounded text-slate-500 hover:text-white"
                                >
                                    [DEV] Simular Carga CSV
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-medium text-white">Vista Previa</h3>
                                <span className="text-xs text-slate-400">{parsedGuests.filter(g => g.isValid).length} válidos de {parsedGuests.length}</span>
                            </div>

                            <div className="border border-white/5 rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-white/5 text-xs text-slate-400 uppercase font-medium">
                                        <tr>
                                            <th className="px-4 py-3">Nombre</th>
                                            <th className="px-4 py-3">Apellido</th>
                                            <th className="px-4 py-3">Mesa</th>
                                            <th className="px-4 py-3 text-right">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {parsedGuests.slice(0, 50).map((guest, idx) => (
                                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                                <td className={`px-4 py-2 ${!guest.nombre ? 'text-red-400' : 'text-slate-300'}`}>
                                                    {guest.nombre || 'Vacío'}
                                                </td>
                                                <td className={`px-4 py-2 ${!guest.apellido ? 'text-red-400' : 'text-slate-300'}`}>
                                                    {guest.apellido || 'Vacío'}
                                                </td>
                                                <td className="px-4 py-2 text-slate-300">
                                                    {guest.mesa || '-'}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    {guest.isValid ?
                                                        <Check size={14} className="ml-auto text-emerald-400" /> :
                                                        <AlertCircle size={14} className="ml-auto text-red-400" />
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {parsedGuests.length > 50 && (
                                    <div className="px-4 py-2 bg-white/5 text-center text-xs text-slate-500 italic">
                                        ... y {parsedGuests.length - 50} más
                                    </div>
                                )}
                            </div>

                            {parsedGuests.some(g => !g.isValid) && (
                                <p className="text-xs text-red-400 text-center">
                                    Algunas filas tienen datos incompletos y serán ignoradas.
                                </p>
                            )}
                        </div>
                    )}

                    {step === 'uploading' && (
                        <div className="flex flex-col items-center justify-center py-10 space-y-4">
                            <Loader2 size={40} className="text-[#FBBF24] animate-spin" />
                            <p className="text-sm text-white font-medium">Importando invitados...</p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-300">{error}</p>
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/5 bg-black/40 flex gap-3 sticky bottom-0 z-10">
                    {step === 'upload' && (
                        <button onClick={handleClose} className="btn btn-outline flex-1 py-2.5 text-sm">Cancelar</button>
                    )}
                    {step === 'preview' && (
                        <>
                            <button
                                onClick={() => { setStep('upload'); setFile(null); }}
                                className="btn btn-outline flex-1 py-2.5 text-sm"
                            >
                                Atrás
                            </button>
                            <button
                                onClick={handleImport}
                                className="btn btn-primary flex-1 py-2.5 text-sm shadow-lg shadow-yellow-500/20"
                                disabled={parsedGuests.filter(g => g.isValid).length === 0}
                            >
                                Confirmar Importación
                            </button>
                        </>
                    )}
                </div>

            </div>
        </div>
    );
}
