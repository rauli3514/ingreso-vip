import { useState } from 'react';
import { Download, QrCode, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { Event, Guest } from '../../../../types';
import { getThemeById } from '../../../../lib/themes';

interface DownloadsTabProps {
    event: Event;
    guests: Guest[];
}

export default function DownloadsTab({ event, guests }: DownloadsTabProps) {
    const [isGeneratingQR, setIsGeneratingQR] = useState(false);

    const getGuestUrl = () => {
        const baseUrl = window.location.pathname.startsWith('/ingreso-vip') ? '/ingreso-vip' : '';
        return `${window.location.origin}${baseUrl}/evento/${event?.id}`;
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

    const downloadGuestsPDF = () => {
        if (!guests.length) {
            alert('No hay invitados para descargar.');
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

            // 2. Create Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('No se pudo crear contexto de canvas');

            const width = orientation === 'landscape' ? 1920 : 1080;
            const height = orientation === 'landscape' ? 1080 : 1920;
            canvas.width = width;
            canvas.height = height;

            // 3. FONDO PERSONALIZADO (si existe) o gradiente del tema
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
                    // Fondo que cubre toda la pantalla sin blur
                    const bgAspect = bgImg.naturalWidth / bgImg.naturalHeight;
                    const canvasAspect = width / height;

                    let bgDrawWidth, bgDrawHeight, bgX, bgY;

                    // Calcular para cubrir todo el canvas (cover)
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

                    // Dibujar imagen de fondo cubriendo todo
                    ctx.drawImage(bgImg, bgX, bgY, bgDrawWidth, bgDrawHeight);

                    // Overlay oscuro sutil para mejorar legibilidad del QR
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                    ctx.fillRect(0, 0, width, height);
                } else {
                    // Fallback: gradiente del tema
                    const gradient = ctx.createLinearGradient(0, 0, 0, height);
                    gradient.addColorStop(0, themeColors.secondary);
                    gradient.addColorStop(0.5, themeColors.primary);
                    gradient.addColorStop(1, themeColors.background);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, width, height);
                }
            } else {
                // Gradiente del tema
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, themeColors.secondary);
                gradient.addColorStop(0.5, themeColors.primary);
                gradient.addColorStop(1, themeColors.background);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }

            // 4. Load and draw QR image
            const qrImg = new Image();
            qrImg.src = qrDataUrl;

            await new Promise((resolve, reject) => {
                qrImg.onload = resolve;
                qrImg.onerror = () => reject(new Error('Error cargando imagen QR'));
                setTimeout(() => reject(new Error('Timeout cargando QR')), 5000);
            });

            // 5. Calculate QR position and size
            const qrSize = orientation === 'landscape' ? 350 : 450;
            const qrX = (width - qrSize) / 2;
            // Posicionar el QR en el tercio inferior (70% de la altura)
            const qrY = height * 0.70 - qrSize / 2;

            // Draw white container with shadow
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 20;
            ctx.fillRect(qrX - 25, qrY - 25, qrSize + 50, qrSize + 50);
            ctx.shadowBlur = 0;

            // Draw QR
            ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

            // 6. Add texts
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 30;

            // Event name
            ctx.font = `bold ${orientation === 'landscape' ? '70' : '80'}px system-ui, sans-serif`;
            ctx.fillText(event.name, width / 2, qrY - 80);

            // Instruction
            ctx.font = `${orientation === 'landscape' ? '40' : '45'}px system-ui, sans-serif`;
            ctx.fillText('Escanea para encontrar tu mesa', width / 2, qrY + qrSize + 90);

            // 7. LOGO CIRCULAR (si existe)
            if (event.theme_custom_logo_url) {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                logoImg.src = event.theme_custom_logo_url;

                await new Promise((resolve) => {
                    logoImg.onload = resolve;
                    logoImg.onerror = () => resolve(null);
                    setTimeout(() => resolve(null), 5000);
                });

                if (logoImg.complete && logoImg.naturalWidth > 0) {
                    const logoSize = orientation === 'landscape' ? 140 : 160;
                    const logoRadius = logoSize / 2;

                    const logoX = width - logoSize - 80;
                    const logoY = 80;

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();

                    const glassGradient = ctx.createRadialGradient(
                        logoX + logoRadius, logoY + logoRadius, 0,
                        logoX + logoRadius, logoY + logoRadius, logoRadius
                    );
                    glassGradient.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
                    glassGradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
                    ctx.fillStyle = glassGradient;
                    ctx.fillRect(logoX, logoY, logoSize, logoSize);

                    ctx.globalAlpha = 0.95;
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

                    // Borde
                    ctx.save();
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
                    ctx.shadowBlur = 25;
                    ctx.shadowOffsetY = 8;
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.arc(logoX + logoRadius, logoY + logoRadius, logoRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Branding
            ctx.font = `${orientation === 'landscape' ? '24' : '28'}px system-ui, sans-serif`;
            ctx.fillStyle = themeColors.accent;
            ctx.fillText('INGRESO VIP • by Tecno Eventos', width / 2, height - 60);

            // Download
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.download = `${event.name.replace(/[^a-z0-9]/gi, '_')}_QR_${orientation}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            alert(`✅ Poster QR ${orientation === 'landscape' ? 'horizontal' : 'vertical'} generado correctamente`);

        } catch (error) {
            console.error('❌ Error generando QR poster:', error);
            const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
            alert(`❌ Error al generar QR: ${errorMsg}`);
        } finally {
            setIsGeneratingQR(false);
        }
    };

    return (
        <div className="animate-in fade-in duration-300 max-w-4xl space-y-6">
            <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-white border-b border-white/5 pb-4 mb-6 flex items-center gap-2">
                    <Download size={18} className="text-[#FBBF24]" /> Descargas y Materiales
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* QR Posters */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-[#FBBF24]/20 flex items-center justify-center text-[#FBBF24]">
                                <QrCode size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium">Posters QR para Imprimir</h4>
                                <p className="text-xs text-slate-400">Genera carteles de alta calidad para la entrada del salón.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => generateQRPoster('landscape')}
                                disabled={isGeneratingQR}
                                className="w-full btn bg-slate-800 hover:bg-slate-700 text-white border-slate-700 flex items-center justify-between group"
                            >
                                <span className="flex items-center gap-2"><QrCode size={16} /> Horizontal (TV 16:9)</span>
                                {isGeneratingQR && <span className="loading loading-spinner loading-xs"></span>}
                            </button>
                            <button
                                onClick={() => generateQRPoster('portrait')}
                                disabled={isGeneratingQR}
                                className="w-full btn bg-slate-800 hover:bg-slate-700 text-white border-slate-700 flex items-center justify-between group"
                            >
                                <span className="flex items-center gap-2"><QrCode size={16} /> Vertical (Totem 9:16)</span>
                                {isGeneratingQR && <span className="loading loading-spinner loading-xs"></span>}
                            </button>
                        </div>
                    </div>

                    {/* Guest Lists */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <FileText size={20} />
                            </div>
                            <div>
                                <h4 className="text-white font-medium">Listas de Invitados</h4>
                                <p className="text-xs text-slate-400">Exporta la lista para compartir o imprimir.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={downloadGuestsPDF}
                                className="w-full btn bg-slate-800 hover:bg-slate-700 text-white border-slate-700 flex items-center justify-between group"
                            >
                                <span className="flex items-center gap-2"><FileText size={16} /> Descargar PDF (Para imprimir)</span>
                                <Download size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>
                            <button
                                onClick={downloadGuestsCSV}
                                className="w-full btn bg-slate-800 hover:bg-slate-700 text-white border-slate-700 flex items-center justify-between group"
                            >
                                <span className="flex items-center gap-2"><FileText size={16} /> Descargar CSV (Excel)</span>
                                <Download size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
