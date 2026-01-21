import React from 'react';
import { InvitationTheme } from '../themes/types';

interface FooterBlockProps {
    theme: InvitationTheme;
}

const FooterBlock: React.FC<FooterBlockProps> = ({ theme }) => {
    return (
        <footer className="py-20 text-center relative overflow-hidden"
            style={{
                backgroundColor: theme.colors.primary,
                color: '#fff'
            }}
        >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="relative z-10 p-6">
                <h2 className="text-4xl md:text-6xl mb-8 opacity-90" style={{ fontFamily: theme.fonts.accent }}>
                    ¡Los esperamos!
                </h2>

                <p className="text-sm uppercase tracking-widest opacity-60 mb-12">
                    Gracias por ser parte de nuestra historia
                </p>

                <div className="text-xs opacity-30 mt-12 flex justify-center items-center gap-2">
                    <span>Powered by</span>
                    <span className="font-bold tracking-wider">INGRESO VIP</span>
                </div>
            </div>
        </footer>
    );
};

export default FooterBlock;
