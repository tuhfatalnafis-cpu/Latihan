import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'mint' | 'lilac' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-primary text-white shadow-soft-lg hover:bg-primary/90',
      secondary: 'bg-white text-ink border border-slate-100 shadow-soft hover:bg-slate-50',
      accent: 'bg-accent-warm text-white shadow-soft hover:bg-accent-warm/90',
      mint: 'bg-accent-mint text-ink shadow-soft hover:bg-accent-mint/90',
      lilac: 'bg-accent-lilac text-ink shadow-soft hover:bg-accent-lilac/90',
      ghost: 'bg-transparent text-ink hover:bg-slate-100',
      outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/5',
      danger: 'bg-rose-500 text-white shadow-soft hover:bg-rose-600',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-xl',
      md: 'px-6 py-3 text-base font-bold rounded-2xl',
      lg: 'px-8 py-4 text-lg font-extrabold rounded-3xl',
      xl: 'px-10 py-5 text-xl font-black rounded-[2rem]',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={cn(
          'inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none active:scale-95',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children as React.ReactNode}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
