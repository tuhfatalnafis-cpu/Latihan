import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { getTermFontClass, isRTL } from '../../../lib/subjectHelpers';
import { Check, X } from 'lucide-react';

interface TrueFalseModeProps {
  question: any;
  schema: SubjectFieldSchema;
  onAnswer: (isCorrect: boolean) => void;
}

export default function TrueFalseMode({ question, schema, onAnswer }: TrueFalseModeProps) {
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const handleChoice = (choice: 'true' | 'false') => {
    if (feedback) return;
    const isCorrect = choice === question.answer;
    setFeedback(isCorrect ? 'correct' : 'wrong');
    onAnswer(isCorrect);
  };

  const showRTL = isRTL(schema);

  return (
    <div className="w-full max-w-2xl px-4 flex flex-col items-center animate-in slide-in-from-bottom-8 duration-500">
      <Card className="mb-12 w-full text-center relative overflow-hidden p-12 bg-white" padding="lg">
         <div className="flex flex-col items-center">
           <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-primary mb-8">
              <span className="font-black">?</span>
           </div>
           
           <div className="flex flex-col items-center gap-6">
              <span className={cn(
                "font-black text-ink leading-tight", 
                showRTL ? cn(getTermFontClass(schema), "text-5xl") : "text-4xl"
              )} dir={showRTL ? "rtl" : "ltr"}>
                {question.metadata.term}
              </span>
              
              <div className="flex items-center gap-4 w-full">
                <div className="h-0.5 flex-1 bg-slate-100" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">bermaksud</span>
                <div className="h-0.5 flex-1 bg-slate-100" />
              </div>
              
              <span className="text-4xl font-black text-primary">
                {question.metadata.stated_meaning}
              </span>
           </div>
         </div>
         
         <div className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Adakah pernyataan di atas betul?
         </div>
      </Card>

      <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
        <Button
          disabled={!!feedback}
          onClick={() => handleChoice('true')}
          className={cn(
            "h-24 rounded-[2.5rem] border-4 text-2xl font-black transition-all flex flex-col gap-1 items-center justify-center shadow-soft",
            !feedback ? "bg-white border-slate-100 text-emerald-500 hover:border-accent-mint hover:bg-accent-mint/5" :
            question.answer === 'true' ? "bg-accent-mint border-accent-mint text-white" : "bg-white border-slate-50 opacity-50 grayscale"
          )}
        >
          <Check className="w-6 h-6" />
          BETUL
        </Button>
        <Button
          disabled={!!feedback}
          onClick={() => handleChoice('false')}
          className={cn(
            "h-24 rounded-[2.5rem] border-4 text-2xl font-black transition-all flex flex-col gap-1 items-center justify-center shadow-soft",
            !feedback ? "bg-white border-slate-100 text-rose-500 hover:border-rose-200 hover:bg-rose-50" :
            question.answer === 'false' ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-slate-50 opacity-50 grayscale"
          )}
        >
          <X className="w-6 h-6" />
          SALAH
        </Button>
      </div>

      {feedback && (
         <div className="mt-12 text-center animate-in fade-in slide-in-from-top-4 w-full px-8 py-6 bg-slate-50 rounded-[2rem]">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {question.explanation ? 'Penjelasan:' : 'Maklumat Sebenar:'}
            </p>
            <p className="text-xl font-bold text-ink">
              {question.explanation || (
                <>
                  <span className={cn(showRTL && getTermFontClass(schema))} dir={showRTL ? "rtl" : "ltr"}>
                    {question.metadata.term}
                  </span> bermaksud <span className="text-primary">{question.metadata.actual_meaning}</span>
                </>
              )}
            </p>
         </div>
      )}
    </div>
  );
}
