import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  RotateCcw
} from 'lucide-react';
import { db } from '../../lib/db';
import { sm2 } from '../../lib/srs';
import { Question, Topic, Attempt, Progress } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '../../lib/utils';

interface StudySessionProps {
  user: User;
  topic: Topic;
  onClose: () => void;
}

type SessionMode = 'srs' | 'browse';

export default function StudySession({ user, topic, onClose }: StudySessionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{questionId: string, isCorrect: boolean}[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<SessionMode>('browse');
  const [showSummary, setShowSummary] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false); // For flashcards
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    fetchQuestions();
  }, [topic.id, mode]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      if (mode === 'browse') {
        const data = await db.questions.listForTopic(topic.id);
        setQuestions(data.sort(() => Math.random() - 0.5));
      } else {
        // Implement SRS due questions
        const due = await db.progress.getDue(user.id);
        const filtered = due.filter((p: any) => p.questions.topic_id === topic.id).map((p: any) => p.questions);
        setQuestions(filtered);
      }
      setCurrentIndex(0);
      setResults([]);
      setShowSummary(false);
      setStartTime(Date.now());
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = questions[currentIndex];

  const handleAnswer = async (isCorrect: boolean) => {
    if (feedback) return; // Prevent double taps

    const timeSpent = Date.now() - startTime;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    try {
      // 1. Record Attempt
      await db.attempts.record({
        student_id: user.id,
        question_id: currentQuestion.id,
        is_correct: isCorrect,
        response_time_ms: timeSpent
      });

      // 2. Update Progress (SM-2)
      const existingProgress = await db.progress.get(user.id, currentQuestion.id);
      const srsResult = sm2(
        isCorrect, 
        existingProgress?.ease, 
        existingProgress?.interval_days, 
        existingProgress?.consecutive_correct
      );
      
      await db.progress.upsert({
        student_id: user.id,
        question_id: currentQuestion.id,
        ...srsResult
      });

      setResults([...results, { questionId: currentQuestion.id, isCorrect }]);

      // 3. Move to next after a delay
      setTimeout(() => {
        setFeedback(null);
        setIsFlipped(false);
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setStartTime(Date.now());
        } else {
          setShowSummary(true);
        }
      }, 1000);
    } catch (err) {
      console.error('Save result error:', err);
    }
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const { question_type, prompt, answer, distractors, metadata, arabic } = currentQuestion;

    if (question_type === 'flashcard') {
      return (
        <div className="flex flex-col items-center">
          <motion.div 
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full max-w-lg aspect-[4/3] relative preserve-3d cursor-pointer perspective-1000"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-white rounded-[40px] shadow-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-12 text-center">
               {metadata.image_url && <img src={metadata.image_url} alt="icon" className="w-24 h-24 mb-8 object-contain" />}
               <h3 className="text-2xl font-bold text-slate-800">{prompt}</h3>
               <p className="mt-8 text-slate-400 font-bold text-xs uppercase tracking-widest">Klik untuk lihat jawapan</p>
            </div>
            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-[40px] shadow-2xl flex flex-col items-center justify-center p-12 text-center [transform:rotateY(180deg)] text-white">
               <h3 className="text-arabic text-5xl font-black mb-4 leading-tight">{answer}</h3>
               {currentQuestion.transliteration && <p className="text-indigo-200 text-lg font-bold tracking-tight italic">{currentQuestion.transliteration}</p>}
               <p className="mt-8 text-indigo-300 font-bold text-xs uppercase tracking-widest">Klik untuk balik semula</p>
            </div>
          </motion.div>

          <div className="mt-12 flex gap-6 w-full max-w-lg">
            <button 
              onClick={() => handleAnswer(false)}
              className="flex-1 py-5 bg-white border-2 border-rose-100 text-rose-500 rounded-2xl font-black shadow-lg shadow-rose-100/50 hover:bg-rose-50 transition-all flex flex-col items-center gap-1"
            >
              <span className="text-xl">Belum Tahu</span>
              <span className="text-[10px] uppercase opacity-50">Lupa lagi</span>
            </button>
            <button 
              onClick={() => handleAnswer(true)}
              className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-600 flex flex-col items-center gap-1"
            >
              <span className="text-xl">Sudah Tahu</span>
              <span className="text-[10px] uppercase opacity-50">Ingat dengan jelas</span>
            </button>
          </div>
        </div>
      );
    }

    if (question_type === 'multiple_choice') {
      const allOptions = useMemo(() => [answer, ...(distractors || [])].sort(() => Math.random() - 0.5), [currentQuestion.id]);
      const isArabicPrompt = metadata.direction === 'ar_to_ms';
      const isArabicOptions = metadata.direction === 'ms_to_ar';

      return (
        <div className="w-full max-w-2xl mx-auto">
          <div className="bg-white rounded-[40px] p-12 shadow-2xl border-2 border-slate-100 mb-8 text-center relative overflow-hidden">
             {metadata.image_url && <img src={metadata.image_url} alt="icon" className="w-20 h-20 mx-auto mb-8 object-contain" />}
             <h3 className={cn("font-black text-slate-800 leading-tight", isArabicPrompt ? "text-arabic text-5xl" : "text-3xl")}>
                {prompt}
             </h3>
             {isArabicPrompt && currentQuestion.transliteration && (
               <p className="mt-4 text-slate-400 font-bold italic tracking-tight">{currentQuestion.transliteration}</p>
             )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allOptions.map((opt, i) => {
              const isCorrectOpt = opt === answer;
              const isSelected = feedback && isCorrectOpt;
              const isWrongSelected = feedback === 'wrong' && !isCorrectOpt; // Not quite right logic but feedback handles it

              return (
                <button
                  key={i}
                  disabled={!!feedback}
                  onClick={() => handleAnswer(isCorrectOpt)}
                  className={cn(
                    "p-6 rounded-[28px] border-2 text-left transition-all relative overflow-hidden flex items-center gap-4 group",
                    !feedback ? "bg-white border-slate-100 hover:border-indigo-500 hover:shadow-xl hover:scale-[1.02]" : 
                    isCorrectOpt ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-white border-slate-50 opacity-50 text-slate-400"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black",
                    !feedback ? "bg-slate-50 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white" :
                    isCorrectOpt ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-300"
                  )}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  <span className={cn("flex-1 font-bold", isArabicOptions ? "text-arabic text-3xl" : "text-lg")}>
                    {opt}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  const renderSummary = () => {
    const score = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((score / results.length) * 100);

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[48px] p-12 shadow-2xl text-center border-2 border-slate-100"
      >
        <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-[32px] flex items-center justify-center mx-auto mb-8 animate-bounce">
           <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-black text-slate-800 mb-2">Sesi Tamat!</h2>
        <p className="text-slate-500 font-bold mb-10 italic">Hebat! Anda telah menyelesaikan semua soalan.</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Betul</p>
              <p className="text-3xl font-black text-emerald-500">{score}/{results.length}</p>
           </div>
           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Akurasi</p>
              <p className="text-3xl font-black text-indigo-600">{accuracy}%</p>
           </div>
        </div>

        <div className="space-y-3">
          <button 
            onClick={fetchQuestions}
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center justify-center gap-2"
          >
             <RotateCcw className="w-5 h-5" /> Cuba Lagi
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
          >
             Tamat & Kembali
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-6 md:px-10 shrink-0">
         <div className="flex items-center gap-4">
           <button onClick={onClose} className="p-2 hover:bg-slate-50 border border-transparent hover:border-slate-200 rounded-xl transition-all">
              <X className="w-6 h-6 text-slate-400" />
           </button>
           <div>
             <h3 className="font-black text-slate-800 text-lg leading-tight">{topic.name}</h3>
             {!showSummary && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentIndex + 1} daripada {questions.length} soalan</p>}
           </div>
         </div>

         <div className="flex items-center gap-4">
            <div className="hidden sm:flex h-3 w-48 bg-slate-100 rounded-full overflow-hidden mr-4">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                 className="h-full bg-emerald-500"
               />
            </div>
            <div className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-2 shrink-0">
               <Clock className="w-4 h-4 text-indigo-500" />
               <span className="text-indigo-600 font-black tabular-nums">03:42</span>
            </div>
         </div>
      </header>

      {/* Main Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {loading ? (
          <div className="flex flex-col items-center gap-4 text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            <p className="font-black">Menyediakan soalan hafalan...</p>
          </div>
        ) : showSummary ? (
          renderSummary()
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {renderQuestion()}
          </div>
        )}

        {/* Feedback Overlay */}
        <AnimatePresence>
          {feedback && (
            <motion.div 
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className={cn(
                "fixed inset-0 z-[100] flex items-center justify-center pointer-events-none",
                feedback === 'correct' ? "bg-emerald-500/10" : "bg-rose-500/10"
              )}
            >
              {feedback === 'correct' ? (
                <div className="p-8 bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl flex items-center gap-6">
                  <CheckCircle2 className="w-20 h-20 text-emerald-500" />
                  <div>
                    <h2 className="text-4xl font-black text-emerald-600">Betul!</h2>
                    <p className="text-emerald-800 font-bold">Syabas, teruskan!</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 bg-white/90 backdrop-blur-md rounded-[40px] shadow-2xl flex items-center gap-6">
                  <XCircle className="w-20 h-20 text-rose-500" />
                  <div>
                    <h2 className="text-4xl font-black text-rose-600">Salah</h2>
                    <p className="text-rose-800 font-bold">Tak apa, cuba lagi!</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer / Instructions */}
      {!showSummary && !loading && (
        <footer className="p-6 bg-white border-t border-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] shrink-0">
           Sesi Pembelajaran Aktif &bull; Cepat Belajar Platform
        </footer>
      )}
    </div>
  );
}
