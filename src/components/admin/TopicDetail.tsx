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
  Settings,
  LayoutDashboard,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { db } from '../../lib/db';
import { Question, Topic } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import VocabImporter from './VocabImporter';
import QuestionGenerator from './QuestionGenerator';
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
  const [showGenerator, setShowGenerator] = useState(false);
  const [activeTab, setActiveTab] = useState<HeaderTabs>('vocabulary');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editName, setEditName] = useState(topic.name);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSets, setExpandedSets] = useState<string[]>([]);
  
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

  const handleAddManual = async () => {
    const arabic = window.prompt("Masukkan perkataan Arab:");
    const meaning = window.prompt("Masukkan maksud dalam Bahasa Melayu:");
    if (!arabic || !meaning) return;

    try {
      await db.vocabulary.create({
        topic_id: topic.id,
        arabic,
        meaning_ms: meaning,
        transliteration: '',
        image_keyword: ''
      });
      fetchData();
      toast.success('Berjaya menambah perkataan!');
    } catch (err) {
      toast.error('Gagal menambah.');
    }
  };

  const handleDeleteSet = async (setName: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Padam set soalan?',
      message: `Adakah anda pasti mahu memadam set soalan '${setName}'? Semua soalan dalam set ini akan dipadam kekal.`,
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const { error } = await supabase
            .from('questions')
            .delete()
            .eq('topic_id', topic.id)
            .filter('metadata->>set_name', 'eq', setName);
          
          if (error) throw error;
          
          toast.success('Set soalan berjaya dipadam.');
          fetchData();
        } catch (err: any) {
          toast.error('Gagal padam set: ' + err.message);
        } finally {
          setIsDeleting(false);
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const groupQuestionsBySet = () => {
    const sets: Record<string, Question[]> = {};
    questions.forEach(q => {
      const metadata = q.metadata as any;
      const setName = metadata?.set_name || 'Tanpa Nama Set';
      if (!sets[setName]) sets[setName] = [];
      sets[setName].push(q);
    });
    return sets;
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

  return (
    <div className="max-w-6xl mx-auto pb-32 relative">
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
          <p className="text-slate-500 font-medium mt-1">Urus perpustakaan kosa kata dan jana set soalan latihan.</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setShowImporter(true)}
            className="px-5 py-3 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <Upload className="w-5 h-5" /> Muat Naik CSV
          </button>
          <button 
            onClick={handleAddManual}
            className="px-5 py-3 bg-white border border-slate-200 rounded-2xl flex items-center gap-2 font-black hover:bg-slate-50 transition-all text-slate-600 shadow-sm"
          >
            <Plus className="w-5 h-5 text-emerald-500" /> Tambah Manual
          </button>
        </div>
      </div>

      {breadcrumbs}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 p-1 bg-slate-100 w-fit rounded-2xl mt-8">
        <button 
          onClick={() => setActiveTab('vocabulary')}
          className={cn(
            "px-6 py-2 rounded-xl font-black text-sm transition-all flex items-center gap-2",
            activeTab === 'vocabulary' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <Database className="w-4 h-4" /> Pustaka Kosa Kata ({vocabulary.length})
        </button>
        <button 
          onClick={() => setActiveTab('questions')}
          className={cn(
            "px-6 py-2 rounded-xl font-black text-sm transition-all flex items-center gap-2",
            activeTab === 'questions' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
          )}
        >
          <BookOpen className="w-4 h-4" /> Soalan ({questions.length})
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400 text-center">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-indigo-500" />
          <p className="font-bold text-slate-800 uppercase tracking-widest text-[10px]">Memuatkan Data...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'vocabulary' ? (
            <motion.div 
              key="vocab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex gap-4 items-center mb-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                  <input 
                    placeholder="Cari perkataan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-100 shadow-sm transition-all"
                  />
                </div>
                <button 
                  onClick={() => setShowGenerator(true)}
                  disabled={vocabulary.length < 4}
                  className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  <BrainCircuit className="w-5 h-5" /> Jana Set Soalan
                </button>
              </div>

              {vocabulary.length === 0 ? (
                <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 text-center flex flex-col items-center">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                     <Database className="w-12 h-12 text-slate-200" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800">Pustaka Kosong</h3>
                   <p className="text-slate-500 max-w-sm mt-2 font-medium">Muat naik fail CSV atau tambah manual untuk mula membina soalan.</p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="grid grid-cols-12 bg-slate-50 px-6 py-4 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="col-span-4">Bahasa Arab</div>
                    <div className="col-span-1">Ikon</div>
                    <div className="col-span-5">Terjemahan Melayu</div>
                    <div className="col-span-2 text-right">Tindakan</div>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto">
                    {vocabulary
                      .filter(v => 
                        v.arabic.includes(searchQuery) || 
                        v.meaning_ms.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((v) => (
                        <div key={v.id} className="grid grid-cols-12 px-6 py-5 items-center hover:bg-slate-50 transition-colors group">
                          <div className="col-span-4">
                            <p className="text-arabic text-xl text-slate-800 font-bold leading-none">{v.arabic}</p>
                            {v.transliteration && <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{v.transliteration}</p>}
                          </div>
                          <div className="col-span-1">
                            {v.image_keyword ? (
                              <div className="w-8 h-8 bg-white border border-slate-100 rounded-lg p-1 flex items-center justify-center">
                                <img src={`https://openmoji.org/data/color/svg/${v.image_keyword}.svg`} alt="" className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                                <Plus className="w-3 h-3 text-slate-200" />
                              </div>
                            )}
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
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="qs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {Object.keys(groupQuestionsBySet()).length === 0 ? (
                <div className="bg-white p-20 rounded-[40px] border border-dashed border-slate-200 text-center flex flex-col items-center">
                   <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                     <BrainCircuit className="w-12 h-12 text-slate-200" />
                   </div>
                   <h3 className="text-2xl font-black text-slate-800">Tiada Set Soalan</h3>
                   <p className="text-slate-500 max-w-sm mt-2 font-medium">Pergi ke Pustaka Kosa Kata untuk menjana set soalan baru secara automatik.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupQuestionsBySet()).map(([setName, setQs]) => {
                    const isExpanded = expandedSets.includes(setName);
                    const sampleQ = setQs[0];
                    const metadata = sampleQ.metadata as any;
                    const method = metadata?.generation_method || 'manual';
                    
                    return (
                      <div key={setName} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "p-3 rounded-2xl",
                              method === 'ai_enhanced' ? "bg-amber-50 text-amber-600" : "bg-indigo-50 text-indigo-600"
                            )}>
                              {method === 'ai_enhanced' ? <Sparkles className="w-5 h-5" /> : <Database className="w-5 h-5" />}
                            </div>
                            <div>
                              <h4 className="font-black text-slate-800 text-lg leading-tight">{setName}</h4>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{setQs.length} Soalan</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(sampleQ.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                             <button 
                               onClick={() => handleDeleteSet(setName)}
                               className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                             >
                               <Trash2 className="w-5 h-5" />
                             </button>
                             <button 
                               onClick={() => setExpandedSets(prev => isExpanded ? prev.filter(s => s !== setName) : [...prev, setName])}
                               className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest"
                             >
                               {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                               {isExpanded ? 'Tutup' : 'Lihat'}
                             </button>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="border-t border-slate-50"
                            >
                              <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                  <tbody className="divide-y divide-slate-50">
                                    {setQs.map((q, idx) => (
                                      <tr key={q.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-[10px] font-black text-slate-300">{(idx + 1).toString().padStart(2, '0')}</td>
                                        <td className="p-4">
                                          <p className={cn("font-bold text-slate-800", q.metadata?.direction === 'ar_to_ms' ? "text-arabic text-xl text-right" : "text-sm")}>
                                            {q.prompt}
                                          </p>
                                        </td>
                                        <td className="p-4">
                                          <p className={cn("font-black text-indigo-600", q.metadata?.direction === 'ms_to_ar' ? "text-arabic text-xl" : "text-sm")}>
                                            {q.answer}
                                          </p>
                                        </td>
                                        <td className="p-4 text-right">
                                          <button 
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            className="p-2 text-slate-300 hover:text-rose-500 rounded-lg"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {showImporter && (
        <VocabImporter 
          topicId={topic.id}
          onClose={() => setShowImporter(false)}
          onComplete={fetchData}
        />
      )}

      {showGenerator && (
        <QuestionGenerator 
          topicId={topic.id}
          userId={user.id}
          library={vocabulary.map(v => ({
            id: v.id,
            arabic: v.arabic,
            meaning_ms: v.meaning_ms,
            transliteration: v.transliteration,
            image_keyword: v.image_keyword
          }))}
          onClose={() => setShowGenerator(false)}
          onComplete={fetchData}
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

