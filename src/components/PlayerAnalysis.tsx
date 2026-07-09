import { useState } from 'react';
import type { Player } from './PlayerCard';
import { Search, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';

interface PlayerAnalysisProps {
  players: Player[];
}

type SortField = 'name' | 'price' | 'xp' | 'form';
type SortOrder = 'asc' | 'desc';

export function PlayerAnalysis({ players }: PlayerAnalysisProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
  const [sortField, setSortField] = useState<SortField>('xp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  // Filter & Search Logic
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'ALL' || player.position === positionFilter;
    return matchesSearch && matchesPosition;
  });

  // Sorting Logic
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (typeof valA === 'string') {
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB as string) 
        : (valB as string).localeCompare(valA);
    }

    return sortOrder === 'asc' 
      ? (valA as number) - (valB as number) 
      : (valB as number) - (valA as number);
  });

  const formatMoney = (val: number) => {
    return (val / 1000000).toFixed(1) + ' Mio. €';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">Spieler-Analyse</h1>
        <p className="text-xs text-successor-textMuted font-mono">Detaillierte Spielerbewertung und xP-Vergleich</p>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row justify-between gap-3 p-4 bg-successor-card border border-white/[0.04] rounded-2xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Name oder Verein suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 pl-10 pr-4 text-[16px] md:text-xs text-white placeholder-gray-600 focus:border-successor-mint/50 focus:outline-none transition-all"
          />
        </div>

        {/* Position Filters */}
        <div className="flex gap-1 bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl p-1 overflow-x-auto no-scrollbar">
          {(['ALL', 'GK', 'DEF', 'MID', 'FWD'] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setPositionFilter(pos)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                positionFilter === pos
                  ? 'bg-white text-black font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* DATATABLE */}
      <div className="glass-card rounded-2xl overflow-hidden border border-white/[0.04]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#0d0e10]/40 text-[9px] uppercase tracking-[0.15em] font-mono text-successor-textMuted">
                <th className="py-4 px-5">Spieler</th>
                <th className="py-4 px-4 text-center">Position</th>
                <th className="py-4 px-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('price')}>
                  <div className="flex items-center gap-1">
                    Marktwert
                    {sortField === 'price' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white transition-colors text-right" onClick={() => handleSort('xp')}>
                  <div className="flex items-center justify-end gap-1">
                    Expected Points
                    {sortField === 'xp' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                  </div>
                </th>
                <th className="py-4 px-4 cursor-pointer hover:text-white transition-colors text-center" onClick={() => handleSort('form')}>
                  <div className="flex items-center justify-center gap-1">
                    Form
                    {sortField === 'form' && (sortOrder === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />)}
                  </div>
                </th>
                <th className="py-4 px-5 text-right">xP / Mio. €</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03] text-xs">
              {sortedPlayers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-successor-textMuted font-mono">
                    Keine Spieler gefunden.
                  </td>
                </tr>
              ) : (
                sortedPlayers.map((player) => {
                  const efficiency = player.price > 0 ? (player.xp / (player.price / 1000000)).toFixed(2) : '0';
                  
                  return (
                    <tr key={player.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Name / Team */}
                      <td className="py-3.5 px-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center font-bold text-xs uppercase text-successor-mint group-hover:scale-105 transition-transform duration-200">
                          {player.name.substring(0,2)}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{player.name}</div>
                          <div className="text-[9px] text-successor-textMuted uppercase font-mono">{player.team}</div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded-md text-[9px] font-black uppercase text-gray-400">
                          {player.position}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {formatMoney(player.price)}
                      </td>

                      {/* Expected Points */}
                      <td className="py-3.5 px-4 text-right font-black text-white text-xs">
                        {player.xp} <span className="text-[9px] text-successor-textMuted font-normal font-sans">xP</span>
                      </td>

                      {/* Form factor */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1 font-mono font-bold">
                          {player.form >= 1.1 ? (
                            <span className="text-successor-mint flex items-center gap-0.5 text-[11px] bg-successor-mint/5 px-1.5 py-0.5 rounded-md">
                              <ArrowUp size={10} />
                              {player.form.toFixed(1)}x
                            </span>
                          ) : player.form <= 0.9 ? (
                            <span className="text-red-400 flex items-center gap-0.5 text-[11px] bg-red-400/5 px-1.5 py-0.5 rounded-md">
                              <ArrowDown size={10} />
                              {player.form.toFixed(1)}x
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[11px]">
                              {player.form.toFixed(1)}x
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Efficiency Ratio */}
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-successor-mint">
                        {efficiency}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
