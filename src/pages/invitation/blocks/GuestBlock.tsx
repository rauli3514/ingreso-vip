import React from 'react';
import { motion } from 'framer-motion';
import { InvitationData, Guest } from '../../../types';
import { InvitationTheme } from '../themes/types';

interface GuestBlockProps {
    data: InvitationData;
    theme: InvitationTheme;
    guest?: Guest | null;
}

const GuestBlock: React.FC<GuestBlockProps> = ({ theme, guest }) => {
    // Si no hay guest para el contexto (ej: preview genérica), no mostramos este bloque específico
    // O mostramos un placeholder genérico
    const displayGuest: Partial<Guest> = guest || {
        first_name: 'Invitado',
        last_name: 'Especial',
        display_name: 'Invitado Especial',
        table_info: 'Por definir'
    };

    return (
        <section className="py-24 px-6 flex justify-center w-full" style={{ backgroundColor: theme.colors.background }}>
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-xl w-full text-center relative p-10 rounded-xl overflow-hidden"
                style={{
                    backgroundColor: theme.colors.surface,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                    border: `1px solid ${theme.colors.secondary}30`
                }}
            >
                {/* Decorative corner */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 opacity-50"
                    style={{ borderColor: theme.colors.secondary }}
                />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 opacity-50"
                    style={{ borderColor: theme.colors.secondary }}
                />

                <p className="text-sm uppercase tracking-widest mb-4" style={{ color: theme.colors.textLight }}>
                    Invitación para
                </p>

                <h3 className="text-3xl md:text-5xl mb-8 capitalize"
                    style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.primary
                    }}
                >
                    {displayGuest.display_name || `${displayGuest.first_name} ${displayGuest.last_name}`}
                </h3>

                <div className="w-16 h-px mx-auto mb-8" style={{ backgroundColor: theme.colors.secondary }}></div>

                {displayGuest.table_info && (
                    <div className="inline-block px-6 py-2 rounded-full mb-6 text-sm font-semibold tracking-wider uppercase"
                        style={{
                            backgroundColor: `${theme.colors.secondary}20`,
                            color: theme.colors.text
                        }}
                    >
                        {displayGuest.table_info}
                    </div>
                )}

                <p className="text-lg leading-relaxed opacity-80" style={{ fontFamily: theme.fonts.body }}>
                    Queremos compartir este momento único contigo.
                    <br />
                    Confirma tu asistencia lo antes posible.
                </p>

                <div className="mt-10">
                    <button className="px-8 py-3 text-white text-sm tracking-widest uppercase transition-transform hover:scale-105"
                        style={{
                            backgroundColor: theme.colors.secondary,
                            fontFamily: theme.fonts.body
                        }}
                    >
                        Confirmar Asistencia
                    </button>
                </div>

            </motion.div>
        </section>
    );
};

export default GuestBlock;
