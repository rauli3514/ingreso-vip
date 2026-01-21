import React from 'react';
import { motion } from 'framer-motion';
import { InvitationTheme } from '../themes/types';

interface TransitionDividerProps {
    theme: InvitationTheme;
    className?: string;
}

const TransitionDivider: React.FC<TransitionDividerProps> = ({ theme, className }) => {
    // Si el tema tiene asset de divisor
    if (theme.assets.divider) {
        return (
            <div className={`w-full overflow-hidden flex justify-center py-6 ${className || ''}`} style={{ backgroundColor: theme.colors.background }}>
                <motion.img
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    src={theme.assets.divider}
                    alt="divider"
                    className="max-w-[200px] md:max-w-[300px] opacity-80"
                />
            </div>
        );
    }

    // Default CSS divider
    return (
        <div className={`w-full py-12 flex items-center justify-center ${className || ''}`} style={{ backgroundColor: theme.colors.background }}>
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                whileInView={{ width: 100, opacity: 1 }}
                transition={{ duration: 1 }}
                className="h-px bg-current opacity-30 mx-4"
                style={{ color: theme.colors.secondary, width: '100px' }}
            />
            <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                whileInView={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 1 }}
                className="w-2 h-2 rounded-full mx-2"
                style={{ backgroundColor: theme.colors.secondary }}
            />
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                whileInView={{ width: 100, opacity: 1 }}
                transition={{ duration: 1 }}
                className="h-px bg-current opacity-30 mx-4"
                style={{ color: theme.colors.secondary, width: '100px' }}
            />
        </div>
    );
};

export default TransitionDivider;
