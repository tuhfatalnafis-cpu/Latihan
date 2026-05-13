import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  ChevronRight, 
  BookOpen, 
  FileText, 
  FolderOpen,
  Trash2,
  Edit2,
  Loader2,
  ArrowLeft,
  MoreVertical,
  CheckCircle2
} from 'lucide-react';
import { db } from '../../lib/db';
import { Subject, Syllabus, Topic } from '../../lib/supabase';
import { User } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import TopicDetail from './TopicDetail';
import ConfirmDialog from '../ui/ConfirmDialog';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ContentManagerProps {
  user: User;
}

type ViewState = 
  | { type: 'subjects' }
  | { type: 'syllabi', subject: Subject }
  | { type: 'topics', subject: Subject, syllabus: Syllabus }
  | { type: 'topic_detail', subject: Subject, syllabus: Syllabus, topic: Topic };

export default function ContentManager({ user }: ContentManagerProps) {
  const [view, setView] = useState<ViewState>({ type: 'subjects' });
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [syllabi, setSyllabi] = useState<Syllabus[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemGrade, setNewItemGrade] = useState('');

  // Confirmation state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string | React.ReactNode;
    onConfirm: () => void;
    id: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    id: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view.type === 'subjects') {
        const data = await db.subjects.list();
        setSubjects(data);
      } else if (view.type === 'syllabi') {
        const data = await db.syllabi.listForSubject(view.subject.id);
        setSyllabi(data);
      } else if (view.type === 'topics') {
        const data = await db.topics.listForSyllabus(view.syllabus.id);
        setTopics(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newItemName.trim()) return;
    try {
      if (view.type === 'subjects') {
        await db.subjects.create({ name: newItemName, grade: newItemGrade, created_by: user.id });
      } else if (view.type === 'syllabi') {
        await db.syllabi.create({ name: newItemName, subject_id: view.subject.id, created_by: user.id });
      } else if (view.type === 'topics') {
        await db.topics.create({ name: newItemName, syllabus_id: view.syllabus.id, order_index: topics.length });
      }
      setNewItemName('');
      setNewItemGrade('');
      setShowAddModal(false);
      fetchData();
      toast.success('Berjaya ditambah');
    } catch (err) {
      toast.error('Gagal menambah item: ' + (err as any).message);
    }
  };

  const [editingItem, setEditingItem] = useState<{ id: string, name: string, grade?: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    try {
      if (view.type === 'subjects') await db.subjects.update(editingItem.id, { name: editingItem.name, grade: editingItem.grade });
      else if (view.type === 'syllabi') await db.syllabi.update(editingItem.id, { name: editingItem.name });
      setEditingItem(null);
      fetchData();
      toast.success('Berjaya dikemaskini');
    } catch (err) {
      toast.error('Gagal mengemaskini.');
    }
  };

  const handleDeleteClick = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setLoading(true);
    try {
      let message = '';
      let title = '';

      if (view.type === 'subjects') {
        const { data: syData } = await supabase.from('syllabi').select('id').eq('subject_id', id);
        const syIds = syData?.map(s => s.id) || [];
        
        let topIds: string[] = [];
        if (syIds.length > 0) {
          const { data: topData } = await supabase.from('topics').select('id').in('syllabus_id', syIds);
          topIds = topData?.map(t => t.id) || [];
        }

        let qCount = 0;
        if (topIds.length > 0) {
          const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).in('topic_id', topIds);
          qCount = count || 0;
        }

        title = `Padam subjek '${name}'?`;
        message = `Ini akan turut memadam:\n• ${syIds.length} silibus\n• ${topIds.length} topik\n• ${qCount} soalan\n• Semua kemajuan pelajar berkaitan\n\nTindakan ini tidak boleh dibuat asal.`;
      } else if (view.type === 'syllabi') {
        const { data: topData } = await supabase.from('topics').select('id').eq('syllabus_id', id);
        const topIds = topData?.map(t => t.id) || [];

        let qCount = 0;
        if (topIds.length > 0) {
          const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true }).in('topic_id', topIds);
          qCount = count || 0;
        }

        title = `Padam silibus '${name}'?`;
        message = `Ini akan turut memadam:\n• ${topIds.length} topik\n• ${qCount} soalan\n• Semua kemajuan pelajar berkaitan\n\nTindakan ini tidak boleh dibuat asal.`;
      } else if (view.type === 'topics') {
        const { count: qCount } = await supabase.from('questions').select('*', { count: 'exact', head: true }).eq('topic_id', id);

        title = `Padam topik '${name}'?`;
        message = `Ini akan turut memadam:\n• ${qCount || 0} soalan\n• Semua kemajuan pelajar berkaitan\n\nTindakan ini tidak boleh dibuat asal.`;
      }

      setConfirmState({
        isOpen: true,
        id,
        title,
        message,
        onConfirm: () => execDelete(id),
      });
    } catch (err) {
      toast.error('Gagal memuatkan maklumat pandaman.');
    } finally {
      setLoading(false);
    }
  };

  const execDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      let error;
      if (view.type === 'subjects') {
        const res = await supabase.from('subjects').delete().eq('id', id);
        error = res.error;
      } else if (view.type === 'syllabi') {
        const res = await supabase.from('syllabi').delete().eq('id', id);
        error = res.error;
      } else if (view.type === 'topics') {
        const res = await supabase.from('topics').delete().eq('id', id);
        error = res.error;
      }

      if (error) throw error;

      toast.success('Berjaya dipadam');
      setConfirmState(prev => ({ ...prev, isOpen: false }));
      fetchData();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(`Gagal memadam: ${err.message || 'Ralat tidak diketahui'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderBreadcrumbs = () => {
    const crumbs = [{ label: 'Subjek', view: { type: 'subjects' } as ViewState }];
    if ('subject' in view) crumbs.push({ label: view.subject.name, view: { type: 'syllabi', subject: view.subject } as ViewState });
    if ('syllabus' in view) crumbs.push({ label: view.syllabus.name, view: { type: 'topics', subject: view.subject, syllabus: view.syllabus } as ViewState });
    if ('topic' in view) crumbs.push({ label: view.topic.name, view: view });

    return (
      <div className="flex items-center gap-2 mb-8 text-sm font-bold overflow-x-auto whitespace-nowrap pb-2 bg-slate-50/50 p-3 rounded-2xl">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
            <button 
              onClick={() => setView(c.view as ViewState)}
              className={cn(
                "transition-colors px-2 py-1 rounded-lg",
                i === crumbs.length - 1 ? "text-primary bg-primary/5" : "text-ink-muted hover:text-ink hover:bg-white"
              )}
            >
              {c.label}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  if (view.type === 'topic_detail') {
    return (
      <TopicDetail 
        user={user} 
        topic={view.topic} 
        onBack={() => setView({ type: 'topics', subject: view.subject, syllabus: view.syllabus })} 
        onUpdate={(updatedTopic) => {
          setView({ ...view, topic: updatedTopic });
          fetchData();
        }}
        onDelete={() => {
          fetchData();
          setView({ type: 'topics', subject: view.subject, syllabus: view.syllabus });
        }}
        breadcrumbs={renderBreadcrumbs()}
      />
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          {view.type !== 'subjects' && (
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => {
                if (view.type === 'syllabi') setView({ type: 'subjects' });
                else if (view.type === 'topics') setView({ type: 'syllabi', subject: view.subject });
              }}
              className="p-2 h-10 w-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="text-3xl font-black text-ink tracking-tight">
            {view.type === 'subjects' ? 'Kandungan Akademik' : 
             view.type === 'syllabi' ? view.subject.name :
             view.syllabus.name}
          </h1>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="rounded-[2rem] px-8 shadow-soft-lg group"
        >
          <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" /> 
          Tambah {view.type === 'subjects' ? 'Subjek' : view.type === 'syllabi' ? 'Silibus' : 'Topik'}
        </Button>
      </div>

      {renderBreadcrumbs()}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-ink-muted animate-in fade-in zoom-in">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
          <p className="font-extrabold text-lg">Memuatkan data...</p>
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {view.type === 'subjects' && Object.entries(
            subjects.reduce((acc, s) => {
              const grade = s.grade || 'Lain-lain';
              if (!acc[grade]) acc[grade] = [];
              acc[grade].push(s);
              return acc;
            }, {} as Record<string, Subject[]>)
          )
          .sort(([a], [b]) => {
            if (a === 'Lain-lain') return 1;
            if (b === 'Lain-lain') return -1;
            return a.localeCompare(b, undefined, { numeric: true });
          })
          .map(([grade, gradeSubjects]) => (
            <React.Fragment key={grade}>
              <div className="col-span-full mt-4 mb-2">
                <h5 className="text-sm font-black text-ink-muted uppercase tracking-[0.2em] flex items-center gap-3">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg">{grade}</span>
                  <div className="h-px flex-1 bg-slate-100" />
                </h5>
              </div>
              {gradeSubjects.map(s => (
                <Card 
                  key={s.id} 
                  onClick={() => setView({ type: 'syllabi', subject: s })}
                  className="cursor-pointer group relative overflow-hidden flex flex-col"
                  hover
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-4 bg-primary/5 text-primary rounded-2xl w-fit group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-300">
                      <BookOpen className="w-8 h-8" />
                    </div>
                    {s.grade && (
                      <span className="bg-slate-100 text-ink-muted text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                        {s.grade}
                      </span>
                    )}
                  </div>
                  
                  {editingItem?.id === s.id ? (
                    <form onClick={e => e.stopPropagation()} onSubmit={handleUpdate} className="flex flex-col gap-3">
                       <div>
                         <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest block mb-1">Nama Subjek</label>
                         <input 
                           value={editingItem.name}
                           onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                           className="w-full px-4 py-2 border-2 border-primary/20 rounded-xl outline-none focus:border-primary font-bold bg-slate-50"
                           autoFocus
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-black text-ink-muted uppercase tracking-widest block mb-1">Gred / Tahun</label>
                         <input 
                           value={editingItem.grade || ''}
                           onChange={e => setEditingItem({ ...editingItem, grade: e.target.value })}
                           placeholder="Contoh: Tahun 1"
                           className="w-full px-4 py-2 border-2 border-primary/20 rounded-xl outline-none focus:border-primary font-bold bg-slate-50"
                         />
                       </div>
                       <Button type="submit" size="sm" className="w-full py-3"><CheckCircle2 className="w-5 h-5 mr-2" /> Simpan</Button>
                    </form>
                  ) : (
                    <>
                      <h3 className="text-xl font-black text-ink mb-2 group-hover:text-primary transition-colors">{s.name}</h3>
                      <p className="text-ink-muted font-medium text-sm leading-relaxed">Klik untuk urus silibus dan modul subjek ini.</p>
                    </>
                  )}
                  
                  <div className="mt-auto pt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingItem({ id: s.id, name: s.name, grade: s.grade }); }}
                        className="p-2 text-ink-muted hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteClick(s.id, s.name, e)}
                        className="p-2 text-ink-muted hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <ChevronRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </Card>
              ))}
            </React.Fragment>
          ))}

          {view.type === 'syllabi' && syllabi.map(s => (
            <Card 
              key={s.id} 
              onClick={() => setView({ type: 'topics', subject: view.subject, syllabus: s })}
              className="cursor-pointer group relative overflow-hidden flex flex-col"
              hover
            >
              <div className="p-4 bg-accent-warm/5 text-accent-warm rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-accent-warm group-hover:text-white transition-all duration-300">
                <FileText className="w-8 h-8" />
              </div>
              
              {editingItem?.id === s.id ? (
                <form onClick={e => e.stopPropagation()} onSubmit={handleUpdate} className="flex gap-2">
                   <input 
                     value={editingItem.name}
                     onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                     className="w-full px-4 py-2 border-2 border-accent-warm/20 rounded-xl outline-none focus:border-accent-warm font-bold bg-slate-50"
                     autoFocus
                   />
                   <Button type="submit" size="sm" className="h-10 w-10 p-0 bg-accent-warm hover:bg-accent-warm/90 border-transparent"><CheckCircle2 className="w-5 h-5" /></Button>
                </form>
              ) : (
                <>
                  <h3 className="text-xl font-black text-ink mb-2 group-hover:text-accent-warm transition-colors">{s.name}</h3>
                  <p className="text-ink-muted font-medium text-sm">Tahun / Gred / Tahap silibus khusus.</p>
                </>
              )}
              
              <div className="mt-auto pt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <div className="flex gap-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingItem({ id: s.id, name: s.name }); }}
                    className="p-2 text-ink-muted hover:text-accent-warm hover:bg-accent-warm/5 rounded-xl transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDeleteClick(s.id, s.name, e)}
                    className="p-2 text-ink-muted hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <ChevronRight className="w-5 h-5 text-accent-warm opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </Card>
          ))}

          {view.type === 'topics' && topics.map(t => (
            <Card 
              key={t.id} 
              onClick={() => setView({ type: 'topic_detail', subject: view.subject, syllabus: view.syllabus, topic: t })}
              className="cursor-pointer group relative overflow-hidden flex flex-col"
              hover
            >
              <div className="p-4 bg-accent-mint/10 text-emerald-600 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:bg-accent-mint group-hover:text-emerald-900 transition-all duration-300">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-ink mb-2 group-hover:text-emerald-600 transition-colors">{t.name}</h3>
              <p className="text-ink-muted font-medium text-sm">Urus kad hafalan dan soalan topik ini.</p>
              
              <div className="mt-auto pt-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <button 
                  onClick={(e) => handleDeleteClick(t.id, t.name, e)}
                  className="p-2 text-ink-muted hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <ChevronRight className="w-5 h-5 text-emerald-600 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
              </div>
            </Card>
          ))}

          {/* Empty State */}
          {((view.type === 'subjects' && subjects.length === 0) ||
            (view.type === 'syllabi' && syllabi.length === 0) ||
            (view.type === 'topics' && topics.length === 0)) && !loading && (
            <div className="col-span-full py-24 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-ink-muted animate-in fade-in slide-in-from-bottom-4">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                <FolderOpen className="w-10 h-10 opacity-20 text-primary" />
              </div>
              <p className="font-extrabold text-lg">Tiada item ditemui.</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-primary font-black hover:underline px-6 py-2 rounded-xl hover:bg-primary/5 transition-all"
              >
                Tambah kandungan pertama sekarang
              </button>
            </div>
          )}
        </motion.div>
      )}

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        isLoading={isDeleting}
      />

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-soft-2xl border-2 border-slate-50"
            >
              <h2 className="text-3xl font-black text-ink mb-6">Tambah {view.type === 'subjects' ? 'Subjek' : view.type === 'syllabi' ? 'Silibus' : 'Topik'}</h2>
              <div className="space-y-4 mb-10">
                <div>
                  <label className="block text-xs font-black text-ink-muted uppercase tracking-widest mb-3 ml-1">Nama {view.type === 'subjects' ? 'Subjek' : view.type === 'syllabi' ? 'Silibus' : 'Topik'}</label>
                  <input 
                    type="text" 
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Masukkan nama..."
                    className="w-full px-6 py-5 bg-bg-cream/50 border-2 border-slate-100 rounded-[1.5rem] focus:border-primary focus:bg-white outline-none transition-all font-bold text-lg"
                    autoFocus
                  />
                </div>
                {view.type === 'subjects' && (
                  <div>
                    <label className="block text-xs font-black text-ink-muted uppercase tracking-widest mb-3 ml-1">Gred / Tahun (Pilihan)</label>
                    <input 
                      type="text" 
                      value={newItemGrade}
                      onChange={(e) => setNewItemGrade(e.target.value)}
                      placeholder="Contoh: Tahun 1"
                      className="w-full px-6 py-5 bg-bg-cream/50 border-2 border-slate-100 rounded-[1.5rem] focus:border-primary focus:bg-white outline-none transition-all font-bold text-lg"
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="ghost"
                  className="flex-1 rounded-2xl h-14"
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </Button>
                <Button 
                  className="flex-1 rounded-2xl h-14 shadow-soft"
                  onClick={handleCreate}
                >
                  Tambah
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
