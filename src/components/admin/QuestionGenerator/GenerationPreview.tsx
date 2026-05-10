import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GeneratedMCQ } from '../../../lib/questionGenerator';
import { Trash2, RotateCcw, CheckCircle2, ChevronLeft, Loader2, Sparkles } from 'lucide-react';
import { cn } from '../../../lib/utils';

interface Step2Props {
  questions: GeneratedMCQ[];
  isEnhancing: boolean;
  enhanceProgress: number;
  onSave: (finalQuestions: GeneratedMCQ[]) => void;
  onBack: () => void;
}

export default function GenerationPreview({ questions, isEnhancing, enhanceProgress, onSave, onBack }: Step2Props) {
  const [items, setItems] = useState(questions);

  const handleDelete = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-slate-800">Pratonton Soalan</h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Langkah 2: Semak & Simpan</p>
      </div>

      {isEnhancing && (
        <div className="bg-amber-50 border border-amber-100 p-6 rounded-[32px] space-y-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
               <p className="text-sm font-black text-amber-900">Meningkatkan Kualiti (AI)...</p>
             </div>
             <span className="text-xs font-black text-amber-600">{Math.round(enhanceProgress)}%</span>
           </div>
           <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${enhanceProgress}%` }}
               className="h-full bg-amber-500"
             />
           </div>
           <p className="text-[10px] font-bold text-amber-700/70 text-center uppercase tracking-widest">Memilih distraktor yang lebih mencabar secara semantik</p>
        </div>
      )}

      <div className="max-h-[400px] overflow-y-auto border border-slate-100 rounded-3xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 border-b border-slate-100 z-10">
            <tr>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400">#</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400">Soalan</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400">Jawapan (Pilihan Salah)</th>
              <th className="p-4 text-[10px] font-black uppercase text-slate-400 text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((q, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors group">
                <td className="p-4 text-[10px] font-black text-slate-300">{(i + 1).toString().padStart(2, '0')}</td>
                <td className="p-4">
                  <div className={cn("leading-tight", q.direction === 'ar_to_ms' ? "text-arabic text-xl" : "text-sm font-bold text-slate-800")}>
                    {q.prompt}
                  </div>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                    {q.direction === 'ar_to_ms' ? 'Arab → Melayu' : 'Melayu → Arab'}
                  </div>
                </td>
                <td className="p-4">
                  <div className={cn("font-black", q.direction === 'ms_to_ar' ? "text-arabic text-lg text-emerald-600" : "text-sm text-emerald-600")}>
                    {q.answer}
                  </div>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {q.distractors.map((d, di) => (
                      <span key={di} className={cn("px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md", q.direction === 'ms_to_ar' ? "text-arabic text-xs" : "text-[10px] font-bold")}>
                        {d}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDelete(i)}
                    className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-3 pt-2">
        {!isEnhancing && (
          <>
            <button 
              onClick={onBack}
              className="w-20 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => onSave(items)}
              className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
            >
              Simpan Set Soalan <CheckCircle2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
