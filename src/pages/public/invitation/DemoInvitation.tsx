import InvitationRenderer from './InvitationRenderer';
import { InvitationData } from '../../../types';

// Invitación de muestra (/invitacion/muestra) para quien todavía no compró:
// muestra todas las secciones con datos de ejemplo. No lee ni guarda nada en la base.

const inDays = (days: number, time: string) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return `${d.toISOString().slice(0, 10)}T${time}:00`;
};

const IMG = '/themes/boda';

const DEMO_INVITATION = {
    id: 'muestra',
    event_id: 'muestra',
    theme_id: 'elegant',
    cover_image_url: `${IMG}/kerri-shaver-xepikEyPgmI-unsplash.jpg`,
    hero_section: {
        show: true,
        title: 'Sofía & Martín',
        subtitle: '¡Nos casamos!',
        show_date: true,
        music: { url: 'https://www.youtube.com/watch?v=2Vv-BfVoq4g', start: 0 },
    },
    countdown_section: { show: true, title: 'Faltan', target_date: inDays(120, '18:00') },
    ceremony_section: {
        show: true,
        title: 'Ceremonia',
        location_name: 'Parroquia Nuestra Señora del Pilar',
        address: 'Junín 1904, Recoleta, CABA',
        start_time: inDays(120, '18:00'),
        map_url: 'https://maps.google.com/?q=Basilica+Nuestra+Senora+del+Pilar+Buenos+Aires',
    },
    party_section: {
        show: true,
        title: 'Fiesta',
        location_name: 'Salón Los Jazmines',
        address: 'Av. del Libertador 5000, CABA',
        start_time: inDays(120, '20:30'),
        map_url: 'https://maps.google.com/?q=Av.+del+Libertador+5000+Buenos+Aires',
    },
    gallery_section: {
        show: true,
        title: 'Nuestra Historia',
        subtitle: 'Algunos momentos que nos trajeron hasta acá',
        images: [
            `${IMG}/alexander-grey-62vi3TG5EDg-unsplash.jpg`,
            `${IMG}/jj-ying-7JX0-bfiuxQ-unsplash.jpg`,
            `${IMG}/mariia-pravedna-Kh0-BXVW8Xs-unsplash.jpg`,
            `${IMG}/n-kamalov-IyffE4SWpmg-unsplash.jpg`,
        ],
    },
    gifts_section: {
        show: true,
        title: 'Regalos',
        subtitle: 'Tu presencia es nuestro mejor regalo. Si además querés hacernos un presente:',
        alias: 'sofi.y.martin.boda',
        owner: 'Sofía Gómez',
        bank: 'Banco de ejemplo',
    },
    extra_info_section: {
        show: true,
        title: 'Información Importante',
        subtitle: 'Hagamos juntos una fiesta inolvidable. Algunos detalles para tener en cuenta.',
        blocks: {
            music: { show: true, title: 'Música' },
            dress_code: { show: true, title: 'Dress Code', content: 'Elegante' },
            tips: { show: true, title: 'Tips y Notas', content: 'Hay estacionamiento en el salón.\nLa fiesta termina a las 5 AM.' },
        },
    },
    social_section: {
        show: true,
        title: 'Compartí tus fotos',
        subtitle: 'Usá nuestro hashtag en Instagram',
        hashtag: '#SofiYMartin',
    },
    footer_section: { show: true },
    components_config: {
        rsvp_enabled: true,
        suggest_song_enabled: true,
        playlist: { show: false },
        dress_code: {
            recommended_colors: ['#C5A572', '#F4E4D7', '#8B7355'],
            avoid_colors: ['#FFFFFF'],
        },
    },
} as unknown as InvitationData;

export default function DemoInvitation() {
    return <InvitationRenderer previewData={DEMO_INVITATION} demo />;
}
