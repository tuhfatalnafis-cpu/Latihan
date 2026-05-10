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
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { STRINGS } from '../../lib/strings';

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

interface StudySessionProps {
  user: User;
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
  const [topicStats, setTopicStats] = useState<{ total: number, mastered: number, previousAccuracy: number }>({ total: 0, mastered: 0, previousAccuracy: 0 });
  const [isFlipped, setIsFlipped] = useState(false); // For flashcards
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isMastered, setIsMastered] = useState(false); // New mastery spark

  useEffect(() => {
    fetchQuestions();
    fetchTopicStats();
  }, [topic.id, mode]);

  useEffect(() => {
    if (showSummary || loading) return;
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [showSummary, loading]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchTopicStats = async () => {
    try {
      const stats = await db.topics.getStats(topic.id, user.id);
      setTopicStats(stats);
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
        setQuestions(filtered.sort(() => Math.random() - 0.5));
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
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const allMultipleChoiceOptions = useMemo(() => {
    if (!currentQuestion || currentQuestion.question_type !== 'multiple_choice') return [];
    return [currentQuestion.answer, ...(currentQuestion.distractors || [])].sort(() => Math.random() - 0.5);
  }, [currentQuestion?.id]);

  const handleNext = () => {
    setFeedback(null);
    setIsMastered(false);
    setIsFlipped(false);
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setStartTime(Date.now());
    } else {
      fetchTopicStats();
      setShowSummary(true);
    }
  };

  const handleAnswer = async (isCorrect: boolean) => {
    if (feedback) return;

    const timeSpent = Date.now() - startTime;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    setIsMastered(false);

    try {
      await db.attempts.record({
        student_id: user.id,
        question_id: currentQuestion.id,
        is_correct: isCorrect,
        response_time_ms: timeSpent
      });

      const existingProgress = await db.progress.get(user.id, currentQuestion.id);
      const srsResult = sm2(
        isCorrect, 
        existingProgress?.ease, 
        existingProgress?.interval_days, 
        existingProgress?.consecutive_correct
      );
      
      const updated = await db.progress.upsert({
        student_id: user.id,
        question_id: currentQuestion.id,
        ...srsResult
      });

      if (isCorrect && updated.consecutive_correct === 3) {
        setIsMastered(true);
      }

      setResults([...results, { questionId: currentQuestion.id, isCorrect }]);
    } catch (err) {
      console.error('Save result error:', err);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const { question_type, prompt, answer, distractors, metadata, arabic } = currentQuestion;

    if (question_type === 'flashcard') {
      return (
        <div className="flex flex-col items-center w-full px-4">
          <motion.div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-lg aspect-[5/4] relative preserve-3d cursor-pointer perspective-1000 group"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-soft-lg flex flex-col items-center justify-center p-10 text-center border-2 border-slate-50">
               {metadata.image_url && (
                 <div className="absolute top-8 left-1/2 -translate-x-1/2 w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-4xl p-2">
                   {metadata.image_url.startsWith('http') ? <img src={metadata.image_url} alt="icon" className="w-full h-full object-contain" /> : metadata.image_url}
                 </div>
               )}
               <h3 className="text-3xl font-black text-ink leading-snug pt-12">{prompt}</h3>
               <div className="mt-auto pt-6 flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
                 <RotateCcw className="w-3 h-3" /> Tap to Flip
               </div>
            </div>
            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-primary rounded-[3rem] shadow-soft-lg flex flex-col items-center justify-center p-10 text-center [transform:rotateY(180deg)] text-white">
               <h3 className="text-arabic text-6xl font-black mb-4 leading-tight">{answer}</h3>
               <div className="mt-auto pt-6 flex items-center gap-2 text-white/50 font-black uppercase text-[10px] tracking-widest">
                 Done? Tap to Close
               </div>
            </div>
          </motion.div>

          <div className="mt-10 flex gap-6 w-full max-w-lg">
            <Button 
              variant="secondary" 
              className="flex-1 rounded-[2rem] border-rose-100 h-20 text-rose-500 font-black text-xl shadow-soft flex flex-col py-0 items-center justify-center gap-1 group overflow-hidden"
              onClick={() => handleAnswer(false)}
            >
              Belum Tahu
              <span className="text-[10px] opacity-40 uppercase">Ulang Kaji Nanti</span>
              <div className="absolute inset-0 bg-rose-50 opacity-0 group-active:opacity-100 transition-opacity" />
            </Button>
            <Button 
              className="flex-1 rounded-[2rem] h-20 bg-accent-mint hover:bg-accent-mint/90 text-emerald-900 font-black text-xl shadow-soft flex flex-col py-0 items-center justify-center gap-1 group overflow-hidden"
              onClick={() => handleAnswer(true)}
            >
              Sudah Tahu
              <span className="text-[10px] opacity-40 uppercase">Lulus Sesi Ini</span>
              <div className="absolute inset-0 bg-emerald-100/20 opacity-0 group-active:opacity-100 transition-opacity" />
            </Button>
          </div>
        </div>
      );
    }

    if (question_type === 'multiple_choice') {
      const isArabicPrompt = metadata.direction === 'ar_to_ms';
      const isArabicOptions = metadata.direction === 'ms_to_ar';

      return (
        <div className="w-full max-w-2xl px-4">
          <Card className="mb-8 text-center relative overflow-hidden" padding="lg">
             <div className="flex flex-col items-center">
               <div className="w-16 h-1 bg-slate-100 rounded-full mb-8" />
               <h3 className={cn("font-black text-ink leading-tight text-4xl", isArabicPrompt && "text-arabic")}>
                  {prompt}
               </h3>
             </div>
          </Card>

          <div className="grid grid-cols-1 gap-4">
            {allMultipleChoiceOptions.map((opt, i) => {
              const isCorrectOpt = opt === answer;
              const isSelected = feedback && isCorrectOpt;
              
              return (
                <button
                  key={i}
                  disabled={!!feedback}
                  onClick={() => handleAnswer(isCorrectOpt)}
                  className={cn(
                    "p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden flex items-center gap-4 group active:scale-95",
                    !feedback ? "bg-white border-slate-100 hover:border-primary hover:shadow-lg" : 
                    isCorrectOpt ? "bg-accent-mint/10 border-accent-mint text-emerald-900" : "bg-white border-slate-50 opacity-50 text-ink-muted"
                  )}
                  dir={isArabicOptions ? "rtl" : "ltr"}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black",
                    !feedback ? "bg-slate-50 text-ink-muted group-hover:bg-primary group-hover:text-white" :
                    isCorrectOpt ? "bg-accent-mint text-emerald-900" : "bg-slate-100 text-ink-muted"
                  )}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className={cn("flex-1 font-bold text-lg", isArabicOptions && "text-arabic text-3xl")}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (question_type === 'matching') {
      const pairs = metadata.pairs || [];
      return (
        <div className="w-full max-w-4xl px-4 pb-20">
          <MatchingView 
            pairs={pairs} 
            onComplete={(isCorrect) => handleAnswer(isCorrect)} 
            direction={metadata.direction || 'ar_to_ms'}
          />
        </div>
      );
    }

    return null;
  };

  /**
   * Inner components for specific question types
   */
  function MatchingView({ pairs, onComplete, direction }: { pairs: {left: string, right: string}[], onComplete: (correct: boolean) => void, direction: string }) {
    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [matches, setMatches] = useState<Record<string, string>>({});
    const [mistakes, setMistakes] = useState(0);

    const leftItems = useMemo(() => shuffleArray(pairs.map(p => p.left)), [pairs]);
    const rightItems = useMemo(() => shuffleArray(pairs.map(p => p.right)), [pairs]);

    const handlePairClick = (item: string, side: 'left' | 'right') => {
      if (side === 'left') {
        if (matches[item]) return;
        setSelectedLeft(item === selectedLeft ? null : item);
      } else {
        if (!selectedLeft) return;
        
        const correctPair = pairs.find(p => p.left === selectedLeft);
        if (correctPair && correctPair.right === item) {
          setMatches({ ...matches, [selectedLeft]: item });
          setSelectedLeft(null);
          
          if (Object.keys(matches).length + 1 === pairs.length) {
            onComplete(mistakes === 0);
          }
        } else {
          setMistakes(m => m + 1);
          setSelectedLeft(null);
          toast.error('Salah! Cuba lagi.');
        }
      }
    };

    return (
      <div className="w-full flex flex-col items-center">
        <h3 className="text-xl font-black text-ink mb-10">Padankan semua pasangan di bawah:</h3>
        
        <div className="grid grid-cols-2 gap-x-8 sm:gap-x-12 gap-y-4 w-full">
           <div className="space-y-4">
             {leftItems.map(item => (
               <Card
                 key={item}
                 padding="none"
                 onClick={() => handlePairClick(item, 'left')}
                 className={cn(
                   "w-full h-24 rounded-3xl cursor-pointer flex items-center justify-center transition-all",
                   matches[item] ? "bg-accent-mint/10 border-accent-mint/30 opacity-40" :
                   selectedLeft === item ? "bg-primary text-white border-primary shadow-soft-lg scale-[1.03]" :
                   "bg-white border-slate-100 hover:border-primary/30"
                 )}
               >
                 <span className={cn("font-black", direction === 'ar_to_ms' ? "text-arabic text-4xl" : "text-xl")}>{item}</span>
               </Card>
             ))}
           </div>

           <div className="space-y-4">
             {rightItems.map(item => {
               const isMatched = Object.values(matches).includes(item);
               return (
                 <Card
                   key={item}
                   padding="none"
                   onClick={() => handlePairClick(item, 'right')}
                   className={cn(
                     "w-full h-24 rounded-3xl cursor-pointer flex items-center justify-center transition-all",
                     isMatched ? "bg-accent-mint/10 border-accent-mint/30 opacity-40" :
                     "bg-white border-slate-100 hover:border-primary/30"
                   )}
                 >
                   <span className={cn("font-black", direction === 'ms_to_ar' ? "text-arabic text-4xl" : "text-xl")}>{item}</span>
                 </Card>
               );
             })}
           </div>
        </div>
      </div>
    );
  }

  const renderSummary = () => {
    const score = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((score / (results.length || 1)) * 100);
    const masteryPercentage = topicStats.total > 0 ? Math.round((topicStats.mastered / topicStats.total) * 100) : 0;
    
    const trend = accuracy - (topicStats.previousAccuracy || 0);
    const isImproved = trend > 0;

    return (
      <Card className="max-w-md w-full bg-white text-center animate-in zoom-in duration-500" padding="lg">
        <div className="w-24 h-24 bg-accent-warm/10 text-accent-warm rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
           <Trophy className="w-12 h-12" />
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
                {results.length > 0 && Math.abs(trend) > 5 && (
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
              <div className="w-20 h-20 bg-white rounded-3xl shadow-soft flex items-center justify-center animate-pulse">
                <BrainCircuit className="w-10 h-10 text-primary" />
              </div>
              <p className="font-black text-lg">Membuka lembaran baru...</p>
            </div>
          ) : showSummary ? (
            renderSummary()
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
