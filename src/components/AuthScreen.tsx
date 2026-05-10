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
  GraduationCap,
  Sparkles
} from 'lucide-react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { STRINGS } from '../lib/strings';

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
    <div className="min-h-screen bg-bg-cream flex flex-col items-center justify-center p-6 sm:p-12 font-sans overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -mr-64 -mt-64" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-accent-warm/10 rounded-full blur-[100px] -ml-48 -mb-48" />

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="text-center md:text-left space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-3 px-6 py-3 bg-white rounded-3xl shadow-soft"
          >
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl">
              C
            </div>
            <span className="font-extrabold text-xl tracking-tight text-ink">Cepat Belajar</span>
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-6xl font-black text-ink leading-[1.1] tracking-tight">
              {STRINGS.auth.subtitle}
            </h1>
            <p className="text-xl text-ink-muted leading-relaxed max-w-md mx-auto md:mx-0">
              Kuasai subjek sekolah dengan teknik hafalan berkesan (SRS) dan soalan interaktif.
            </p>
          </div>

          <div className="hidden md:flex flex-col gap-4">
            <div className="flex items-center gap-4 p-5 bg-white rounded-3xl border border-slate-100 shadow-soft w-fit">
              <div className="w-12 h-12 bg-accent-mint/20 rounded-2xl flex items-center justify-center text-accent-mint-dark">
                <BrainCircuit className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-ink">Teknik SRS</h4>
                <p className="text-sm text-ink-muted">Ingatan jangka panjang yang kukuh.</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-md mx-auto" padding="lg">
          <div className="mb-10">
            <h3 className="text-3xl font-black text-ink mb-2">
              {mode === 'login' ? 'Selamat Kembali' : 'Daftar Akaun'}
            </h3>
            <p className="text-ink-muted font-bold">
              {mode === 'login' ? 'Masuk ke dashboard anda' : 'Mulakan perjalanan hari ini'}
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
                    <label className="block text-[10px] font-black text-ink-muted uppercase tracking-widest mb-2 ml-1">Nama Penuh</label>
                    <div className="relative group">
                      <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Nama penuh anda"
                        className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-100 focus:border-primary outline-none transition-all bg-slate-50 font-bold text-ink"
                        required={mode === 'signup'}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-ink-muted uppercase tracking-widest mb-2 ml-1">Alamat Emel</label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="pengguna@emel.com"
                    className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-100 focus:border-primary outline-none transition-all bg-slate-50 font-bold text-ink"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-ink-muted uppercase tracking-widest mb-2 ml-1">Kata Laluan</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-muted group-focus-within:text-primary transition-colors" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-14 pr-5 py-4 rounded-2xl border border-slate-100 focus:border-primary outline-none transition-all bg-slate-50 font-bold text-ink"
                    required
                  />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              isLoading={loading}
            >
              {mode === 'login' ? 'Log Masuk' : 'Daftar Sekarang'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </form>
          
          <div className="mt-10 text-center">
            <p className="text-ink-muted font-bold">
              {mode === 'login' ? "Belum ada akaun?" : "Sudah ada akaun?"}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-primary font-black hover:underline"
              >
                {mode === 'login' ? 'Daftar sini' : 'Log masuk'}
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
