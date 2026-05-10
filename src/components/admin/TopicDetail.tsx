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
  MoreHorizontal,
  BookOpen,
  Database,
  ArrowRight,
  Settings
} from 'lucide-react';
import { db } from '../../lib/db';
import { Question, Topic } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import CsvImporter from './CsvImporter';
import { generateMcqsFromVocab, generateFlashcardsFromVocab, VocabRow } from '../../lib/questionGenerator';
import { supabase } from '../../lib/supabase';
import ConfirmDialog from '../ui/ConfirmDialog';
import { toast } from 'sonner';

interface TopicDetailProps {
  user: User;
  topic: Topic;
  onBack: () => void;
  onUpdate: (updatedTopic: Topic) => void;
  onDelete: () => void;
  breadcrumbs: React.ReactNode;
}

type HeaderTabs = 'questions' | 'vocabulary';

export default function TopicDetail({ user, topic, onBack, onUpdate, onDelete, breadcrumbs }: TopicDetailProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [vocabulary, setVocabulary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImporter, setShowImporter] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<HeaderTabs>('questions');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editName, setEditName] = useState(topic.name);
  const [showGenOptions, setShowGenOptions] = useState(false);
  const [genLoading, setGenLoading] = useState(false);

  // Confirmation state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [topic.id]);

  const handleGenerateFromVocab = async (type: 'mcq' | 'flashcard') => {
    if (vocabulary.length === 0) return alert('Tiada data perbendaharaan kata.');
    try {
      setGenLoading(true);
      const vocabRows: VocabRow[] = vocabulary.map(v => ({
        arabic: v.arabic,
        meaning_ms: v.meaning_ms,
        transliteration: v.transliteration || '',
        image_keyword: v.image_keyword || ''
      }));

      const newItems = type === 'mcq' 
        ? generateMcqsFromVocab(topic.id, vocabRows, user.id, 10)
        : generateFlashcardsFromVocab(topic.id, vocabRows, user.id);

      for (const item of newItems) {
        await db.questions.create(item);
      }
      
      fetchData();
      setActiveTab('questions');
      alert(`Berjaya menjana ${newItems.length} items!`);
    } catch (err) {
      alert('Gagal menjana.');
    } finally {
      setGenLoading(false);
      setShowGenOptions(false);
    }
  };

  const handleGenerateFromVocabAI = async () => {
    if (vocabulary.length === 0) return alert('Tiada data perbendaharaan kata.');
    try {
      setGenLoading(true);
      const vocabText = vocabulary.map(v => `${v.arabic}: ${v.meaning_ms}`).join(', ');
      const prompt = `Gunakan senarai perbendaharaan kata ini untuk menjana soalan MCQ: ${vocabText}`;

      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count: 10 })
      });
      
      const data = await res.json();
      if (!data || !Array.isArray(data)) throw new Error('Invalid AI Response');

      for (const q of data) {
        await db.questions.create({ ...q, topic_id: topic.id, created_by: user.id });
      }

      fetchData();
      setActiveTab('questions');
      alert('AI berjaya menjana 10 soalan baru berdasarkan vocab sedia ada!');
    } catch (err) {
      alert('AI gagal menjana soalan.');
    } finally {
      setGenLoading(false);
    }
  };

  const handleAIBuilder = async () => {
    const prompt = window.prompt("Beritahu AI apa topik atau perkataan yang anda mahu bina soalan. Contoh: 'Peralatan di sekolah' atau 'Warna-warna dalam bahasa Arab'");
    if (!prompt) return;

    try {
      setGenLoading(true);
      const res = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count: 10 })
      });
      
      const data = await res.json();
      if (!data || !Array.isArray(data)) throw new Error('Invalid AI Response');

      for (const q of data) {
        await db.questions.create({ ...q, topic_id: topic.id, created_by: user.id });
      }

      fetchData();
      setActiveTab('questions');
      alert('AI berjaya menjana 10 soalan baru!');
    } catch (err) {
      alert('AI gagal menjana soalan.');
    } finally {
      setGenLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qs, vocabs] = await Promise.all([
        db.questions.listForTopic(topic.id),
        db.vocabulary.listForTopic(topic.id)
      ]);
      setQuestions(qs);
      setVocabulary(vocabs);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTopic = async () => {
    try {
      const updated = await db.topics.update(topic.id, { name: editName });
      onUpdate(updated);
      setIsEditingTopic(false);
    } catch (err) {
      alert('Gagal mengemaskini topik.');
    }
  };

  const handleDeleteTopicClick = async () => {
    setLoading(true);
    try {
      const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('topic_id', topic.id);
      const { count: vCount } = await supabase.from('vocabulary').select('*', { count: 'exact', head: true }).eq('topic_id', topic.id);

      setConfirmState({
        isOpen: true,
        title: `Padam topik '${topic.name}'?`,
        message: `Ini akan turut memadam:\n• ${qCount || 0} soalan\n• ${vCount || 0} perbendaharaan kata\n• Semua kemajuan pelajar berkaitan\n\nTindakan ini tidak boleh dibuat asal.`,
        onConfirm: async () => {
          setIsDeleting(true);
          const { error } = await supabase.from('topics').delete().eq('id', topic.id);
          setIsDeleting(false);
          if (error) {
            toast.error(`Gagal padam: ${error.message}`);
          } else {
            toast.success('Topik berjaya dipadam');
            setConfirmState(prev => ({ ...prev, isOpen: false }));
            onDelete();
          }
        }
      });
    } catch (err) {
      toast.error('Gagal mengambil maklumat topik.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Padam soalan?',
      message: 'Adakah anda pasti mahu memadam soalan ini? Tindakan ini tidak boleh dibuat asal.',
      onConfirm: async () => {
        setIsDeleting(true);
        const { error } = await supabase.from('questions').delete().eq('id', id);
        setIsDeleting(false);
        if (error) {
          toast.error(`Gagal padam soalan: ${error.message}`);
        } else {
          toast.success('Soalan berjaya dipadam');
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          setQuestions(prev => prev.filter(q => q.id !== id));
        }
      }
    });
  };

  const handleDeleteVocab = async (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      title: `Padam '${name}'?`,
      message: 'Adakah anda pasti mahu memadam perkataan ini?',
      onConfirm: async () => {
        setIsDeleting(true);
        const { error } = await supabase.from('vocabulary').delete().eq('id', id);
        setIsDeleting(false);
        if (error) {
          toast.error(`Gagal padam: ${error.message}`);
        } else {
          toast.success('Perkataan berjaya dipadam');
          setConfirmState(prev => ({ ...prev, isOpen: false }));
          setVocabulary(prev => prev.filter(v => v.id !== id));
        }
      }
    });
  };

  const handleImportSave = async (vocab: VocabRow[], generatedQuestions: Partial<Question>[], withIcons: boolean) => {
    try {
      setIsGenerating(true);
      
      // 1. Save Vocabulary to Database
      const vocabToInsert = vocab.map(v => ({
        topic_id: topic.id,
        arabic: v.arabic,
        meaning_ms: v.meaning_ms,
        transliteration: v.transliteration,
        image_keyword: v.image_keyword,
        metadata: { imported: true }
      }));
      await db.vocabulary.batchCreate(vocabToInsert);

      // 2. Generate and Save Questions (Flashcards + MCQs)
      const flashcards = generateFlashcardsFromVocab(topic.id, vocab, user.id);
      
      for (const card of flashcards) {
        await db.questions.create(card);
      }

      for (const q of generatedQuestions) {
        await db.questions.create({ ...q, topic_id: topic.id, created_by: user.id });
      }
      
      setShowImporter(false);
      fetchData();
      alert('Berjaya mengimport data dan menjana soalan!');
    } catch (err) {
      alert('Gagal menyimpan: ' + (err as any).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          {isEditingTopic ? (
            <div className="flex items-center gap-3">
              <input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-3xl font-black text-slate-800 bg-white border-2 border-indigo-100 rounded-xl px-4 py-1 outline-none focus:border-indigo-500 transition-all"
                autoFocus
              />
              <button onClick={handleUpdateTopic} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100"><CheckCircle2 className="w-6 h-6" /></button>
              <button onClick={() => setIsEditingTopic(false)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100"><XCircle className="w-6 h-6" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-3 group">
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                {topic.name}
              </h1>
              <button onClick={() => setIsEditingTopic(true)} className="p-2 text-slate-300 hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all"><Edit2 className="w-4 h-4" /></button>
              <button onClick={handleDeleteTopicClick} className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
            </div>
          )}
          <p className="text-slate-500 font-medium mt-1">Urus senarai soalan dan perbendaharaan kata.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => handleAIBuilder()}
            disabled={genLoading}
            className="px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 font-bold hover:bg-amber-100 transition-all text-amber-700 shadow-sm"
          >
            {genLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />} 
            AI Builder
          </button>
          <button 
            onClick={() => setShowImporter(true)}
            className="px-5 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 font-bold hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
          >
            <Upload className="w-5 h-5 text-indigo-500" /> Muat Naik CSV
          </button>
        </div>
      </div>

      {breadcrumbs}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 p-1 bg-slate-100 w-fit rounded-2xl mt-8">
        <button 
          onClick={() => setActiveTab('questions')}
          className={cn(
            "px-6 py-2 rounded-xl font-black text-sm transition-all flex items-center gap-2",
            activeTab === 'questions' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <BookOpen className="w-4 h-4" /> Soalan ({questions.length})
        </button>
        <button 
          onClick={() => setActiveTab('vocabulary')}
          className={cn(
            "px-6 py-2 rounded-xl font-black text-sm transition-all flex items-center gap-2",
            activeTab === 'vocabulary' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Database className="w-4 h-4" /> Perbendaharaan Kata ({vocabulary.length})
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p className="font-bold">Memuatkan data...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'questions' ? (
            <motion.div 
              key="qs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {questions.length === 0 ? (
                <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 text-center flex flex-col items-center">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                     <BrainCircuit className="w-12 h-12 text-slate-200" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800">Tiada Soalan Lagi</h3>
                   <p className="text-slate-500 max-w-sm mt-2 font-medium">Jana soalan secara automatik daripada perbendaharaan kata atau import fail CSV.</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50 px-6 py-4 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="col-span-1">No.</div>
                    <div className="col-span-4">Soalan / Pembayang</div>
                    <div className="col-span-3">Jawapan / Arab</div>
                    <div className="col-span-2">Jenis</div>
                    <div className="col-span-2 text-right">Tindakan</div>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {questions.map((q, i) => (
                      <div key={q.id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-slate-50 transition-colors group">
                        <div className="col-span-1 text-[10px] font-black text-slate-300">{(i + 1).toString().padStart(2, '0')}</div>
                        <div className="col-span-4 flex items-center gap-4">
                          {q.metadata.image_url && (
                            <div className="w-10 h-10 bg-white rounded-lg overflow-hidden p-1 shrink-0 border border-slate-100 flex items-center justify-center">
                              <img src={q.metadata.image_url} alt="icon" className="w-full h-full object-contain" />
                            </div>
                          )}
                          <div>
                            <p className={cn("font-bold text-slate-800 leading-tight", q.question_type === 'multiple_choice' && q.metadata.direction === 'ar_to_ms' ? "text-arabic text-xl" : "text-sm")} dir={q.question_type === 'multiple_choice' && q.metadata.direction === 'ar_to_ms' ? 'rtl' : 'ltr'}>
                              {q.prompt}
                            </p>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className={cn("font-black text-slate-900 leading-tight", q.question_type === 'flashcard' || (q.question_type === 'multiple_choice' && q.metadata.direction === 'ms_to_ar') ? "text-arabic text-xl" : "text-sm underline decoration-indigo-500 decoration-2 underline-offset-4")} dir={q.question_type === 'flashcard' || (q.question_type === 'multiple_choice' && q.metadata.direction === 'ms_to_ar') ? 'rtl' : 'ltr'}>
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
                             <button 
                               onClick={() => handleDeleteQuestion(q.id)}
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
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="vocab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {vocabulary.length === 0 ? (
                <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 text-center flex flex-col items-center">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                     <Database className="w-12 h-12 text-slate-200" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800">Pangkalan Kata Kosong</h3>
                   <p className="text-slate-500 max-w-sm mt-2 font-medium">Muat naik fail CSV untuk mengisi pangkalan kata topik ini.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <div>
                      <p className="font-extrabold text-emerald-900 leading-tight">Data Perbendaharaan Kata</p>
                      <p className="text-emerald-700/80 text-xs mt-1 font-medium italic">Anda boleh menggunakan data ini untuk menjana soalan-soalan baru pada bila-bila masa.</p>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => handleGenerateFromVocab('flashcard')}
                         disabled={genLoading}
                         className="px-4 py-2 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-xs font-black hover:bg-emerald-100 transition-all flex items-center gap-2"
                        >
                          <BookOpen className="w-4 h-4" /> Jana Kad Hafalan
                        </button>
                        <button 
                         onClick={() => handleGenerateFromVocab('mcq')}
                         disabled={genLoading}
                         className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                        >
                          <BrainCircuit className="w-4 h-4" /> Jana Soalan (MCQ)
                        </button>
                        <button 
                         onClick={() => handleGenerateFromVocabAI()}
                         disabled={genLoading}
                         className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" /> Jana AI (Vocab)
                        </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-12 bg-slate-50 px-6 py-4 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <div className="col-span-5">Bahasa Arab</div>
                      <div className="col-span-5">Terjemahan Melayu</div>
                      <div className="col-span-2 text-right">Tindakan</div>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                      {vocabulary.map((v) => (
                        <div key={v.id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-slate-50 transition-colors group">
                          <div className="col-span-5">
                            <p className="text-arabic text-xl text-slate-800 font-bold leading-none">{v.arabic}</p>
                            {v.transliteration && <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{v.transliteration}</p>}
                          </div>
                          <div className="col-span-5">
                            <p className="text-sm font-bold text-slate-700">{v.meaning_ms}</p>
                          </div>
                          <div className="col-span-2 text-right">
                             <button 
                               onClick={() => handleDeleteVocab(v.id, v.arabic)}
                               className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {showImporter && (
        <CsvImporter 
          onClose={() => setShowImporter(false)} 
          onSave={handleImportSave}
          topicId={topic.id}
          userId={user.id}
        />
      )}
      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        isLoading={isDeleting}
      />
    </div>
  );
}

