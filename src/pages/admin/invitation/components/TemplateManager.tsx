import { useState } from 'react';
import { InvitationData } from '../../../../types';
import { supabase } from '../../../../lib/supabase';
import { Upload, Ruler, Image as ImageIcon, Loader2, Trash2, Smartphone, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

// Importamos el Renderer para poder renderizarlo oculto y medirlo
import InvitationRenderer from '../../../public/invitation/InvitationRenderer';

interface Props {
    invitation: InvitationData;
    onChange: (updates: Partial<InvitationData>) => void;
}

export default function TemplateManager({ invitation, onChange }: Props) {
    const [uploading, setUploading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [dimensions, setDimensions] = useState<{ width: number, height: number } | null>(null);

    const overlayUrl = (invitation as any).design?.overlay_url;

    const analyzeDimensions = async () => {
        setAnalyzing(true);
        // Esperamos un momento para que se renderice todo (imágenes, fuentes)
        await new Promise(r => setTimeout(r, 1500));

        const container = document.querySelector('#invitation-analysis-root #invitation-container') as HTMLElement;

        if (container) {
            setDimensions({
                width: container.offsetWidth,
                height: container.scrollHeight
            });
        } else {
            console.error('Container not found within analysis root');
            alert('No se pudo analizar la invitación. Intenta recargar la página.');
        }
        setAnalyzing(false);
    };

    const downloadReference = async () => {
        const container = document.querySelector('#invitation-analysis-root #invitation-container') as HTMLElement;
        if (!container) return;

        // Ocultar temporalmente el overlay existente para la captura limpia
        const existingOverlay = container.querySelector('img[alt="Diseño Decorativo"]')?.parentElement;
        if (existingOverlay) existingOverlay.style.display = 'none';

        try {
            // Necesitamos esperar que carguen imágenes
            await new Promise(r => setTimeout(r, 1000));

            const canvas = await html2canvas(container, {
                useCORS: true,
                scale: 2, // Retina quality
                backgroundColor: '#ffffff',
                height: container.scrollHeight,
                windowWidth: container.scrollWidth,
                logging: false,
                onclone: (clonedDoc) => {
                    // Asegurar que el clon sea visible
                    const clonedContainer = clonedDoc.querySelector('#invitation-analysis-root #invitation-container') as HTMLElement;
                    if (clonedContainer) {
                        clonedContainer.style.display = 'block';
                        clonedContainer.style.visibility = 'visible';
                    }
                }
            });

            const link = document.createElement('a');
            link.download = `referencia-invitacion-${invitation.hero_section?.title || 'boda'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Error generando captura:', error);
            alert('Error generando la captura. Verifica que las imágenes sean públicas.');
        } finally {
            if (existingOverlay) existingOverlay.style.display = 'block';
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setUploading(true);
        const file = e.target.files[0];

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `overlay-${invitation.id}-${Date.now()}.${fileExt}`;
            const filePath = `designs/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('invitation_assets')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('invitation_assets')
                .getPublicUrl(filePath);

            // Update Invitation
            onChange({
                ['design' as any]: {
                    ...((invitation as any).design || {}),
                    overlay_url: publicUrl
                }
            });

        } catch (error) {
            console.error('Upload error:', error);
            alert('Error al subir la imagen. Verifica tu conexión.');
        } finally {
            setUploading(false);
        }
    };

    const removeOverlay = () => {
        if (confirm('¿Estás seguro de quitar el diseño actual?')) {
            onChange({
                ['design' as any]: {
                    ...((invitation as any).design || {}),
                    overlay_url: null
                }
            });
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 relative">

            {/* --- CONTENEDOR DE ANÁLISIS OCULTO (fuera de viewport pero renderizado) --- */}
            {/* Usamos fixed para que no afecte el flujo del layout del admin, y z-index negativo para ocultarlo visualmente */}
            <div id="invitation-analysis-root" style={{ position: 'fixed', left: '-9999px', top: 0, width: '430px', maxWidth: '480px', visibility: 'visible', zIndex: -9999, overflow: 'hidden' }}>
                <InvitationRenderer
                    previewData={invitation}
                    isEditable={false} // Modo no editable para limpieza
                    forceViewContent={true} // Forzar vista de contenido completo
                />
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-indigo-900 mb-2">Diseño Mobile-First (Overlay)</h3>
                        <p className="text-indigo-700/80 text-sm leading-relaxed">
                            Este sistema utiliza una <strong>Plantilla PNG Decorativa</strong> única que se superpone sobre toda la invitación.
                            Esto garantiza un diseño perfecto sin errores de CSS ni desbordes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Paso 1: Análisis */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-500">1</div>
                    <h4 className="font-bold text-stone-800">Obtener Dimensiones y Referencia</h4>
                </div>

                <p className="text-sm text-stone-500 mb-6 pl-11">
                    Primero, analiza el tamaño actual de tu invitación (depende del contenido que hayas activado).
                </p>

                <div className="pl-11 flex flex-wrap gap-4">
                    <button
                        onClick={analyzeDimensions}
                        disabled={analyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-800 text-white rounded-lg hover:bg-stone-700 transition-colors text-sm font-medium"
                    >
                        {analyzing ? <Loader2 className="animate-spin" size={16} /> : <Ruler size={16} />}
                        {analyzing ? 'Analizando...' : 'Analizar Tamaño'}
                    </button>

                    <button
                        onClick={downloadReference}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
                    >
                        <ImageIcon size={16} />
                        Descargar Captura de Referencia
                    </button>
                </div>

                {dimensions && (
                    <div className="mt-6 ml-11 bg-yellow-50 border border-yellow-200 p-4 rounded-lg inline-block">
                        <p className="font-mono text-yellow-800 text-sm font-bold">
                            Dimensiones Requeridas: {dimensions.width}px (Ancho) x {dimensions.height}px (Alto)
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">
                            Diseña tu PNG con estas medidas exactas y fondo transparente.
                        </p>
                    </div>
                )}
            </div>

            {/* Paso 2: Subida */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-500">2</div>
                    <h4 className="font-bold text-stone-800">Subir Plantilla PNG</h4>
                </div>

                <div className="pl-11">
                    {!overlayUrl ? (
                        <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:border-indigo-300 transition-colors bg-stone-50/50">
                            <input
                                type="file"
                                id="overlay-upload"
                                className="hidden"
                                accept="image/png"
                                onChange={handleUpload}
                                disabled={uploading}
                            />
                            <label htmlFor="overlay-upload" className="cursor-pointer flex flex-col items-center">
                                {uploading ? (
                                    <Loader2 className="h-10 w-10 text-indigo-500 animate-spin mb-3" />
                                ) : (
                                    <Upload className="h-10 w-10 text-stone-400 mb-3" />
                                )}
                                <span className="text-sm font-medium text-stone-700">
                                    {uploading ? 'Subiendo...' : 'Click para subir PNG'}
                                </span>
                                <span className="text-xs text-stone-400 mt-1">Solo formato PNG con transparencia</span>
                            </label>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-100 aspect-[9/16] w-32 shadow-md">
                                <img src={overlayUrl} alt="Overlay actual" className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={removeOverlay}
                                        className="p-2 bg-white rounded-full text-red-600 hover:scale-110 transition-transform"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full border border-green-200 flex items-center gap-1">
                                    <Check size={12} /> Plantilla Activa
                                </span>
                                <p className="text-xs text-stone-500">
                                    Tu diseño se está aplicando sobre la invitación.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
