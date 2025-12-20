# Correcciones Necesarias - Ingreso VIP

## Problemas Reportados por Usuario
1. Links de descarga no funcionan
2. Web de usuario necesita arreglos

## Diagnóstico
- Servidor corriendo en http://localhost:3000/ingreso-vip/
- Base path configurado correctamente en vite.config.ts
- Funciones downloadGuestsCSV y generateQRPoster implementadas

## Acciones a Realizar

### 1. Verificar y Corregir Descarga CSV
- Revisar función downloadGuestsCSV
- Asegurar que maneja casos edge (sin invitados)
- Mejorar manejo de errores

### 2. Verificar y Corregir Generador QR
- Revisar función generateQRPoster
- Manejar errores de CORS en imágenes
- Asegurar fallback si background falla

### 3. Mejorar GuestApp (Web de Usuario)
- Diseño responsive completo
- Optimizar búsqueda de invitados
- Mejorar visualización de mesa
- Video playback si existe URL

### 4. URLs y Navegación
- Verificar getGuestUrl() genera URL correcta
- Asegurar navegación interna funciona
- Botón "Ver App" debe funcionar

## Prioridad
1. Downloads CSV/QR - CRÍTICO
2. GuestApp responsive - ALTO
3. Navegación - MEDIO
