import React, { useState } from 'react';
import { Sidebar } from '../components/admin/Sidebar';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AdminLayoutProps {
  children: React.ReactNode;
  user: any;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  title?: string;
  actions?: React.ReactNode;
}

export const AdminLayout = ({ children, user, activeTab, onTabChange, onLogout, title, actions }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-bg-cream flex">
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        onLogout={onLogout}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <div className="flex-1 md:ml-72 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between sticky top-0 z-30 px-6 md:px-10">
          <div className="flex items-center gap-4">
             <div className="md:hidden w-12 h-12" /> {/* Spacer for toggle if fixed */}
             <div className="animate-in fade-in slide-in-from-left-4 duration-500">
               <p className="text-[10px] font-black text-ink-muted uppercase tracking-[0.3em] mb-1">Cepat Belajar Admin</p>
               <h2 className="text-2xl font-black text-ink tracking-tight">{title}</h2>
             </div>
          </div>
          <div className="flex items-center gap-6">
            {actions}
            <div className="hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
               <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white text-xs font-black">
                 {user.name?.[0] || 'A'}
               </div>
               <span className="text-sm font-bold text-ink">Administrator</span>
            </div>
          </div>
        </header>

        <main className="p-6 md:p-10 w-full max-w-7xl mx-auto flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};
