import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Loader2,
  Bell,
  Clock,
  Target,
  BarChart2,
  Sparkles
} from 'lucide-react';
import { db } from '../../lib/db';
import { Subject, Syllabus, Topic } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import StudySession from './StudySession';
import { StudentLayout } from '../../layouts/StudentLayout';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatCard } from '../ui/StatCard';
import { STRINGS } from '../../lib/strings';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
}

type TabState = 'dashboard' | 'subjects' | 'progress' | 'profile';

type ViewState = 
  | { type: 'browse_subjects' }
  | { type: 'browse_syllabi', subject: Subject }
  | { type: 'browse_topics', subject: Subject, syllabus: Syllabus }
  | { type: 'browse_sets', subject: Subject, syllabus: Syllabus, topic: Topic, sets: string[] }
  | { type: 'study', topic: Topic, subject: Subject, syllabus: Syllabus, setName?: string };

export default function StudentDashboard({ user, onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabState>('dashboard');
  const [view, setView] = useState<ViewState>({ type: 'browse_subjects' });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicStats, setTopicStats] = useState<Record<string, { total: number, mastered: number, attempted: number, accuracy: number, masteryPercentage: number }>>({});
  const [dashboardStats, setDashboardStats] = useState<{ 
    streak: number, 
    totalQuestions: number,
    totalCorrect: number,
    totalAttempts: number,
    accuracy: number,
    totalTimeMs: number,
    totalMastered: number
  }>({ streak: 0, totalQuestions: 0, totalCorrect: 0, totalAttempts: 0, accuracy: 0, totalTimeMs: 0, totalMastered: 0 });
  const [loading, setLoading] = useState(true);

  const [subjectMastery, setSubjectMastery] = useState<Record<string, { percentage: number, accuracy: number, total: number, mastered: number, attempted: number }>>({});

  useEffect(() => {
    const init = async () => {
      await fetchData();
      fetchDashboardStats();
    };
    init();
  }, [view, activeTab]);

  useEffect(() => {
    if (activeTab === 'progress' && subjects.length > 0) {
      fetchSubjectMastery();
    }
  }, [activeTab, subjects]);

  const fetchSubjectMastery = async () => {
    try {
      const mastery: Record<string, { percentage: number, total: number, mastered: number, attempted: number }> = {};
      
      const subjectStatsPromises = subjects.map(async (subject) => {
        // Find topics for this subject
        const subjectSyllabi = await db.syllabi.listForSubject(subject.id);
        
        // Parallelize fetching topics for all syllabi
        const allTopicsResults = await Promise.all(
          subjectSyllabi.map(s => db.topics.listForSyllabus(s.id))
        );
        const subjectTopicIds = allTopicsResults.flat().map(t => t.id);

        if (subjectTopicIds.length === 0) {
          return { id: subject.id, stats: { percentage: 0, total: 0, mastered: 0, attempted: 0 } };
        }

        // Parallelize fetching stats for all topics
        const topicStats = await Promise.all(
          subjectTopicIds.map(topicId => db.topics.getStats(topicId, user.id))
        );

        let total = 0;
        let mastered = 0;
        let attempted = 0;
        let accuracySum = 0;
        let percentageSum = 0;
        let topicsWithQuestions = 0;
        let topicsWithAttempts = 0;
        
        for (const s of topicStats) {
          total += s.total;
          mastered += s.mastered;
          attempted += (s as any).attempted || 0;
          if (s.total > 0) {
            percentageSum += (s as any).masteryPercentage || 0;
            topicsWithQuestions++;
          }
          if ((s as any).attempted > 0) {
            accuracySum += (s as any).accuracy || 0;
            topicsWithAttempts++;
          }
        }

        return { 
          id: subject.id, 
          stats: { 
            percentage: topicsWithQuestions > 0 ? Math.round(percentageSum / topicsWithQuestions) : 0,
            accuracy: topicsWithAttempts > 0 ? Math.round(accuracySum / topicsWithAttempts) : 0,
            total,
            mastered,
            attempted
          } 
        };
      });

      const results = await Promise.all(subjectStatsPromises);
      const masteryMap: Record<string, any> = {};
      results.forEach(res => {
        masteryMap[res.id] = res.stats;
      });
      
      setSubjectMastery(masteryMap);
    } catch (err) {
      console.error('Error fetching subject mastery:', err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const stats = await db.profiles.getDashboardStats(user.id);
      setDashboardStats(stats as any);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}j ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const fetchData = async () => {
    if (activeTab !== 'subjects' && activeTab !== 'dashboard' && activeTab !== 'progress') return;
    
    setLoading(true);
    try {
      if (view.type === 'browse_subjects' || activeTab === 'progress') {
        const data = await db.subjects.list();
        setSubjects(data);
      }
      
      if (view.type === 'browse_syllabi') {
        const data = await db.syllabi.listForSubject(view.subject.id);
        setSyllabi(data);
      } else if (view.type === 'browse_topics') {
        const data = await db.topics.listForSyllabus(view.syllabus.id);
        setTopics(data);
        
        // Parallelize topic stats fetching
        const stats: Record<string, { total: number, mastered: number, attempted: number, accuracy: number, masteryPercentage: number }> = {};
        const topicStatsPromises = data.map(async (topic) => {
          const s = await db.topics.getStats(topic.id, user.id);
          return { id: topic.id, stats: s as any };
        });
        
        const results = await Promise.all(topicStatsPromises);
        results.forEach(res => {
          stats[res.id] = res.stats;
        });
        
        setTopicStats(stats);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Card */}
      <Card variant="primary" className="relative group overflow-hidden border-none" padding="lg">
        <div className="relative z-10 space-y-4 max-w-[80%]">
          <h2 className="text-3xl font-black leading-tight sm:text-4xl text-white">
            {STRINGS.student.greeting} {user.name.split(' ')[0]}! 👋
          </h2>
          <p className="text-white/80 font-bold leading-relaxed text-sm">
            Mana satu kita nak kuasai hari ini? Mari sambung belajar!
          </p>
          <div className="pt-2">
            <Button 
              variant="secondary" 
              onClick={() => setActiveTab('subjects')}
              className="text-primary font-black rounded-2xl h-12 shadow-soft hover:shadow-soft-lg"
            >
              Mula Belajar <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="absolute right-[-20px] bottom-[-20px] w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
        <div className="absolute top-1/2 right-4 -translate-y-1/2 select-none opacity-20 rotate-12 group-hover:rotate-0 transition-all duration-500">
           <GraduationCap className="w-32 h-32 text-white" />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          label={STRINGS.student.streak_info} 
          value={dashboardStats.streak} 
          icon={Flame} 
          variant="warm" 
        />
        <StatCard 
          label="Akurasi Keseluruhan" 
          value={`${dashboardStats.accuracy}%`} 
          icon={Target} 
          variant="lilac" 
        />
        <StatCard 
          label={STRINGS.student.questions_done} 
          value={dashboardStats.totalQuestions} 
          icon={CheckCircle} 
          variant="mint" 
        />
        <StatCard 
          label="Selesai Masteri" 
          value={dashboardStats.totalMastered} 
          icon={Trophy} 
          variant="primary" 
        />
      </div>

      {/* Recommended Topics */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-ink tracking-tight">Pelan Belajar</h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveTab('subjects')} className="text-primary font-black">Semua</Button>
        </div>
        
        <div className="space-y-4">
          {subjects.slice(0, 3).map((subject, idx) => {
            const variants = ['mint', 'warm', 'lilac'] as const;
            return (
              <Card 
                key={subject.id} 
                variant="white"
                className="flex items-center justify-between group cursor-pointer border-2 border-slate-50 hover:border-primary/20"
                onClick={() => {
                  setActiveTab('subjects');
                  setView({ type: 'browse_syllabi', subject });
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center text-ink text-2xl shadow-soft transition-transform group-hover:scale-110",
                    idx === 0 ? "bg-accent-mint/10" : idx === 1 ? "bg-accent-warm/10" : "bg-accent-lilac/10"
                  )}>
                     {subject.name.includes('Arab') ? '🇸🇦' : '📚'}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-ink leading-tight">{subject.name}</h4>
                    <p className="text-ink-muted text-[10px] font-black uppercase tracking-widest mt-1">Tekan untuk mula</p>
                  </div>
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-ink-muted group-hover:bg-primary group-hover:text-white transition-all">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );

  const handleTopicClick = async (topic: Topic) => {
    try {
      const questions = await db.questions.listForTopic(topic.id);
      const uniqueSets = Array.from(new Set(questions.map(q => (q.metadata as any)?.set_name || 'Tanpa Nama Set')));
      
      if (uniqueSets.length > 1) {
        setView({ 
          type: 'browse_sets', 
          subject: (view as any).subject, 
          syllabus: (view as any).syllabus, 
          topic, 
          sets: uniqueSets 
        });
      } else {
        setView({ 
          type: 'study', 
          topic, 
          subject: (view as any).subject, 
          syllabus: (view as any).syllabus,
          setName: uniqueSets[0] === 'Tanpa Nama Set' ? undefined : uniqueSets[0]
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderSets = () => {
    if (view.type !== 'browse_sets') return null;
    const { topic, sets } = view;
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-ink tracking-tight">Pilih Set Latihan</h3>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setView({ type: 'browse_topics', subject: view.subject, syllabus: view.syllabus })}
            className="text-ink-muted font-bold"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Kembali
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {sets.map((setName, idx) => (
            <Card 
              key={setName}
              variant="white"
              className="flex items-center justify-between group cursor-pointer border-2 border-slate-50 hover:border-primary/20"
              onClick={() => setView({ 
                type: 'study', 
                topic, 
                subject: view.subject, 
                syllabus: view.syllabus,
                setName: setName === 'Tanpa Nama Set' ? undefined : setName
              })}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-soft">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-extrabold text-lg text-ink leading-tight">{setName}</h4>
                  <p className="text-xs font-bold text-ink-muted mt-1 uppercase tracking-widest">Sesi Hafalan {idx + 1}</p>
                </div>
              </div>
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-ink-muted group-hover:bg-primary group-hover:text-white transition-all">
                <ArrowRight className="w-5 h-5" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderSubjects = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black text-ink tracking-tight">
          {view.type === 'browse_subjects' ? 'Pilih Subjek' : view.type === 'browse_syllabi' ? view.subject.name : view.type === 'browse_topics' ? view.syllabus.name : 'Pilih Set'}
        </h3>
        {view.type !== 'browse_subjects' && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              if (view.type === 'browse_syllabi') setView({ type: 'browse_subjects' });
              else if (view.type === 'browse_topics') setView({ type: 'browse_syllabi', subject: (view as any).subject });
              else if (view.type === 'browse_sets') setView({ type: 'browse_topics', subject: view.subject, syllabus: view.syllabus });
            }}
            className="text-ink-muted font-bold"
          >
            <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> Kembali
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-ink-muted animate-pulse">
           <Loader2 className="w-12 h-12 animate-spin mb-6 text-primary" />
           <p className="font-black tracking-widest uppercase text-xs">Mencari kandungan terbaik...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-20">
          {view.type === 'browse_subjects' && subjects.map((s, idx) => {
            const variants = ['mint', 'warm', 'lilac', 'primary'] as const;
            return (
              <Card 
                key={s.id} 
                variant="white"
                className="flex flex-col items-start min-h-[160px] cursor-pointer group active:scale-95 border-2 border-slate-50 hover:border-primary/20"
                onClick={() => setView({ type: 'browse_syllabi', subject: s })}
              >
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-auto group-hover:scale-110 group-hover:-rotate-6 transition-transform shadow-soft",
                  idx % 4 === 0 ? "bg-accent-mint/10" : idx % 4 === 1 ? "bg-accent-warm/10" : idx % 4 === 2 ? "bg-accent-lilac/10" : "bg-primary/10"
                )}>
                   {s.name.includes('Arab') ? '🇸🇦' : '📚'}
                </div>
                <h4 className="text-xl font-black text-ink leading-tight mt-4">{s.name}</h4>
                <p className="text-xs font-bold text-ink-muted mt-1 uppercase tracking-widest">Terokai subjek</p>
              </Card>
            );
          })}

          {view.type === 'browse_syllabi' && syllabi.map(s => (
            <Card 
              key={s.id} 
              variant="white"
              className="flex flex-col items-start min-h-[160px] cursor-pointer group active:scale-95 border-2 border-slate-50 hover:border-primary/20"
              onClick={() => setView({ type: 'browse_topics', subject: (view as any).subject, syllabus: s })}
            >
              <div className="w-14 h-14 bg-accent-warm/10 text-accent-warm rounded-2xl flex items-center justify-center mb-auto group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-soft">
                 <FileText className="w-7 h-7" />
              </div>
              <h4 className="text-xl font-black text-ink leading-tight mt-4">{s.name}</h4>
            </Card>
          ))}

          {view.type === 'browse_topics' && topics.map(t => {
            const stats = topicStats[t.id] || { mastered: 0, total: 0, attempted: 0, accuracy: 0, masteryPercentage: 0 };
            const percentage = stats.masteryPercentage;
            const attemptedPercentage = stats.total > 0 ? Math.round((stats.attempted / stats.total) * 100) : 0;
            
            return (
              <Card 
                key={t.id} 
                variant="white"
                className="col-span-full cursor-pointer group active:scale-95 border-2 border-slate-50 hover:border-primary/20"
                onClick={() => handleTopicClick(t)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 bg-accent-mint/10 text-accent-mint rounded-[1.2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-soft">
                     <BrainCircuit className="w-7 h-7" />
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Akurasi</p>
                      <p className="text-xl font-black text-primary">{stats.accuracy}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest">Masteri</p>
                      <p className="text-xl font-black text-emerald-600">{percentage}%</p>
                    </div>
                  </div>
                </div>
                <h4 className="text-2xl font-black text-ink mb-6 leading-tight tracking-tight">{t.name}</h4>
                <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 relative">
                  {/* Attempted */}
                  <div 
                    className="absolute inset-x-0 h-full bg-accent-mint/20"
                    style={{ width: `${attemptedPercentage}%` }}
                  />
                  {/* Mastered */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-accent-mint shadow-soft-sm relative z-10"
                  />
                </div>
              </Card>
            );
          })}

          {view.type === 'browse_sets' && renderSets()}
        </div>
      )}
    </div>
  );

  const renderProgress = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <h3 className="text-2xl font-black text-ink tracking-tight">Kemajuan Saya</h3>
      
      <Card variant="lilac" className="relative overflow-hidden border-none" padding="lg">
        <div className="flex flex-col items-center text-center gap-6 relative z-10">
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-5xl shadow-soft-xl animate-bounce-slow">
            🏆
          </div>
          <div>
            <h4 className="text-2xl font-black text-ink leading-tight">Bintang Cepat Belajar!</h4>
            <p className="text-ink-muted font-bold mt-2">Setiap soalan yang betul membawa anda lebih jauh.</p>
          </div>
        </div>
        <div className="absolute top-[-10px] left-[-10px] opacity-20">
          <Sparkles className="w-16 h-16 text-white" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Masa Belajar" value={formatTime(dashboardStats.totalTimeMs)} icon={Clock} variant="mint" />
        <StatCard label="Akurasi" value={`${dashboardStats.accuracy}%`} icon={Target} variant="lilac" />
        <StatCard label="Selesai Masteri" value={dashboardStats.totalMastered} icon={Trophy} variant="warm" />
        <StatCard label="Soalan Dijawab" value={dashboardStats.totalAttempts} icon={CheckCircle} variant="primary" />
      </div>

      <Card className="border-2 border-slate-50">
        <h4 className="font-black text-ink mb-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <BarChart2 className="w-5 h-5" />
          </div>
          Penguasaan Subjek
        </h4>
        <div className="space-y-8">
          {subjects.map(s => {
            const stats = (subjectMastery[s.id] as any) || { percentage: 0, accuracy: 0, total: 0, mastered: 0, attempted: 0 };
            return (
              <div key={s.id} className="space-y-3">
                <div className="flex justify-between text-sm items-center">
                  <div>
                    <span className="font-black text-ink text-lg block">{s.name}</span>
                    <span className="text-[10px] font-black text-ink-muted uppercase tracking-wider">
                      {stats.mastered} dikuasai • {stats.attempted} dicuba • {stats.accuracy}% akurasi
                    </span>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black text-primary uppercase block mb-1">Masteri</span>
                     <span className="font-black text-primary bg-primary/5 px-3 py-1 rounded-full">{stats.percentage}%</span>
                  </div>
                </div>
                <div className="w-full h-3 bg-slate-50 rounded-full border border-slate-100 overflow-hidden relative">
                  {/* Attempted progress (lighter) */}
                  <div 
                    className="absolute inset-x-0 h-full bg-primary/20"
                    style={{ width: `${stats.total > 0 ? (stats.attempted / stats.total) * 100 : 0}%` }}
                  />
                  {/* Mastered progress (darker) */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.percentage}%` }}
                    className="h-full bg-primary shadow-soft-sm relative z-10" 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col items-center gap-6 mt-10">
        <div className="relative group">
          <div className="w-28 h-28 bg-primary/10 text-primary text-5xl font-black rounded-[2.5rem] flex items-center justify-center shadow-soft-lg border-4 border-white">
            {user.name[0]}
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent-warm text-white rounded-2xl flex items-center justify-center shadow-soft ring-4 ring-bg-cream transition-transform group-hover:rotate-12">
            <Sparkles className="w-5 h-5 fill-current" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-3xl font-black text-ink tracking-tight">{user.name}</h3>
          <p className="text-ink-muted font-bold mt-1">{user.email}</p>
        </div>
      </div>

      <div className="space-y-4 pt-6">
        <Card padding="md" className="flex items-center justify-between border-2 border-slate-50 group hover:border-primary/20 cursor-pointer">
           <div className="flex items-center gap-5">
             <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-ink-muted group-hover:bg-primary group-hover:text-white transition-all">
               <Bell className="w-6 h-6" />
             </div>
             <span className="font-black text-lg text-ink">Notifikasi</span>
           </div>
           <ChevronRight className="w-6 h-6 text-slate-200" />
        </Card>

        <Card padding="md" className="flex items-center justify-between border-2 border-slate-50 group hover:border-rose-100 cursor-pointer" onClick={onLogout}>
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-all">
              <LogOut className="w-6 h-6" />
            </div>
            <span className="font-black text-lg text-rose-500">Log Keluar</span>
          </div>
          <ChevronRight className="w-6 h-6 text-rose-200" />
        </Card>
      </div>
      
      <p className="text-center text-[10px] font-black text-ink-muted uppercase tracking-[0.3em] pt-10">Cepat Belajar v2.0</p>
    </div>
  );

  if (view.type === 'study') {
    return (
      <StudySession 
        user={user} 
        topic={view.topic} 
        setName={view.setName}
        onClose={() => setView({ type: 'browse_topics', subject: (view as any).subject, syllabus: (view as any).syllabus })} 
      />
    );
  }

  return (
    <StudentLayout activeTab={activeTab} onTabChange={(tab) => {
      setActiveTab(tab as TabState);
      if (tab === 'subjects') setView({ type: 'browse_subjects' });
    }}>
      <header className="px-6 py-8 flex justify-between items-center">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Cepat Belajar</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-xs font-black text-ink">Sesi Pintar Aktif</span>
          </div>
        </div>
        <button className="w-14 h-14 bg-white/80 backdrop-blur rounded-[1.2rem] shadow-soft relative active:scale-90 transition-all flex items-center justify-center border-2 border-white">
          <Bell className="w-6 h-6 text-ink-muted" />
          <div className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-soft" />
        </button>
      </header>

      <main className="px-6 md:px-10 max-w-lg mx-auto w-full">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'subjects' && renderSubjects()}
        {activeTab === 'progress' && renderProgress()}
        {activeTab === 'profile' && renderProfile()}
      </main>
    </StudentLayout>
  );
}
