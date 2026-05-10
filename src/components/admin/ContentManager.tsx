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
        await db.subjects.create({ name: newItemName, created_by: user.id });
      } else if (view.type === 'syllabi') {
        await db.syllabi.create({ name: newItemName, subject_id: view.subject.id, created_by: user.id });
      } else if (view.type === 'topics') {
        await db.topics.create({ name: newItemName, syllabus_id: view.syllabus.id, order_index: topics.length });
      }
      setNewItemName('');
      setShowAddModal(false);
      fetchData();
    } catch (err) {
      alert('Gagal menambah item: ' + (err as any).message);
    }
  };

  const [editingItem, setEditingItem] = useState<{ id: string, name: string } | null>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;
    try {
      if (view.type === 'subjects') await db.subjects.update(editingItem.id, { name: editingItem.name });
      else if (view.type === 'syllabi') await db.syllabi.update(editingItem.id, { name: editingItem.name });
      setEditingItem(null);
      fetchData();
    } catch (err) {
      alert('Gagal mengemaskini.');
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
      <div className="flex items-center gap-2 mb-8 text-sm font-bold overflow-x-auto whitespace-nowrap pb-2">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />}
            <button 
              onClick={() => setView(c.view as ViewState)}
              className={cn(
                "transition-colors",
                i === crumbs.length - 1 ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
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
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {view.type !== 'subjects' && (
            <button 
              onClick={() => {
                if (view.type === 'syllabi') setView({ type: 'subjects' });
                else if (view.type === 'topics') setView({ type: 'syllabi', subject: view.subject });
              }}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Kandungan Akademik</h1>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 font-black shadow-xl shadow-indigo-100 transition-all"
        >
          <Plus className="w-5 h-5" /> Tambah {view.type === 'subjects' ? 'Subjek' : view.type === 'syllabi' ? 'Silibus' : 'Topik'}
        </button>
      </div>

      {renderBreadcrumbs()}

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
          <p className="font-bold">Memuatkan data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {view.type === 'subjects' && subjects.map(s => (
            <div 
              key={s.id} 
              onClick={() => setView({ type: 'syllabi', subject: s })}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="w-8 h-8" />
              </div>
              
              {editingItem?.id === s.id ? (
                <form onClick={e => e.stopPropagation()} onSubmit={handleUpdate} className="flex gap-2">
                   <input 
                     value={editingItem.name}
                     onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                     className="w-full px-4 py-2 border-2 border-indigo-100 rounded-xl outline-none focus:border-indigo-500 font-bold"
                     autoFocus
                   />
                   <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl"><CheckCircle2 className="w-5 h-5" /></button>
                </form>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{s.name}</h3>
                  <p className="text-slate-400 font-medium text-sm">Klik untuk urus silibus subjek ini.</p>
                </>
              )}
              
              <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingItem({ id: s.id, name: s.name }); }}
                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleDeleteClick(s.id, s.name, e)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {view.type === 'syllabi' && syllabi.map(s => (
            <div 
              key={s.id} 
              onClick={() => setView({ type: 'topics', subject: view.subject, syllabus: s })}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8" />
              </div>
              
              {editingItem?.id === s.id ? (
                <form onClick={e => e.stopPropagation()} onSubmit={handleUpdate} className="flex gap-2">
                   <input 
                     value={editingItem.name}
                     onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                     className="w-full px-4 py-2 border-2 border-indigo-100 rounded-xl outline-none focus:border-indigo-500 font-bold"
                     autoFocus
                   />
                   <button type="submit" className="p-2 bg-indigo-600 text-white rounded-xl"><CheckCircle2 className="w-5 h-5" /></button>
                </form>
              ) : (
                <>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{s.name}</h3>
                  <p className="text-slate-400 font-medium text-sm">Tahun / Gred / Tahap silibus.</p>
                </>
              )}
              
              <div className="absolute top-6 right-6 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button 
                  onClick={(e) => { e.stopPropagation(); setEditingItem({ id: s.id, name: s.name }); }}
                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => handleDeleteClick(s.id, s.name, e)}
                  className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {view.type === 'topics' && topics.map(t => (
            <div 
              key={t.id} 
              onClick={() => setView({ type: 'topic_detail', subject: view.subject, syllabus: view.syllabus, topic: t })}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform">
                <FolderOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{t.name}</h3>
              <p className="text-slate-400 font-medium text-sm">Urus kad hafalan dan soalan topik ini.</p>
              
              <button 
                onClick={(e) => handleDeleteClick(t.id, t.name, e)}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {/* Empty State */}
          {((view.type === 'subjects' && subjects.length === 0) ||
            (view.type === 'syllabi' && syllabi.length === 0) ||
            (view.type === 'topics' && topics.length === 0)) && !loading && (
            <div className="col-span-full py-24 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400">
              <FolderOpen className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-bold">Tiada item ditemui.</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-indigo-600 font-black hover:underline"
              >
                Tambah kandung pertama Sekarang
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog 
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        isLoading={isDeleting}
      />
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
          >
            <h2 className="text-2xl font-black text-slate-800 mb-6">Tambah {view.type === 'subjects' ? 'Subjek' : view.type === 'syllabi' ? 'Silibus' : 'Topik'}</h2>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Nama {view.type === 'subjects' ? 'Subjek' : view.type === 'syllabi' ? 'Silibus' : 'Topik'}</label>
                <input 
                  type="text" 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Masukkan nama..."
                  className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none transition-all font-bold"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleCreate}
                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-lg shadow-indigo-100"
              >
                Tambah
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
