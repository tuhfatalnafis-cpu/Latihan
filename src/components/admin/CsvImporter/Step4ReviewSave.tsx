import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  ArrowLeft, 
  BrainCircuit, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  Languages, 
  RotateCcw,
  Sliders,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { VocabRow, generateMcqsFromVocab } from '../../../lib/questionGenerator';
import { Question } from '../../../lib/supabase';
import { cn } from '../../../lib/utils';

interface Step4Props {
  data: VocabRow[];
  topicId: string;
  userId: string;
  onSave: (vocab: VocabRow[], questions: Partial<Question>[]) => void;
  onBack: () => void;
}

type GenMode = 'standard' | 'ai';

export default function Step4ReviewSave({ data, topicId, userId, onSave, onBack }: Step4Props) {
  const [mode, setMode] = useState<GenMode>('standard');
  const [count, setCount] = useState(20);
  const [instructions, setInstructions] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<Partial<Question>[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);

  // Initialize with standard generation
  const handlePreview = async () => {
    setIsGenerating(true);
    try {
      if (mode === 'standard') {
        const mcqs = generateMcqsFromVocab(topicId, data, userId, count);
        setGeneratedQuestions(mcqs);
      } else {
        const response = await fetch('/api/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vocab: data,
            instructions,
            count,
            topicId,
            userId
          })
        });
        if (!response.ok) throw new Error('AI Generation failed');
        const mcqs = await response.json();
        setGeneratedQuestions(mcqs);
      }
      setShowQuestions(true);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Gagal menjana soalan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFinalSave = () => {
    onSave(data, generatedQuestions);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-black text-slate-800">
            {showQuestions ? 'Semak Soalan' : 'Konfigurasi Penjanaan'}
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            {showQuestions ? `${generatedQuestions.length} soalan sedia untuk disimpan.` : `${data.length} perkataan sedia untuk dijana.`}
          </p>
        </div>
      </div>

      {!showQuestions ? (
        <div className="space-y-6">
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => {
                setMode('standard');
                if (count > 200) setCount(200);
              }}
              className={cn(
                "py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                mode === 'standard' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Languages className="w-4 h-4" /> Standard
            </button>
            <button
              onClick={() => {
                setMode('ai');
                if (count > 40) setCount(40);
              }}
              className={cn(
                "py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all",
                mode === 'ai' ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Sparkles className="w-4 h-4" /> AI Gemini
            </button>
          </div>

          {/* Slider */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-400" />
                <span className="font-bold text-slate-700 text-sm">Jumlah Soalan</span>
              </div>
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-xs font-black">{count}</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max={mode === 'standard' ? 200 : 40} 
              value={count} 
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>1</span>
              <span>{mode === 'standard' ? 200 : 40}</span>
            </div>
          </div>

          {/* AI Instructions */}
          {mode === 'ai' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <MessageSquare className="w-4 h-4 text-amber-500" />
                <label className="text-sm font-black text-slate-700">Arahan AI (Opsyenal)</label>
              </div>
              <textarea 
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Contoh: Fokus pada perkataan yang berkaitan dengan rumah"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-sm font-medium focus:border-amber-400 outline-none transition-all resize-none h-24"
              />
            </div>
          )}

          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <p className="font-extrabold text-indigo-900 leading-tight">Literasi Arab Diutamakan</p>
              <p className="text-indigo-700/80 text-xs mt-1 font-medium">
                Sistem akan menjana soalan-soalan bi-arah (Arab-Melayu) tanpa sebarang transliterasi rumi.
              </p>
            </div>
          </div>

          <button 
            disabled={isGenerating}
            onClick={handlePreview}
            className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-70 transform active:scale-95"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ChevronRight className="w-5 h-5" />}
            Jana Pratinjau Soalan
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-sm">
            <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
              {generatedQuestions.map((q, i) => (
                <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-full text-slate-500">
                      Soalan {i + 1}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">
                      {q.metadata?.direction === 'ar_to_ms' ? 'Ar → Ms' : 'Ms → Ar'}
                    </span>
                  </div>
                  <p className={cn(
                    "font-bold text-slate-800 leading-tight mb-2",
                    q.metadata?.direction === 'ar_to_ms' ? "text-arabic text-2xl" : "text-sm"
                  )} dir={q.metadata?.direction === 'ar_to_ms' ? 'rtl' : 'ltr'}>
                    {q.prompt}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={cn(
                      "p-2 rounded-lg text-xs font-black border",
                      q.metadata?.direction === 'ms_to_ar' ? "text-arabic text-right mb-1" : ""
                    )} dir={q.metadata?.direction === 'ms_to_ar' ? 'rtl' : 'ltr'}>
                      <span className="text-emerald-600">✓ {q.answer}</span>
                    </div>
                    {q.distractors?.map((d, di) => (
                      <div key={di} className={cn(
                        "p-2 rounded-lg text-xs font-bold border border-slate-100 text-slate-400 truncate",
                        q.metadata?.direction === 'ms_to_ar' ? "text-arabic text-right" : ""
                      )} dir={q.metadata?.direction === 'ms_to_ar' ? 'rtl' : 'ltr'}>
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
             <button 
              disabled={isGenerating}
              onClick={handlePreview}
              className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-700 font-black rounded-2xl hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group transform active:scale-95 disabled:opacity-50"
            >
              <RotateCcw className={cn("w-5 h-5 text-slate-400 group-hover:text-indigo-500", isGenerating && "animate-spin")} />
              Jana Semula
            </button>
            <button 
              onClick={handleFinalSave}
              className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 transform active:scale-95"
            >
              <Check className="w-5 h-5" />
              Simpan ({data.length} Flashcard + {generatedQuestions.length} Soalan)
            </button>
          </div>
          
          <button 
            onClick={() => setShowQuestions(false)}
            className="w-full text-slate-400 hover:text-slate-600 font-bold text-xs flex items-center justify-center gap-1 transition-colors"
          >
            Tukar Konfigurasi
          </button>
        </div>
      )}

      {!showQuestions && (
        <button 
          onClick={onBack}
          className="text-slate-400 hover:text-slate-600 font-bold text-xs flex items-center gap-1 mx-auto transition-colors"
        >
          <ArrowLeft className="w-3 h-3" /> Kembali ke pemilihan ikon
        </button>
      )}
    </div>
  );
}

