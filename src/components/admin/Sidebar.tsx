import React from 'react';
import { LayoutDashboard, BookMarked, Users, Settings, LogOut, Menu, X, Rocket } from 'lucide-react';
import { STRINGS } from '../../lib/strings';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ activeTab, onTabChange, onLogout, isOpen, onToggle }: SidebarProps) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'content', label: STRINGS.admin.subjects, icon: BookMarked },
    { id: 'students', label: STRINGS.admin.students, icon: Users },
    { id: 'settings', label: STRINGS.admin.settings, icon: Settings },
  ];

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={onToggle}
        className="fixed top-6 left-6 z-50 p-3 bg-white rounded-2xl shadow-soft md:hidden border-2 border-slate-50 active:scale-95 transition-all text-primary"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/40 backdrop-blur-md z-40 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-100 z-40 transition-transform md:translate-x-0 flex flex-col shadow-soft-2xl md:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-10 pb-6">
          <div className="flex items-center gap-4 group cursor-default">
             <div className="w-12 h-12 bg-primary rounded-[1.2rem] flex items-center justify-center text-white font-black text-2xl shadow-soft group-hover:rotate-12 transition-transform">
               CB
             </div>
             <div>
               <h1 className="font-black text-xl tracking-tight text-ink leading-none">Cepat Belajar</h1>
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">Sistem Pintar</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3 mt-4">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  if (window.innerWidth < 768) onToggle();
                }}
                className={cn(
                  "w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] font-black transition-all relative group",
                  isActive 
                    ? "text-primary bg-primary/5" 
                    : "text-ink-muted hover:bg-slate-50 hover:text-ink"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-active-pill"
                    className="absolute inset-y-2 left-0 w-1.5 bg-primary rounded-r-full"
                  />
                )}
                <item.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", isActive ? "text-primary" : "text-ink-muted")} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <Card className="bg-bg-cream/50 border-none p-6 mb-6">
             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary mb-3 shadow-soft-sm">
                <Rocket className="w-6 h-6" />
             </div>
             <p className="text-xs font-black text-ink">Bantuan Admin?</p>
             <p className="text-[10px] font-bold text-ink-muted mt-1 leading-relaxed">Hubungi pasukan sokongan untuk bantuan teknikal.</p>
          </Card>

          <Button 
            variant="ghost" 
            className="w-full justify-start text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-2xl h-14 px-6"
            onClick={onLogout}
          >
            <LogOut className="w-5 h-5 mr-4" />
            <span className="font-black text-sm tracking-tight">Log Keluar</span>
          </Button>
        </div>
      </aside>
    </>
  );
};
