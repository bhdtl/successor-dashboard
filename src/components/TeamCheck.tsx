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
  RefreshCw,
  Check
} from 'lucide-react';

interface TeamStats {
  squadSize: number;
  averageFdr: number;
  totalValue: number;
  topScorer: { name: string; points: number } | null;
  bestValue: { name: string; ratio: number } | null;
}

// Mapped exactly to /public/logos/256x256/ paths
const TEAM_LOGOS: Record<string, string> = {
  'FCB': '/logos/256x256/bayern-munchen.football-logos.cc.png',
  'B04': '/logos/256x256/bayer-leverkusen.football-logos.cc.png',
  'BVB': '/logos/256x256/borussia-dortmund.football-logos.cc.png',
  'RBL': '/logos/256x256/rb-leipzig.football-logos.cc.png',
  'VFB': '/logos/256x256/vfb-stuttgart.football-logos.cc.png',
  'SGE': '/logos/256x256/eintracht-frankfurt.football-logos.cc.png',
  'SCF': '/logos/256x256/freiburg.football-logos.cc.png',
  'TSG': '/logos/256x256/hoffenheim.football-logos.cc.png',
  'SVW': '/logos/256x256/werder-bremen.football-logos.cc.png',
  'BMG': '/logos/256x256/borussia-monchengladbach.football-logos.cc.png',
  'FCU': '/logos/256x256/union-berlin.football-logos.cc.png',
  'FCA': '/logos/256x256/augsburg.football-logos.cc.png',
  'M05': '/logos/256x256/mainz-05.football-logos.cc.png',
  'HSV': '/logos/256x256/hamburger-sv.football-logos.cc.png',
  'S04': '/logos/256x256/schalke-04.football-logos.cc.png',
  'SCP': '/logos/256x256/paderborn.football-logos.cc.png',
  'SVE': '/logos/256x256/sv-elversberg.football-logos.cc.png',
  'KOE': '/logos/256x256/koln.football-logos.cc.png'
};

const CLUBS = [
  { name: 'FC Bayern München', abbr: 'FCB', baseFdr: 5 },
  { name: 'Bayer 04 Leverkusen', abbr: 'B04', baseFdr: 5 },
  { name: 'Borussia Dortmund', abbr: 'BVB', baseFdr: 5 },
  { name: 'RB Leipzig', abbr: 'RBL', baseFdr: 5 },
  { name: 'VfB Stuttgart', abbr: 'VFB', baseFdr: 4 },
  { name: 'Eintracht Frankfurt', abbr: 'SGE', baseFdr: 4 },
  { name: 'TSG Hoffenheim', abbr: 'TSG', baseFdr: 3 },
  { name: 'Sport-Club Freiburg', abbr: 'SCF', baseFdr: 3 },
  { name: 'SV Werder Bremen', abbr: 'SVW', baseFdr: 3 },
  { name: 'Borussia Mönchengladbach', abbr: 'BMG', baseFdr: 3 },
  { name: '1. FC Union Berlin', abbr: 'FCU', baseFdr: 3 },
  { name: 'FC Augsburg', abbr: 'FCA', baseFdr: 3 },
  { name: '1. FSV Mainz 05', abbr: 'M05', baseFdr: 3 },
  { name: 'Hamburger SV', abbr: 'HSV', baseFdr: 2 },
  { name: 'FC Schalke 04', abbr: 'S04', baseFdr: 2 },
  { name: 'SC Paderborn 07', abbr: 'SCP', baseFdr: 2 },
  { name: 'SV Elversberg', abbr: 'SVE', baseFdr: 2 },
  { name: '1. FC Köln', abbr: 'KOE', baseFdr: 2 }
];

export function TeamCheck() {
  const [selectedAbbr, setSelectedAbbr] = useState<string>("FCB");
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  
  // Sorting state
  const [sortField, setSortField] = useState<string>("kickbase_points");
  const [sortAsc, setSortAsc] = useState(false);

  const activeClub = CLUBS.find(c => c.abbr === selectedAbbr) || CLUBS[0];

  // Fetch players for the selected team
  useEffect(() => {
    async function loadTeamPlayers() {
      setLoading(true);
      try {
        if (!isOfflineMode) {
          const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('team', activeClub.name);
          
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
        const localData = BUNDESLIGA_ROSTERS.filter(p => p.team === activeClub.name);
        setPlayers(localData);
      } catch (err: any) {
        console.error('Error fetching team players:', err.message);
        const localData = BUNDESLIGA_ROSTERS.filter(p => p.team === activeClub.name);
        setPlayers(localData);
      } finally {
        setLoading(false);
      }
    }
    loadTeamPlayers();
  }, [selectedAbbr]);

  // Calculate team KPIs
  const kpis: TeamStats = {
    squadSize: players.length,
    averageFdr: activeClub.baseFdr,
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

  // Filter teams list based on search
  const filteredClubsList = CLUBS.filter(club => 
    club.name.toLowerCase().includes(teamSearchQuery.toLowerCase()) ||
    club.abbr.toLowerCase().includes(teamSearchQuery.toLowerCase())
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

        {/* Team Selector Trigger (Matching FDR Selection Look) */}
        <div className="relative w-full md:w-64">
          <button
            onClick={() => {
              setTeamSearchQuery('');
              setIsSelectOpen(true);
            }}
            className="w-full px-4 py-3 bg-[#0d0e12]/80 hover:bg-black border border-white/[0.06] hover:border-white/10 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99] shadow-inner"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="flex items-center gap-2.5">
              <img 
                src={TEAM_LOGOS[activeClub.abbr]} 
                alt="" 
                className="w-5.5 h-5.5 object-contain" 
                style={{ width: '22px', height: '22px' }} 
              />
              <span className="text-[14px] font-bold text-white truncate">{activeClub.name}</span>
            </div>
            <ChevronDown size={14} className="text-gray-500" />
          </button>
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
            <div className="text-[8.5px] text-successor-textMuted font-mono">Echte Roster-Spieler</div>
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
            <div className="text-[8.5px] text-successor-textMuted font-mono">FDR Stärke</div>
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

      {/* premium search popup selector modal overlay (matching FixturePlanner exactly) */}
      {isSelectOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all animate-in fade-in duration-200">
          <div className="bg-[#181a20] border border-white/[0.08] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Verein auswählen</h3>
                <p className="text-[9.5px] text-successor-textMuted font-mono">Suche deinen Bundesliga-Club aus</p>
              </div>
              <button 
                onClick={() => setIsSelectOpen(false)}
                className="p-1.5 bg-[#0d0e12] border border-white/[0.04] rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <X size={14} />
              </button>
            </div>

            {/* Live Search input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
              <input
                type="text"
                value={teamSearchQuery}
                onChange={e => setTeamSearchQuery(e.target.value)}
                placeholder="Name oder Kürzel suchen..."
                className="w-full bg-[#0d0e12] border border-white/[0.06] rounded-xl py-2.5 pl-10 pr-4 text-[16px] md:text-xs font-bold text-white placeholder-gray-500 focus:border-successor-mint/45 focus:outline-none transition-all shadow-inner"
                autoFocus
              />
            </div>

            {/* List of clubs */}
            <div className="overflow-y-auto pr-1 space-y-1.5 max-h-[350px] no-scrollbar">
              {filteredClubsList.length > 0 ? (
                filteredClubsList.map((club) => {
                  const isSelected = club.abbr === activeClub.abbr;
                  return (
                    <button
                      key={club.abbr}
                      onClick={() => {
                        setSelectedAbbr(club.abbr);
                        setIsSelectOpen(false);
                        setTeamSearchQuery("");
                      }}
                      className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center justify-between transition-all ${
                        isSelected 
                          ? 'bg-white text-black shadow-lg' 
                          : 'text-gray-300 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={TEAM_LOGOS[club.abbr]} 
                          alt="" 
                          className="w-6 h-6 object-contain" 
                          style={{ width: '24px', height: '24px' }} 
                        />
                        <div className="text-left">
                          <div className={`text-xs font-black ${isSelected ? 'text-black' : 'text-white'}`}>{club.name}</div>
                          <span className="text-[8.5px] font-mono text-gray-500 uppercase">{club.abbr}</span>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <Check size={14} className="text-black" />
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-8 text-[10px] font-mono text-gray-500">
                  Keine Vereine gefunden
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
