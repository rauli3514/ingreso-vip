import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check } from 'lucide-react';
import { InvitationData } from '../../../types';
import { InvitationTheme } from '../themes/types';

interface GiftsBlockProps {
    data: InvitationData;
    theme: InvitationTheme;
}

const GiftsBlock: React.FC<GiftsBlockProps> = ({ data, theme }) => {
    const sectionData = data.gifts_section;
    const [copied, setCopied] = useState(false);

    if (!sectionData.show) return null;

    const handleCopy = (text: string | undefined) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="py-24 px-6 flex flex-col items-center" style={{ backgroundColor: theme.colors.background }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl w-full text-center"
            >
                <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${theme.colors.secondary}20`, color: theme.colors.secondary }}
                >
                    <Gift size={32} />
                </div>

                <h3 className="text-3xl md:text-4xl mb-6 font-medium" style={{ fontFamily: theme.fonts.heading, color: theme.colors.primary }}>
                    Regalos
                </h3>

                <p className="text-lg mb-10 opacity-70 leading-relaxed" style={{ fontFamily: theme.fonts.body }}>
                    El mejor regalo es tu presencia, pero si deseas hacernos un presente, puedes hacerlo aquí:
                </p>

                <div className="p-8 rounded-xl relative overflow-hidden"
                    style={{
                        backgroundColor: theme.colors.surface,
                        border: `1px solid ${theme.colors.secondary}30`
                    }}
                >
                    <div className="space-y-4 font-mono text-sm md:text-base">
                        {sectionData.bank && <div className="uppercase opacity-60 tracking-wider text-xs mb-2">{sectionData.bank}</div>}

                        {sectionData.cbu && (
                            <div className="flex flex-col md:flex-row items-center justify-between gap-2 p-3 rounded-lg bg-black/5">
                                <span className="opacity-70">CBU:</span>
                                <span className="font-bold cursor-pointer select-all" onClick={() => handleCopy(sectionData.cbu)}>{sectionData.cbu}</span>
                                <button onClick={() => handleCopy(sectionData.cbu)} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="opacity-50" />}
                                </button>
                            </div>
                        )}

                        {sectionData.alias && (
                            <div className="flex flex-col md:flex-row items-center justify-center gap-2 mt-4 text-lg font-bold" style={{ color: theme.colors.primary }}>
                                <span>Alias:</span>
                                <span>{sectionData.alias}</span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </section>
    );
};

export default GiftsBlock;
