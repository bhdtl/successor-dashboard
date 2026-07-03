import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Zap, 
  Users, 
  ShieldAlert, 
  ChevronRight, 
  LogOut, 
  User, 
  UserCheck
} from 'lucide-react';

// Subcomponents
import { Dashboard } from './components/Dashboard';
import { PlayerAnalysis } from './components/PlayerAnalysis';
import { TransferHelper } from './components/TransferHelper';
import { LineupPlanner } from './components/LineupPlanner';
import { AdminCMS } from './components/AdminCMS';
import type { Player } from './components/PlayerCard';

// Preloaded mock database of Bundesliga players
const INITIAL_DATABASE: Player[] = [
  { id: '1', name: 'Florian Wirtz', position: 'MID', price: 42000000, xp: 215, form: 1.4, team: 'Bayer Leverkusen', opponent: 'FC Bayern', isHome: false, avatarColor: 'from-red-600 to-black' },
  { id: '2', name: 'Jamal Musiala', position: 'MID', price: 39500000, xp: 195, form: 1.3, team: 'FC Bayern', opponent: 'Leverkusen', isHome: true, avatarColor: 'from-red-600 to-red-950' },
  { id: '3', name: 'Harry Kane', position: 'FWD', price: 46000000, xp: 240, form: 1.2, team: 'FC Bayern', opponent: 'Leverkusen', isHome: true, avatarColor: 'from-red-600 to-red-950' },
  { id: '4', name: 'Alejandro Grimaldo', position: 'DEF', price: 34000000, xp: 185, form: 1.3, team: 'Bayer Leverkusen', opponent: 'FC Bayern', isHome: false, avatarColor: 'from-red-600 to-black' },
  { id: '5', name: 'Gregor Kobel', position: 'GK', price: 21000000, xp: 115, form: 1.0, team: 'Dortmund', opponent: 'Stuttgart', isHome: true, avatarColor: 'from-yellow-500 to-black' },
  { id: '6', name: 'Nico Schlotterbeck', position: 'DEF', price: 24000000, xp: 130, form: 1.1, team: 'Dortmund', opponent: 'Stuttgart', isHome: true, avatarColor: 'from-yellow-500 to-black' },
  { id: '7', name: 'Xavi Simons', position: 'MID', price: 31000000, xp: 160, form: 1.1, team: 'RB Leipzig', opponent: 'Frankfurt', isHome: false, avatarColor: 'from-blue-600 to-red-600' },
  { id: '8', name: 'Serhou Guirassy', position: 'FWD', price: 35000000, xp: 190, form: 1.2, team: 'Dortmund', opponent: 'Stuttgart', isHome: true, avatarColor: 'from-yellow-500 to-black' },
  { id: '9', name: 'David Raum', position: 'DEF', price: 18500000, xp: 120, form: 1.0, team: 'RB Leipzig', opponent: 'Frankfurt', isHome: false, avatarColor: 'from-blue-600 to-red-600' },
  { id: '10', name: 'Maximilian Mittelstädt', position: 'DEF', price: 17000000, xp: 110, form: 1.0, team: 'VfB Stuttgart', opponent: 'Dortmund', isHome: false, avatarColor: 'from-red-500 to-white' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'transfer' | 'lineup' | 'admin'>('dashboard');
  
  // Roster / Database states
  const [dbPlayers, setDbPlayers] = useState<Player[]>(INITIAL_DATABASE);
  const [squad, setSquad] = useState<Player[]>([
    INITIAL_DATABASE[0], // Wirtz
    INITIAL_DATABASE[1], // Musiala
    INITIAL_DATABASE[3], // Grimaldo
    INITIAL_DATABASE[4], // Kobel
    INITIAL_DATABASE[5], // Schlotterbeck
  ]);

  // Lineup state (11 slots: index 0 = GK, 1-4 = DEF, 5-9 = MID, 10 = FWD)
  const [lineup, setLineup] = useState<(Player | undefined)[]>([
    INITIAL_DATABASE[4], // GK: Kobel
    INITIAL_DATABASE[3], // DEF: Grimaldo
    INITIAL_DATABASE[5], // DEF: Schlotterbeck
    undefined,           // DEF: empty
    undefined,           // DEF: empty
    INITIAL_DATABASE[0], // MID: Wirtz
    INITIAL_DATABASE[1], // MID: Musiala
    undefined,           // MID: empty
    undefined,           // MID: empty
    undefined,           // MID: empty
    undefined,           // FWD: empty
  ]);

  const [budget, setBudget] = useState<number>(31500000); // 31.5M

  // Simulated email account state
  // Can be: null (Logged out), "user@domain.com" (Normal user), "bh.dtl@web.de" (Founder admin)
  const [userEmail, setUserEmail] = useState<string | null>('user@domain.com');
  const [showUserSwitcher, setShowUserSwitcher] = useState(false);

  const isAdmin = userEmail === 'bh.dtl@web.de';

  // Redirect away from Admin tab if admin status is lost
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('dashboard');
    }
  }, [userEmail, activeTab, isAdmin]);

  // Handler to buy/add player to squad
  const handleAddToSquad = (player: Player) => {
    if (squad.some(p => p.id === player.id)) return;
    if (budget < player.price) {
      alert("Nicht genügend Budget!");
      return;
    }
    setSquad([...squad, player]);
    setBudget(budget - player.price);
  };

  // Handler to remove player from squad (and lineup)
  const handleRemoveFromSquad = (playerId: string) => {
    const player = squad.find(p => p.id === playerId);
    if (!player) return;

    setSquad(squad.filter(p => p.id !== playerId));
    setLineup(lineup.map(p => p?.id === playerId ? undefined : p));
    setBudget(budget + player.price);
  };

  // Admin handlers
  const handleAddPlayerToDb = (newPlayer: Player) => {
    setDbPlayers([newPlayer, ...dbPlayers]);
  };

  const handleDeletePlayerFromDb = (playerId: string) => {
    setDbPlayers(dbPlayers.filter(p => p.id !== playerId));
    handleRemoveFromSquad(playerId);
  };

  const handleBulkAddPlayers = (newPlayers: Player[]) => {
    // Merge new players preventing duplicates
    setDbPlayers(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const filteredNew = newPlayers.filter(p => !existingIds.has(p.id));
      return [...filteredNew, ...prev];
    });
  };

  const squadIds = new Set(squad.map(p => p.id));

  // Sidebar link styles
  const getSidebarLinkClass = (tab: typeof activeTab) => {
    const base = "w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 font-bold ";
    if (activeTab === tab) {
      return base + "bg-white text-black shadow-lg shadow-white/5";
    }
    return base + "text-gray-400 hover:text-white hover:bg-white/[0.03]";
  };

  // Tab definitions
  const desktopTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: 'Spieler-Analyse', icon: LineChart },
    { id: 'transfer', label: 'Transfer-Helfer', icon: Zap },
    { id: 'lineup', label: 'Aufstellungs-Planer', icon: Users },
  ] as const;

  return (
    <div className="min-h-screen flex bg-[#0d0e10] text-white">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:block w-72 flex-shrink-0 z-30">
        <div className="liquid-glass-sidebar">
          <div className="liquid-glass-sidebar-content h-screen p-5 flex flex-col justify-between">
            {/* Header Branding */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pt-2">
                <img src="/logo.png" alt="Successor Logo" className="h-9 w-9 object-contain" />
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.25em] text-white leading-none">Successor</div>
                  <span className="text-[9px] text-[#00ff88] font-mono tracking-widest font-black">DATA ANALYTICS</span>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                <div className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] px-2 mb-2">
                  Bereiche
                </div>
                {desktopTabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={getSidebarLinkClass(tab.id as any)}
                  >
                    <div className="flex items-center gap-3">
                      <tab.icon size={16} />
                      <span className="text-xs">{tab.label}</span>
                    </div>
                    <ChevronRight size={14} className={activeTab === tab.id ? "text-black" : "text-gray-600"} />
                  </button>
                ))}

                {/* Conditional Admin CMS Tab */}
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={getSidebarLinkClass('admin')}
                  >
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={16} className="text-successor-mint" />
                      <span className="text-xs">Admin CMS</span>
                    </div>
                    <ChevronRight size={14} className={activeTab === 'admin' ? "text-black" : "text-successor-mint"} />
                  </button>
                )}
              </nav>
            </div>

            {/* User Profile Card & Identity Switcher */}
            <div className="space-y-3 border-t border-white/[0.06] pt-5">
              <div className="relative">
                <button
                  onClick={() => setShowUserSwitcher(!showUserSwitcher)}
                  className="w-full flex items-center gap-3 p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-all text-left"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${isAdmin ? 'bg-successor-mint/15 text-successor-mint border border-successor-mint/20' : 'bg-white/[0.06] text-gray-400 border border-white/5'}`}>
                    {isAdmin ? <ShieldAlert size={16} /> : <User size={16} />}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="text-xs font-bold text-white truncate">
                      {userEmail ? userEmail.split('@')[0] : 'Gast-Zugang'}
                    </div>
                    <div className="text-[8px] font-mono text-successor-textMuted truncate">
                      {userEmail || 'Bitte einloggen'}
                    </div>
                  </div>
                </button>

                {/* Identity Switcher Dropdown */}
                {showUserSwitcher && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#121316] border border-white/[0.08] rounded-xl p-2 shadow-2xl z-40 space-y-1">
                    <div className="text-[8px] font-mono text-gray-500 uppercase px-2 py-1">
                      Account simulieren:
                    </div>
                    <button
                      onClick={() => { setUserEmail('user@domain.com'); setShowUserSwitcher(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-gray-300 hover:bg-white/5 flex items-center gap-1.5"
                    >
                      <User size={10} />
                      Standard User
                    </button>
                    <button
                      onClick={() => { setUserEmail('bh.dtl@web.de'); setShowUserSwitcher(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-successor-mint font-bold hover:bg-white/5 flex items-center gap-1.5"
                    >
                      <UserCheck size={10} />
                      bh.dtl@web.de (Admin)
                    </button>
                    <button
                      onClick={() => { setUserEmail(null); setShowUserSwitcher(false); }}
                      className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-red-400 hover:bg-white/5 flex items-center gap-1.5"
                    >
                      <LogOut size={10} />
                      Ausloggen (Gast)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden ios-nav-bar fixed top-0 left-0 right-0 z-40 px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Successor Logo" className="h-6 w-6 object-contain" />
            <span className="text-sm font-black uppercase tracking-wider text-white">Successor</span>
          </div>

          {/* Quick Simulated Auth Switcher for Mobile testing */}
          <div className="relative">
            <button
              onClick={() => setShowUserSwitcher(!showUserSwitcher)}
              className="text-[9px] font-black uppercase tracking-wider bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1 text-gray-300 hover:text-white"
            >
              Simulate Auth
            </button>
            
            {showUserSwitcher && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#121316] border border-white/[0.08] rounded-xl p-2 shadow-2xl z-40 space-y-1">
                <button
                  onClick={() => { setUserEmail('user@domain.com'); setShowUserSwitcher(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-gray-300 hover:bg-white/5"
                >
                  Standard User
                </button>
                <button
                  onClick={() => { setUserEmail('bh.dtl@web.de'); setShowUserSwitcher(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-successor-mint font-bold hover:bg-white/5"
                >
                  bh.dtl@web.de (Admin)
                </button>
                <button
                  onClick={() => { setUserEmail(null); setShowUserSwitcher(false); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-[10px] text-red-400 hover:bg-white/5"
                >
                  Logout (Gast)
                </button>
              </div>
            )}
          </div>
        </header>

        {/* PAGE BODY AREA */}
        <main className="flex-grow pt-[calc(3.5rem+env(safe-area-inset-top,0px))] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6 md:pt-6 px-4 md:px-8 max-w-6xl w-full mx-auto overflow-y-auto no-scrollbar">
          
          {activeTab === 'dashboard' && (
            <Dashboard players={squad} lineup={lineup} budget={budget} />
          )}

          {activeTab === 'analytics' && (
            <PlayerAnalysis players={dbPlayers} />
          )}

          {activeTab === 'transfer' && (
            <TransferHelper players={dbPlayers} onAddToSquad={handleAddToSquad} squadIds={squadIds} />
          )}

          {activeTab === 'lineup' && (
            <LineupPlanner squad={squad} lineup={lineup} onUpdateLineup={setLineup} />
          )}

          {activeTab === 'admin' && isAdmin && (
            <AdminCMS 
              players={dbPlayers} 
              onAddPlayer={handleAddPlayerToDb} 
              onDeletePlayer={handleDeletePlayerFromDb}
              onBulkAdd={handleBulkAddPlayers}
            />
          )}

        </main>

        {/* FLOATING MOBILE TAB BAR */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <nav className="ios-tab-bar">
            <div className="ios-tab-inner">
              
              {/* Tab 1: Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'dashboard' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <LayoutDashboard size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Dashboard</span>
                </div>
              </button>

              {/* Tab 2: Analytics */}
              <button
                onClick={() => setActiveTab('analytics')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'analytics' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <LineChart size={20} strokeWidth={activeTab === 'analytics' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Analyse</span>
                </div>
              </button>

              {/* Tab 3: Transfer */}
              <button
                onClick={() => setActiveTab('transfer')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'transfer' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <Zap size={20} strokeWidth={activeTab === 'transfer' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Transfer</span>
                </div>
              </button>

              {/* Tab 4: Lineup */}
              <button
                onClick={() => setActiveTab('lineup')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'lineup' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <Users size={20} strokeWidth={activeTab === 'lineup' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Aufstellung</span>
                </div>
              </button>

              {/* Tab 5: Admin CMS (Only visible if email is bh.dtl@web.de) */}
              {isAdmin && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className="ios-tab-item"
                >
                  <div className={`ios-tab-content ${activeTab === 'admin' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                    <ShieldAlert size={20} strokeWidth={activeTab === 'admin' ? 2.5 : 1.8} />
                    <span className="ios-tab-label">Admin</span>
                  </div>
                </button>
              )}

            </div>
          </nav>
        </div>

      </div>

    </div>
  );
}
