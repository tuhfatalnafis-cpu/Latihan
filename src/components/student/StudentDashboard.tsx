import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  ChevronRight, 
  Flame, 
  Trophy, 
  Timer, 
  BrainCircuit,
  LayoutDashboard,
  LogOut,
  GraduationCap,
  CheckCircle,
  FolderOpen,
  ArrowRight,
  FileText,
  Loader2
} from 'lucide-react';
import { db } from '../../lib/db';
import { Subject, Syllabus, Topic } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import StudySession from './StudySession';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

type ViewState = 
  | { type: 'browse_subjects' }
  | { type: 'browse_syllabi', subject: Subject }
  | { type: 'browse_topics', subject: Subject, syllabus: Syllabus }
  | { type: 'study', topic: Topic, subject: Subject, syllabus: Syllabus };

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [view, setView] = useState<ViewState>({ type: 'browse_subjects' });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicStats, setTopicStats] = useState<Record<string, { total: number, mastered: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view.type === 'browse_subjects') {
        const data = await db.subjects.list();
        setSubjects(data);
      } else if (view.type === 'browse_syllabi') {
        const data = await db.syllabi.listForSubject(view.subject.id);
        setSyllabi(data);
      } else if (view.type === 'browse_topics') {
        const data = await db.topics.listForSyllabus(view.syllabus.id);
        setTopics(data);
        
        // Fetch stats for each topic
        const stats: Record<string, { total: number, mastered: number }> = {};
        for (const topic of data) {
          const s = await db.topics.getStats(topic.id, user.id);
          stats[topic.id] = s;
        }
        setTopicStats(stats);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    <header className="p-6 md:p-10 flex justify-between items-center bg-white border-b border-slate-100 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
           <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-slate-800 tracking-tight hidden sm:block">Cepat Belajar</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end mr-2">
          <p className="text-sm font-black text-slate-800">{user.name}</p>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mt-1">Pelajar</p>
        </div>
        <button 
          onClick={onLogout}
          className="p-3 bg-slate-50 text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );

  if (view.type === 'study') {
    return (
      <StudySession 
        user={user} 
        topic={view.topic} 
        onClose={() => setView({ type: 'browse_topics', subject: view.subject, syllabus: view.syllabus })} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans student-theme">
      {renderHeader()}

      <main className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full">
        <section className="mb-10">
          <div className="bg-indigo-600 rounded-[40px] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="relative z-10 max-w-xl">
               <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Selamat Datang, {user.name.split(' ')[0]}! 👋</h2>
               <p className="text-indigo-100 text-lg font-medium mb-8 leading-relaxed">
                 Sudah sedia untuk kuasai topik baru hari ini? Pilih subjek anda dan mulakan sesi hafalan pintar.
               </p>
               <div className="flex gap-4 flex-wrap">
                 <div className="px-5 py-3 bg-white/10 rounded-2xl backdrop-blur-md flex items-center gap-3">
                    <Flame className="w-5 h-5 text-orange-400" />
                    <span className="font-bold">3 Hari Streak</span>
                 </div>
                 <div className="px-5 py-3 bg-white/10 rounded-2xl backdrop-blur-md flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold">45 Soalan Tamat</span>
                 </div>
               </div>
            </div>
            
            {/* Shapes */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500 rounded-full blur-[80px] opacity-50"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-400 rounded-full blur-[80px] opacity-50"></div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">
              {view.type === 'browse_subjects' ? 'Pilih Subjek' : view.type === 'browse_syllabi' ? view.subject.name : view.syllabus.name}
            </h3>
            {view.type !== 'browse_subjects' && (
              <button 
                onClick={() => {
                  if (view.type === 'browse_syllabi') setView({ type: 'browse_subjects' });
                  else if (view.type === 'browse_topics') setView({ type: 'browse_syllabi', subject: view.subject });
                }}
                className="text-indigo-600 font-black text-sm flex items-center gap-2 hover:underline"
              >
                Kembali ke {view.type === 'browse_syllabi' ? 'Semua Subjek' : view.subject.name}
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
               <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
               <p className="font-bold">Mencari kandungan...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {view.type === 'browse_subjects' && subjects.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setView({ type: 'browse_syllabi', subject: s })}
                  className="bg-white p-8 rounded-[32px] border-2 border-transparent hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all group text-left flex flex-col items-start min-h-[220px]"
                >
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                     <BookOpen className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-1 leading-tight">{s.name}</h4>
                  <p className="text-slate-400 text-sm font-bold mt-auto flex items-center gap-2">
                    Lihat Kandungan <ArrowRight className="w-4 h-4" />
                  </p>
                </button>
              ))}

              {view.type === 'browse_syllabi' && syllabi.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => setView({ type: 'browse_topics', subject: view.subject, syllabus: s })}
                  className="bg-white p-8 rounded-[32px] border-2 border-transparent hover:border-amber-500 shadow-sm hover:shadow-xl transition-all group text-left flex flex-col items-start min-h-[220px]"
                >
                  <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                     <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-black text-slate-800 mb-1 leading-tight">{s.name}</h4>
                  <p className="text-slate-400 text-sm font-bold mt-auto">Peringkat Pembelajaran</p>
                </button>
              ))}

              {view.type === 'browse_topics' && topics.map(t => {
                const stats = topicStats[t.id] || { mastered: 0, total: 0 };
                const percentage = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;
                
                return (
                  <button 
                    key={t.id} 
                    onClick={() => setView({ type: 'study', topic: t, subject: view.subject, syllabus: view.syllabus })}
                    className="bg-white p-8 rounded-[32px] border-2 border-transparent hover:border-emerald-500 shadow-sm hover:shadow-xl transition-all group text-left flex flex-col items-start min-h-[260px] relative overflow-hidden"
                  >
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                       <BrainCircuit className="w-8 h-8" />
                    </div>
                    <div className="mb-4">
                      <h4 className="text-xl font-black text-slate-800 mb-1 leading-tight">{t.name}</h4>
                      <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stats.total} Perkataan</p>
                    </div>

                    <div className="w-full mt-auto space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mastery</span>
                        <span className="text-sm font-black text-emerald-600">{percentage}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full bg-emerald-500"
                        />
                      </div>
                      <p className="text-slate-400 text-[10px] font-bold mt-2 flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
                        Mula Belajar <ArrowRight className="w-3 h-3" />
                      </p>
                    </div>
                  </button>
                );
              })}

              {/* Empty State */}
              {((view.type === 'browse_subjects' && subjects.length === 0) ||
                (view.type === 'browse_syllabi' && syllabi.length === 0) ||
                (view.type === 'browse_topics' && topics.length === 0)) && !loading && (
                <div className="col-span-full py-20 bg-white border-4 border-dashed border-slate-100 rounded-[40px] flex flex-col items-center justify-center text-slate-300">
                   <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                   <p className="text-lg font-black italic">Tiada kandungan tersedia lagi.</p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
