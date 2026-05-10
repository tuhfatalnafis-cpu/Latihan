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
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

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
      toast.success('Topik berjaya dikemaskini');
    } catch (err) {
      toast.error('Gagal mengemaskini topik.');
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
    <div className="w-full pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
        <div className="flex-1 w-full">
          {isEditingTopic ? (
            <div className="flex items-center gap-3">
              <input 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-3xl font-black text-ink bg-white border-2 border-primary/20 rounded-2xl px-6 py-2 outline-none focus:border-primary shadow-soft w-full max-w-lg"
                autoFocus
              />
              <Button onClick={handleUpdateTopic} className="h-14 w-14 p-0 bg-accent-mint hover:bg-accent-mint/90 border-transparent text-emerald-900"><CheckCircle2 className="w-6 h-6" /></Button>
              <Button variant="ghost" onClick={() => setIsEditingTopic(false)} className="h-14 w-14 p-0 text-ink-muted"><XCircle className="w-6 h-6" /></Button>
            </div>
          ) : (
            <div className="flex items-center gap-4 group">
              <h1 className="text-4xl font-black text-ink tracking-tight">
                {topic.name}
              </h1>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <button onClick={() => setIsEditingTopic(true)} className="p-3 text-ink-muted hover:text-primary hover:bg-primary/5 rounded-2xl transition-all"><Edit2 className="w-4 h-4" /></button>
                <button onClick={handleDeleteTopicClick} className="p-3 text-ink-muted hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )}
          <p className="text-ink-muted font-bold mt-2 flex items-center gap-2">
            <Database className="w-4 h-4" />
            Urus perpustakaan kosa kata dan jana set soalan latihan pintar.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <Button 
            onClick={() => setShowImporter(true)}
            className="rounded-[1.5rem] bg-primary hover:bg-primary/90 shadow-soft-lg group h-14"
          >
            <Upload className="w-5 h-5 mr-3 group-hover:-translate-y-1 transition-transform" /> Muat Naik CSV
          </Button>
          <Button 
            variant="outline"
            onClick={handleAddManual}
            className="rounded-[1.5rem] h-14 bg-white border-slate-200"
          >
            <Plus className="w-5 h-5 mr-2 text-accent-warm" /> Tambah Manual
          </Button>
        </div>
      </div>

      {breadcrumbs}

      {/* Tabs */}
      <div className="flex gap-4 mb-8 p-1.5 bg-bg-cream/50 w-fit rounded-[2rem] mt-8 border-2 border-slate-50">
        <button 
          onClick={() => setActiveTab('vocabulary')}
          className={cn(
            "px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-3",
            activeTab === 'vocabulary' 
              ? "bg-white text-emerald-700 shadow-soft-lg border-2 border-accent-mint/20" 
              : "text-ink-muted hover:text-ink"
          )}
        >
          <Languages className="w-4 h-4" /> Pustaka Kosa Kata ({vocabulary.length})
        </button>
        <button 
          onClick={() => setActiveTab('questions')}
          className={cn(
            "px-8 py-3 rounded-[1.5rem] font-black text-sm transition-all flex items-center gap-3",
            activeTab === 'questions' 
              ? "bg-white text-primary shadow-soft-lg border-2 border-primary/10" 
              : "text-ink-muted hover:text-ink"
          )}
        >
          <BookOpen className="w-4 h-4" /> Set Soalan ({questions.length})
        </button>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-ink-muted text-center animate-pulse">
          <Loader2 className="w-16 h-16 animate-spin mb-6 text-primary" />
          <p className="font-black text-lg tracking-widest uppercase">Menyediakan Data...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {activeTab === 'vocabulary' ? (
            <motion.div 
              key="vocab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative w-full">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted" />
                  <input 
                    placeholder="Cari perkataan dalam Arab atau Melayu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-8 py-5 bg-white border-2 border-slate-50 rounded-[1.5rem] font-bold text-ink outline-none focus:border-primary shadow-soft focus:shadow-soft-xl transition-all"
                  />
                </div>
                <Button 
                  onClick={() => setShowGenerator(true)}
                  className="w-full md:w-auto px-10 py-5 h-auto bg-accent-mint hover:bg-accent-mint/90 border-transparent text-emerald-900 rounded-[1.5rem] font-black shadow-soft transition-all flex items-center justify-center gap-3"
                >
                  <BrainCircuit className="w-6 h-6" /> Jana Set Latihan
                </Button>
              </div>

              {vocabulary.length === 0 ? (
                <Card className="p-24 border-4 border-dashed text-center flex flex-col items-center">
                   <div className="w-24 h-24 bg-bg-cream rounded-[2rem] flex items-center justify-center mb-6">
                     <Database className="w-12 h-12 text-ink-muted" />
                   </div>
                   <h3 className="text-3xl font-black text-ink">Perpustakaan Kosong</h3>
                   <p className="text-ink-muted max-w-sm mt-3 font-bold">Muat naik fail CSV atau tambah manual perkataan Arab anda untuk mula membina modul pembelajaran.</p>
                </Card>
              ) : (
                <Card className="p-0 overflow-hidden border-2 border-slate-50">
                  <div className="grid grid-cols-12 bg-slate-50/50 px-8 py-5 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-ink-muted">
                    <div className="col-span-4">Kosa Kata Arab</div>
                    <div className="col-span-1 text-center">Ikon</div>
                    <div className="col-span-1"></div>
                    <div className="col-span-4">Terjemahan Melayu</div>
                    <div className="col-span-2 text-right">Tindakan</div>
                  </div>
                  <div className="divide-y divide-slate-50 max-h-[700px] overflow-y-auto custom-scrollbar">
                    {vocabulary
                      .filter(v => 
                        v.arabic.includes(searchQuery) || 
                        v.meaning_ms.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((v) => (
                        <div key={v.id} className="grid grid-cols-12 px-8 py-6 items-center hover:bg-bg-cream/20 transition-all group">
                          <div className="col-span-4">
                            <p className="text-arabic text-3xl text-ink font-bold leading-none mb-2">{v.arabic}</p>
                            {v.transliteration && <p className="text-[10px] text-primary font-black uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded w-fit">{v.transliteration}</p>}
                          </div>
                          <div className="col-span-1 flex justify-center">
                            {v.image_keyword ? (
                              <div className="w-12 h-12 bg-white border-2 border-slate-50 rounded-2xl p-2 flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform">
                                <img src={`https://openmoji.org/data/color/svg/${v.image_keyword}.svg`} alt="" className="w-full h-full object-contain" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-100 opacity-40">
                                <Plus className="w-4 h-4 text-ink-muted" />
                              </div>
                            )}
                          </div>
                          <div className="col-span-1 text-center">
                             <ArrowRight className="w-5 h-5 text-slate-200" />
                          </div>
                          <div className="col-span-4">
                            <p className="text-lg font-black text-ink">{v.meaning_ms}</p>
                          </div>
                          <div className="col-span-2 text-right">
                             <button 
                                onClick={() => handleDeleteVocab(v.id, v.arabic)}
                                className="p-4 text-ink-muted hover:text-rose-500 hover:bg-rose-50 transition-all rounded-[1.5rem] opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </Card>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="qs"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {Object.keys(groupQuestionsBySet()).length === 0 ? (
                <Card className="p-24 border-4 border-dashed text-center flex flex-col items-center">
                   <div className="w-24 h-24 bg-bg-cream rounded-[2rem] flex items-center justify-center mb-6">
                     <BrainCircuit className="w-12 h-12 text-ink-muted" />
                   </div>
                   <h3 className="text-3xl font-black text-ink">Tiada Set Latihan</h3>
                   <p className="text-ink-muted max-w-sm mt-3 font-bold">Gunakan perpustakaan kosa kata atau jana soalan terus menggunakan AI Pintar tanpa fail CSV.</p>
                </Card>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupQuestionsBySet()).map(([setName, setQs]) => {
                    const isExpanded = expandedSets.includes(setName);
                    const sampleQ = setQs[0];
                    const metadata = sampleQ.metadata as any;
                    const method = metadata?.generation_method || 'manual';
                    
                    return (
                      <Card key={setName} className="p-0 overflow-hidden border-2 border-slate-50" hover>
                        <div 
                          className="p-8 flex flex-col md:flex-row items-start md:items-center justify-between cursor-pointer group"
                          onClick={() => setExpandedSets(prev => isExpanded ? prev.filter(s => s !== setName) : [...prev, setName])}
                        >
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-300",
                              method === 'ai_enhanced' 
                                ? "bg-accent-warm/10 text-accent-warm group-hover:bg-accent-warm group-hover:text-white" 
                                : "bg-primary/5 text-primary group-hover:bg-primary group-hover:text-white"
                            )}>
                              {method === 'ai_enhanced' ? <Sparkles className="w-8 h-8" /> : <Database className="w-8 h-8" />}
                            </div>
                            <div>
                              <h4 className="font-black text-ink text-2xl tracking-tight leading-none group-hover:text-primary transition-colors">{setName}</h4>
                              <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full">
                                  <span className="text-[10px] font-black text-ink tracking-widest uppercase">{setQs.length} SOALAN</span>
                                </div>
                                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full">
                                  <span className="text-[10px] font-black text-ink-muted tracking-widest uppercase">{new Date(sampleQ.created_at).toLocaleDateString('ms-MY')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-6 md:mt-0 w-full md:w-auto">
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleDeleteSet(setName); }}
                               className="p-4 text-ink-muted hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"
                             >
                               <Trash2 className="w-6 h-6" />
                             </button>
                             <div className={cn(
                               "p-4 rounded-2xl transition-all duration-300 bg-slate-50",
                               isExpanded ? "rotate-180 bg-primary/10 text-primary" : "text-ink-muted group-hover:bg-primary/5 group-hover:text-primary"
                             )}>
                               <ChevronDown className="w-6 h-6" />
                             </div>
                          </div>
                        </div>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t-2 border-slate-50 bg-slate-50/10"
                            >
                              <div className="max-h-[500px] overflow-y-auto custom-scrollbar px-8 py-4">
                                <table className="w-full text-left">
                                  <thead>
                                    <tr className="text-[10px] font-black text-ink-muted uppercase tracking-[0.2em]">
                                      <th className="py-4">No.</th>
                                      <th className="py-4">Soalan / Prompt</th>
                                      <th className="py-4">Jawapan Betul</th>
                                      <th className="py-4 text-right">Tindakan</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {setQs.map((q, idx) => (
                                      <tr key={q.id} className="group/row">
                                        <td className="py-5 font-black text-slate-200">{(idx + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-5 max-w-md pr-10">
                                          <p className={cn("font-bold text-ink", q.metadata?.direction === 'ar_to_ms' ? "text-arabic text-3xl leading-relaxed" : "text-base")}>
                                            {q.prompt}
                                          </p>
                                          {q.metadata?.direction === 'ar_to_ms' && q.transliteration && (
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 opacity-50">{q.transliteration}</p>
                                          )}
                                        </td>
                                        <td className="py-5">
                                          <div className={cn(
                                            "font-black px-4 py-2 rounded-xl inline-block",
                                            q.metadata?.direction === 'ms_to_ar' ? "text-arabic text-3xl text-emerald-700 bg-emerald-50" : "text-base text-primary bg-primary/5"
                                          )}>
                                            {q.answer}
                                          </div>
                                        </td>
                                        <td className="py-5 text-right">
                                          <button 
                                            onClick={() => handleDeleteQuestion(q.id)}
                                            className="p-3 text-ink-muted hover:text-rose-500 hover:bg-rose-50 transition-all rounded-xl opacity-0 group-hover/row:opacity-100"
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
                      </Card>
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

