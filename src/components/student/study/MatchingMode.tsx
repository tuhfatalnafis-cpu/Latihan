import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from '../../ui/Card';
import { cn } from '../../../lib/utils';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { getTermFontClass, isRTL } from '../../../lib/subjectHelpers';
import { toast } from 'sonner';

interface MatchingModeProps {
  question: any;
  schema: SubjectFieldSchema;
  onAnswer: (isCorrect: boolean, pairsCount?: number) => void;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  return [...array].sort(() => Math.random() - 0.5);
};

export default function MatchingMode({ question, schema, onAnswer }: MatchingModeProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [mistakes, setMistakes] = useState(0);
  const [completed, setCompleted] = useState(false);

  const pairs = question.metadata.pairs || [];
  
  const leftItems = useMemo(() => shuffleArray(pairs.map((p: any) => p.left)), [question.id]);
  const rightItems = useMemo(() => shuffleArray(pairs.map((p: any) => p.right)), [question.id]);

  const handlePairClick = (item: string, side: 'left' | 'right') => {
    if (completed) return;

    if (side === 'left') {
      if (matches[item]) return;
      setSelectedLeft(item === selectedLeft ? null : item);
    } else {
      if (!selectedLeft) return;
      
      const correctPair = pairs.find((p: any) => p.left === selectedLeft);
      if (correctPair && correctPair.right === item) {
        setMatches(prev => ({ ...prev, [selectedLeft]: item }));
        setSelectedLeft(null);
        
        if (Object.keys(matches).length + 1 === pairs.length) {
          setCompleted(true);
          setTimeout(() => {
             // Matching counts as multiple attempts per user request
             onAnswer(mistakes === 0, pairs.length);
          }, 1500);
        }
      } else {
        setMistakes(m => m + 1);
        setSelectedLeft(null);
        toast.error('Salah! Cuba lagi.', { duration: 1000 });
      }
    }
  };

  const showLeftRTL = isRTL(schema);

  return (
    <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="text-center mb-10">
        <h3 className="text-2xl font-black text-ink mb-2">Padankan Pasangan</h3>
        <p className="text-ink-muted font-bold uppercase text-[10px] tracking-widest bg-slate-100 px-4 py-2 rounded-xl">
          {Object.keys(matches).length} / {pairs.length} Berjaya
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-4 w-full">
         <div className="space-y-4">
           {leftItems.map((item: string) => (
             <motion.div
               key={item}
               whileTap={{ scale: 0.95 }}
             >
               <Card
                 padding="none"
                 onClick={() => handlePairClick(item, 'left')}
                 className={cn(
                   "w-full h-24 rounded-3xl cursor-pointer flex items-center justify-center transition-all border-2",
                   matches[item] ? "bg-accent-mint/10 border-accent-mint/30 opacity-40 grayscale" :
                   selectedLeft === item ? "bg-primary text-white border-primary shadow-soft-lg scale-[1.03]" :
                   "bg-white border-slate-100 hover:border-primary/20"
                 )}
               >
                 <span className={cn(
                   "font-black text-center px-4 leading-tight", 
                   showLeftRTL ? cn(getTermFontClass(schema), "text-4xl") : "text-xl"
                 )} dir={showLeftRTL ? "rtl" : "ltr"}>
                   {item}
                 </span>
               </Card>
             </motion.div>
           ))}
         </div>

         <div className="space-y-4">
           {rightItems.map((item: string) => {
             const isMatched = Object.values(matches).includes(item);
             return (
               <motion.div
                 key={item}
                 whileTap={{ scale: 0.95 }}
               >
                 <Card
                   padding="none"
                   onClick={() => handlePairClick(item, 'right')}
                   className={cn(
                     "w-full h-24 rounded-3xl cursor-pointer flex items-center justify-center transition-all border-2",
                     isMatched ? "bg-accent-mint/10 border-accent-mint/30 opacity-40 grayscale" :
                     "bg-white border-slate-100 hover:border-primary/20"
                   )}
                 >
                   <span className="font-black text-center px-4 text-xl">
                     {item}
                   </span>
                 </Card>
               </motion.div>
             );
           })}
         </div>
      </div>

      <AnimatePresence>
        {completed && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-accent-mint/20 backdrop-blur-sm"
          >
            <div className="bg-white p-12 rounded-[4rem] shadow-soft-lg text-center border-4 border-accent-mint">
              <h2 className="text-6xl font-black text-ink mb-4">Tahniah!</h2>
              <p className="text-2xl font-bold text-emerald-600">Semua padanan berjaya!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
