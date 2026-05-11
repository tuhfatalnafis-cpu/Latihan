import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Users, 
  Search, 
  Trash2, 
  UserPlus, 
  Eye, 
  ShieldCheck,
  GraduationCap,
  Mail,
  Lock,
  ChevronRight,
  TrendingUp,
  BarChart2,
  Loader2,
  UserCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';
import { Profile } from '../../lib/supabase';
import { cn } from '../../lib/utils';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { StatCard } from '../ui/StatCard';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function StudentManager() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
  
  // New user form/Edit form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [studentStats, setStudentStats] = useState<Record<string, { activeTopics: number, accuracy: number }>>({});
  const [globalStudentStats, setGlobalStudentStats] = useState({ trend: 0, avgAccuracy: 0 });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStudents(data);

      // Fetch progress summary for all students
      const { data: progressData } = await supabase
        .from('progress')
        .select('student_id, question_id, consecutive_correct, questions(topic_id)');
      
      const stats: Record<string, { activeTopics: number, accuracy: number }> = {};
      const studentAccuracies: number[] = [];

      data.forEach(s => {
        const studentProgress = progressData?.filter(p => p.student_id === s.id) || [];
        const uniqueTopics = new Set(studentProgress.map(p => (p.questions as any)?.topic_id)).size;
        
        // accuracy heuristic: mastered questions / total attempted questions in progress
        const mastered = studentProgress.filter(p => p.consecutive_correct >= 3).length;
        const accuracy = studentProgress.length > 0 ? Math.round((mastered / studentProgress.length) * 100) : 0;
        
        stats[s.id] = { activeTopics: uniqueTopics, accuracy };
        if (studentProgress.length > 0) studentAccuracies.push(accuracy);
      });

      setStudentStats(stats);
      
      const avgAcc = studentAccuracies.length > 0 
        ? Math.round(studentAccuracies.reduce((a, b) => a + b, 0) / studentAccuracies.length) 
        : 0;
      
      setGlobalStudentStats({ trend: 15, avgAccuracy: avgAcc }); // Trend can be static for now or calculated if preferred
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Gagal memuatkan senarai pelajar');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: 'student'
          }
        }
      });

      if (error) throw error;
      
      // Explicitly update the profile to ensure metadata.gender is saved
      // This bypasses potential trigger limitations
      if (data.user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            metadata: { gender: gender }
          } as any)
          .eq('id', data.user.id);
        
        if (updateError) {
          console.error('Failed to update profile metadata:', updateError);
        }
      }
      
      toast.success(`Akaun untuk ${fullName} telah dicipta. Sila kongsi emel dan kata laluan kepada pelajar.`);
      setShowAddModal(false);
      resetForm();
      fetchStudents();
    } catch (err) {
      toast.error('Gagal menambah pelajar: ' + (err as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setGender(null);
    setEditingStudent(null);
  };

  const handleEditClick = (student: Profile) => {
    setEditingStudent(student);
    setFullName(student.full_name);
    setGender(student.metadata?.gender || null);
    // password and email not editable here for simplicity
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          metadata: { 
            ...(editingStudent.metadata || {}),
            gender: gender 
          }
        } as any)
        .eq('id', editingStudent.id);

      if (error) throw error;
      
      toast.success(`Profil ${fullName} telah dikemaskini.`);
      setEditingStudent(null);
      resetForm();
      fetchStudents();
    } catch (err) {
      toast.error('Gagal mengemaskini pelajar: ' + (err as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-ink tracking-tight">Pengurusan Pelajar</h1>
          <p className="text-ink-muted font-bold mt-1">Daftar dan pantau aktiviti pembelajaran pelajar anda.</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="rounded-[2rem] px-8 shadow-soft-lg group h-14"
        >
          <UserPlus className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" /> Daftar Pelajar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats Column */}
        <div className="lg:col-span-1 space-y-6">
           <StatCard 
             label="Jumlah Pelajar" 
             value={students.length.toString()} 
             icon={Users}
             variant="primary"
           />
           
           <Card className="p-8 border-2 border-slate-50 relative group overflow-hidden" hover>
             <div className="w-14 h-14 bg-accent-mint/10 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
               <TrendingUp className="w-7 h-7" />
             </div>
             <p className="text-xs font-black text-ink-muted uppercase tracking-widest mb-2">Prestasi Purata</p>
             <h4 className="text-4xl font-black text-ink">{globalStudentStats.avgAccuracy}%</h4>
             <div className="mt-6 space-y-2">
                <div className="flex justify-between text-xs font-bold text-ink-muted">
                  <span>Keberkesanan</span>
                  <span>{globalStudentStats.avgAccuracy}%</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     animate={{ width: `${globalStudentStats.avgAccuracy}%` }}
                     transition={{ duration: 1, ease: "easeOut" }}
                     className="h-full bg-accent-mint" 
                   />
                </div>
             </div>
             {/* Decorative element */}
             <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-accent-mint/5 rounded-full blur-2xl group-hover:bg-accent-mint/10 transition-all" />
           </Card>

           <Card className="p-8 bg-primary/5 border-transparent flex items-center gap-4">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-soft text-primary">
               <UserCheck className="w-6 h-6" />
             </div>
             <div>
               <p className="text-xs font-black text-primary uppercase tracking-widest leading-none mb-1">Status Sistem</p>
               <p className="text-sm font-bold text-primary/80">Semua Pelajar Aktif</p>
             </div>
           </Card>
        </div>

        {/* List Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-ink-muted group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari nama pelajar melalui kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border-2 border-slate-50 rounded-[1.5rem] focus:border-primary focus:bg-white outline-none transition-all shadow-soft focus:shadow-soft-xl font-bold text-lg text-ink"
            />
          </div>

          <Card className="p-0 overflow-hidden border-2 border-slate-50">
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center text-ink-muted animate-pulse">
                <Loader2 className="w-12 h-12 animate-spin mb-4 text-primary" />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Memuatkan senarai pelajar...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-24 flex flex-col items-center justify-center text-ink-muted text-center px-10">
                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                  <Users className="w-10 h-10 opacity-20" />
                </div>
                <p className="font-black text-xl text-ink">Tiada pelajar dijumpai.</p>
                <p className="text-sm max-w-[280px] mt-2 font-medium">Mulakan dengan mendaftarkan akaun pelajar pertama untuk melihat peningkatannya di sini.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredStudents.map((s) => (
                  <div key={s.id} className="p-8 flex flex-col sm:flex-row items-center justify-between hover:bg-bg-cream/20 transition-all group gap-6">
                    <div className="flex items-center gap-6 w-full sm:w-auto">
                       <div className="w-16 h-16 bg-primary/10 border-4 border-white rounded-[1.5rem] flex items-center justify-center text-primary font-black text-2xl shadow-soft group-hover:scale-110 transition-transform">
                          {s.full_name?.charAt(0) || 'U'}
                       </div>
                       <div>
                         <h5 className="font-black text-ink text-xl leading-tight group-hover:text-primary transition-colors">{s.full_name}</h5>
                         <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest mt-1">
                            DEBUG: {s.metadata?.gender === 'female' ? 'Perempuan' : s.metadata?.gender === 'male' ? 'Lelaki' : 'Tidak nyatakan'}
                         </p>
                         <div className="flex items-center gap-4 mt-2">
                           <p className="text-ink-muted text-xs font-bold flex items-center gap-1.5">
                             <GraduationCap className="w-3.5 h-3.5 text-accent-warm" />
                             Gred {s.grade || 'N/A'}
                           </p>
                           <span className="w-1 h-1 bg-slate-200 rounded-full" />
                           <p className="text-ink-muted text-xs font-bold flex items-center gap-1.5">
                             <TrendingUp className="w-3.5 h-3.5 text-accent-mint" />
                             Aktif: {studentStats[s.id]?.activeTopics || 0} Topik
                           </p>
                         </div>
                       </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                       <Button 
                         variant="ghost" 
                         onClick={() => handleEditClick(s)}
                         className="px-6 rounded-2xl hover:bg-white hover:shadow-soft border-2 border-transparent hover:border-slate-50"
                       >
                         <UserCheck className="w-5 h-5 mr-2 text-primary" />
                         Edit Jantina
                       </Button>
                       <Button 
                         variant="ghost" 
                         className="px-6 rounded-2xl hover:bg-white hover:shadow-soft border-2 border-transparent hover:border-slate-50"
                       >
                         <BarChart2 className="w-5 h-5 mr-2 text-primary" />
                         Laporan
                       </Button>
                       <Button 
                         variant="ghost"
                         className="p-4 rounded-2xl text-ink-muted hover:text-rose-500 hover:bg-rose-50"
                       >
                         <Trash2 className="w-5 h-5" />
                       </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Student Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-soft-2xl relative overflow-hidden"
            >
               <div className="relative z-10">
                  <h3 className="text-3xl font-black text-ink mb-2">Edit Profil Pelajar</h3>
                  <p className="text-ink-muted font-bold mb-8 text-sm leading-relaxed">Kemaskini maklumat asas dan jantina untuk paparan mascot yang betul.</p>
                  
                  <form onSubmit={handleUpdateStudent} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-ink-muted uppercase tracking-[0.2em] mb-3 ml-2">Nama Penuh Pelajar</label>
                      <div className="relative group">
                        <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-primary transition-all" />
                        <input 
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ali bin Ahmad"
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-ink"
                          required
                        />
                      </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-ink-muted uppercase tracking-[0.2em] mb-3 ml-2">Jantina</label>
                       <select 
                         value={gender || ''} 
                         onChange={(e) => setGender(e.target.value as any || null)}
                         className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-ink appearance-none"
                       >
                         <option value="">Tidak nyatakan (Lelaki sebagai default)</option>
                         <option value="male">Lelaki</option>
                         <option value="female">Perempuan</option>
                       </select>
                    </div>

                    <div className="pt-6 flex gap-4">
                      <Button 
                        variant="ghost"
                        className="flex-1 h-14 rounded-2xl"
                        onClick={() => setEditingStudent(null)}
                        type="button"
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 h-14 rounded-2xl shadow-soft"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan'}
                      </Button>
                    </div>
                  </form>
               </div>
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Student Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-ink/40 backdrop-blur-md z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-soft-2xl relative overflow-hidden"
            >
               <div className="relative z-10">
                  <h3 className="text-3xl font-black text-ink mb-2">Daftar Pelajar Baru</h3>
                  <p className="text-ink-muted font-bold mb-8 text-sm leading-relaxed">Pendaftaran memerlukan emel sah dan kata laluan unik untuk akses pembelajaran pelajar.</p>
                  
                  <form onSubmit={handleAddStudent} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-ink-muted uppercase tracking-[0.2em] mb-3 ml-2">Nama Penuh Pelajar</label>
                      <div className="relative group">
                        <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-primary transition-all" />
                        <input 
                          type="text" 
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ali bin Ahmad"
                          className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-ink"
                          required
                        />
                      </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-ink-muted uppercase tracking-[0.2em] mb-3 ml-2">Alamat Emel</label>
                       <div className="relative group">
                         <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-primary transition-all" />
                         <input 
                           type="email" 
                           value={email}
                           onChange={(e) => setEmail(e.target.value)}
                           placeholder="pelajar@cepatbelajar.com"
                           className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-ink"
                           required
                         />
                       </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-ink-muted uppercase tracking-[0.2em] mb-3 ml-2">Kata Laluan</label>
                       <div className="relative group">
                         <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-primary transition-all" />
                         <input 
                           type="password" 
                           value={password}
                           onChange={(e) => setPassword(e.target.value)}
                           placeholder="Minimum 6 aksara"
                           className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-ink"
                           required
                         />
                       </div>
                    </div>

                    <div>
                       <label className="block text-[10px] font-black text-ink-muted uppercase tracking-[0.2em] mb-3 ml-2">Jantina</label>
                       <select 
                         value={gender || ''} 
                         onChange={(e) => setGender(e.target.value as any || null)}
                         className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-50 rounded-[1.2rem] focus:bg-white focus:border-primary outline-none transition-all font-bold text-ink appearance-none"
                       >
                         <option value="">Tidak nyatakan (Lelaki sebagai default)</option>
                         <option value="male">Lelaki</option>
                         <option value="female">Perempuan</option>
                       </select>
                    </div>

                    <div className="pt-6 flex gap-4">
                      <Button 
                        variant="ghost"
                        className="flex-1 h-14 rounded-2xl"
                        onClick={() => setShowAddModal(false)}
                        type="button"
                      >
                        Batal
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="flex-1 h-14 rounded-2xl shadow-soft"
                      >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sahkan Daftar'}
                      </Button>
                    </div>
                  </form>
               </div>
               
               {/* Background Accent */}
               <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
