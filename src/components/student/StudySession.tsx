import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Clock, 
  BrainCircuit, 
  Trophy,
  Loader2,
  ChevronRight,
  RotateCcw,
  LayoutDashboard,
  Sparkles
} from 'lucide-react';
import { db } from '../../lib/db';
import { sm2 } from '../../lib/srs';
import { Question, Topic, Attempt, Progress } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import { useSubjectSchema } from '../../hooks/useSubjectSchema';
import { getTermFontClass, isRTL } from '../../lib/subjectHelpers';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Mascot } from './Mascot';
import { STRINGS } from '../../lib/strings';

import FlashcardMode from './study/FlashcardMode';
import MCQMode from './study/MCQMode';
import MatchingMode from './study/MatchingMode';
import FillBlankMode from './study/FillBlankMode';
import TrueFalseMode from './study/TrueFalseMode';
import UnsupportedFormat from './study/UnsupportedFormat';

import { DEFAULT_SCHEMA } from '../../lib/subjectPresets';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

interface StudySessionProps {
  user: any;
  topic: Topic;
  setName?: string;
  onClose: () => void;
}

type SessionMode = 'srs' | 'browse';

export default function StudySession({ user, topic, setName, onClose }: StudySessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{questionId: string, isCorrect: boolean}[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<SessionMode>('browse');
  const [showSummary, setShowSummary] = useState(false);
  const { schema } = useSubjectSchema(topic.id);
  const [topicStats, setTopicStats] = useState<{ total: number, mastered: number, previousAccuracy: number, masteryPercentage?: number }>({ total: 0, mastered: 0, previousAccuracy: 0 });
  const [initialStats, setInitialStats] = useState<{ total: number, mastered: number, previousAccuracy: number, masteryPercentage?: number } | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isMastered, setIsMastered] = useState(false);
  const [savedSession, setSavedSession] = useState<any>(null);
  const [showResumePrompt, setShowResumePrompt] = useState(false);

  const sessionKey = useMemo(() => {
    return setName ? `${topic.id}:${setName}` : topic.id;
  }, [topic.id, setName]);

  useEffect(() => {
    checkSavedSession();
    fetchTopicStats(true);
  }, [topic.id, mode, setName]);

  const checkSavedSession = async () => {
    setLoading(true);
    try {
      const profile = await db.profiles.get(user.id);
      const activeSessions = profile.metadata?.active_sessions || {};
      const saved = activeSessions[sessionKey];
      
      if (saved && !showSummary) {
        setSavedSession(saved);
        setShowResumePrompt(true);
        setLoading(false);
      } else {
        fetchQuestions();
      }
    } catch (err) {
      console.error('Check saved session error:', err);
      fetchQuestions();
    }
  };

  const resumeSession = async () => {
    if (!savedSession) return;
    setLoading(true);
    setShowResumePrompt(false);
    try {
      const qData = await db.questions.listByIds(savedSession.question_ids);
      setQuestions(qData);
      setCurrentIndex(savedSession.current_index);
      setResults(savedSession.results || []);
      setSecondsElapsed(savedSession.seconds_elapsed || 0);
      setStartTime(Date.now());
      setLoading(false);
    } catch (err) {
      console.error('Resume error:', err);
      restartSession();
    }
  };

  const restartSession = () => {
    setShowResumePrompt(false);
    db.profiles.clearPartialSession(user.id, sessionKey).catch(console.error);
    fetchQuestions();
  };

  useEffect(() => {
    if (showSummary || loading || showResumePrompt) return;
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showSummary, loading, showResumePrompt]);

  const saveProgress = async (newIndex: number, newResults: any[], elapsed: number) => {
    if (showSummary || questions.length === 0) return;
    try {
      await db.profiles.savePartialSession(user.id, sessionKey, {
        current_index: newIndex,
        results: newResults,
        seconds_elapsed: elapsed,
        question_ids: questions.map(q => q.id),
        set_name: setName || 'Umum'
      });
    } catch (err) {
      console.error('Save progress error:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchTopicStats = async (isInitial = false) => {
    try {
      const stats = await db.topics.getStats(topic.id, user.id);
      setTopicStats(stats);
      if (isInitial) setInitialStats(stats);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    setIsMastered(false);
    try {
      if (mode === 'browse') {
        const data = await db.questions.listForTopic(topic.id);
        let filtered = data;
        if (setName) {
          filtered = data.filter(q => (q.metadata as any)?.set_name === setName);
        }
        setQuestions(shuffleArray(filtered));
      } else {
        const due = await db.progress.getDue(user.id);
        const filtered = due.filter((p: any) => p.questions.topic_id === topic.id).map((p: any) => p.questions);
        setQuestions(filtered);
      }
      setCurrentIndex(0);
      setResults([]);
      setShowSummary(false);
      setStartTime(Date.now());
      setSecondsElapsed(0);
      db.profiles.clearPartialSession(user.id, sessionKey).catch(console.error);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleNext = () => {
    setFeedback(null);
    setIsMastered(false);
    setIsFlipped(false);
    
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setStartTime(Date.now());
      saveProgress(nextIndex, results, secondsElapsed);
    } else {
      db.profiles.clearPartialSession(user.id, sessionKey).catch(console.error);
      fetchTopicStats();
      
      const score = results.filter(r => r.isCorrect).length;
      const accuracy = Math.round((score / (results.length || 1)) * 100);
      db.profiles.recordQuizResult(user.id, {
        topic_id: topic.id,
        set_name: setName || 'Umum',
        score,
        total: results.length,
        accuracy,
        timestamp: new Date().toISOString()
      }).catch(console.error);
      
      setShowSummary(true);
    }
  };

  const handleAnswer = async (isCorrect: boolean, bonusCount = 1) => {
    if (feedback) return;

    const timeSpent = Date.now() - startTime;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setIsMastered(false);

    // Track results (Matching might add multiple results if we wanted to be precise, but here we add one session entry)
    const newResults = [...results];
    for (let i = 0; i < bonusCount; i++) {
        newResults.push({ questionId: currentQuestion.id, isCorrect });
    }
    setResults(newResults);
    saveProgress(currentIndex, newResults, secondsElapsed);

    try {
      const [recordRes, existingProgress] = await Promise.all([
        db.attempts.record({
          student_id: user.id,
          question_id: currentQuestion.id,
          is_correct: isCorrect,
          response_time_ms: timeSpent
        }),
        db.progress.get(user.id, currentQuestion.id)
      ]);

      // SRS Ease Adjustment for True/False (easier than MCQs)
      const easeMultiplier = currentQuestion.question_type === 'true_false' ? 0.7 : 1;
      
      const srsResult = sm2(
        isCorrect, 
        existingProgress?.ease, 
        existingProgress?.interval_days, 
        existingProgress?.consecutive_correct
      );
      
      // Apply ease multiplier if correct
      if (isCorrect && currentQuestion.question_type === 'true_false' && existingProgress) {
          const originalEase = existingProgress.ease || 2.5;
          const predictedEase = srsResult.ease;
          const gain = predictedEase - originalEase;
          srsResult.ease = originalEase + (gain * easeMultiplier);
      }
      
      const updated = await db.progress.upsert({
        id: existingProgress?.id,
        student_id: user.id,
        question_id: currentQuestion.id,
        ...srsResult
      });

      if (isCorrect && updated.consecutive_correct === 3) {
        setIsMastered(true);
      }

      // Special case for matching and true_false: if correct, we can advance faster or show feedback
      // MCQ and Fill-blank usually show Seterusnya button via feedback state
      // MatchingMode already handles internal state and calls handleAnswer at end
    } catch (err) {
      console.error('Save result error:', err);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const commonProps = {
      question: currentQuestion,
      schema: schema || DEFAULT_SCHEMA,
      onAnswer: handleAnswer
    };

    switch (currentQuestion.question_type) {
      case 'flashcard':
        return <FlashcardMode {...commonProps} isFlipped={isFlipped} onFlip={setIsFlipped} />;
      case 'multiple_choice':
        return <MCQMode {...commonProps} feedback={feedback} />;
      case 'matching':
        return <MatchingMode {...commonProps} />;
      case 'fill_blank':
        return <FillBlankMode {...commonProps} />;
      case 'true_false':
        return <TrueFalseMode {...commonProps} />;
      default:
        return <UnsupportedFormat type={currentQuestion.question_type} onSkip={handleNext} />;
    }
  };

  const renderSummary = () => {
    const score = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((score / (results.length || 1)) * 100);
    const masteryPercentage = topicStats.masteryPercentage ?? (topicStats.total > 0 ? Math.round((topicStats.mastered / topicStats.total) * 100) : 0);
    
    // Compare current session accuracy vs previous data
    const prevAcc = initialStats?.previousAccuracy ?? 0;
    const trend = accuracy - prevAcc;
    const isImproved = trend >= 0;
    // Show trend if we have previous data OR if it's the first time and accuracy is significant
    const showTrend = results.length > 0 && (prevAcc > 0 ? Math.abs(trend) > 0.1 : accuracy > 0);

    return (
      <Card className="max-w-md w-full bg-white text-center animate-in zoom-in duration-500 overflow-visible" padding="lg">
        <div className="relative mb-14">
           {/* Mascot Result */}
           <div className="absolute -top-24 left-1/2 -translate-x-1/2 z-0">
              <Mascot gender={user.gender} className="size-44" animate="pulse" />
           </div>
           <div className="w-20 h-20 bg-accent-warm/10 text-accent-warm rounded-[2rem] flex items-center justify-center mx-auto relative z-10 shadow-soft-lg border-4 border-white bg-white">
              <Trophy className="w-10 h-10" />
           </div>
        </div>
        <h2 className="text-4xl font-black text-ink mb-2">Sesi Tamat!</h2>
        <p className="text-ink-muted font-bold mb-10 italic">Hebat! Anda telah menyelesaikan sesi hafal hari ini.</p>

        <div className="grid grid-cols-2 gap-4 mb-6">
           <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
              <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1">Masa</p>
              <p className="text-3xl font-black text-primary tabular-nums">{formatTime(secondsElapsed)}</p>
           </div>
           <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden">
              <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest mb-1">Akurasi</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-3xl font-black text-primary">{accuracy}%</p>
                {showTrend && (
                  <div className={cn(
                    "flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-lg",
                    isImproved ? "bg-accent-mint/20 text-emerald-600" : "bg-rose-100 text-rose-500"
                  )}>
                    {isImproved ? '↑' : '↓'} {Math.round(Math.abs(trend))}%
                  </div>
                )}
              </div>
           </div>
        </div>

        <div className="bg-accent-mint/10 p-6 rounded-[2rem] border border-accent-mint/20 mb-10">
           <div className="flex justify-between items-center mb-4">
             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Masteri Topik</p>
             <p className="text-xl font-black text-emerald-700">{masteryPercentage}%</p>
           </div>
           <div className="w-full h-4 bg-white rounded-full overflow-hidden p-0.5 border border-accent-mint/20">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${masteryPercentage}%` }}
               className="h-full bg-accent-mint rounded-full shadow-sm"
             />
           </div>
           <p className="text-[10px] text-emerald-600 font-extrabold mt-4">
              {topicStats.mastered} daripada {topicStats.total} perkataan dikuasai
           </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button 
            size="lg"
            className="w-full shadow-soft-lg"
            onClick={fetchQuestions}
          >
             <RotateCcw className="w-5 h-5 mr-3" /> Cuba Lagi
          </Button>
          <Button 
            variant="ghost"
            size="lg"
            className="w-full"
            onClick={onClose}
          >
             Tamat & Kembali
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="fixed inset-0 bg-bg-cream z-50 flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 md:px-12 shrink-0 sticky top-0 z-10">
         <div className="flex items-center gap-5">
           <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90">
              <X className="w-6 h-6 text-ink-muted" />
           </button>
           <div className="hidden sm:block">
             <h3 className="font-extrabold text-ink leading-tight">{topic.name}</h3>
             {!showSummary && <p className="text-[10px] font-black text-ink-muted uppercase tracking-widest">{currentIndex + 1} / {questions.length} Perkataan</p>}
           </div>
         </div>
 
          <div className="flex-1 max-w-[240px] mx-6">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / (questions.length || 1)) * 100}%` }}
                className="h-full bg-primary"
              />
            </div>
          </div>
 
          <div className="flex items-center gap-3">
             {!showSummary && !loading && !showResumePrompt && (
               <button 
                 onClick={restartSession}
                 className="p-3 bg-white border border-slate-100 text-ink-muted hover:text-primary rounded-2xl transition-all flex items-center gap-2 text-xs font-black uppercase tracking-wider"
                 title="Restart session"
               >
                 <RotateCcw className="w-4 h-4" />
                 <span className="hidden sm:inline">Retry</span>
               </button>
             )}
             <div className="px-4 py-2.5 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-2 shrink-0">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-primary font-black tabular-nums">{formatTime(secondsElapsed)}</span>
             </div>
          </div>
      </header>
 
      {/* Main Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 relative flex items-start justify-center">
        <div className="w-full max-w-5xl flex flex-col items-center justify-start pt-4 sm:pt-10">
          {loading ? (
            <div className="flex flex-col items-center gap-6 text-ink-muted pt-20 animate-in fade-in zoom-in">
              <div className="w-24 h-24 bg-white rounded-3xl shadow-soft flex items-center justify-center animate-pulse overflow-hidden">
                <Mascot gender={user.gender} className="size-20" />
              </div>
              <p className="font-black text-lg">Membuka lembaran baru...</p>
            </div>
          ) : showResumePrompt ? (
            <div className="flex flex-col items-center justify-center max-w-md w-full animate-in zoom-in duration-300">
              <Card className="w-full text-center p-10 bg-white shadow-soft-lg rounded-[3rem]" padding="lg">
                <div className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                  <BrainCircuit className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-black text-ink mb-2">Sesi Belum Tamat!</h2>
                <p className="text-ink-muted font-bold mb-10">
                  Anda mempunyai sesi yang belum tamat untuk topik ini. Ingin sambung dari mana anda berhenti?
                </p>
                <div className="flex flex-col gap-4">
                  <Button size="lg" className="w-full shadow-soft" onClick={resumeSession}>
                    <ArrowRight className="w-5 h-5 mr-3" /> Sambung Sesi
                  </Button>
                  <Button size="lg" variant="ghost" className="w-full" onClick={restartSession}>
                    <RotateCcw className="w-5 h-5 mr-3" /> Mula Baru
                  </Button>
                </div>
              </Card>
            </div>
          ) : showSummary ? (
            renderSummary()
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-8 animate-in fade-in slide-in-from-bottom-8">
              <Mascot gender={user.gender} className="size-48 mb-6" />
              <h3 className="text-3xl font-black text-ink mb-3">Tiada soalan tersedia!</h3>
              <p className="text-ink-muted font-bold max-w-sm">
                Kandungan untuk topik ini sedang disediakan atau anda telah menyelesaikan sesi hari ini.
              </p>
              <Button variant="ghost" className="mt-8 font-black text-primary px-8" onClick={onClose}>
                <ChevronRight className="w-5 h-5 rotate-180 mr-2" /> Kembali ke Dashboard
              </Button>
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-col items-center justify-start animate-in slide-in-from-bottom-8 duration-500">
               {renderQuestion()}
            </div>
          )}
        </div>

        {/* Action Button for MCQs and after Feedback */}
        <AnimatePresence>
          {feedback && !showSummary && !loading && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs px-6"
            >
              <Button 
                size="xl"
                className="w-full shadow-soft-lg shadow-primary/20 group"
                onClick={handleNext}
              >
                Seterusnya <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Feedback Overlay */}
        <AnimatePresence>
          {(feedback || isMastered) && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center pointer-events-none",
                isMastered ? "bg-accent-warm/10" : 
                feedback === 'correct' ? "bg-accent-mint/10" : "bg-rose-500/10"
              )}
            >
              {isMastered ? (
                <div className="p-10 bg-white rounded-[3rem] shadow-soft-lg flex items-center gap-6 border-4 border-accent-warm relative">
                  <div className="w-20 h-20 bg-accent-warm rounded-3xl flex items-center justify-center text-white">
                    <Trophy className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-ink tracking-tight">Dikuasai!</h2>
                    <p className="text-ink-muted font-black uppercase text-[10px] tracking-widest mt-1">Mastery Tercapai 🏆</p>
                  </div>
                  <Sparkles className="absolute -top-4 -right-4 w-12 h-12 text-accent-warm animate-pulse" />
                </div>
              ) : feedback === 'correct' ? (
                <div className="p-10 bg-white rounded-[3rem] shadow-soft-lg flex items-center gap-6">
                  <div className="w-20 h-20 bg-accent-mint rounded-3xl flex items-center justify-center text-emerald-900">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-ink">Betul!</h2>
                    <p className="text-ink-muted font-bold">Syabas, teruskan!</p>
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-white rounded-[3rem] shadow-soft-lg flex items-center gap-6">
                  <div className="w-20 h-20 bg-rose-500 rounded-3xl flex items-center justify-center text-white">
                    <XCircle className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-black text-ink">Salah</h2>
                    <p className="text-ink-muted font-bold">Tak apa, cuba lagi!</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Instruction (Mobile only) */}
      {!showSummary && !loading && (
        <div className="p-6 bg-white shrink-0 text-center sm:hidden border-t border-slate-50">
           {!feedback && (
             <p className="text-[10px] font-black text-ink-muted uppercase tracking-[0.2em]">
               Pilih jawapan yang betul
             </p>
           )}
        </div>
      )}
    </div>
  );
}
