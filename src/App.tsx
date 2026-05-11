import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { User, UserRole } from './types';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/admin/AdminDashboard';
import StudentDashboard from './components/student/StudentDashboard';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Session error:', error);
          if (error.message.includes('Refresh Token') || error.message.includes('Invalid token')) {
            await supabase.auth.signOut();
          }
          setLoading(false);
          return;
        }
        if (session) {
          fetchProfile(session.user.id, session.user.email || '');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Session check crash:', err);
        setLoading(false);
      }
    };

    checkSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (session) {
        fetchProfile(session.user.id, session.user.email || '');
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email: string) => {
    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (!profile) {
        console.log('Profile missing, attempting to create...');
        // Attempt to create profile if missing
        // Check if this is the first user
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        const isFirstUser = !countError && count === 0;
        
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ 
            id: userId, 
            full_name: email.split('@')[0], 
            role: isFirstUser ? 'admin' : 'student' 
          }])
          .select()
          .maybeSingle();

        if (createError) {
          console.error('Failed to auto-create profile:', createError);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }
        profile = newProfile;
      }

      if (!profile) {
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      setUser({
        id: userId,
        email: email,
        name: profile.full_name || 'User',
        role: profile.role as UserRole,
        grade: profile.grade,
        metadata: profile.metadata
      });
    } catch (err) {
      console.error('Fatal profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <h3 className="text-xl font-black text-slate-800">Menyediakan Dashboard...</h3>
        <p className="text-slate-400 font-bold mt-2 italic">Sila tunggu sebentar sementara sistem memuatkan data anda.</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-center" richColors />
      {user.role === 'admin' ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <StudentDashboard user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
