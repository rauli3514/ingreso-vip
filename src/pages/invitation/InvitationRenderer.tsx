import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { InvitationData } from '../../types';
import { getTheme } from './themes/registry';
import HeroBlock from './blocks/HeroBlock';
import CountdownBlock from './blocks/CountdownBlock';
import GuestBlock from './blocks/GuestBlock';
import EventDetailsBlock from './blocks/EventDetailsBlock';
import GiftsBlock from './blocks/GiftsBlock';
import FooterBlock from './blocks/FooterBlock';
import TransitionDivider from './blocks/TransitionDivider';
import { supabase } from '../../lib/supabase';

// Mock Data for develop without DB connection ready
const MOCK_DATA: InvitationData = {
    id: 'mock-1',
    event_id: 'demo',
    theme_id: 'hojas',
    cover_image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0202128?q=80&w=1500',
    hero_section: {
        show: true,
        title: 'Ana & Lucas',
        subtitle: '¡Nos casamos!',
        date_format: '25 . 11 . 2026'
    },
    countdown_section: {
        show: true,
        target_date: '2026-11-25T18:00:00',
        title: 'Cuenta Regresiva'
    },
    ceremony_section: {
        show: true,
        location_name: 'Parroquia San Benito',
        location_url: 'https://maps.google.com',
        time: '18:00'
    },
    party_section: {
        show: true,
        location_name: 'Estancia La Candelaria',
        location_url: 'https://maps.google.com',
        time: '20:30'
    },
    gallery_section: { show: true, images: [] },
    dress_code_section: { show: true, images: [] },
    gifts_section: {
        show: true,
        cbu: '00000031000404040404',
        alias: 'AMOR.BODA.FIESTA',
        bank: 'Banco Galicia'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
};

export default function InvitationRenderer() {
    const { id } = useParams<{ id: string }>(); // This might be event_id or guest_link
    const [data, setData] = useState<InvitationData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Fetch from Supabase using ID
        // For now, assume ID = 'demo' uses mock data
        if (id === 'demo') {
            setData(MOCK_DATA);
            setLoading(false);
        } else {
            // Placeholder fetch
            const fetchInvitation = async () => {
                try {
                    const { data: invData, error } = await supabase
                        .from('event_invitations')
                        .select('*')
                        .eq('event_id', id)
                        .single();

                    if (error || !invData) {
                        console.warn('Invitation not found, using Fallback/Mock');
                        // setData(MOCK_DATA); // Uncomment to fallback to mock if preferred during dev
                    } else {
                        setData(invData);
                    }
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchInvitation();
        }
    }, [id]);

    if (loading) return <div className="min-h-screen bg-white flex items-center justify-center">Cargando invitación...</div>;

    // If no data found (and not loading), show 404 or basic error
    if (!data) return <div className="min-h-screen flex items-center justify-center">Invitación no encontrada</div>;

    const theme = getTheme(data.theme_id);

    return (
        <div
            className="w-full min-h-screen selection:bg-black selection:text-white"
            style={{
                backgroundColor: theme.colors.background,
                fontFamily: theme.fonts.body,
                color: theme.colors.text
            }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Great+Vibes&family=Montserrat:wght@200;300;400;500&family=Playfair+Display:ital@0;1&family=Lato:wght@300;400&family=Dancing+Script&display=swap');
            `}</style>

            <HeroBlock data={data} theme={theme} />

            <TransitionDivider theme={theme} />

            <CountdownBlock data={data} theme={theme} />

            <TransitionDivider theme={theme} />

            {/* Guest Block (Personalized logic to be improved with real guest data) */}
            <GuestBlock data={data} theme={theme} guest={null} />

            <TransitionDivider theme={theme} />

            <EventDetailsBlock data={data} theme={theme} />

            {/* Gallery Block Placeholder */}

            <TransitionDivider theme={theme} />

            <GiftsBlock data={data} theme={theme} />

            <FooterBlock theme={theme} />

            <div className="py-4 text-center text-xs opacity-30">
                Invitation System v1.0
            </div>
        </div>
    );
}
