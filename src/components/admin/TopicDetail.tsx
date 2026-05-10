import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  Edit2, 
  Sparkles, 
  Upload,
  BrainCircuit,
  Languages,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import { db } from '../../lib/db';
import { Question, Topic } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import CsvImporter from './CsvImporter';
import { generateMcqsFromVocab, generateFlashcardsFromVocab, VocabRow } from '../../lib/questionGenerator';

interface TopicDetailProps {
  user: User;
  topic: Topic;
  onBack: () => void;
  breadcrumbs: React.ReactNode;
}

export default function TopicDetail({ user, topic, onBack, breadcrumbs }: TopicDetailProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImporter, setShowImporter] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [topic.id]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const data = await db.questions.listForTopic(topic.id);
      setQuestions(data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Adakah anda pasti mahu memadam soalan ini?')) return;
    try {
      await db.questions.delete(id);
      setQuestions(questions.filter(q => q.id !== id));
    } catch (err) {
      alert('Gagal memadam.');
    }
  };

  const handleImportSave = async (vocab: VocabRow[], withIcons: boolean) => {
    try {
      const flashcards = generateFlashcardsFromVocab(topic.id, vocab, user.id);
      
      // Batch save
      for (const card of flashcards) {
        await db.questions.create(card);
      }
      
      setShowImporter(false);
      fetchQuestions();
    } catch (err) {
      alert('Gagal menyimpan vocab: ' + (err as any).message);
    }
  };

  const handleAutoGenerate = async (vocab: VocabRow[]) => {
    setIsGenerating(true);
    try {
      const mcqs = generateMcqsFromVocab(topic.id, vocab, user.id);
      
      // Batch save
      for (const mcq of mcqs) {
        await db.questions.create(mcq);
      }
      
      alert(`${mcqs.length} soalan MCQ berjaya dijana!`);
      fetchQuestions();
    } catch (err) {
      alert('Gagal menjana soalan.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
             {topic.name}
          </h1>
          <p className="text-slate-500 font-medium mt-1">Urus senarai soalan dan kad hafalan untuk topik ini.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImporter(true)}
            className="px-5 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 font-bold hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
          >
            <Upload className="w-5 h-5 text-indigo-500" /> Import CSV / Vocab
          </button>
          
          <button 
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl flex items-center gap-2 font-bold shadow-xl shadow-indigo-100 transition-all"
          >
            <Plus className="w-5 h-5" /> Tambah Manual
          </button>
        </div>
      </div>

      {breadcrumbs}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p className="font-bold">Memuatkan soalan...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 text-center flex flex-col items-center">
           <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
             <BrainCircuit className="w-12 h-12 text-slate-200" />
           </div>
           <h3 className="text-2xl font-black text-slate-800">Topik Ini Masih Kosong</h3>
           <p className="text-slate-500 max-w-sm mt-2 font-medium">Mulakan dengan mengimport senarai perbendaharaan kata atau tambah soalan secara manual.</p>
           <button 
             onClick={() => setShowImporter(true)}
             className="mt-8 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-indigo-100 hover:scale-105 transition-all"
           >
              Mula Import Sekarang
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 px-6 py-4 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <div className="col-span-5">Soalan / Pembayang</div>
              <div className="col-span-3">Jawapan / Arab</div>
              <div className="col-span-2">Jenis</div>
              <div className="col-span-2 text-right">Tindakan</div>
            </div>
            <div className="divide-y divide-slate-50">
              {questions.map((q) => (
                <div key={q.id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-slate-50 transition-colors group">
                  <div className="col-span-5 flex items-center gap-4">
                    {q.metadata.image_url && (
                      <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden p-1 shrink-0 border border-slate-200 flex items-center justify-center">
                        <img src={q.metadata.image_url} alt={q.metadata.image_keyword} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <p className={cn("font-bold text-slate-800", q.question_type === 'multiple_choice' && q.metadata.direction === 'ar_to_ms' ? "text-arabic text-xl" : "text-sm")}>
                        {q.prompt}
                      </p>
                      {q.transliteration && <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-tight">{q.transliteration}</p>}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <p className={cn("font-black text-slate-900", q.question_type === 'flashcard' || (q.question_type === 'multiple_choice' && q.metadata.direction === 'ms_to_ar') ? "text-arabic text-xl" : "text-sm underline decoration-indigo-500 decoration-2 underline-offset-4")}>
                      {q.answer}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                      q.question_type === 'flashcard' ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"
                    )}>
                      {q.question_type === 'flashcard' ? 'KAD' : 'MCQ'}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"><Edit2 className="w-4 h-4" /></button>
                       <button 
                         onClick={() => handleDelete(q.id)}
                         className="p-2 text-slate-300 hover:text-rose-500 hover:bg-white rounded-lg transition-all shadow-sm border border-transparent hover:border-slate-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showImporter && (
        <CsvImporter 
          onClose={() => setShowImporter(false)} 
          onSave={handleImportSave}
          onAutoGenerate={handleAutoGenerate}
        />
      )}
    </div>
  );
}
