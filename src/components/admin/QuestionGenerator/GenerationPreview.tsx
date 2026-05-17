import React, { useState } from 'react';
import { motion } from 'motion/react';
import { GeneratedMCQ } from '../../../lib/questionGenerator';
import { SubjectFieldSchema } from '../../../lib/subjectPresets';
import { getTermFontClass, isRTL } from '../../../lib/subjectHelpers';
import { Trash2, RotateCcw, CheckCircle2, ChevronLeft, Loader2, Sparkles, Edit2, X, Save } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/Button';

interface Step2Props {
  questions: GeneratedMCQ[];
  schema: SubjectFieldSchema;
  isEnhancing: boolean;
  enhanceProgress: number;
  onSave: (finalQuestions: GeneratedMCQ[]) => void;
  onBack: () => void;
}

export default function GenerationPreview({ questions, schema, isEnhancing, enhanceProgress, onSave, onBack }: Step2Props) {
  const [items, setItems] = useState(questions);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<GeneratedMCQ | null>(null);

  React.useEffect(() => {
    if (questions.length > 0) {
      setItems(questions);
    }
  }, [questions]);

  const handleDelete = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditForm(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...items[index] });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditForm(null);
  };

  const saveEdit = () => {
    if (editingIndex !== null && editForm) {
      const newItems = [...items];
      newItems[editingIndex] = editForm;
      setItems(newItems);
      setEditingIndex(null);
      setEditForm(null);
    }
  };

  const isEmpty = items.length === 0 && !isEnhancing;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-black text-slate-800">Pratonton Soalan</h3>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Langkah 2: Semak & Simpan</p>
      </div>

      {isEnhancing && (
        <div className="bg-primary/5 border border-primary/10 p-6 rounded-[32px] space-y-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
               <Loader2 className="w-5 h-5 text-primary animate-spin" />
               <p className="text-sm font-black text-primary">Sila tunggu, AI sedang menjana soalan...</p>
             </div>
             <span className="text-xs font-black text-primary">{Math.round(enhanceProgress)}%</span>
           </div>
           <div className="w-full h-2 bg-primary/10 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${enhanceProgress}%` }}
               className="h-full bg-primary"
             />
           </div>
           <p className="text-[10px] font-bold text-primary/60 text-center uppercase tracking-widest">Ini mungkin mengambil masa 5-10 saat</p>
        </div>
      )}

      <div className="max-h-[500px] overflow-y-auto border border-slate-100 rounded-3xl overflow-hidden relative">
        {isEmpty && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400">
            <Sparkles className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-bold text-sm">Tiada soalan dijanakan.</p>
          </div>
        )}
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
            {items.map((q, i) => {
              const isEditing = editingIndex === i;
              
              if (isEditing && editForm) {
                return (
                  <tr key={i} className="bg-indigo-50/30">
                    <td className="p-4 text-[10px] font-black text-indigo-300">{(i + 1).toString().padStart(2, '0')}</td>
                    <td className="p-4" colSpan={2}>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1 block">Soalan / Prompt</label>
                          <input 
                            value={editForm.prompt}
                            onChange={e => setEditForm({ ...editForm, prompt: e.target.value })}
                            dir={isRTL(schema) && editForm.direction === 'term_to_meaning' ? 'rtl' : 'ltr'}
                            className={cn(
                              "w-full px-4 py-2 border-2 border-indigo-100 rounded-xl outline-none focus:border-indigo-500 font-bold",
                              editForm.direction === 'term_to_meaning' 
                                ? cn(getTermFontClass(schema), isRTL(schema) ? "text-3xl" : "text-base") 
                                : "text-sm",
                              isRTL(schema) && editForm.direction === 'term_to_meaning' && "text-right"
                            )}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mb-1 block">Jawapan Betul</label>
                            <input 
                              value={editForm.answer}
                              onChange={e => setEditForm({ ...editForm, answer: e.target.value })}
                              dir={isRTL(schema) && editForm.direction === 'meaning_to_term' ? 'rtl' : 'ltr'}
                              className={cn(
                                "w-full px-4 py-2 border-2 border-emerald-100 rounded-xl outline-none focus:border-emerald-500 font-bold text-emerald-700",
                                editForm.direction === 'meaning_to_term' 
                                  ? cn(getTermFontClass(schema), isRTL(schema) ? "text-3xl" : "text-base") 
                                  : "text-sm",
                                isRTL(schema) && editForm.direction === 'meaning_to_term' && "text-right"
                              )}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1 block">Pilihan Salah (Distractors)</label>
                            {editForm.distractors.map((d, di) => (
                              <input 
                                key={di}
                                value={d}
                                onChange={e => {
                                  const newDistractors = [...editForm.distractors] as [string, string, string];
                                  newDistractors[di] = e.target.value;
                                  setEditForm({ ...editForm, distractors: newDistractors });
                                }}
                                dir={isRTL(schema) && editForm.direction === 'meaning_to_term' ? 'rtl' : 'ltr'}
                                className={cn(
                                  "w-full px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-rose-400 text-slate-600",
                                  editForm.direction === 'meaning_to_term' 
                                    ? cn(getTermFontClass(schema), isRTL(schema) ? "text-xl" : "text-sm") 
                                    : "text-xs font-bold",
                                  isRTL(schema) && editForm.direction === 'meaning_to_term' && "text-right"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={saveEdit}
                          className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                          title="Simpan"
                        >
                          <Save className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={cancelEditing}
                          className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all"
                          title="Batal"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors group">
                  <td className="p-4 text-[10px] font-black text-slate-300">{(i + 1).toString().padStart(2, '0')}</td>
                  <td className="p-4">
                    <div 
                      dir={isRTL(schema) && q.direction === 'term_to_meaning' ? 'rtl' : 'ltr'}
                      className={cn("leading-tight", q.direction === 'term_to_meaning' ? cn(getTermFontClass(schema), isRTL(schema) ? "text-3xl" : "text-base font-bold text-slate-800") : "text-sm font-bold text-slate-800", isRTL(schema) && q.direction === 'term_to_meaning' && "text-right")}
                    >
                      {q.prompt}
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                      {q.direction === 'term_to_meaning' ? `${schema.term_label} → ${schema.meaning_label}` : `${schema.meaning_label} → ${schema.term_label}`}
                    </div>
                  </td>
                  <td className="p-4">
                    <div 
                      dir={isRTL(schema) && q.direction === 'meaning_to_term' ? 'rtl' : 'ltr'}
                      className={cn("font-black", q.direction === 'meaning_to_term' ? cn(getTermFontClass(schema), isRTL(schema) ? "text-3xl text-emerald-600" : "text-base text-emerald-600") : "text-sm text-emerald-600", isRTL(schema) && q.direction === 'meaning_to_term' && "text-right")}
                    >
                      {q.answer}
                    </div>
                    <div className={cn("flex gap-2 flex-wrap mt-2", isRTL(schema) && q.direction === 'meaning_to_term' && "justify-end")}>
                      {q.distractors.map((d, di) => (
                        <span key={di} className={cn("px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md", q.direction === 'meaning_to_term' ? cn(getTermFontClass(schema), isRTL(schema) ? "text-lg" : "text-xs") : "text-[10px] font-bold")}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => startEditing(i)}
                        className="p-2 text-slate-300 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(i)}
                        className="p-2 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
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
              disabled={editingIndex !== null}
              onClick={() => onSave(items)}
              className={cn(
                "flex-1 py-4 font-black rounded-2xl shadow-lg transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3",
                editingIndex !== null 
                  ? "bg-slate-100 text-slate-300 cursor-not-allowed shadow-none" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              Simpan Set Soalan <CheckCircle2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
