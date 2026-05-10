import React from 'react';
import { Home, BookOpen, Trophy, User } from 'lucide-react';
import { motion } from 'motion/react';
import { STRINGS } from '../../lib/strings';
import { cn } from '../../lib/utils';

interface MobileNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNav = ({ activeTab, onTabChange }: MobileNavProps) => {
  const tabs = [
    { id: 'dashboard', label: STRINGS.student.nav.home, icon: Home },
    { id: 'subjects', label: STRINGS.student.nav.learn, icon: BookOpen },
    { id: 'progress', label: STRINGS.student.nav.progress, icon: Trophy },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-100 px-6 pt-3 pb-8 z-50 md:hidden shadow-[0_-8px_40px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 transition-all relative px-4 py-2 rounded-2xl",
                isActive ? "text-primary" : "text-ink-muted hover:text-ink"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-primary/5 rounded-[1.2rem] -z-10"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <tab.icon className={cn("w-6 h-6 transition-transform duration-300", isActive && "scale-110 -translate-y-0.5")} />
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-all",
                isActive ? "opacity-100" : "opacity-60"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
