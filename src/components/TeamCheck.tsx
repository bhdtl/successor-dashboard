import { useState, useEffect } from 'react';
import { supabase, isOfflineMode } from '../lib/supabase';
import { BUNDESLIGA_ROSTERS } from '../data/rosters';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Search, 
  ChevronDown, 
  ChevronUp,
  X, 
  ArrowUpDown,
  Zap,
  RefreshCw
} from 'lucide-react';

interface TeamStats {
  squadSize: number;
  averageFdr: number;
  totalValue: number;
  topScorer: { name: string; points: number } | null;
  bestValue: { name: string; ratio: number } | null;
}

// 18 Bundesliga clubs logos mappings
const TEAM_LOGOS: Record<string, string> = {
  "FCB": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "LEV": "https://upload.wikimedia.org/wikipedia/de/f/f7/Bayer_04_Leverkusen_Logo.svg",
  "BVB": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "RBL": "https://upload.wikimedia.org/wikipedia/de/d/d4/RB_Leipzig_2014_Logo.svg",
  "VFB": "https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg",
  "SGE": "https://upload.wikimedia.org/wikipedia/commons/0/04/Eintracht_Frankfurt_Logo.svg",
  "TSG": "https://upload.wikimedia.org/wikipedia/commons/e/e7/Logo_TSG_Hoffenheim.svg",
  "SCF": "https://upload.wikimedia.org/wikipedia/de/f/f1/SC-Freiburg_Logo.svg",
  "SVW": "https://upload.wikimedia.org/wikipedia/commons/b/be/SV-Werder-Bremen-Logo.svg",
  "FCA": "https://upload.wikimedia.org/wikipedia/de/b/b5/FC_Augsburg_Logo.svg",
  "HDH": "https://upload.wikimedia.org/wikipedia/de/e/e0/1._FC_Heidenheim_1846_Logo.svg",
  "M05": "https://upload.wikimedia.org/wikipedia/commons/d/d6/FSV_Mainz_05_Logo.svg",
  "BMG": "https://upload.wikimedia.org/wikipedia/commons/a/ae/Borussia_M%C3%B6nchengladbach_Logo.svg",
  "FCU": "https://upload.wikimedia.org/wikipedia/de/d/d0/1._FC_Union_Berlin_1966_Logo.svg",
  "WOB": "https://upload.wikimedia.org/wikipedia/commons/f/f3/VfL_Wolfsburg_Logo.svg",
  "BOC": "https://upload.wikimedia.org/wikipedia/commons/7/72/VfL_Bochum_logo.svg",
  "STP": "https://upload.wikimedia.org/wikipedia/de/c/c8/FC_St._Pauli_Logo.svg",
  "KSV": "https://upload.wikimedia.org/wikipedia/de/b/b1/Holstein_Kiel_Logo.svg"
};

const TEAM_METADATA: Record<string, { abbr: string; baseFdr: number }> = {
  "Bayer 04 Leverkusen": { abbr: "LEV", baseFdr: 5 },
  "FC Bayern München": { abbr: "FCB", baseFdr: 5 },
  "Borussia Dortmund": { abbr: "BVB", baseFdr: 5 },
  "RB Leipzig": { abbr: "RBL", baseFdr: 5 },
  "VfB Stuttgart": { abbr: "VFB", baseFdr: 4 },
  "Eintracht Frankfurt": { abbr: "SGE", baseFdr: 4 },
  "TSG Hoffenheim": { abbr: "TSG", baseFdr: 3 },
  "SC Freiburg": { abbr: "SCF", baseFdr: 3 },
  "SV Werder Bremen": { abbr: "SVW", baseFdr: 3 },
  "FC Augsburg": { abbr: "FCA", baseFdr: 3 },
  "1. FC Heidenheim": { abbr: "HDH", baseFdr: 3 },
  "1. FSV Mainz 05": { abbr: "M05", baseFdr: 3 },
  "Borussia Mönchengladbach": { abbr: "BMG", baseFdr: 3 },
  "1. FC Union Berlin": { abbr: "FCU", baseFdr: 3 },
  "VfL Wolfsburg": { abbr: "WOB", baseFdr: 3 },
  "VfL Bochum": { abbr: "BOC", baseFdr: 2 },
  "FC St. Pauli": { abbr: "STP", baseFdr: 2 },
  "Holstein Kiel": { abbr: "KSV", baseFdr: 2 }
};

export function TeamCheck() {
  const [selectedTeam, setSelectedTeam] = useState<string>("FC Bayern München");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  
  // Sorting state
  const [sortField, setSortField] = useState<string>("kickbase_points");
  const [sortAsc, setSortAsc] = useState(false);

  // Fetch players for the selected team
  useEffect(() => {
    async function loadTeamPlayers() {
      setLoading(true);
      try {
        if (!isOfflineMode) {
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('team', selectedTeam);
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            setPlayers(data.map((row: any) => ({
              id: row.id,
              name: row.name,
              position: row.position,
              price: Number(row.price),
              xp: row.xp,
              form: Number(row.form),
              team: row.team,
              kickbase_points: row.kickbase_points || 0,
              goals: row.goals || 0,
              assists: row.assists || 0,
              matches_played: row.matches_played || 0,
              stats: row.stats || {}
            })));
            setLoading(false);
            return;
          }
        }
        
        // Fallback to local rosters file if offline or db empty
        const localData = BUNDESLIGA_ROSTERS.filter(p => p.team === selectedTeam);
        setPlayers(localData);
      } catch (err: any) {
        console.error('Error fetching team players:', err.message);
        const localData = BUNDESLIGA_ROSTERS.filter(p => p.team === selectedTeam);
        setPlayers(localData);
      } finally {
        setLoading(false);
      }
    }
    loadTeamPlayers();
  }, [selectedTeam]);

  // Calculate team KPIs
  const kpis: TeamStats = {
    squadSize: players.length,
    averageFdr: TEAM_METADATA[selectedTeam]?.baseFdr || 3,
    totalValue: players.reduce((sum, p) => sum + p.price, 0),
    topScorer: players.length > 0 
      ? players.reduce((best, p) => p.kickbase_points > (best?.points || 0) ? { name: p.name, points: p.kickbase_points } : best, { name: '', points: 0 })
      : null,
    bestValue: players.length > 0
      ? players.reduce((best, p) => {
          const ratio = p.price > 0 ? (p.kickbase_points / (p.price / 1000000)) : 0;
          return ratio > (best?.ratio || 0) ? { name: p.name, ratio } : best;
        }, { name: '', ratio: 0 })
      : null
  };

  // Filter teams list
  const filteredTeamsList = Object.keys(TEAM_METADATA).filter(teamName => 
    teamName.toLowerCase().includes(teamSearchQuery.toLowerCase())
  );

  // Filter players list
  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort players list
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === 'value_ratio') {
      aVal = a.price > 0 ? (a.kickbase_points / (a.price / 1000000)) : 0;
      bVal = b.price > 0 ? (b.kickbase_points / (b.price / 1000000)) : 0;
    }

    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return sortAsc ? (aVal - bVal) : (bVal - aVal);
    }
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const getPositionBadge = (pos: string) => {
    const styles = {
      GK: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      DEF: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      MID: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      FWD: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${styles[pos as keyof typeof styles] || ''}`}>
        {pos}
      </span>
    );
  };

  const getFdrColor = (fdr: number) => {
    if (fdr >= 5) return 'text-red-400 bg-red-950/20 border-red-900/30';
    if (fdr >= 4) return 'text-orange-400 bg-orange-950/20 border-orange-900/30';
    if (fdr >= 3) return 'text-yellow-400 bg-yellow-950/20 border-yellow-900/30';
    return 'text-successor-mint bg-successor-mint/10 border-successor-mint/20';
  };

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* Top Header Selector Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2.5">
            <Users size={24} className="text-successor-mint" />
            Bundesliga Teamcheck
          </h1>
          <p className="text-xs text-successor-textMuted font-mono">
            Kader- &amp; Kickbase-Leistungsdaten der Saison 2025/2026
          </p>
        </div>

        {/* Team Selector Popover Trigger */}
        <div className="relative w-full md:w-64">
          <button
            onClick={() => setIsSelectOpen(!isSelectOpen)}
            className="w-full px-4 py-3 bg-[#0d0e12] border border-white/[0.06] rounded-2xl flex items-center justify-between transition-all hover:border-white/10 active:scale-[0.99]"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="flex items-center gap-2.5">
              <img 
                src={TEAM_LOGOS[TEAM_METADATA[selectedTeam]?.abbr] || ""} 
                alt="" 
                className="w-5 h-5 object-contain" 
                style={{ width: '20px', height: '20px' }} 
              />
              <span className="text-[15px] font-bold text-white truncate">{selectedTeam}</span>
            </div>
            <ChevronDown size={16} className={`text-gray-500 transition-transform ${isSelectOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* iOS-Style Team Selector Popover overlay */}
          {isSelectOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setIsSelectOpen(false)} />
              <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] md:max-h-[380px] md:absolute md:top-full md:bottom-auto md:mt-2 bg-[#0d0e12] border border-white/[0.08] rounded-t-3xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom md:zoom-in-95 duration-200">
                <div className="flex justify-between items-center px-4 py-3.5 border-b border-white/[0.04] md:hidden">
                  <span className="text-xs font-black uppercase text-white tracking-widest">Club Auswählen</span>
                  <button onClick={() => setIsSelectOpen(false)} className="p-1 bg-white/[0.03] border border-white/[0.06] rounded-lg text-gray-400">
                    <X size={14} />
                  </button>
                </div>
                
                {/* Mini Search inside popup */}
                <div className="p-2 border-b border-white/[0.04] bg-[#07080b]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                    <input
                      type="text"
                      placeholder="Club filtern..."
                      value={teamSearchQuery}
                      onChange={e => setTeamSearchQuery(e.target.value)}
                      className="w-full bg-[#0d0e12] border border-white/[0.04] rounded-xl py-2 pl-9 pr-3 text-[16px] md:text-xs text-white placeholder-gray-600 focus:outline-none focus:border-successor-mint/30"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto p-1.5 space-y-0.5 max-h-[300px] no-scrollbar">
                  {filteredTeamsList.map((teamName) => {
                    const abbr = TEAM_METADATA[teamName]?.abbr;
                    const isSelected = selectedTeam === teamName;
                    return (
                      <button
                        key={teamName}
                        onClick={() => {
                          setSelectedTeam(teamName);
                          setIsSelectOpen(false);
                          setTeamSearchQuery("");
                        }}
                        className={`w-full text-left px-3.5 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold transition-all ${isSelected ? 'bg-successor-mint/10 text-successor-mint border border-successor-mint/20' : 'text-gray-300 hover:bg-white/[0.02]'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img src={TEAM_LOGOS[abbr] || ""} alt="" className="w-5 h-5 object-contain" style={{ width: '20px', height: '20px' }} />
                          <span>{teamName}</span>
                        </div>
                        {isSelected && <Zap size={12} className="fill-current" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* KPI Stats widgets grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Squad size */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-[95px] relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold uppercase text-successor-textMuted tracking-wider">Kadergröße</span>
            <Users size={14} className="text-successor-textMuted group-hover:text-successor-mint transition-colors" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{kpis.squadSize} Spieler</div>
            <div className="text-[8.5px] text-successor-textMuted font-mono">Im Successor Tracker</div>
          </div>
        </div>

        {/* KPI 2: FDR Rating */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-[95px] relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold uppercase text-successor-textMuted tracking-wider">Basis FDR</span>
            <TrendingUp size={14} className="text-successor-textMuted" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <div className="text-xl font-black text-white">{kpis.averageFdr}.0</div>
              <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono border ${getFdrColor(kpis.averageFdr)}`}>
                {kpis.averageFdr >= 5 ? 'Elite' : kpis.averageFdr >= 4 ? 'Schwer' : kpis.averageFdr >= 3 ? 'Mittel' : 'Einfach'}
              </span>
            </div>
            <div className="text-[8.5px] text-successor-textMuted font-mono">Schwierigkeitsstufe</div>
          </div>
        </div>

        {/* KPI 3: Squad value */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-[95px] relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold uppercase text-successor-textMuted tracking-wider">Gesamtwert</span>
            <DollarSign size={14} className="text-successor-textMuted group-hover:text-successor-mint transition-colors" />
          </div>
          <div>
            <div className="text-xl font-black text-white">{(kpis.totalValue / 1000000).toFixed(1)}M €</div>
            <div className="text-[8.5px] text-successor-textMuted font-mono">Kader-Marktwert</div>
          </div>
        </div>

        {/* KPI 4: Top point scorer */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-[95px] relative overflow-hidden group">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold uppercase text-successor-textMuted tracking-wider">Top-Scorer</span>
            <Award size={14} className="text-successor-mint" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white truncate max-w-[130px]" title={kpis.topScorer?.name}>
              {kpis.topScorer ? kpis.topScorer.name : 'Keine Daten'}
            </div>
            <div className="text-[8.5px] text-successor-textMuted font-mono">
              Schnitt: <strong className="text-successor-mint">{kpis.topScorer ? kpis.topScorer.points : 0} Pkt.</strong>
            </div>
          </div>
        </div>

        {/* KPI 5: Best Value Pick */}
        <div className="glass-card rounded-2xl p-4 flex flex-col justify-between h-[95px] relative overflow-hidden group lg:col-span-1 col-span-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-mono font-bold uppercase text-successor-textMuted tracking-wider">Value-Pick</span>
            <Zap size={14} className="text-purple-400" />
          </div>
          <div>
            <div className="text-[13px] font-black text-white truncate max-w-[200px] lg:max-w-[130px]" title={kpis.bestValue?.name}>
              {kpis.bestValue ? kpis.bestValue.name : 'Keine Daten'}
            </div>
            <div className="text-[8.5px] text-successor-textMuted font-mono">
              Punkte pro Mio.: <strong className="text-purple-400">{kpis.bestValue ? kpis.bestValue.ratio.toFixed(1) : 0}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* Roster list table area */}
      <div className="glass-card rounded-3xl p-5 space-y-4">
        
        {/* Search bar inside list */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">Spieler-Kaderliste</h2>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Name oder Position filtern..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d0e12] border border-white/[0.06] rounded-xl py-2 pl-10 pr-4 text-[16px] md:text-xs text-white placeholder-gray-500 focus:outline-none focus:border-successor-mint/45 shadow-inner"
            />
          </div>
        </div>

        {/* Roster Table Grid */}
        <div className="overflow-x-auto no-scrollbar -mx-5 px-5">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw size={24} className="animate-spin text-successor-mint mx-auto" />
              <div className="text-xs text-successor-textMuted font-mono">Lade Kader-Daten...</div>
            </div>
          ) : sortedPlayers.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <div className="text-xs text-successor-textMuted font-mono">Keine Spieler gefunden.</div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.04] text-[9.5px] font-mono text-successor-textMuted uppercase tracking-wider">
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                    Name {sortField === 'name' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white text-center" onClick={() => handleSort('position')}>
                    Pos {sortField === 'position' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white text-right" onClick={() => handleSort('price')}>
                    Marktwert {sortField === 'price' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white text-right" onClick={() => handleSort('xp')}>
                    XP {sortField === 'xp' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white text-right" onClick={() => handleSort('kickbase_points')}>
                    KB Schnitt {sortField === 'kickbase_points' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white text-right" onClick={() => handleSort('value_ratio')}>
                    Pkt. / Mio. {sortField === 'value_ratio' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white text-center" onClick={() => handleSort('goals')}>
                    Tore {sortField === 'goals' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white text-center" onClick={() => handleSort('assists')}>
                    Assists {sortField === 'assists' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                  <th className="py-3 font-bold select-none cursor-pointer hover:text-white text-center" onClick={() => handleSort('matches_played')}>
                    Spiele {sortField === 'matches_played' ? (sortAsc ? <ChevronUp size={10} className="inline ml-0.5" /> : <ChevronDown size={10} className="inline ml-0.5" />) : <ArrowUpDown size={10} className="inline ml-0.5 text-gray-600" />}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {sortedPlayers.map((player) => {
                  const ratio = player.price > 0 ? (player.kickbase_points / (player.price / 1000000)) : 0;
                  return (
                    <tr key={player.id} className="text-xs hover:bg-white/[0.01] transition-colors group">
                      <td className="py-3 font-bold text-white flex items-center gap-2">
                        {player.name}
                      </td>
                      <td className="py-3 text-center">
                        {getPositionBadge(player.position)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-gray-300">
                        {(player.price / 1000000).toFixed(1)}M €
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-successor-mint/90">
                        {player.xp}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-white">
                        {player.kickbase_points}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-purple-400">
                        {ratio.toFixed(1)}
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                        {player.goals}
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-gray-400 group-hover:text-white transition-colors">
                        {player.assists}
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-gray-500">
                        {player.matches_played}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

    </div>
  );
}
