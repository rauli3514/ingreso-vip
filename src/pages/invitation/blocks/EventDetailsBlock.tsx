import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock } from 'lucide-react';
import { InvitationData } from '../../../types';
import { InvitationTheme } from '../themes/types';

interface EventDetailsBlockProps {
    data: InvitationData;
    theme: InvitationTheme;
}

const EventDetailsBlock: React.FC<EventDetailsBlockProps> = ({ data, theme }) => {
    const ceremony = data.ceremony_section;
    const party = data.party_section;

    if (!ceremony.show && !party.show) return null;

    const LocationCard = ({ title, info, icon: Icon, delay = 0 }: any) => (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay }}
            className="flex flex-col items-center text-center p-8 flex-1 min-w-[300px]"
        >
            <div className="mb-6 p-4 rounded-full bg-opacity-10" style={{ backgroundColor: `${theme.colors.secondary}20` }}>
                <Icon size={32} style={{ color: theme.colors.secondary }} />
            </div>

            <h3 className="text-2xl mb-4 font-semibold" style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>
                {title}
            </h3>

            {info.time && <div className="text-lg mb-2 font-medium">{info.time} hrs</div>}

            {info.location_name && (
                <div className="text-xl mb-2" style={{ fontFamily: theme.fonts.heading }}>
                    {info.location_name}
                </div>
            )}

            <p className="text-sm opacity-70 max-w-xs mb-6 mx-auto">
                Dirección del lugar
            </p>

            {info.location_url && (
                <a
                    href={info.location_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 border-b pb-1 hover:opacity-70 transition-opacity text-sm uppercase tracking-wider"
                    style={{ borderColor: theme.colors.secondary, color: theme.colors.text }}
                >
                    Ver Mapa
                </a>
            )}
        </motion.div>
    );

    return (
        <section className="py-24 px-6 relative" style={{ backgroundColor: theme.colors.background }}>
            {/* Divider Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-gray-300 opacity-50"></div>

            <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12">
                {ceremony.show && (
                    <LocationCard
                        title="Ceremonia"
                        info={ceremony}
                        icon={Clock}
                    />
                )}

                {party.show && (
                    <LocationCard
                        title="Fiesta"
                        info={party}
                        icon={MapPin}
                        delay={0.2}
                    />
                )}
            </div>
        </section>
    );
};

export default EventDetailsBlock;
