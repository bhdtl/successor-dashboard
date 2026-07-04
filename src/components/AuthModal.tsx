import { useState } from 'react';
import { supabase, isOfflineMode } from '../lib/supabase';
import { Lock, Mail, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string) => void;
}

export function AuthModal({ isOpen, onClose, onLoginSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setErrorMsg('');

    if (isOfflineMode) {
      // Simulating authentication in local offline mode
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess(email.trim().toLowerCase());
        onClose();
      }, 1000);
    } else {
      // Live Supabase authentication
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: password.trim(),
        });

        if (error) throw error;

        if (data?.user?.email) {
          onLoginSuccess(data.user.email);
          onClose();
        } else {
          throw new Error('Keine E-Mail-Adresse zurückgegeben');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Anmeldung fehlgeschlagen');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative glass-card rounded-2xl max-w-sm w-full p-6 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Connection status tag */}
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-successor-mint to-darkMint" />
        <div className="flex justify-between items-center mb-6 pt-2">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Successor Logo" className="h-7 w-7 object-contain" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Successor Portal</span>
          </div>
          <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${isOfflineMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-successor-mint/10 text-successor-mint border border-successor-mint/20'}`}>
            {isOfflineMode ? 'OFFLINE MOCK MODE' : 'SUPABASE LIVE'}
          </span>
        </div>

        {/* Modal Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center mx-auto shadow-inner">
            <Lock size={18} className="text-gray-400" />
          </div>
          <h2 className="text-base font-black uppercase tracking-wider text-white">Datenzugriff autorisieren</h2>
          <p className="text-[10px] text-successor-textMuted font-mono">
            {isOfflineMode 
              ? 'Tippe deine E-Mail ein (z. B. bh.dtl@web.de für Admin-Zugriff).' 
              : 'Logge dich mit deinen Supabase-Anmeldedaten ein.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {/* Email Field */}
            <div className="relative">
              <Mail size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="E-Mail-Adresse"
                disabled={loading}
                className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:border-successor-mint/50 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock size={12} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Passwort"
                disabled={loading}
                className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-600 focus:border-successor-mint/50 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-xl text-red-400 text-[10px] font-bold flex items-center gap-2">
              <AlertCircle size={14} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Offline Mode Info Box */}
          {isOfflineMode && (
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-gray-400 text-[9px] font-mono flex items-start gap-2">
              <ShieldCheck size={14} className="text-successor-mint flex-shrink-0 mt-0.5" />
              <span>
                Simuliert: E-Mails wie <strong>bh.dtl@web.de</strong> schalten das Admin-Menü frei. Jedes beliebige Passwort funktioniert.
              </span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-mint py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <span>Verbindung herstellen</span>
            )}
          </button>
        </form>

        {/* Footer cancel */}
        <button
          onClick={onClose}
          disabled={loading}
          className="w-full text-center text-[10px] text-gray-500 hover:text-white transition-colors pt-4 block font-mono"
        >
          Abbrechen
        </button>

      </div>
    </div>
  );
}
