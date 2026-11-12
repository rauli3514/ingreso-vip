// Copiar y compartir links. navigator.clipboard falla en algunos navegadores
// (el de Instagram o Facebook, Safari viejo, páginas sin foco), así que hay
// un plan B con un textarea temporal.

export async function copyText(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {
        // sigue con el plan B
    }
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '0';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ta.setSelectionRange(0, text.length);
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch {
        return false;
    }
}

/** Abre WhatsApp con el mensaje escrito; la persona elige a quién mandarlo. */
export function openWhatsApp(text: string) {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
}

/** Menú de compartir del celular. Devuelve false si no hay (computadora). */
export async function nativeShare(data: { title?: string; text?: string; url: string }): Promise<boolean> {
    if (!navigator.share) return false;
    try {
        await navigator.share(data);
        return true;
    } catch (err) {
        // Cerrar el menú sin elegir nada no es un error.
        return (err as Error)?.name === 'AbortError';
    }
}
