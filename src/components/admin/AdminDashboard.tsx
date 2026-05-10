import React, { useState } from 'react';
import { 
  Users, 
  Settings, 
  Database, 
  BarChart3, 
  LogOut,
  LayoutDashboard,
  BookOpen,
  PieChart,
  UserCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { User } from '../../types';
import ContentManager from './ContentManager';
import StudentManager from './StudentManager';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type AdminTab = 'content' | 'students' | 'analytics' | 'settings';

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('content');

  const menuItems = [
    { id: 'content', title: 'Kad & Subjek', icon: BookOpen },
    { id: 'students', title: 'Pengurusan Pelajar', icon: Users },
    { id: 'analytics', title: 'Prestasi', icon: BarChart3 },
    { id: 'settings', title: 'Tetapan', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-xl font-black text-slate-800 tracking-tight">Cepat Belajar</span>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AdminTab)}
                className={cn(
                  "w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === item.id 
                    ? "bg-indigo-50 text-indigo-600" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                )}
              >
                <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-indigo-600" : "text-slate-400")} />
                {item.title}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-100">
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl mb-4">
            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 font-bold border border-slate-100">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">Pentadbir</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 shrink-0">
          <h2 className="text-xl font-black text-slate-800 tracking-tight">
            {menuItems.find(m => m.id === activeTab)?.title}
          </h2>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-right">
               <span className="text-xs text-slate-400 font-bold uppercase tracking-widest text-right">Dashboard Terkini</span>
               <span className="text-sm font-black text-slate-800">Pentadbiran Pelajar & Kandungan</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200" />
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10">
          {activeTab === 'content' && <ContentManager user={user} />}
          {activeTab === 'students' && <StudentManager />}
          {activeTab === 'analytics' && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
               <PieChart className="w-12 h-12 text-slate-200 mb-4" />
               <h3 className="text-xl font-bold text-slate-800">Analisis Prestasi</h3>
               <p className="text-slate-500 max-w-sm mt-1">Ciri perincian prestasi platform akan tersedia selepas data mencukupi dari aktiviti pelajar.</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center flex flex-col items-center">
               <Settings className="w-12 h-12 text-slate-200 mb-4" />
               <h3 className="text-xl font-bold text-slate-800">Tetapan Platform</h3>
               <p className="text-slate-500 max-w-sm mt-1">Konfigurasi sistem sedang dalam pembinaan.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
