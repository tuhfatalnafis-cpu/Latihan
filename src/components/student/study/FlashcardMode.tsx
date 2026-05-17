import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { getTermFontClass, isRTL } from '../../../lib/subjectHelpers';

interface FlashcardModeProps {
  question: any;
  schema: SubjectFieldSchema;
  isFlipped: boolean;
  onFlip: (flipped: boolean) => void;
  onAnswer: (isCorrect: boolean) => void;
}

export default function FlashcardMode({ question, schema, isFlipped, onFlip, onAnswer }: FlashcardModeProps) {
  const { prompt, answer, metadata } = question;
  const showRTL = isRTL(schema);

  return (
    <div className="flex flex-col items-center w-full px-4">
      <motion.div 
        onClick={() => onFlip(!isFlipped)}
        className="w-full max-w-lg aspect-[5/4] relative preserve-3d cursor-pointer perspective-1000 group"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front (Term) */}
        <div className="absolute inset-0 backface-hidden bg-white rounded-[3rem] shadow-soft-lg flex flex-col items-center justify-center p-0 text-center border-2 border-slate-50 overflow-hidden">
           {metadata.image_url ? (
             <div className="w-full h-1/2 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
               <img 
                 src={metadata.image_url} 
                 alt="Imej" 
                 className="w-full h-full object-contain"
                 referrerPolicy="no-referrer"
               />
             </div>
           ) : (
             <div className="pt-10">
               <div className="w-16 h-1 bg-slate-100 rounded-full mx-auto" />
             </div>
           )}
           <div className={cn("flex flex-col items-center flex-1 justify-center px-10", showRTL && "text-right")} dir={showRTL ? "rtl" : "ltr"}>
             <h3 className={cn("font-black text-ink leading-snug", getTermFontClass(schema), showRTL ? "text-5xl" : "text-3xl")}>
               {prompt}
             </h3>
             {schema.extra_fields?.map((f: any) => metadata[f.key] && (
               <div key={f.key} className="mt-2 px-3 py-1 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">
                 {f.label}: {metadata[f.key]}
               </div>
             ))}
           </div>
           <div className="pb-8 flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest">
             <RotateCcw className="w-3 h-3" /> Tap to Flip
           </div>
        </div>
        {/* Back (Meaning) */}
        <div className="absolute inset-0 backface-hidden bg-primary rounded-[3rem] shadow-soft-lg flex flex-col items-center justify-center p-10 text-center [transform:rotateY(180deg)] text-white">
           <h3 className="text-4xl font-black mb-4 leading-tight">{answer}</h3>
           <div className="mt-auto pt-6 flex items-center gap-2 text-white/50 font-black uppercase text-[10px] tracking-widest">
             Done? Tap to Close
           </div>
        </div>
      </motion.div>

      <div className="mt-10 flex gap-6 w-full max-w-lg">
        <Button 
          variant="secondary" 
          className="flex-1 rounded-[2rem] border-rose-100 h-20 text-rose-500 font-black text-xl shadow-soft flex flex-col py-0 items-center justify-center gap-1 group overflow-hidden"
          onClick={() => onAnswer(false)}
        >
          Belum Tahu
          <span className="text-[10px] opacity-40 uppercase">Ulang Kaji Nanti</span>
          <div className="absolute inset-0 bg-rose-50 opacity-0 group-active:opacity-100 transition-opacity" />
        </Button>
        <Button 
          className="flex-1 rounded-[2rem] h-20 bg-accent-mint hover:bg-accent-mint/90 text-emerald-900 font-black text-xl shadow-soft flex flex-col py-0 items-center justify-center gap-1 group overflow-hidden"
          onClick={() => onAnswer(true)}
        >
          Sudah Tahu
          <span className="text-[10px] opacity-40 uppercase">Lulus Sesi Ini</span>
          <div className="absolute inset-0 bg-emerald-100/20 opacity-0 group-active:opacity-100 transition-opacity" />
        </Button>
      </div>
    </div>
  );
}
