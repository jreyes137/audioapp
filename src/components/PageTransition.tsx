/**
 * PAGE TRANSITION - Transiciones Suaves
 * 
 * Wrapper con Framer Motion para transiciones fluidas entre páginas
 * Efecto: Opacity 0 -> 1 + Desplazamiento Y: 10 -> 0
 */

"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
    children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ 
                    opacity: 0, 
                    y: 10 
                }}
                animate={{ 
                    opacity: 1, 
                    y: 0 
                }}
                exit={{ 
                    opacity: 0, 
                    y: -10 
                }}
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1], // Curva de ease-out suave
                }}
                className="w-full h-full"
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}

