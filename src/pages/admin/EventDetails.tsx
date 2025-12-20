import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { supabase } from '../../lib/supabase';
import { Event, Guest } from '../../types';
import DashboardLayout from '../../layouts/DashboardLayout';
import {
    ArrowLeft, Calendar, Users, MapPin, Search,
    Upload, Plus, Filter, MoreVertical, CheckCircle2, Clock,
    Edit2, Trash2, Settings,
    Palette, Video, Download, QrCode, FileText, Shield, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import GuestImportModal from '../../components/GuestImportModal';
import CreateGuestModal from '../../components/CreateGuestModal';
import ThemeSelector from '../../components/ThemeSelector';
import { getThemeById } from '../../lib/themes';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';

export default function EventDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [guests, setGuests] = useState<Guest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'guests' | 'tables' | 'settings' | 'design' | 'receptionist' | 'downloads'>('guests');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    // Filtering
    const [filterTable, setFilterTable] = useState<string>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);



    // Video Assignment State
    const [videoSearchQuery, setVideoSearchQuery] = useState('');
    const [selectedGuestsForVideo, setSelectedGuestsForVideo] = useState<Set<string>>(new Set());

    // Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<{ type: 'background' | 'logo' | 'default_video' | 'table_video' | 'guest_video', id?: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (id) {
            fetchEventDetails();
            fetchGuests();
        }
    }, [id]);

    const fetchEventDetails = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setEvent(data);
        } catch (error) {
            console.error('Error loading event:', error);
            // Mock data for UI verification
            setEvent({
                id: '123',
                name: 'Evento de Prueba (Visualización)',
                date: '2025-12-25',
                guest_count_total: 150,
                status: 'active',
                table_count: 15,
                owner_id: 'user-id',
                created_at: new Date().toISOString()
            } as any);
        } finally {
            setLoading(false);
        }
    };

    const fetchGuests = async () => {
        if (!id) return;
        try {
            const { data, error } = await supabase
                .from('guests')
                .select('*')
                .eq('event_id', id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setGuests(data || []);
        } catch (error) {
            console.error('Error loading guests:', error);
        }
    };

    const handleImportComplete = (newGuests?: Guest[]) => {
        if (event?.id === '123' && newGuests) {
            setGuests(prev => [...newGuests, ...prev]);
        } else {
            fetchGuests();
            fetchEventDetails();
        }
    };

    const handleGuestAdded = (newGuest: Guest) => {
        setGuests(prev => [newGuest, ...prev]);
        if (event?.id !== '123') {
            fetchEventDetails();
        }
        setIsCreateModalOpen(false);
    };

    const handleGuestUpdated = (updatedGuest: Guest) => {
        setGuests(prev => prev.map(g => g.id === updatedGuest.id ? updatedGuest : g));
        if (event?.id !== '123') {
            fetchEventDetails();
        }
        setIsCreateModalOpen(false);
        setEditingGuest(null);
    };

    const normalizeTableName = (name: string | null | undefined) => {
        if (!name) return null;
        const trimmed = name.trim();
        // If it's just a number, prefix with "Mesa "
        if (/^\d+$/.test(trimmed)) {
            return `Mesa ${trimmed}`;
        }
        return trimmed;
    };

    const handleDragEnd = async (result: DropResult) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && source.index === destination.index) return;

        // Destination droppableId is already the Normalized Table Name (e.g. "Mesa 5")
        const newTableInfo = destination.droppableId === 'unassigned' ? null : destination.droppableId;

        // Optimistic update
        const updatedGuests = guests.map(g =>
            g.id === draggableId ? { ...g, table_info: newTableInfo } : g
        );
        setGuests(updatedGuests as Guest[]);

        // Update Backend
        if (event?.id === '123') return; // Mock mode

        try {
            const { error } = await supabase
                .from('guests')
                .update({ table_info: newTableInfo })
                .eq('id', draggableId);

            if (error) throw error;
        } catch (err) {
            console.error('Error updating guest table:', err);
            // Revert on error
            fetchGuests();
        }
    };

    const downloadGuestsCSV = () => {
        if (!guests.length) return alert('No hay invitados para descargar.');

        // Define columns
        const headers = ['Nombre', 'Apellido', 'Display Name', 'Mesa', 'Estado', 'Email', 'Telefono'];
        const csvContent = [
            headers.join(','),
            ...guests.map(g => [
                `"${g.first_name || ''}"`,
                `"${g.last_name || ''}"`,
                `"${g.display_name || ''}"`,
                `"${g.table_info || ''}"`,
                `"${g.status}"`,
                `"${(g as any).email || ''}"`,
                `"${(g as any).phone || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${event?.name || 'evento'}_invitados.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getGuestUrl = () => {
        const baseUrl = window.location.pathname.startsWith('/ingreso-vip') ? '/ingreso-vip' : '';
        return `${window.location.origin}${baseUrl}/evento/${event?.id}`;
    };

    const downloadGuestsPDF = () => {
        if (!guests.length) {
            alert('No hay invitados para descargar.');
            return;
        }
        if (!event) {
            alert('No hay evento seleccionado');
            return;
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let yPos = margin;

        // Título
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(`Lista de Invitados - ${event.name}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Fecha
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const eventDate = event.date ? format(new Date(event.date), 'dd/MM/yyyy', { locale: es }) : 'Sin fecha';
        doc.text(`Fecha: ${eventDate}`, pageWidth / 2, yPos, { align: 'center' });
        yPos += 15;

        // Ordenar invitados por mesa
        const sortedGuests = [...guests].sort((a, b) => {
            const mesaA = a.table_info || 'Sin mesa';
            const mesaB = b.table_info || 'Sin mesa';
            return mesaA.localeCompare(mesaB);
        });

        // Tabla de invitados
        doc.setFontSize(9);
        const colWidths = [70, 70, 30, 25];
        const headers = ['Nombre Completo', 'Mesa', 'Estado', ''];

        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(79, 70, 229);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
        doc.setTextColor(255, 255, 255);

        let xPos = margin + 2;
        headers.forEach((header, i) => {
            doc.text(header, xPos, yPos + 5);
            xPos += colWidths[i];
        });
        yPos += 7;

        // Rows
        doc.setFont('helvetica', 'normal');
        sortedGuests.forEach((guest, index) => {
            // Check if new page needed
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;

                // Re-draw header
                doc.setFont('helvetica', 'bold');
                doc.setFillColor(79, 70, 229);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 7, 'F');
                doc.setTextColor(255, 255, 255);

                xPos = margin + 2;
                headers.forEach((header, i) => {
                    doc.text(header, xPos, yPos + 5);
                    xPos += colWidths[i];
                });
                yPos += 7;
            }

            // Row background
            if (index % 2 === 0) {
                doc.setFillColor(249, 250, 251);
                doc.rect(margin, yPos, pageWidth - 2 * margin, 6, 'F');
            }

            // Row data
            doc.setTextColor(0, 0, 0);
            xPos = margin + 2;

            // Nombre completo
            const fullName = guest.display_name || `${guest.first_name} ${guest.last_name}`;
            doc.text(fullName, xPos, yPos + 4.5, { maxWidth: colWidths[0] - 4 });
            xPos += colWidths[0];

            // Mesa
            doc.text(guest.table_info || 'Sin mesa', xPos, yPos + 4.5);
            xPos += colWidths[1];

            // Estado con color
            const statusColors: any = {
                confirmed: [16, 185, 129],
                pending: [251, 191, 36],
                cancelled: [239, 68, 68]
            };
            const statusLabels: any = {
                confirmed: 'Confirmado',
                pending: 'Pendiente',
                cancelled: 'Cancelado'
            };

            const color = statusColors[guest.status] || [156, 163, 175];
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(statusLabels[guest.status] || guest.status, xPos, yPos + 4.5);
            doc.setTextColor(0, 0, 0);

            yPos += 6;
        });

        // Footer
        yPos = pageHeight - 15;
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total de invitados: ${guests.length}`, margin, yPos);
        doc.text(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, pageWidth - margin, yPos, { align: 'right' });

        // Download
        doc.save(`${event.name}_invitados.pdf`);
    };

    const generateQRPoster = async (orientation: 'portrait' | 'landscape') => {
        if (!event) {
            alert('No hay evento seleccionado');
            return;
        }

        setIsGeneratingQR(true);
        console.log('🎨 Iniciando generación de QR poster...', { orientation, eventId: event.id });

        try {
            // Get theme colors
            const theme = getThemeById(event.theme_id || 'default');
            const themeColors = theme?.colors || {
                primary: '#6b21a8',
                secondary: '#581c87',
                accent: '#FBBF24',
                background: '#1a1030'
            };

            // 1. Generate QR Code first
            console.log('📱 Generando código QR para:', getGuestUrl());
            const qrDataUrl = await QRCode.toDataURL(getGuestUrl(), {
                width: 800,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                },
                errorCorrectionLevel: 'H'
            });
            console.log('✅ QR Code generado exitosamente');

            // 2. Create Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No se pudo crear contexto de canvas');

            const width = orientation === 'landscape' ? 1920 : 1080;
            const height = orientation === 'landscape' ? 1080 : 1920;
            canvas.width = width;
            canvas.height = height;
            console.log('🖼️ Canvas creado:', { width, height });

            // 3. FONDO PERSONALIZADO CON BLUR (si existe) o gradiente del tema
            if (event.theme_background_url) {
                const bgImg = new Image();
                bgImg.crossOrigin = 'anonymous';
                bgImg.src = event.theme_background_url;

                await new Promise((resolve) => {
                    bgImg.onload = resolve;
                    bgImg.onerror = () => {
                        console.warn('Error cargando fondo personalizado, usando gradiente');
                        resolve(null);
                    };
                    setTimeout(() => resolve(null), 5000);
                });

                if (bgImg.complete && bgImg.naturalWidth > 0) {
                    // PASO 1: Fondo blureado (cubre todo el canvas)
                    ctx.filter = 'blur(40px) brightness(0.7)';

                    // Calcular dimensiones para cubrir todo sin distorsionar
                    const bgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
                    const canvasAspect = width / height;

                    let bgDrawWidth, bgDrawHeight, bgX, bgY;

                    if (bgAspect > canvasAspect) {
                        bgDrawHeight = height;
                        bgDrawWidth = height * bgAspect;
                        bgX = -(bgDrawWidth - width) / 2;
                        bgY = 0;
                    } else {
                        bgDrawWidth = width;
                        bgDrawHeight = width / bgAspect;
                        bgX = 0;
                        bgY = -(bgDrawHeight - height) / 2;
                    }

                    ctx.drawImage(bgImg, bgX, bgY, bgDrawWidth, bgDrawHeight);
                    ctx.filter = 'none';

                    // PASO 2: Imagen principal centrada (contenida, sin crop)
                    const maxImgWidth = width * 0.9;
                    const maxImgHeight = height * 0.9;

                    let mainImgWidth = bgImg.naturalWidth;
                    let mainImgHeight = bgImg.naturalHeight;

                    // Escalar para que quepa manteniendo aspect ratio
                    if (mainImgWidth > maxImgWidth) {
                        mainImgHeight = (maxImgWidth / mainImgWidth) * mainImgHeight;
                        mainImgWidth = maxImgWidth;
                    }
                    if (mainImgHeight > maxImgHeight) {
                        mainImgWidth = (maxImgHeight / mainImgHeight) * mainImgWidth;
                        mainImgHeight = maxImgHeight;
                    }

                    const mainImgX = (width - mainImgWidth) / 2;
                    const mainImgY = (height - mainImgHeight) / 2;

                    // Dibujar imagen principal nítida y centrada
                    ctx.globalAlpha = 0.85;
                    ctx.drawImage(bgImg, mainImgX, mainImgY, mainImgWidth, mainImgHeight);
                    ctx.globalAlpha = 1.0;

                    // Overlay para legibilidad
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.fillRect(0, 0, width, height);

                    console.log('🎨 Fondo personalizado aplicado con blur');
                } else {
                    // Fallback: gradiente del tema
                    const gradient = ctx.createLinearGradient(0, 0, 0, height);
                    gradient.addColorStop(0, themeColors.secondary);
                    gradient.addColorStop(0.5, themeColors.primary);
                    gradient.addColorStop(1, themeColors.background);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, width, height);
                    console.log('🎨 Fondo gradiente aplicado (fallback)');
                }
            } else {
                // Gradiente del tema
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, themeColors.secondary);
                gradient.addColorStop(0.5, themeColors.primary);
                gradient.addColorStop(1, themeColors.background);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                console.log('🎨 Fondo con tema:', event.theme_id);
            }

            // 4. Load and draw QR image
            const qrImg = new Image();
            qrImg.src = qrDataUrl;

            await new Promise((resolve, reject) => {
                qrImg.onload = resolve;
                qrImg.onerror = () => reject(new Error('Error cargando imagen QR'));
                setTimeout(() => reject(new Error('Timeout cargando QR')), 5000);
            });
            console.log('✅ Imagen QR cargada');

            // 5. Calculate QR position and size (optimizado para TV 50")
            const qrSize = orientation === 'landscape' ? 350 : 450;
            const qrX = (width - qrSize) / 2;
            const qrY = (height - qrSize) / 2;

            // Draw white container with shadow
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 20;
            ctx.fillRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);
            ctx.shadowBlur = 0;

            // Draw QR
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
            console.log('✅ QR dibujado en canvas');

            // 6. Add texts (optimizados para TV)
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 30;

            // Event name (más pequeño)
            ctx.font = `bold ${orientation === 'landscape' ? '70' : '80'}px system-ui, sans-serif`;
            ctx.fillText(event.name, width / 2, qrY - 80);

            // Instruction (más pequeño y más cerca)
            ctx.font = `${orientation === 'landscape' ? '40' : '45'}px system-ui, sans-serif`;
            ctx.fillText('Escanea para encontrar tu mesa', width / 2, qrY + qrSize + 90);

            // 7. LOGO CIRCULAR CON EFECTO CRISTAL (si existe)
            if (event.theme_custom_logo_url) {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                logoImg.src = event.theme_custom_logo_url;

                await new Promise((resolve) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = () => {
                        console.warn('Error cargando logo');
                        resolve(null);
                    };
                    setTimeout(() => resolve(null), 5000);
                });

                if (logoImg.complete && logoImg.naturalWidth > 0) {
                    // Tamaño del logo circular (reducido para TV)
                    const logoSize = orientation === 'landscape' ? 140 : 160;
                    const logoRadius = logoSize / 2;

                    // Posición: esquina superior derecha
                    const logoX = width - logoSize - 80;
                    const logoY = 80;

                    // EFECTO GLASSMORPHISM (CRISTAL)
                    ctx.save();

                    // Clip circular
                    ctx.beginPath();
                    ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    // Fondo glassmorphism
                    const glassGradient = ctx.createRadialGradient(
                        logoX + logoRadius, logoY + logoRadius, 0,
                        logoX + logoRadius, logoY + logoRadius, logoRadius
                    );
                    glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
                    glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
                    ctx.fillStyle = glassGradient;
                    ctx.fillRect(logoX, logoY, logoSize, logoSize);

                    // Dibujar logo dentro del círculo
                    ctx.globalAlpha = 0.95;

                    // Calcular tamaño del logo manteniendo aspect ratio (75% del círculo)
                    const logoInnerSize = logoSize * 0.75;
                    let logoDrawWidth = logoImg.naturalWidth;
                    let logoDrawHeight = logoImg.naturalHeight;

                    if (logoDrawWidth > logoDrawHeight) {
                        logoDrawHeight = (logoInnerSize / logoDrawWidth) * logoDrawHeight;
                        logoDrawWidth = logoInnerSize;
                    } else {
                        logoDrawWidth = (logoInnerSize / logoDrawHeight) * logoDrawWidth;
                        logoDrawHeight = logoInnerSize;
                    }

                    const logoDrawX = logoX + (logoSize - logoDrawWidth) / 2;
                    const logoDrawY = logoY + (logoSize - logoDrawHeight) / 2;

                    ctx.drawImage(logoImg, logoDrawX, logoDrawY, logoDrawWidth, logoDrawHeight);
                    ctx.globalAlpha = 1.0;

                    ctx.restore();

                    // BORDE Y SOMBRA DEL CÍ RCULO
                    ctx.save();
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    ctx.shadowBlur = 25;
                    ctx.shadowOffsetY = 8;

                    // Borde blanco semitransparente
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius, 0, Math.PI * 2);
                    ctx.stroke();

                    ctx.restore();

                    console.log('✅ Logo circular agregado');
                }
            }

            //Logo/branding
            ctx.font = `${orientation === 'landscape' ? '24' : '28'}px system-ui, sans-serif`;
            ctx.fillStyle = themeColors.accent;
            ctx.fillText('INGRESO VIP • by Tecno Eventos', width / 2, height - 60);

            console.log('✅ Textos agregados');

            // 7. Convert to image and download
            console.log('💾 Generando descarga...');
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.download = `${event.name.replace(/[^a-z0-9]/gi, '_')}_QR_${orientation}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ ¡Descarga iniciada exitosamente!');
            alert(`✅ Poster QR ${orientation === 'landscape' ? 'horizontal' : 'vertical'} generado correctamente`);

        } catch (error) {
            console.error('❌ Error generando QR poster:', error);
            const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
            alert(`❌ Error al generar QR: ${errorMsg}\n\nRevisa la consola para más detalles (F12).`);
        } finally {
            setIsGeneratingQR(false);
            console.log('🏁 Proceso de generación finalizado');
        }
    };

    const handleThemeChange = async (themeId: string) => {
        if (!event) return;

        try {
            const { error } = await supabase
                .from('events')
                .update({ theme_id: themeId })
                .eq('id', event.id);

            if (error) throw error;

            setEvent({ ...event, theme_id: themeId });
            alert('Tema actualizado correctamente');
        } catch (error) {
            console.error('Error updating theme:', error);
            alert('Error al actualizar tema');
        }
    };

    const handleUpdateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (event?.id === '123') {
            alert('En modo demo no se pueden guardar cambios de configuración.');
            return;
        }

        // Logic to update event in Supabase would go here
        alert('Configuración guardada (simulado).');
    };

    const handleUploadClick = (type: 'background' | 'logo' | 'default_video' | 'table_video' | 'guest_video', id?: string) => {
        setUploadTarget({ type, id });
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset
            // Set accept type based on upload target
            if (type === 'logo') fileInputRef.current.accept = 'image/*';
            else if (type === 'background') fileInputRef.current.accept = 'image/*,video/*';
            else fileInputRef.current.accept = 'video/*';

            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget || !event) return;

        setIsUploading(true);
        try {
            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${event.id}/${Math.random().toString(36).substring(7)}.${fileExt}`;
            const bucket = uploadTarget.type === 'guest_video' ? 'guest-videos' : 'event-assets';

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            // 3. Update Database & State based on target
            if (uploadTarget.type === 'background') {
                await supabase.from('events').update({ theme_background_url: publicUrl }).eq('id', event.id);
                setEvent(prev => prev ? { ...prev, theme_background_url: publicUrl } : null);
            }
            else if (uploadTarget.type === 'logo') {
                await supabase.from('events').update({ theme_custom_logo_url: publicUrl }).eq('id', event.id);
                setEvent(prev => prev ? { ...prev, theme_custom_logo_url: publicUrl } : null);
            }
            else if (uploadTarget.type === 'default_video') {
                await supabase.from('events').update({ video_url_default: publicUrl }).eq('id', event.id);
                setEvent(prev => prev ? { ...prev, video_url_default: publicUrl } : null);
            }
            else if (uploadTarget.type === 'table_video' && uploadTarget.id) {
                // Update table configuration map
                const currentConfig = event.video_configuration || {};
                const newConfig = { ...currentConfig, [uploadTarget.id]: publicUrl };

                await supabase.from('events').update({ video_configuration: newConfig }).eq('id', event.id);
                setEvent(prev => prev ? { ...prev, video_configuration: newConfig } : null);
            }
            else if (uploadTarget.type === 'guest_video') {
                // Update specific assigned guests
                const guestIds = Array.from(selectedGuestsForVideo);
                if (guestIds.length === 0) return;

                await supabase.from('guests')
                    .update({ assigned_video_url: publicUrl })
                    .in('id', guestIds);

                // Update local state
                setGuests(prev => prev.map(g => guestIds.includes(g.id) ? { ...g, assigned_video_url: publicUrl } : g));

                // Reset selection
                setSelectedGuestsForVideo(new Set());
                alert(`Video asignado a ${guestIds.length} invitados correctamente.`);
            }

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error al subir el archivo. Intenta de nuevo.');
        } finally {
            setIsUploading(false);
            setUploadTarget(null);
        }
    };

    const handleDeleteGuest = async (guestId: string) => {
        if (!confirm('¿Estás seguro de eliminar este invitado?')) return;

        try {
            const { error } = await supabase
                .from('guests')
                .delete()
                .eq('id', guestId);

            if (error) throw error;

            setGuests(prev => prev.filter(g => g.id !== guestId));
            setOpenMenuId(null);
        } catch (error) {
            console.error('Error deleting guest:', error);
            alert('Error al eliminar invitado');
        }
    };

    const filteredGuests = guests.filter(g => {
        const matchesSearch = (g.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.last_name.toLowerCase().includes(searchQuery.toLowerCase()));

        if (filterTable === 'all') return matchesSearch;
        if (filterTable === 'unassigned') return matchesSearch && !g.table_info;
        return matchesSearch && g.table_info === filterTable;
    });

    const uniqueTables = Array.from(new Set(guests.map(g => g.table_info).filter(Boolean))).sort();

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-[#FBBF24] border-t-transparent rounded-full"></div>
            </div>
        </DashboardLayout>
    );

    if (!event) return null;

    return (
        <DashboardLayout>
            {/* Header with Back Button */}
            <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <button
                    onClick={() => navigate('/admin/dashboard')}
                    className="flex items-center gap-2 text-muted hover:text-foreground transition-colors mb-6 text-xs font-bold uppercase tracking-wider"
                >
                    <ArrowLeft size={14} /> Volver al Dashboard
                </button>

                {
                    event.status === 'closed' && (
                        <div className="bg-slate-800 text-white px-4 py-3 rounded-xl mb-6 flex items-center gap-3 shadow-lg">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <Clock size={16} />
                            </div>
                            <div>
                                <p className="font-bold text-sm">Evento Finalizado</p>
                                <p className="text-xs text-slate-400">Este evento está cerrado. Solo lectura.</p>
                            </div>
                        </div>
                    )
                }

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-foreground tracking-tight font-display">{event.name}</h1>
                            <span className={`badge ${event.status === 'active'
                                ? 'bg-emerald-500 text-white border-transparent'
                                : 'bg-slate-100 text-slate-600 border-slate-200'} border px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm`}>
                                {event.status === 'active' ? 'En Curso' : event.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-6 text-muted-foreground text-sm font-medium">
                            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
                                <Calendar size={14} className="text-accent" />
                                <span>{format(new Date(event.date + 'T00:00:00'), "d 'de' MMMM, yyyy", { locale: es })}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm">
                                <Users size={14} className="text-accent" />
                                <span>{event.guest_count_total} Invitados</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => window.open(getGuestUrl(), '_blank')}
                            className="btn btn-outline border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300 dark:border-purple-900/50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                            title="Ver vista del invitado"
                        >
                            <QrCode size={16} className="mr-2" /> Ver App
                        </button>
                        {event.status !== 'closed' && (
                            <>
                                <button
                                    onClick={() => setIsImportModalOpen(true)}
                                    className="btn btn-outline"
                                >
                                    <Upload size={16} className="mr-2" /> Importar
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="btn btn-primary"
                                >
                                    <Plus size={16} className="mr-2" /> Nuevo Invitado
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Invitados" value={guests.length} icon={Users} color="blue" />
                <StatCard label="Confirmados" value={guests.filter(g => g.status === 'confirmed').length} icon={CheckCircle2} color="emerald" />
                <StatCard label="En Espera" value={guests.filter(g => g.status === 'pending').length} icon={Clock} color="amber" />
                <StatCard label="Mesas Asignadas" value={guests.filter(g => !!g.table_info).length} icon={MapPin} color="purple" />
            </div>

            {/* Tabs Navigation (Premium Pill Style) */}
            <div className="mb-8">
                <div className="bg-surface border border-border p-1.5 rounded-xl inline-flex flex-wrap gap-1 shadow-sm">
                    {[
                        { id: 'guests', label: 'Invitados', icon: Users },
                        { id: 'tables', label: 'Organizador', icon: MapPin },
                        { id: 'design', label: 'Diseño', icon: Palette },
                        { id: 'receptionist', label: 'Recepcionista', icon: Video },
                        { id: 'downloads', label: 'Descargas', icon: Download },
                        { id: 'settings', label: 'Configuración', icon: Settings },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200
                                ${activeTab === tab.id
                                    ? 'bg-accent/10 text-accent-dark shadow-sm ring-1 ring-inset ring-accent/20'
                                    : 'text-muted hover:text-foreground hover:bg-background'}
                            `}
                        >
                            <tab.icon size={16} className={activeTab === tab.id ? 'text-accent' : 'text-muted-foreground'} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div >

            {/* Guests List */}
            {
                activeTab === 'guests' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex gap-3">
                            <div className="bg-white border border-slate-200 p-1.5 rounded-xl flex-1 flex items-center gap-3 shadow-sm placeholder:text-slate-400">
                                <div className="pl-4 text-slate-400"><Search size={18} /></div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar invitado por nombre..."
                                    className="bg-transparent border-none shadow-none focus:shadow-none p-2 text-sm placeholder:text-slate-400 w-full text-slate-900"
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
                                                        onClick={() => { setFilterTable(table!); setShowFilterMenu(false); }}
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
                                            onClick={() => setIsImportModalOpen(true)}
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
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500">
                                                        {guest.table_info ? (
                                                            <span className="flex items-center gap-2">
                                                                <MapPin size={14} className="text-amber-500" /> {guest.table_info}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400 italic">Sin asignar</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <span className={`badge ${guest.status === 'confirmed' ? 'badge-success' :
                                                            guest.status === 'arrived' ? 'badge-info bg-blue-50 text-blue-600 border-blue-100' :
                                                                'badge-neutral'
                                                            }`}>
                                                            {guest.status === 'pending' ? 'Pendiente' : guest.status}
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
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setEditingGuest(guest);
                                                                                        setIsCreateModalOpen(true);
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
                                                                                        handleDeleteGuest(guest.id);
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
                )
            }

            {/* Tables Tab */}
            {/* Tables Tab */}
            {
                activeTab === 'tables' && (
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

                                {/* Generated Tables */}{
                                    (() => {
                                        // 1. Generate standard numbered tables
                                        const standardTables = Array.from({ length: event.table_count || 0 }, (_, i) => `Mesa ${i + 1}`);

                                        // 2. Find any "custom" tables from guests that aren't covered by standard tables
                                        //    taking normalization into account.
                                        const customTables = new Set<string>();
                                        guests.forEach(g => {
                                            const normalized = normalizeTableName(g.table_info);
                                            if (normalized && !standardTables.includes(normalized)) {
                                                customTables.add(normalized);
                                            }
                                        });

                                        // 3. Merge and sort
                                        const allTables = [...standardTables, ...Array.from(customTables)].sort((a, b) => {
                                            // Custom sort to keep "Mesa X" properly ordered numbers wise
                                            const aMatch = a.match(/^Mesa (\d+)$/);
                                            const bMatch = b.match(/^Mesa (\d+)$/);
                                            if (aMatch && bMatch) return parseInt(aMatch[1]) - parseInt(bMatch[1]);
                                            return a.localeCompare(b);
                                        });

                                        return allTables.map((tableName) => {
                                            // Filter guests who belong to this table (checking normalized name)
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
                                        });
                                    })()
                                }
                            </div>
                        </div>
                    </DragDropContext>
                )
            }

            {/* Design Tab */}
            {
                activeTab === 'design' && (
                    <div className="animate-in fade-in duration-300 max-w-4xl space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                                <Palette size={18} className="text-[#FBBF24]" /> Personalización Visual
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Theme Selection */}
                                <div className="space-y-4">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tema del Evento</label>
                                    <ThemeSelector
                                        selectedThemeId={event.theme_id || 'default'}
                                        onThemeSelect={handleThemeChange}
                                        compact
                                    />
                                </div>

                                {/* Background Upload */}
                                <div className="space-y-4">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fondo Personalizado (Imagen o Video Loop)</label>
                                    <div
                                        onClick={() => handleUploadClick('background')}
                                        className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden"
                                    >
                                        {event.theme_background_url && (
                                            <img src={event.theme_background_url} alt="Background Preview" className="absolute inset-0 w-full h-full object-cover opacity-30" />
                                        )}
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform mx-auto">
                                                {isUploading && uploadTarget?.type === 'background' ? (
                                                    <div className="loading loading-spinner text-[#FBBF24]"></div>
                                                ) : (
                                                    <Upload size={20} className="text-slate-400 group-hover:text-white" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium">
                                                {event.theme_background_url ? 'Cambiar Fondo' : 'Click para subir'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">1920x1080 recomendado. JPG, MP4</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Logo Upload */}
                                <div className="space-y-4">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Logo del Evento</label>
                                    <div
                                        onClick={() => handleUploadClick('logo')}
                                        className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group relative overflow-hidden"
                                    >
                                        {event.theme_custom_logo_url && (
                                            <img src={event.theme_custom_logo_url} alt="Logo Preview" className="absolute inset-0 w-full h-full object-contain opacity-50 p-4" />
                                        )}
                                        <div className="relative z-10">
                                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform mx-auto">
                                                {isUploading && uploadTarget?.type === 'logo' ? (
                                                    <div className="loading loading-spinner text-[#FBBF24]"></div>
                                                ) : (
                                                    <Upload size={20} className="text-slate-400 group-hover:text-white" />
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-300 font-medium">{event.theme_custom_logo_url ? 'Cambiar Logo' : 'Subir Logo'}</p>
                                            <p className="text-xs text-slate-500 mt-1">PNG transparente recomendado</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Font Selection */}
                                <div className="space-y-4">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tipografía</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50">
                                        <option value="Outfit">Outfit (Moderna)</option>
                                        <option value="Inter">Inter (Estándar)</option>
                                        <option value="Playfair Display">Playfair Display (Elegante)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Receptionist Tab */}
            {
                activeTab === 'receptionist' && (
                    <div className="animate-in fade-in duration-300 max-w-4xl space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                                <Video size={18} className="text-[#FBBF24]" /> Configuración de Multimedia
                            </h3>

                            {/* Default Video */}
                            <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-white mb-1">Video por Defecto</h4>
                                        <p className="text-xs text-slate-400">Se reproduce para invitados que no tengan video específico asignado.</p>
                                        {event.video_url_default && (
                                            <div className="mt-2 text-xs text-[#FBBF24] flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Video activo
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleUploadClick('default_video')}
                                        disabled={isUploading}
                                        className="btn btn-primary text-xs py-2 px-4 flex items-center gap-2"
                                    >
                                        {isUploading && uploadTarget?.type === 'default_video' ? 'Subiendo...' : <><Upload size={14} /> {event.video_url_default ? 'Cambiar Video' : 'Subir Video Default'}</>}
                                    </button>
                                </div>
                            </div>

                            {/* Table Videos */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Videos por Mesa</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {[...Array.from({ length: event.table_count || 5 }, (_, i) => `Mesa ${i + 1}`)].map(tableName => (
                                        <div key={tableName} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                                    {tableName.replace('Mesa ', '')}
                                                </div>
                                                <span className="text-sm text-slate-200 font-medium">{tableName}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {event.video_configuration?.[tableName] ? (
                                                    <span className="text-xs text-[#FBBF24] mr-2 flex items-center gap-1"><Video size={10} /> Asignado</span>
                                                ) : (
                                                    <span className="text-xs text-slate-500 italic mr-2">Sin video asignado</span>
                                                )}
                                                <button
                                                    onClick={() => handleUploadClick('table_video', tableName)}
                                                    className={`p-2 rounded-lg transition-colors ${event.video_configuration?.[tableName] ? 'text-[#FBBF24] bg-[#FBBF24]/10' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                                                >
                                                    <Upload size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Personal Videos */}
                            <div className="pt-6 border-t border-white/5">
                                <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4">Videos Personalizados (Uno o Varios Invitados)</h4>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[500px]">
                                    {/* Selection Panel */}
                                    <div className="glass-card p-4 flex flex-col border border-white/10">
                                        <div className="mb-4 relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                            <input
                                                type="text"
                                                placeholder="Buscar invitado..."
                                                value={videoSearchQuery}
                                                onChange={(e) => setVideoSearchQuery(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#FBBF24]/50"
                                            />
                                        </div>

                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                            {guests
                                                .filter(g =>
                                                    g.first_name.toLowerCase().includes(videoSearchQuery.toLowerCase()) ||
                                                    g.last_name.toLowerCase().includes(videoSearchQuery.toLowerCase())
                                                )
                                                .map(guest => (
                                                    <div
                                                        key={guest.id}
                                                        className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${selectedGuestsForVideo.has(guest.id) ? 'bg-[#FBBF24]/10 border border-[#FBBF24]/30' : 'hover:bg-white/5 border border-transparent'}`}
                                                        onClick={() => {
                                                            const newSet = new Set(selectedGuestsForVideo);
                                                            if (newSet.has(guest.id)) newSet.delete(guest.id);
                                                            else newSet.add(guest.id);
                                                            setSelectedGuestsForVideo(newSet);
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedGuestsForVideo.has(guest.id) ? 'bg-[#FBBF24] border-[#FBBF24]' : 'border-slate-600'}`}>
                                                                {selectedGuestsForVideo.has(guest.id) && <CheckCircle2 size={12} className="text-black" />}
                                                            </div>
                                                            <div>
                                                                <div className={`text-sm font-medium ${selectedGuestsForVideo.has(guest.id) ? 'text-[#FBBF24]' : 'text-slate-300'}`}>
                                                                    {guest.last_name}, {guest.first_name}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500">
                                                                    {guest.table_info || 'Sin Mesa'} {guest.assigned_video_url && '• Tiene video asignado'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-xs text-slate-400">
                                            <span>{selectedGuestsForVideo.size} seleccionados</span>
                                            {selectedGuestsForVideo.size > 0 && (
                                                <button
                                                    onClick={() => setSelectedGuestsForVideo(new Set())}
                                                    className="text-slate-500 hover:text-white"
                                                >
                                                    Desmarcar todos
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Panel */}
                                    <div className="flex flex-col gap-4">
                                        <div className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all ${selectedGuestsForVideo.size > 0 ? 'border-[#FBBF24]/50 bg-[#FBBF24]/5 cursor-pointer hover:bg-[#FBBF24]/10' : 'border-white/10 opacity-50 cursor-not-allowed'}`}>
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${selectedGuestsForVideo.size > 0 ? 'bg-[#FBBF24] text-black' : 'bg-white/5 text-slate-500'}`}>
                                                {isUploading && uploadTarget?.type === 'guest_video' ? (
                                                    <div className="loading loading-spinner text-current"></div>
                                                ) : (
                                                    <Upload size={24} />
                                                )}
                                            </div>
                                            <h3 className="text-lg font-bold text-white mb-2">Asignar Video Personalizado</h3>
                                            <p className="text-sm text-slate-400 mb-6 max-w-xs">
                                                Sube un video para asignarlo a los <strong>{selectedGuestsForVideo.size} invitados</strong> seleccionados.
                                            </p>
                                            <button
                                                onClick={() => handleUploadClick('guest_video')}
                                                disabled={selectedGuestsForVideo.size === 0 || isUploading}
                                                className="btn btn-primary py-2 px-6 shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:shadow-none"
                                            >
                                                {isUploading && uploadTarget?.type === 'guest_video' ? 'Subiendo y Asignando...' : 'Seleccionar Archivo de Video'}
                                            </button>
                                        </div>

                                        {/* List of assignments */}
                                        <div className="h-40 glass-card p-3 overflow-y-auto custom-scrollbar">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 sticky top-0 bg-[#0a0f1c] py-1">Asignaciones Actuales</h5>
                                            <div className="space-y-2">
                                                {guests.filter(g => g.assigned_video_url).map(g => (
                                                    <div key={g.id} className="flex justify-between items-center text-xs p-2 bg-white/5 rounded">
                                                        <span className="text-slate-300">{g.first_name} {g.last_name}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[#FBBF24] flex items-center gap-1"><Video size={10} /> Video</span>
                                                            <button className="text-rose-400 hover:text-rose-300"><Trash2 size={12} /></button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {guests.filter(g => g.assigned_video_url).length === 0 && (
                                                    <div className="text-slate-600 italic text-center py-4">No hay videos personalizados asignados</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Downloads Tab */}
            {
                activeTab === 'downloads' && (
                    <div className="animate-in fade-in duration-300 max-w-4xl space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* QR Code Section */}
                            <div className="glass-card p-6 flex flex-col items-center text-center">
                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                    <QrCode size={18} className="text-[#FBBF24]" /> QR de Ingreso
                                </h3>

                                <div className="aspect-[9/16] w-64 bg-black rounded-xl border-4 border-[#FBBF24] relative flex flex-col items-center justify-center p-6 shadow-2xl mb-6">
                                    {/* Simulated QR Screen Content */}
                                    <div className="absolute inset-0 bg-slate-900 opacity-50"></div>
                                    <div className="relative z-10 bg-white p-4 rounded-xl">
                                        <QrCode size={120} className="text-black" />
                                    </div>
                                    <div className="relative z-10 mt-6 text-white font-bold text-lg">ESCANEA PARA INGRESAR</div>
                                    <div className="relative z-10 mt-2 text-[#FBBF24] text-sm">Tecno Eventos</div>
                                </div>

                                <div className="space-y-3">
                                    <button
                                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                                        onClick={() => generateQRPoster('portrait')}
                                    >
                                        <Download size={16} /> QR Vertical (1080x1920)
                                    </button>
                                    <button
                                        className="btn btn-secondary w-full flex items-center justify-center gap-2"
                                        onClick={() => generateQRPoster('landscape')}
                                    >
                                        <Download size={16} /> QR Horizontal (1920x1080)
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Elige el formato según tu pantalla</p>
                            </div>

                            {/* Lists Section */}
                            <div className="space-y-6">
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <FileText size={18} className="text-[#FBBF24]" /> Listas y Plantillas
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-white text-sm">Plantilla de Importación</h4>
                                                    <p className="text-xs text-slate-400 mt-1">CSV para carga masiva de invitados</p>
                                                </div>
                                                <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg">
                                                    <FileText size={16} />
                                                </div>
                                            </div>
                                            <button
                                                className="text-xs text-[#FBBF24] font-medium hover:underline flex items-center gap-1"
                                                onClick={downloadGuestsCSV}
                                            >
                                                Descargar CSV <Download size={10} />
                                            </button>
                                        </div>

                                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="font-medium text-white text-sm">Lista Final de Invitados</h4>
                                                    <p className="text-xs text-slate-400 mt-1">PDF listo para imprimir control manual</p>
                                                </div>
                                                <div className="bg-emerald-500/20 text-emerald-400 p-2 rounded-lg">
                                                    <FileText size={16} />
                                                </div>
                                            </div>
                                            <button
                                                className="text-xs text-[#FBBF24] font-medium hover:underline flex items-center gap-1"
                                                onClick={downloadGuestsPDF}
                                            >
                                                Descargar PDF <Download size={10} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Downloads Tab */}
            {activeTab === 'downloads' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="card-premium p-6">
                        <h3 className="text-xl font-bold text-foreground mb-4 font-display">Descargas y Recursos</h3>
                        <p className="text-muted-foreground mb-6">Descarga la información de tu evento o genera códigos QR.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* CSV Download */}
                            <div className="p-4 border border-border rounded-xl bg-surface hover:border-accent/50 transition-colors">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">Lista de Invitados</h4>
                                        <p className="text-sm text-muted">Formato CSV compatible con Excel.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={downloadGuestsCSV}
                                    className="btn btn-outline w-full justify-center"
                                >
                                    <Download size={16} className="mr-2" /> Descargar CSV
                                </button>
                            </div>

                            {/* QR Code Link */}
                            <div className="p-4 border border-border rounded-xl bg-surface hover:border-accent/50 transition-colors">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                                        <QrCode size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-foreground">Acceso Invitados (QR)</h4>
                                        <p className="text-sm text-muted">Genera imágenes para pantallas.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => generateQRPoster('portrait')}
                                        disabled={isGeneratingQR}
                                        className="btn btn-outline flex-1 text-xs justify-center"
                                    >
                                        <Download size={14} className="mr-2" /> Vertical
                                    </button>
                                    <button
                                        onClick={() => generateQRPoster('landscape')}
                                        disabled={isGeneratingQR}
                                        className="btn btn-outline flex-1 text-xs justify-center"
                                    >
                                        <Download size={14} className="mr-2" /> Horizontal
                                    </button>
                                </div>
                                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                                    <span className="text-xs text-muted">Link directo:</span>
                                    <a href={getGuestUrl()} target="_blank" className="text-xs text-accent hover:underline flex items-center gap-1">
                                        Ver App <ArrowRight size={10} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'settings' && (
                <div className="animate-in fade-in duration-300 max-w-2xl">
                    <form onSubmit={handleUpdateEvent} className="glass-card p-6 space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Información General</h3>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre del Evento</label>
                                    <input
                                        type="text"
                                        defaultValue={event.name}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Descripción (Opcional)</label>
                                    <textarea
                                        defaultValue={event.description}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600 resize-none"
                                        placeholder="Detalles adicionales del evento..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Fecha</label>
                                        <input
                                            type="date"
                                            defaultValue={event.date}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50 focus:ring-1 focus:ring-[#FBBF24]/50 transition-all placeholder:text-slate-600 appearance-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</label>
                                        <select
                                            defaultValue={event.status}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50"
                                        >
                                            <option value="pending">Pendiente</option>
                                            <option value="active">Activo</option>
                                            <option value="disabled">Deshabilitado</option>
                                            <option value="closed">Cerrado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2 mb-4">Configuración de Mesas y Áreas</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cantidad de Mesas</label>
                                    <input
                                        type="number"
                                        defaultValue={event.table_count || 10}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Invitados por Mesa</label>
                                    <input
                                        type="number"
                                        defaultValue={event.guests_per_table_default || 10}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 px-4 text-white text-sm focus:outline-none focus:border-[#FBBF24]/50"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div>
                                    <div className="text-sm font-medium text-white">Habilitar Living (Adolescentes)</div>
                                    <div className="text-xs text-slate-500">Área sin numeración estricta</div>
                                </div>
                                <input type="checkbox" defaultChecked={event.has_living_room} className="toggle toggle-warning toggle-sm" />
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                                <div>
                                    <div className="text-sm font-medium text-white">Habilitar Trasnoche</div>
                                    <div className="text-xs text-slate-500">Invitados post-cena</div>
                                </div>
                                <input type="checkbox" defaultChecked={event.has_after_party} className="toggle toggle-warning toggle-sm" />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                            <button type="button" className="btn btn-ghost text-slate-400 hover:text-white">Cancelar</button>
                            <button type="submit" className="btn btn-primary py-2.5 px-6 shadow-lg shadow-yellow-500/20">
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            )
            }
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
            {
                event && <GuestImportModal
                    isOpen={isImportModalOpen}
                    onClose={() => setIsImportModalOpen(false)}
                    event={event}
                    onImportComplete={handleImportComplete}
                />
            }

            {/* Create/Edit Guest Modal */}
            {
                event && <CreateGuestModal
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingGuest(null);
                    }}
                    event={event}
                    guestToEdit={editingGuest}
                    onGuestAdded={handleGuestAdded}
                    onGuestUpdated={handleGuestUpdated}
                />
            }

        </DashboardLayout >
    );
}

function StatCard({ label, value, icon: Icon, color }: any) {
    const colorClasses = {
        blue: 'text-blue-500 bg-blue-500/10',
        emerald: 'text-emerald-500 bg-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/10',
        purple: 'text-purple-500 bg-purple-500/10',
    };

    return (
        <div className="card-premium p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[color as keyof typeof colorClasses]}`}>
                <Icon size={24} />
            </div>
            <div>
                <div className="text-2xl font-bold text-foreground leading-none mb-1">{value}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
            </div>
        </div>
    );
}
