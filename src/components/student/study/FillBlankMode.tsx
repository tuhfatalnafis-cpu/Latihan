import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { getTermFontClass, isRTL } from '../../../lib/subjectHelpers';
import { isAnswerCorrect } from '../../../lib/answerMatcher';
import { ArrowRight } from 'lucide-react';

interface FillBlankModeProps {
  question: any;
  schema: SubjectFieldSchema;
  onAnswer: (isCorrect: boolean) => void;
}

export default function FillBlankMode({ question, schema, onAnswer }: FillBlankModeProps) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setValue('');
    setSubmitted(false);
  }, [question.id]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitted || !value.trim()) return;

    const correct = isAnswerCorrect(value, question.answer, schema);
    setSubmitted(true);
    onAnswer(correct);
  };

  const isTermToMeaning = question.metadata.direction === 'term_to_meaning' || question.metadata.direction === 'ar_to_ms';
  const showPromptRTL = isRTL(schema) && isTermToMeaning;
  const showInputRTL = isRTL(schema) && !isTermToMeaning;

  return (
    <div className="w-full max-w-2xl px-4 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500">
      <Card className="mb-8 w-full text-center relative overflow-hidden p-0" padding="none">
         <div className="flex flex-col items-center">
           {question.metadata.image_url && (
             <div className="w-full h-48 md:h-64 bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
               <img 
                 src={question.metadata.image_url} 
                 alt="Soalan" 
                 className="w-full h-full object-contain"
                 referrerPolicy="no-referrer"
               />
             </div>
           )}
           <div className="p-8 md:p-12 w-full flex flex-col items-center">
             <div className="w-16 h-1 bg-slate-100 rounded-full mb-8" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
               {isTermToMeaning ? 'Berikan Maksud' : 'Tuliskan Istilah'}
             </p>
             <div dir={showPromptRTL ? "rtl" : "ltr"}>
               <h3 className={cn(
                 "font-black text-ink leading-tight", 
                 showPromptRTL ? cn(getTermFontClass(schema), "text-5xl") : "text-4xl"
               )}>
                  {question.prompt}
               </h3>
             </div>
           </div>
         </div>
      </Card>

      <form onSubmit={handleSubmit} className="w-full space-y-6">
        <div className="relative group">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={submitted}
            placeholder="Taip jawapan di sini..."
            className={cn(
               "w-full h-24 px-8 rounded-[2rem] border-4 transition-all text-2xl font-black text-center outline-none shadow-soft-lg",
               showInputRTL ? cn(getTermFontClass(schema), "text-4xl") : "",
               !submitted ? "bg-white border-primary/10 focus:border-primary/40 focus:bg-white" : 
               isAnswerCorrect(value, question.answer, schema) ? "bg-accent-mint/5 border-accent-mint text-emerald-900" : "bg-rose-50 border-rose-500 text-rose-600"
            )}
            dir={showInputRTL ? "rtl" : "ltr"}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
        </div>

        {!submitted && (
           <Button 
            type="submit"
            size="xl" 
            className="w-full h-20 rounded-3xl bg-primary text-white font-black text-xl shadow-soft"
            disabled={!value.trim()}
          >
            Semak Jawapan
          </Button>
        )}

        {submitted && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
             <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jawapan Betul:</p>
                <p className={cn(
                  "text-3xl font-black text-ink",
                  showInputRTL ? getTermFontClass(schema) : ""
                )} dir={showInputRTL ? "rtl" : "ltr"}>
                  {question.answer}
                </p>
             </div>
             
             {question.explanation && (
                <div className="p-6 bg-slate-50 rounded-3xl w-full">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Penjelasan:</p>
                   <p className="text-lg font-bold text-ink">
                     {question.explanation}
                   </p>
                </div>
             )}
          </div>
        )}
      </form>
    </div>
  );
}
