import { ImageResponse } from '@vercel/og';
import { loadInvitationPreview } from './_invitacion';

// Imagen de 1200x630 que WhatsApp, Facebook y Telegram muestran al compartir
// el link de una invitación: foto de portada (si hay), nombres, fecha y sello.

export const config = { runtime: 'edge' };

const GOLD = '#D4AF37';
const MAX_COVER_BYTES = 2_500_000;

type Node = { type: string; props: Record<string, any> };
const h = (type: string, style: Record<string, any>, children?: any, extra: Record<string, any> = {}): Node =>
    ({ type, props: { style, children, ...extra } });

function toBase64(buf: ArrayBuffer): string {
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
        bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
        const res = await fetch(url, { signal: ctrl.signal });
        return res.ok ? res : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

/** Portada achicada (con el optimizador de Vercel) como data URI; null si no se puede. */
async function loadCover(cover: string, origin: string): Promise<string | null> {
    const candidates = [`${origin}/_vercel/image?url=${encodeURIComponent(cover)}&w=1200&q=70`, cover];
    for (const url of candidates) {
        const res = await fetchWithTimeout(url, 4000);
        if (!res) continue;
        const type = res.headers.get('content-type') || '';
        if (!/image\/(jpeg|png)/.test(type)) continue;
        const buf = await res.arrayBuffer();
        if (buf.byteLength > MAX_COVER_BYTES) continue;
        return `data:${type.split(';')[0]};base64,${toBase64(buf)}`;
    }
    return null;
}

function initials(title: string): string {
    const parts = title.split(/\s*(?:&|\sy\s)\s*/i).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}&${parts[1][0]}`.toUpperCase();
    // "15 Años Nayra" → "N": la inicial de la última palabra que empieza con letra.
    const words = title.split(/\s+/).filter(w => /^\p{L}/u.test(w));
    const last = words[words.length - 1];
    return (last ? last[0] : '•').toUpperCase();
}

export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const data = await loadInvitationPreview(url.searchParams.get('id'), url.searchParams.get('i'));

    const [bold, italic, cover] = await Promise.all([
        fetch(new URL('/fonts/playfair-display-latin-700-normal.woff', url.origin)).then(r => r.arrayBuffer()),
        fetch(new URL('/fonts/playfair-display-latin-400-italic.woff', url.origin)).then(r => r.arrayBuffer()),
        data?.coverUrl ? loadCover(data.coverUrl, url.origin) : Promise.resolve(null),
    ]);

    const title = data?.title || 'Estás invitado';
    const titleSize = title.length > 30 ? 58 : title.length > 18 ? 72 : 88;

    const layers: any[] = [];
    if (cover) {
        layers.push(h('img', { position: 'absolute', top: 0, left: 0, width: 1200, height: 630, objectFit: 'cover' }, undefined, { src: cover, width: 1200, height: 630 }));
    }
    layers.push(h('div', {
        position: 'absolute', top: 0, left: 0, width: 1200, height: 630, display: 'flex',
        backgroundImage: cover
            ? 'linear-gradient(180deg, rgba(8,12,35,0.55) 0%, rgba(8,12,35,0.72) 55%, rgba(8,12,35,0.9) 100%)'
            : 'linear-gradient(135deg, #0b1437 0%, #1d2b64 55%, #0b1437 100%)',
    }));
    // Marco dorado
    layers.push(h('div', {
        position: 'absolute', top: 26, left: 26, width: 1148, height: 578, display: 'flex',
        border: `2px solid rgba(212,175,55,0.75)`, borderRadius: 28,
    }));

    const content = h('div', {
        position: 'absolute', top: 0, left: 0, width: 1200, height: 630,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 90px', color: 'white', textAlign: 'center',
    }, [
        // Sello
        h('div', {
            width: 104, height: 104, borderRadius: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundImage: 'radial-gradient(circle at 35% 30%, #F6E27A 0%, #D4AF37 45%, #8C6D1F 100%)',
            boxShadow: '0 6px 18px rgba(0,0,0,0.45)', color: '#3b2a05', fontFamily: 'Playfair', fontSize: 38, fontWeight: 700,
            marginBottom: 22,
        }, initials(title)),
        h('div', { display: 'flex', fontSize: 22, letterSpacing: 8, color: GOLD, fontWeight: 700, marginBottom: 10 },
            data?.guestName ? `PARA ${data.guestName.toUpperCase()}` : 'ESTÁS INVITADO'),
        h('div', { display: 'flex', fontFamily: 'Playfair', fontWeight: 700, fontSize: titleSize, lineHeight: 1.1, textShadow: '0 3px 12px rgba(0,0,0,0.5)' }, title),
        data?.subtitle
            ? h('div', { display: 'flex', fontFamily: 'Playfair Italic', fontSize: 36, color: '#F3E6C0', marginTop: 14 }, data.subtitle)
            : null,
        data?.dateText
            ? h('div', {
                display: 'flex', marginTop: 26, padding: '10px 26px', borderRadius: 999, fontSize: 26,
                border: '1.5px solid rgba(212,175,55,0.8)', backgroundColor: 'rgba(8,12,35,0.45)', color: 'white',
            }, data.dateText)
            : null,
    ].filter(Boolean));

    const footer = h('div', {
        position: 'absolute', bottom: 46, left: 0, width: 1200, display: 'flex', justifyContent: 'center',
        fontSize: 20, color: 'rgba(255,255,255,0.75)', letterSpacing: 2,
    }, 'Tocá para abrir la invitación · EventPix');

    const root = h('div', { width: 1200, height: 630, display: 'flex', position: 'relative', backgroundColor: '#0b1437', fontFamily: 'Sans' },
        [...layers, content, footer]);

    return new ImageResponse(root as any, {
        width: 1200,
        height: 630,
        fonts: [
            { name: 'Playfair', data: bold, weight: 700, style: 'normal' },
            { name: 'Playfair Italic', data: italic, weight: 400, style: 'italic' },
        ],
        headers: { 'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400' },
    });
}
