import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface CardProps extends HTMLMotionProps<'div'> {
  variant?: 'white' | 'primary' | 'mint' | 'warm' | 'lilac' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = ({ 
  className, 
  variant = 'white', 
  padding = 'md', 
  hover = false,
  children, 
  ...props 
}: CardProps) => {
  const variants = {
    white: 'bg-white border border-slate-100 shadow-soft',
    primary: 'bg-primary text-white shadow-soft-lg',
    mint: 'bg-accent-mint/10 border border-accent-mint/20',
    warm: 'bg-accent-warm/10 border border-accent-warm/20',
    lilac: 'bg-accent-lilac/10 border border-accent-lilac/20',
    glass: 'bg-white/70 backdrop-blur-md border border-white/20 shadow-soft',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6 md:p-8',
    lg: 'p-8 md:p-12',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn(
        'rounded-3xl',
        variants[variant],
        paddings[padding],
        hover && 'cursor-pointer hover:shadow-soft-lg transition-shadow duration-300',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
