import React from 'react';
import { Check, X, ArrowLeft, BrainCircuit, Sparkles, AlertCircle } from 'lucide-react';
import { VocabRow } from '../../../lib/questionGenerator';

interface Step4Props {
  data: VocabRow[];
  onSave: (data: VocabRow[]) => void;
  onAutoGenerate: (data: VocabRow[]) => void;
  onBack: () => void;
  isGenerating: boolean;
}

export default function Step4ReviewSave({ data, onSave, onAutoGenerate, onBack, isGenerating }: Step4Props) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Semak & Simpan</h2>
          <p className="text-slate-500 text-sm font-medium">{data.length} perkataan ditemui dalam fail anda.</p>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
          {data.map((row, i) => (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
              {row.image_keyword?.startsWith('http') && (
                <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg p-1 shrink-0 flex items-center justify-center shadow-sm">
                   <img src={row.image_keyword} alt="icon" className="w-full h-full object-contain" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-arabic text-lg leading-none mb-1">{row.arabic}</p>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-tight">{row.transliteration}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{row.meaning_ms}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
        <Sparkles className="w-8 h-8 text-amber-600 shrink-0" />
        <div>
          <p className="font-extrabold text-amber-900 leading-tight">Pilihan Pengumpulan Soalan</p>
          <p className="text-amber-700/80 text-xs mt-1 font-medium italic">Anda boleh menyimpan sebagai flashcard sekarang, DAN menjana set soalan aneka pilihan (MCQ) tambahan secara automatik.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
          onClick={() => onSave(data)}
          className="py-4 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group"
        >
          <Check className="w-5 h-5 text-slate-400 group-hover:text-indigo-500" /> Simpan Flashcard Sahaja
        </button>
        <button 
          disabled={isGenerating}
          onClick={() => onAutoGenerate(data)}
          className="py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 transform active:scale-95"
        >
          {isGenerating ? <BrainCircuit className="w-5 h-5 animate-pulse" /> : <Sparkles className="w-5 h-5" />}
          Simpan & Jana Soalan (MCQ)
        </button>
      </div>

      <button 
        onClick={onBack}
        className="text-slate-400 hover:text-slate-600 font-bold text-xs flex items-center gap-1 mx-auto transition-colors"
      >
        <ArrowLeft className="w-3 h-3" /> Kembali ke pemilihan ikon
      </button>
    </div>
  );
}
