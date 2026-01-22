import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Users, TrendingUp, Sparkles } from 'lucide-react';

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

        // Suscripción en tiempo real
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

    if (loading) {
        return null;
    }

    return (
        <div className="fixed bottom-8 right-8 z-50">
            <div
                className={`bg-white rounded-2xl shadow-2xl border-2 p-6 min-w-[200px] transition-all duration-500 ${animation ? 'scale-110 shadow-[0_0_30px_rgba(79,70,229,0.4)]' : 'scale-100'
                    }`}
                style={{ borderColor: themeColor }}
            >
                {/* Sparkle Effect */}
                {animation && (
                    <div className="absolute -top-2 -right-2">
                        <Sparkles className="text-yellow-500 animate-spin" size={24} />
                    </div>
                )}

                {/* Icon Header */}
                <div className="flex items-center justify-center gap-2 mb-3">
                    <Users size={24} style={{ color: themeColor }} />
                    {count > 0 && (
                        <TrendingUp size={16} className="text-green-500" />
                    )}
                </div>

                {/* Count */}
                <div className="text-center">
                    <div
                        className={`text-5xl font-bold mb-1 transition-all duration-300 ${animation ? 'scale-125' : 'scale-100'
                            }`}
                        style={{ color: themeColor }}
                    >
                        {count}
                    </div>
                    <p className="text-sm text-slate-600 font-medium">
                        {count === 1 ? 'persona confirmó' : 'personas confirmaron'}
                    </p>
                </div>

                {/* Motivational Message */}
                {count > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                        <p className="text-xs text-center text-slate-500">
                            {count >= 50 && '¡Increíble! 🎉'}
                            {count >= 20 && count < 50 && '¡Qué emoción! 💫'}
                            {count >= 10 && count < 20 && '¡Sumando! ⭐'}
                            {count < 10 && '¡Sé el próximo! 💝'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
