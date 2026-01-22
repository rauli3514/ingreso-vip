import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Users, Sparkles } from 'lucide-react';

interface Props {
    eventId: string;
    themeColor?: string;
}

export default function AttendeeCounter({ eventId, themeColor = '#4F46E5' }: Props) {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [animation, setAnimation] = useState(false);

    useEffect(() => {
        fetchCount();

        const channel = supabase
            .channel('attendee-count')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'invitation_responses',
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    fetchCount();
                    triggerAnimation();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [eventId]);

    const fetchCount = async () => {
        try {
            const { count: totalCount, error } = await supabase
                .from('invitation_responses')
                .select('*', { count: 'exact', head: true })
                .eq('event_id', eventId)
                .eq('attending', true);

            if (error) throw error;
            setCount(totalCount || 0);
        } catch (error) {
            console.error('Error fetching attendee count:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerAnimation = () => {
        setAnimation(true);
        setTimeout(() => setAnimation(false), 600);
    };

    if (loading || count === 0) {
        return null; // No mostrar si está cargando o no hay confirmados
    }

    return (
        <div className="fixed bottom-4 right-4 z-40">
            <div
                className={`bg-white/95 backdrop-blur-sm rounded-full shadow-lg border px-3 py-2 transition-all duration-500 hover:scale-105 cursor-default ${animation ? 'scale-105' : 'scale-100'
                    }`}
                style={{ borderColor: `${themeColor}40` }}
            >
                <div className="flex items-center gap-2">
                    <Users size={14} style={{ color: themeColor }} className="opacity-70" />

                    <div
                        className={`text-base font-bold transition-all duration-300 ${animation ? 'scale-110' : 'scale-100'
                            }`}
                        style={{ color: themeColor }}
                    >
                        {count}
                    </div>

                    <p className="text-xs text-slate-600 font-medium">
                        confirmaron
                    </p>

                    {animation && (
                        <Sparkles size={12} className="text-yellow-500" />
                    )}
                </div>
            </div>
        </div>
    );
}
