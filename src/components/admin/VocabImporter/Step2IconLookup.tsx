import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, ChevronLeft, Image, Search, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { VocabRow } from '../../../lib/questionGenerator';
import { cn } from '../../../lib/utils';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { getTermFontClass, isRTL } from '../../../lib/subjectHelpers';

interface Step2Props {
  data: Partial<VocabRow>[];
  schema: SubjectFieldSchema;
  onNext: (data: Partial<VocabRow>[]) => void;
  onBack: () => void;
}

export default function Step2IconLookup({ data, schema, onNext, onBack }: Step2Props) {
  const [workingData, setWorkingData] = useState(data);
  const [isResolving, setIsResolving] = useState(false);

  const handleSmartIcon = async () => {
    setIsResolving(true);
    // Mimic API icon lookup - in reality we could use an icon map
    await new Promise(r => setTimeout(r, 1500));
    
    const updated = workingData.map(item => ({
      ...item,
      image_keyword: item.image_keyword || item.meaning?.toLowerCase().split(' ')[0] || ''
    }));
    
    setWorkingData(updated);
    setIsResolving(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-slate-800">Pembayang Visual</h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Langkah 2: Resolusi Ikon (Pilihan)</p>
      </div>

      <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="font-extrabold text-amber-900 leading-tight text-sm">Jana Ikon Automatik</p>
            <p className="text-amber-700/70 text-[10px] font-bold uppercase tracking-widest mt-0.5">Berdasarkan maksud</p>
          </div>
        </div>
        <p className="text-xs text-amber-800/80 font-medium leading-relaxed mb-6">
          Sistem akan cuba mencari kata kunci ikon OpenMoji yang sesuai untuk setiap perkataan. Anda boleh menyuntingnya kemudian dalam pustaka.
        </p>
        <button 
          onClick={handleSmartIcon}
          disabled={isResolving}
          className="w-full py-4 bg-white text-amber-600 font-black rounded-2xl hover:bg-amber-100 transition-all uppercase tracking-widest text-xs shadow-sm border border-amber-200 flex items-center justify-center gap-2"
        >
          {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Padan Ikon Pintar
        </button>
      </div>

      <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-2xl">
        <div className="grid grid-cols-2 gap-2 p-2">
          {workingData.slice(0, 10).map((row, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl overflow-hidden">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                {row.image_keyword ? (
                  <img src={`https://openmoji.org/data/color/svg/${row.image_keyword}.svg`} alt="" className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
                ) : (
                  <Image className="w-4 h-4 text-slate-200" />
                )}
              </div>
              <div className="truncate flex-1" dir={isRTL(schema) ? "rtl" : "ltr"}>
                <p className={cn("text-ink leading-none truncate", getTermFontClass(schema), isRTL(schema) ? "text-lg" : "text-sm font-bold")}>{row.term}</p>
                <p className="text-[9px] font-bold text-slate-400 truncate uppercase mt-0.5">{row.image_keyword || 'Tiada'}</p>
              </div>
            </div>
          ))}
          {workingData.length > 10 && (
            <div className="col-span-2 py-2 text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">
              + {workingData.length - 10} lagi perkataan
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button 
          onClick={onBack}
          className="w-20 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button 
          onClick={() => onNext(workingData)}
          className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
        >
          Simpan Pustaka <CheckCircle2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
