import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const isFetchError = this.state.error?.message?.includes('Failed to fetch') || 
                           this.state.error?.message?.toLowerCase().includes('network error');

      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center font-sans" id="error-screen">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl border border-rose-100 max-w-xl w-full">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h1 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">System Initialization Error</h1>
            <p className="text-slate-500 font-medium mb-8 leading-relaxed">
              {isFetchError 
                ? "Sistem gagal berhubung dengan pangkalan data. Sila pastikan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY telah dikonfigurasi dengan betul dalam tetapan projek." 
                : "Terdapat ralat semasa memuatkan aplikasi. Ini biasanya disebabkan oleh konfigurasi yang tidak lengkap atau masalah sambungan."
              }
            </p>
            
            <div className="bg-slate-50 p-6 rounded-2xl text-left border border-slate-100 mb-8 overflow-auto max-h-40">
               <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Error Details:</p>
               <pre className="text-sm font-mono text-rose-600 whitespace-pre-wrap">{this.state.error?.message}</pre>
            </div>

            <button 
              id="reload-button"
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
            >
              Cuba Segarkan Laman (Reload)
            </button>
            
            <p className="mt-6 text-xs text-slate-400 font-bold">
               Jika masalah berterusan, sila hubungi pentadbir sistem anda.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
