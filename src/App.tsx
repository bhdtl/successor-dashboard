import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  Zap, 
  Users, 
  ShieldAlert, 
  ChevronRight, 
  LogOut, 
  LogIn,
  User,
  Calendar,
  Shield,
  Sliders
} from 'lucide-react';

// Subcomponents
import { Dashboard } from './components/Dashboard';
import { PlayerAnalysis } from './components/PlayerAnalysis';
import { TransferHelper } from './components/TransferHelper';
import { LineupPlanner } from './components/LineupPlanner';
import { AdminCMS } from './components/AdminCMS';
import { AuthModal } from './components/AuthModal';
import { FixturePlanner } from './components/FixturePlanner';
import { TeamCheck } from './components/TeamCheck';
import { MobileMenu } from './components/MobileMenu';
import type { Player } from './components/PlayerCard';
import { supabase, isOfflineMode } from './lib/supabase';

// Mock database to preload when "Demo-Daten laden" is clicked
const DEMO_DATABASE: Player[] = [
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'analytics' | 'teamcheck' | 'planner' | 'transfer' | 'lineup' | 'admin'>('dashboard');
  
  // Database states
  const [dbPlayers, setDbPlayers] = useState<Player[]>([]);
  const [squad, setSquad] = useState<Player[]>([]);
  const [lineup, setLineup] = useState<(Player | undefined)[]>(Array(11).fill(undefined));
  const [budget, setBudget] = useState<number>(50000000); // 50M default starting cash

  // Auth states
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = userEmail === 'bh.dtl@web.de';

  // Helper to map DB row keys to Player interface camelCase
  const mapDbToPlayer = (row: any): Player => ({
    id: row.id,
    name: row.name,
    position: row.position,
    price: Number(row.price),
    xp: row.xp,
    form: Number(row.form),
    team: row.team,
    opponent: row.opponent || 'TBD',
    isHome: row.is_home,
    avatarColor: row.avatar_color,
    image: row.image || undefined
  });

  // Fetch players, squad, and lineup from Supabase
  const syncSupabaseData = async (userEmailStr: string | null) => {
    if (isOfflineMode || !userEmailStr) {
      setDbPlayers([]);
      setSquad([]);
      setLineup(Array(11).fill(undefined));
      setBudget(50000000);
      return;
    }

    try {
      // 1. Fetch Players Database
      const { data: playersData, error: playersErr } = await supabase
        .from('players')
        .select('*')
        .order('xp', { ascending: false });

      if (playersErr) throw playersErr;
      const mappedPlayers: Player[] = (playersData || []).map(mapDbToPlayer);
      setDbPlayers(mappedPlayers);

      // Get authenticated user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. Fetch User's Squad
      const { data: squadData, error: squadErr } = await supabase
        .from('squad_players')
        .select('player_id')
        .eq('user_id', user.id);

      if (squadErr) throw squadErr;
      const squadIds = new Set((squadData || []).map((row: any) => row.player_id));
      const userSquad = mappedPlayers.filter((p: Player) => squadIds.has(p.id));
      setSquad(userSquad);

      // Compute budget dynamically
      const squadCost = userSquad.reduce((sum: number, p: Player) => sum + p.price, 0);
      setBudget(50000000 - squadCost);

      // 3. Fetch User's Lineup slots
      const { data: lineupData, error: lineupErr } = await supabase
        .from('lineups')
        .select('slot_index, player_id')
        .eq('user_id', user.id);

      if (lineupErr) throw lineupErr;
      const userLineup = Array(11).fill(undefined);
      (lineupData || []).forEach((row: any) => {
        const found = mappedPlayers.find((p: Player) => p.id === row.player_id);
        if (found && row.slot_index >= 0 && row.slot_index <= 10) {
          userLineup[row.slot_index] = found;
        }
      });
      setLineup(userLineup);

    } catch (err: any) {
      console.error('Fehler beim Laden von Supabase-Daten:', err.message);
    }
  };

  // 1. Supabase Auth Session listener
  useEffect(() => {
    if (isOfflineMode) return;

    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      const email = session?.user?.email || null;
      setUserEmail(email);
      syncSupabaseData(email);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      const email = session?.user?.email || null;
      setUserEmail(email);
      syncSupabaseData(email);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Redirect away from Admin tab if admin status is lost
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('dashboard');
    }
  }, [userEmail, activeTab, isAdmin]);

  // Handler to load demo data (works in offline or online)
  const handleLoadDemoData = async () => {
    if (!isOfflineMode) {
      try {
        // Bulk insert/upsert to Supabase
        const dbRows = DEMO_DATABASE.map(p => ({
          id: p.id,
          name: p.name,
          position: p.position,
          price: p.price,
          xp: p.xp,
          form: p.form,
          team: p.team,
          opponent: p.opponent,
          is_home: p.isHome,
          avatar_color: p.avatarColor,
          image: p.image
        }));

        const { error } = await supabase
          .from('players')
          .upsert(dbRows, { onConflict: 'id' });

        if (error) throw error;

        // Auto-add some to squad in Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const squadRows = [DEMO_DATABASE[0], DEMO_DATABASE[1], DEMO_DATABASE[3], DEMO_DATABASE[4], DEMO_DATABASE[5]].map(p => ({
            user_id: user.id,
            player_id: p.id
          }));

          await supabase.from('squad_players').upsert(squadRows);

          // Add slots to lineup in Supabase
          const lineupRows = [
            { user_id: user.id, slot_index: 0, player_id: DEMO_DATABASE[4].id }, // Kobel
            { user_id: user.id, slot_index: 1, player_id: DEMO_DATABASE[3].id }, // Grimaldo
            { user_id: user.id, slot_index: 2, player_id: DEMO_DATABASE[5].id }, // Schlotterbeck
            { user_id: user.id, slot_index: 5, player_id: DEMO_DATABASE[0].id }, // Wirtz
            { user_id: user.id, slot_index: 6, player_id: DEMO_DATABASE[1].id }, // Musiala
          ];

          await supabase.from('lineups').upsert(lineupRows);
        }

        // Re-sync
        await syncSupabaseData(userEmail);
        return;
      } catch (err: any) {
        alert('Fehler beim Laden der Demodaten in Supabase: ' + err.message);
        return;
      }
    }

    // Local offline state preloading
    setDbPlayers(DEMO_DATABASE);
    setSquad([
      DEMO_DATABASE[0], // Wirtz
      DEMO_DATABASE[1], // Musiala
      DEMO_DATABASE[3], // Grimaldo
      DEMO_DATABASE[4], // Kobel
      DEMO_DATABASE[5], // Schlotterbeck
    ]);
    setLineup([
      DEMO_DATABASE[4], // GK: Kobel
      DEMO_DATABASE[3], // DEF: Grimaldo
      DEMO_DATABASE[5], // DEF: Schlotterbeck
      undefined,
      undefined,
      DEMO_DATABASE[0], // MID: Wirtz
      DEMO_DATABASE[1], // MID: Musiala
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
    setBudget(31500000);
  };

  // Handler to buy/add player to squad
  const handleAddToSquad = async (player: Player) => {
    if (squad.some(p => p.id === player.id)) return;
    if (budget < player.price) {
      alert("Nicht genügend Budget!");
      return;
    }

    if (!isOfflineMode) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('squad_players')
          .insert({
            user_id: user.id,
            player_id: player.id
          });

        if (error) throw error;
      } catch (err: any) {
        alert('Kauf fehlgeschlagen: ' + err.message);
        return;
      }
    }

    const updatedSquad = [...squad, player];
    setSquad(updatedSquad);
    setBudget(budget - player.price);
  };

  // Handler to remove player from squad (and lineup)
  const handleRemoveFromSquad = async (playerId: string) => {
    const player = squad.find(p => p.id === playerId);
    if (!player) return;

    if (!isOfflineMode) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Will cascade delete from lineup table via FK constraints
        const { error } = await supabase
          .from('squad_players')
          .delete()
          .eq('user_id', user.id)
          .eq('player_id', playerId);

        if (error) throw error;
      } catch (err: any) {
        alert('Verkauf fehlgeschlagen: ' + err.message);
        return;
      }
    }

    setSquad(squad.filter(p => p.id !== playerId));
    setLineup(lineup.map(p => p?.id === playerId ? undefined : p));
    setBudget(budget + player.price);
  };

  // Intercept lineup planning changes and persist to Supabase
  const handleUpdateLineup = async (newLineup: (Player | undefined)[]) => {
    setLineup(newLineup);

    if (isOfflineMode) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Clear current lineup mappings
      const { error: clearError } = await supabase
        .from('lineups')
        .delete()
        .eq('user_id', user.id);

      if (clearError) throw clearError;

      // 2. Insert new lineup slot assignments
      const insertRows = newLineup
        .map((player, slotIdx) => player ? {
          user_id: user.id,
          slot_index: slotIdx,
          player_id: player.id
        } : null)
        .filter(Boolean);

      if (insertRows.length > 0) {
        const { error: insertError } = await supabase
          .from('lineups')
          .insert(insertRows);

        if (insertError) throw insertError;
      }
    } catch (err: any) {
      console.error('Fehler beim Speichern der Aufstellung:', err.message);
    }
  };

  // Admin handlers (keep states synced locally for instant UI response)
  const handleAddPlayerToDb = (newPlayer: Player) => {
    setDbPlayers([newPlayer, ...dbPlayers]);
  };

  const handleDeletePlayerFromDb = (playerId: string) => {
    setDbPlayers(dbPlayers.filter(p => p.id !== playerId));
    handleRemoveFromSquad(playerId);
  };

  const handleBulkAddPlayers = (newPlayers: Player[]) => {
    setDbPlayers(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const filteredNew = newPlayers.filter(p => !existingIds.has(p.id));
      return [...filteredNew, ...prev];
    });
  };

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    syncSupabaseData(email);
  };

  const handleLogout = async () => {
    if (!isOfflineMode) {
      await supabase.auth.signOut();
    }
    setUserEmail(null);
    setActiveTab('dashboard');
    syncSupabaseData(null);
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
    { id: 'teamcheck', label: 'Teamcheck', icon: Shield },
    { id: 'planner', label: 'FDR-Planer', icon: Calendar },
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

            {/* User Profile Card & Sign In Control */}
            <div className="space-y-3 border-t border-white/[0.06] pt-5">
              {userEmail ? (
                <div className="w-full flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isAdmin ? 'bg-successor-mint/15 text-successor-mint border border-successor-mint/20' : 'bg-white/[0.06] text-gray-400 border border-white/5'}`}>
                      {isAdmin ? <ShieldAlert size={14} /> : <User size={14} />}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">
                        {userEmail.split('@')[0]}
                      </div>
                      <div className="text-[8px] font-mono text-successor-textMuted truncate">
                        {userEmail}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex-shrink-0"
                    title="Abmelden"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-xl hover:bg-white/[0.08] hover:border-white/[0.1] text-xs font-bold text-white transition-all active:scale-[0.98]"
                >
                  <LogIn size={14} />
                  <span>Anmelden</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-grow flex flex-col min-w-0">
        
        {/* PAGE BODY AREA */}
        <main className="flex-grow pt-[max(1.25rem,env(safe-area-inset-top,0px))] pb-[calc(5rem+env(safe-area-inset-bottom,0px))] md:pb-6 md:pt-6 px-4 md:px-8 max-w-6xl w-full mx-auto overflow-y-auto no-scrollbar">
          
          {/* MOBILE HEADER (scrolls away with page content) */}
          <header className="md:hidden flex items-center justify-between pb-3.5 mb-5 border-b border-white/[0.04] w-full">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Successor Logo" className="h-6 w-6 object-contain" style={{ width: '24px', height: '24px' }} />
              <span className="text-sm font-black uppercase tracking-wider text-white">Successor</span>
            </div>

            {/* Login/Logout Button for Mobile */}
            {userEmail ? (
              <button
                onClick={handleLogout}
                className="text-[9px] font-black uppercase tracking-wider bg-red-950/20 border border-red-900/30 rounded-lg px-2.5 py-1 text-red-400 hover:text-white"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-[9px] font-black uppercase tracking-wider bg-white/[0.04] border border-white/[0.06] rounded-lg px-2.5 py-1 text-gray-300 hover:text-white"
              >
                Login
              </button>
            )}
          </header>
          
          {activeTab === 'dashboard' && (
            <Dashboard 
              players={squad} 
              lineup={lineup} 
              budget={budget} 
              onLoadDemoData={handleLoadDemoData} 
            />
          )}

          {activeTab === 'analytics' && (
            <PlayerAnalysis players={dbPlayers} />
          )}

          {activeTab === 'teamcheck' && (
            <TeamCheck />
          )}

          {activeTab === 'planner' && (
            <FixturePlanner />
          )}

          {activeTab === 'transfer' && (
            <TransferHelper players={dbPlayers} onAddToSquad={handleAddToSquad} squadIds={squadIds} />
          )}

          {activeTab === 'lineup' && (
            <LineupPlanner squad={squad} lineup={lineup} onUpdateLineup={handleUpdateLineup} />
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]">
          <nav 
            className="ios-tab-bar"
            style={{
              backgroundColor: 'rgba(18, 20, 24, 0.75)',
              backdropFilter: 'blur(50px) saturate(240%)',
              WebkitBackdropFilter: 'blur(50px) saturate(240%)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
              borderRadius: '24px',
              position: 'relative',
              width: '100%'
            }}
          >
            <div className="ios-tab-inner">
              
              <button
                onClick={() => setActiveTab('dashboard')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'dashboard' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <LayoutDashboard size={20} strokeWidth={activeTab === 'dashboard' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Dashboard</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('analytics')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'analytics' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <LineChart size={20} strokeWidth={activeTab === 'analytics' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Analyse</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('teamcheck')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'teamcheck' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <Shield size={20} strokeWidth={activeTab === 'teamcheck' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Teamcheck</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('transfer')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'transfer' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <Zap size={20} strokeWidth={activeTab === 'transfer' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Transfer</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('lineup')}
                className="ios-tab-item"
              >
                <div className={`ios-tab-content ${activeTab === 'lineup' ? 'ios-tab-active' : 'ios-tab-inactive'}`}>
                  <Users size={20} strokeWidth={activeTab === 'lineup' ? 2.5 : 1.8} />
                  <span className="ios-tab-label">Aufstellung</span>
                </div>
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="ios-tab-item"
              >
                <div className="ios-tab-content ios-tab-inactive">
                  <Sliders size={20} strokeWidth={1.8} />
                  <span className="ios-tab-label">Menü</span>
                </div>
              </button>

            </div>
          </nav>
        </div>

      </div>

      {/* Mobile drawer control center */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userEmail={userEmail}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      {/* Auth Modal Portal Overlay */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />

    </div>
  );
}
