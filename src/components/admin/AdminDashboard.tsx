import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db } from '../../lib/db';
import { 
  Users, 
  Settings, 
  Database, 
  BarChart3, 
  LogOut,
  LayoutDashboard,
  BookOpen,
  PieChart,
  UserCircle,
  TrendingUp,
  Award,
  BookMarked,
  Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { User } from '../../types';
import ContentManager from './ContentManager';
import StudentManager from './StudentManager';
import AppInfoSettings from './AppInfoSettings';
import { AdminLayout } from '../../layouts/AdminLayout';
import { Card } from '../ui/Card';
import { StatCard } from '../ui/StatCard';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
}

type AdminTab = 'dashboard' | 'content' | 'students' | 'settings';

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [globalStats, setGlobalStats] = useState<{
    totalStudents: number,
    totalVocabulary: number,
    sessionsToday: number,
    successRate: number,
    recentSignups: any[],
    chartData: { day: string, count: number }[]
  } | null>(null);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchGlobalStats();
    }
  }, [activeTab]);

  const fetchGlobalStats = async () => {
    try {
      const stats = await db.admin.getGlobalStats();
      setGlobalStats(stats as any);
    } catch (err) {
      console.error(err);
    }
  };

  const getPageTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'Ringkasan Eksekutif';
      case 'content': return 'Dashboard Kandungan';
      case 'students': return 'Pengurusan Pelajar';
      case 'settings': return 'Tetapan Sistem';
      default: return 'Pentadbiran';
    }
  };

  const renderDashboardOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Jumlah Pelajar" value={globalStats?.totalStudents || 0} icon={Users} variant="primary" />
        <StatCard label="Kosa Kata Aktif" value={globalStats?.totalVocabulary || 0} icon={BookMarked} variant="mint" />
        <StatCard label="Pelajar Hari Ini" value={globalStats?.sessionsToday || 0} icon={Activity} variant="warm" />
        <StatCard label="Kadar Kejayaan" value={`${globalStats?.successRate || 0}%`} icon={Award} variant="lilac" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
           <div className="flex items-center justify-between mb-8">
             <div>
               <h3 className="text-xl font-black text-ink">Aktiviti Pembelajaran</h3>
               <p className="text-sm font-bold text-ink-muted">Statistik penggunaan 7 hari terakhir</p>
             </div>
             <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-primary rounded-full" />
                  <span className="text-xs font-bold text-ink-muted">Minggu Ini</span>
                </div>
             </div>
           </div>
           <div className="h-64 flex items-end gap-2 px-4 pb-4">
              {globalStats?.chartData.map((d, i) => {
                const max = Math.max(...globalStats.chartData.map(c => c.count), 1);
                const height = (d.count / max) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-3 group relative">
                    <div className="w-full bg-slate-50 rounded-t-xl relative h-full flex items-end overflow-hidden">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        className="w-full bg-primary/20 group-hover:bg-primary/40 transition-colors"
                      />
                    </div>
                    <span className="text-[10px] font-black text-ink-muted uppercase">
                      {new Date(d.day).toLocaleDateString('ms-MY', { weekday: 'short' })}
                    </span>
                    <div className="absolute top-0 -translate-y-8 bg-ink text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {d.count} Percubaan
                    </div>
                  </div>
                );
              })}
              {(!globalStats || globalStats.chartData.length === 0) && (
                <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl">
                   <p className="text-xs font-black text-ink-muted uppercase tracking-widest">Tiada data aktiviti lagi</p>
                </div>
              )}
           </div>
        </Card>

        <Card>
          <h3 className="text-xl font-black text-ink mb-6">Pendaftaran Terbaru</h3>
          <div className="space-y-6">
            {globalStats?.recentSignups.map((s, i) => (
              <div key={s.id} className="flex gap-4 group cursor-default">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex-shrink-0 flex items-center justify-center text-primary font-black group-hover:scale-110 transition-transform">
                   {s.full_name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                   <p className="text-sm font-black text-ink leading-none truncate">{s.full_name || 'Pelajar Baru'}</p>
                   <p className="text-[10px] font-bold text-ink-muted mt-1 truncate">{s.email}</p>
                   <p className="text-[10px] font-black text-primary uppercase mt-2">
                     {new Date(s.created_at).toLocaleDateString('ms-MY', { day: 'numeric', month: 'short' })}
                   </p>
                </div>
              </div>
            ))}
            {globalStats?.recentSignups.length === 0 && (
              <p className="text-xs font-bold text-ink-muted text-center py-10 opacity-50">Tiada pendaftaran baru</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <AdminLayout 
      user={user} 
      activeTab={activeTab} 
      onTabChange={(tab) => setActiveTab(tab as AdminTab)}
      onLogout={onLogout}
      title={getPageTitle()}
    >
      <div className="space-y-6">
        {activeTab === 'dashboard' && renderDashboardOverview()}
        {activeTab === 'content' && <ContentManager user={user} />}
        {activeTab === 'students' && <StudentManager />}
        {activeTab === 'settings' && (
          <div className="max-w-4xl mx-auto py-8 space-y-8">
            <AppInfoSettings />
            
            <Card className="p-8 text-center flex flex-col items-center bg-slate-50/50 border-2 border-slate-50">
               <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-soft">
                 <Settings className="w-8 h-8 text-primary animate-spin-slow" />
               </div>
               <h3 className="text-2xl font-black text-ink">Informasi Sistem</h3>
               <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 text-left">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Versi Sistem</p>
                    <p className="text-sm font-black text-ink">v2.0.4-beta</p>
                  </div>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 text-left">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Status Server</p>
                    <p className="text-sm font-black text-ink">Stabil</p>
                  </div>
                  <div className="col-span-2 p-4 bg-white rounded-2xl border border-slate-100 text-left">
                    <p className="text-[10px] font-black text-accent-lilac uppercase tracking-widest mb-2">Pasukan Pembangun</p>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-ink">1. Dr Asyraf Saharudin</p>
                      <p className="text-sm font-black text-ink">2. Dr Atikah</p>
                    </div>
                  </div>
               </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
