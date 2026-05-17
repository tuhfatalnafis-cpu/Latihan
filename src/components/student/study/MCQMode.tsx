import React, { useMemo } from 'react';
import { Card } from '../../ui/Card';
import { cn } from '../../../lib/utils';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { getTermFontClass, isRTL } from '../../../lib/subjectHelpers';

interface MCQModeProps {
  question: any;
  schema: SubjectFieldSchema;
  feedback: 'correct' | 'wrong' | null;
  onAnswer: (isCorrect: boolean) => void;
}

export default function MCQMode({ question, schema, feedback, onAnswer }: MCQModeProps) {
  const { prompt, answer, distractors, metadata } = question;

  const allOptions = useMemo(() => {
    return [answer, ...(distractors || [])].sort(() => Math.random() - 0.5);
  }, [question.id]);

  const isTermToMeaning = metadata.direction === 'term_to_meaning' || metadata.direction === 'ar_to_ms';
  const isMeaningToTerm = metadata.direction === 'meaning_to_term' || metadata.direction === 'ms_to_ar';
  
  const showPromptRTL = isRTL(schema) && isTermToMeaning;
  const showOptionsRTL = isRTL(schema) && isMeaningToTerm;

  return (
    <div className="w-full max-w-2xl px-4 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500">
      <Card className="mb-8 text-center relative overflow-hidden w-full" padding="lg">
         <div className="flex flex-col items-center">
           <div className="w-16 h-1 bg-slate-100 rounded-full mb-8" />
           <div dir={showPromptRTL ? "rtl" : "ltr"}>
             <h3 className={cn(
               "font-black text-ink leading-tight", 
               showPromptRTL ? cn(getTermFontClass(schema), "text-5xl") : "text-4xl"
             )}>
                {prompt}
             </h3>
           </div>
         </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 w-full">
        {allOptions.map((opt, i) => {
          const isCorrectOpt = opt === answer;
          
          return (
            <button
              key={`${question.id}-${i}`}
              disabled={!!feedback}
              onClick={() => onAnswer(isCorrectOpt)}
              className={cn(
                "p-6 rounded-3xl border-2 text-left transition-all relative overflow-hidden flex items-center gap-4 group active:scale-95",
                !feedback ? "bg-white border-slate-100 hover:border-primary hover:shadow-lg" : 
                isCorrectOpt ? "bg-accent-mint/10 border-accent-mint text-emerald-900" : "bg-white border-slate-50 opacity-50 text-ink-muted"
              )}
              dir={showOptionsRTL ? "rtl" : "ltr"}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black",
                !feedback ? "bg-slate-50 text-ink-muted group-hover:bg-primary group-hover:text-white" :
                isCorrectOpt ? "bg-accent-mint text-emerald-900" : "bg-slate-100 text-ink-muted"
              )}>
                {String.fromCharCode(65 + i)}
              </div>
              <span className={cn(
                "flex-1 font-bold", 
                showOptionsRTL ? cn(getTermFontClass(schema), "text-4xl") : "text-lg"
              )}>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
