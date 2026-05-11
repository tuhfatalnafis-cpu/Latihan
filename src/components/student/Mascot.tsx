import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '../../lib/utils';

interface MascotProps {
  gender?: 'male' | 'female' | null;
  pose?: 'wave' | 'study' | 'celebrate'; // stubbed for future
  className?: string;
  variant?: 'hero' | 'empty' | 'result' | 'avatar';
  animate?: boolean | 'pulse';
}

export const Mascot: React.FC<MascotProps> = ({ 
  gender = 'male', 
  pose = 'wave', 
  className,
  variant,
  animate = true
}) => {
  const shouldReduceMotion = useReducedMotion();
  
  // Add debug log for development
  console.log('[Mascot Debug] Received gender:', gender);

  // Handing the null/unspecified case
  const resolvedAsset = gender === 'female' ? 'girl' : 'boy';
  const src = `/assets/mascots/${resolvedAsset}.png`;

  // Base animations
  const variants = {
    initial: { opacity: 0, y: 20 },
    enter: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 100
      }
    },
    hover: {
      y: [0, -8, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut"
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.4
      }
    }
  };

  const isAnimate = animate && !shouldReduceMotion;

  return (
    <motion.div
      initial={isAnimate ? "initial" : false}
      animate={isAnimate ? (animate === 'pulse' ? "pulse" : "enter") : false}
      whileHover={isAnimate && animate !== 'pulse' ? "hover" : undefined}
      className={cn("relative inline-block overflow-visible", className)}
    >
      <img
        src={src}
        alt="Mascot"
        className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
        referrerPolicy="no-referrer"
      />
    </motion.div>
  );
};
