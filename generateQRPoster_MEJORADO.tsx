// FUNCIÓN MEJORADA PARA GENERAR QR CON FONDO PREMIUM Y LOGO CIRCULAR

const generateQRPoster = async (orientation: 'portrait' | 'landscape') => {
    if (!event) {
        alert('No hay evento seleccionado');
        return;
    }

    setIsGeneratingQR(true);
    console.log('🎨 Generando QR poster premium...');

    try {
        // Get theme colors
        const theme = getThemeById(event.theme_id || 'default');
        const colors = theme?.colors || {
            primary: '#6b21a8',
            secondary: '#581c87',
            accent: '#FBBF24',
            background: '#1a1030'
        };

        // 1. Generar QR primero
        const qrDataUrl = await QRCode.toDataURL(getGuestUrl(), {
            width: 1000,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
        });

        // 2. Crear canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas no disponible');

        const width = orientation === 'landscape' ? 1920 : 1080;
        const height = orientation === 'landscape' ? 1080 : 1920;
        canvas.width = width;
        canvas.height = height;

        // 3. FONDO PERSONALIZADO CON TÉCNICA DE BLUR (PREMIUM)
        if (event.theme_background_url) {
            const bgImg = new Image();
            bgImg.crossOrigin = 'anonymous';
            bgImg.src = event.theme_background_url;

            await new Promise((resolve) => {
                bgImg.onload = resolve;
                bgImg.onerror = () => {
                    console.warn('Error cargando fondo, usando gradiente');
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

                // Overlay sutil para legibilidad
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.fillRect(0, 0, width, height);
            } else {
                // Fallback: gradiente
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, colors.secondary);
                gradient.addColorStop(0.5, colors.primary);
                gradient.addColorStop(1, colors.background);
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
            }
        } else {
            // Gradiente del tema
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, colors.secondary);
            gradient.addColorStop(0.5, colors.primary);
            gradient.addColorStop(1, colors.background);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        }

        // 4. Cargar imagen QR
        const qrImg = new Image();
        qrImg.src = qrDataUrl;
        await new Promise((resolve, reject) => {
            qrImg.onload = resolve;
            qrImg.onerror = reject;
            setTimeout(reject, 5000);
        });

        // 5. Dibujar QR centrado
        const qrSize = orientation === 'landscape' ? 600 : 900;
        const qrX = (width - qrSize) / 2;
        const qrY = (height - qrSize) / 2;

        // Contenedor blanco para QR
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 40;
        ctx.fillRect(qrX - 40, qrY - 40, qrSize + 80, qrSize + 80);
        ctx.shadowBlur = 0;

        // Dibujar QR
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // 6. Textos
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 20;

        // Nombre del evento
        ctx.font = `bold ${orientation === 'landscape' ? '80' : '100'}px system-ui, sans-serif`;
        ctx.fillText(event.name, width / 2, qrY - 120);

        // Instrucción
        ctx.font = `${orientation === 'landscape' ? '50' : '60'}px system-ui, sans-serif`;
        ctx.fillText('Escanea para encontrar tu mesa', width / 2, qrY + qrSize + 140);
        ctx.shadowBlur = 0;

        // 7. LOGO CIRCULAR CON EFECTO CRISTAL (LATERAL)
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
                // Tamaño del logo circular
                const logoSize = orientation === 'landscape' ? 180 : 220;
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

                // Calcular tamaño del logo manteniendo aspect ratio (80% del círculo)
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

                // BORDE Y SOMBRA DEL CÍRCULO
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
            }
        }

        // 8. Branding
        ctx.font = '32px system-ui, sans-serif';
        ctx.fillStyle = colors.accent;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 10;
        ctx.fillText('Ingreso VIP • by Tecno Eventos', width / 2, height - 80);

        // 9. Descargar
        canvas.toBlob((blob) => {
            if (!blob) throw new Error('Error generando imagen');

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `${event.name.replace(/[^a-z0-9]/gi, '_')}_QR_${orientation}.jpg`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            console.log('✅ QR premium generado exitosamente');
            alert(`✅ QR ${orientation === 'landscape' ? 'horizontal' : 'vertical'} generado correctamente`);
        }, 'image/jpeg', 0.95);

    } catch (error) {
        console.error('Error generando QR:', error);
        alert('Error al generar el QR. Revisa la consola para más detalles.');
    } finally {
        setIsGeneratingQR(false);
    }
};
