import { loadInvitationPreview, escapeHtml } from './_invitacion';

// Solo lo reciben los robots que arman la vista previa de un link (WhatsApp,
// Facebook, Telegram...): vercel.json les manda acá /invitacion/:id según el
// user-agent. Las personas siguen viendo la invitación normal.

export const config = { runtime: 'edge' };

export default async function handler(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const guestId = url.searchParams.get('i');
    const data = await loadInvitationPreview(id, guestId);

    const pageUrl = new URL(`/invitacion/${id || ''}`, url.origin);
    if (guestId) pageUrl.searchParams.set('i', guestId);

    const imageUrl = new URL('/api/invitacion-imagen', url.origin);
    if (id) imageUrl.searchParams.set('id', id);
    if (guestId) imageUrl.searchParams.set('i', guestId);

    const title = data
        ? (data.guestName ? `${data.guestName}, estás invitado: ${data.title}` : `Estás invitado: ${data.title}`)
        : 'Estás invitado 💌';
    const description = data
        ? [data.subtitle, data.dateText, 'Tocá para ver la invitación y confirmar tu asistencia.'].filter(Boolean).join(' · ')
        : 'Tocá para ver la invitación y confirmar tu asistencia.';

    const t = escapeHtml(title);
    const d = escapeHtml(description);
    const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="EventPix">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="${escapeHtml(pageUrl.toString())}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${escapeHtml(imageUrl.toString())}">
<meta property="og:image:secure_url" content="${escapeHtml(imageUrl.toString())}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${t}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${escapeHtml(imageUrl.toString())}">
</head>
<body><a href="${escapeHtml(pageUrl.toString())}">${t}</a></body>
</html>`;

    return new Response(html, {
        headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400',
        },
    });
}
