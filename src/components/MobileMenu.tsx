import { 
  X, Calendar, ShieldAlert, LogOut, User, Sliders, ChevronRight 
} from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  userEmail: string | null;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenAuth: () => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  userEmail,
  isAdmin,
  onLogout,
  onOpenAuth
}: MobileMenuProps) {
  return (
    <>
      {/* Backdrop Blur overlay */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black/85 backdrop-blur-sm z-[140] transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Container (Bottom Sheet) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-[150] bg-[#121418]/95 border-t border-white/[0.08] rounded-t-[2.5rem] w-full max-h-[85vh] flex flex-col transition-transform duration-300 ease-out transform md:hidden backdrop-blur-3xl shadow-2xl ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Grabber Bar */}
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-3 shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-successor-mint/10 rounded-lg text-successor-mint">
              <Sliders size={18} />
            </div>
            <div className="text-left">
              <h3 className="text-white font-black uppercase text-xs tracking-widest">Menü</h3>
              <p className="text-gray-500 text-[8px] font-mono uppercase tracking-wider mt-0.5">Control Center</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5"
          >
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        {/* Scrollable drawer body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
          
          {/* Account settings */}
          <div className="space-y-3">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 mb-1">
              Mein Account
            </div>

            {userEmail ? (
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-successor-mint/15 text-successor-mint' : 'bg-white/[0.06] text-gray-400'}`}>
                    {isAdmin ? <ShieldAlert size={18} /> : <User size={18} />}
                  </div>
                  <div className="text-left overflow-hidden">
                    <span className="text-xs font-black text-white block truncate max-w-[180px]">{userEmail.split('@')[0]}</span>
                    <span className="text-[9px] font-mono text-gray-500 block mt-0.5">{userEmail}</span>
                  </div>
                </div>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-black/40 border ${isAdmin ? 'text-successor-mint border-successor-mint/20' : 'text-gray-400 border-white/5'}`}>
                  {isAdmin ? 'Admin' : 'User'}
                </span>
              </div>
            ) : (
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
                <p className="text-xs text-successor-mint font-bold mb-3">Melde dich an, um unbegrenzten Zugriff zu erhalten</p>
                <button
                  onClick={() => { onClose(); onOpenAuth(); }}
                  className="w-full py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-successor-mint transition-all active:scale-[0.98]"
                >
                  Anmelden / Registrieren
                </button>
              </div>
            )}
          </div>

          {/* Navigation items */}
          <div className="space-y-3">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 mb-1">
              Tools & Bereiche
            </div>
            
            <div className="space-y-2">
              
              {/* FDR Planner tab button */}
              <button
                onClick={() => {
                  setActiveTab('planner');
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-2xl flex items-center justify-between border transition-all active:scale-[0.98] ${
                  activeTab === 'planner'
                    ? 'bg-successor-mint/10 border-successor-mint/30 text-white font-black'
                    : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl ${activeTab === 'planner' ? 'bg-successor-mint text-black' : 'bg-white/5 text-gray-400'}`}>
                    <Calendar size={18} />
                  </div>
                  <div className="text-left">
                    <span className={`text-xs font-black uppercase tracking-wider block ${activeTab === 'planner' ? 'text-successor-mint' : ''}`}>FDR Spielplan-Planer</span>
                    <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Optimiere deine Spieler-Rotation</span>
                  </div>
                </div>
                <ChevronRight size={14} className="text-gray-600 shrink-0" />
              </button>

              {/* Admin CMS tab button */}
              {isAdmin && (
                <button
                  onClick={() => {
                    setActiveTab('admin');
                    onClose();
                  }}
                  className={`w-full text-left p-4 rounded-2xl flex items-center justify-between border transition-all active:scale-[0.98] ${
                    activeTab === 'admin'
                      ? 'bg-successor-mint/10 border-successor-mint/30 text-white font-black'
                      : 'bg-white/[0.02] border-white/5 text-gray-300 hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${activeTab === 'admin' ? 'bg-successor-mint text-black' : 'bg-white/5 text-gray-400'}`}>
                      <ShieldAlert size={18} />
                    </div>
                    <div className="text-left">
                      <span className={`text-xs font-black uppercase tracking-wider block ${activeTab === 'admin' ? 'text-successor-mint' : ''}`}>System-Administration</span>
                      <span className="text-[10px] text-gray-500 font-medium block mt-0.5">Datenbank befüllen & verwalten</span>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 shrink-0" />
                </button>
              )}

            </div>
          </div>

        </div>

        {/* Bottom Actions footer */}
        <div className="px-6 py-4 border-t border-white/[0.04] shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-gray-500 uppercase">Successor Control</span>
            {userEmail && (
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="text-xs font-bold text-red-400/80 hover:text-red-400 flex items-center gap-1.5 px-3 py-2 hover:bg-red-500/10 rounded-xl transition-colors border border-transparent"
              >
                <LogOut size={14} />
                <span>Abmelden</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
