import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  BrainCircuit, 
  Mail, 
  Lock, 
  User as UserIcon,
  Loader2,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface AuthScreenProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'signup';

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName
            }
          }
        });

        if (authError) throw authError;
        
        if (!authData.user) throw new Error('Pendaftaran tidak berjaya. Sila cuba lagi.');

        // Wait a small amount of time for the trigger to execute
        await new Promise(r => setTimeout(r, 1000));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        onLogin({
          id: authData.user.id,
          email,
          name: profile?.full_name || fullName,
          role: profile?.role as UserRole || 'student'
        });
      } else {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Log masuk gagal.');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        onLogin({
          id: authData.user.id,
          email: authData.user.email || '',
          name: profile?.full_name || 'Pengguna',
          role: profile?.role as UserRole || 'student'
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message === 'Invalid login credentials' ? 'Emel atau kata laluan salah.' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      <div className="md:w-1/2 bg-indigo-600 p-12 flex flex-col justify-center text-white relative overflow-hidden">
        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm shadow-xl">
              <GraduationCap className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-black tracking-tight">Cepat Belajar</h1>
          </div>
          <h2 className="text-5xl font-extrabold mb-8 leading-[1.15]">
            Platform Ulatan <span className="text-indigo-200 italic underline decoration-indigo-300">Pantas</span> & Pintar.
          </h2>
          <p className="text-xl text-indigo-100 mb-12 font-medium">
            Kuasai subjek sekolah dengan teknik hafalan berkesan (SRS) dan soalan interaktif.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold">Teknik SRS</h4>
                <p className="text-sm text-indigo-100/70 text-xs">Ulangkaji pada waktu yang paling tepat untuk ingatan jangka masa panjang.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-400 rounded-full blur-[120px] -mr-64 -mt-64 opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-800 rounded-full blur-[100px] -ml-48 -mb-48 opacity-40"></div>
      </div>

      <div className="md:w-1/2 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h3 className="text-3xl font-black text-slate-900 mb-2">
              {mode === 'login' ? 'Selamat Kembali' : 'Daftar Akaun'}
            </h3>
            <p className="text-slate-500 font-medium">
              {mode === 'login' ? 'Masuk ke dashboard pembelajaran anda' : 'Mulakan perjalanan ilmu anda hari ini'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 text-sm font-bold shadow-sm"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-5 overflow-hidden"
                >
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Nama Penuh</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Cth: Ahmad bin Abu"
                        className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm font-medium"
                        required={mode === 'signup'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Alamat Emel</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pengguna@emel.com"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm font-medium"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Kata Laluan</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all bg-white shadow-sm font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 text-lg"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Log Masuk' : 'Daftar Sekarang'}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-slate-500 font-medium">
              {mode === 'login' ? "Belum ada akaun?" : "Sudah ada akaun?"}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-indigo-600 font-black hover:underline"
              >
                {mode === 'login' ? 'Daftar sini' : 'Log masuk'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
