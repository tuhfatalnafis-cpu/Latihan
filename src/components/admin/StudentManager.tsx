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
  Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { db } from '../../lib/db';
import { Profile } from '../../lib/supabase';
import { cn } from '../../lib/utils';

export default function StudentManager() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // New user form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // For creating student accounts by admin, we use Supabase Auth signup
      // Note: In production, you'd usually use an edge function or admin API
      // Since this is a demo, we use the client signup.
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
      
      alert(`Akaun untuk ${fullName} telah dicipta. Sila kongsi emel dan kata laluan kepada pelajar.`);
      setShowAddModal(false);
      setEmail('');
      setPassword('');
      setFullName('');
      fetchStudents();
    } catch (err) {
      alert('Gagal menambah pelajar: ' + (err as any).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Pengurusan Pelajar</h1>
          <p className="text-slate-500 font-medium mt-1">Daftar dan urus akaun anak-anak atau pelajar anda.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl flex items-center gap-3 font-black shadow-xl shadow-indigo-100 transition-all"
        >
          <UserPlus className="w-5 h-5" /> Daftar Pelajar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Stats Column */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
               <Users className="w-6 h-6" />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Jumlah Pelajar</p>
             <h4 className="text-3xl font-black text-slate-800">{students.length}</h4>
           </div>
           
           <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative group cursor-help">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
               <TrendingUp className="w-6 h-6" />
             </div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Peningkatan Sesi</p>
             <h4 className="text-3xl font-black text-slate-800">+12%</h4>
             <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-2/3" />
             </div>
           </div>
        </div>

        {/* List Column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama pelajar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium"
            />
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Memuatkan senarai...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center px-10">
                <Users className="w-12 h-12 mb-4 opacity-10" />
                <p className="font-bold">Tiada pelajar dijumpai.</p>
                <p className="text-xs max-w-[200px] mt-2 italic">Mulakan dengan mendaftarkan akaun pelajar pertama.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {filteredStudents.map((s) => (
                  <div key={s.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                       <div className="w-14 h-14 bg-indigo-50 border-2 border-white rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl shadow-sm">
                          {s.full_name.charAt(0)}
                       </div>
                       <div>
                         <h5 className="font-black text-slate-800 text-lg leading-tight">{s.full_name}</h5>
                         <p className="text-slate-400 text-sm font-medium mt-1">Hafalan Aktif: <span className="text-indigo-500 font-bold">12 Topik</span></p>
                       </div>
                    </div>

                    <div className="flex items-center gap-2">
                       <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-slate-100 flex items-center gap-2 font-bold text-sm">
                         <BarChart2 className="w-5 h-5" />
                         <span className="hidden sm:inline">Laporan</span>
                       </button>
                       <button className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                         <Trash2 className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-2xl font-black text-slate-800 mb-2">Daftar Pelajar Baru</h3>
                <p className="text-slate-500 font-medium mb-8 text-sm italic">Kata laluan perlu diberikan kepada pelajar secara manual selepas pendaftaran.</p>
                
                <form onSubmit={handleAddStudent} className="space-y-5">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Penuh</label>
                    <div className="relative group">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Contoh: Ali bin Abu"
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                        required
                      />
                    </div>
                  </div>

                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Alamat Emel</label>
                     <div className="relative group">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                       <input 
                         type="email" 
                         value={email}
                         onChange={(e) => setEmail(e.target.value)}
                         placeholder="emel.pelajar@gmail.com"
                         className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                         required
                       />
                     </div>
                  </div>

                  <div>
                     <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Kata Laluan Sementara</label>
                     <div className="relative group">
                       <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                       <input 
                         type="password" 
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         placeholder="Min 6 aksara"
                         className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-50 rounded-2xl focus:bg-white focus:border-indigo-500 outline-none transition-all font-bold"
                         required
                       />
                     </div>
                  </div>

                  <div className="pt-4 flex gap-4">
                    <button 
                      type="button" 
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan'}
                    </button>
                  </div>
                </form>
             </div>
             
             {/* Background Shape */}
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>
          </div>
        </div>
      )}
    </div>
  );
}
