import { useState } from 'react';
import { PlayerCard } from './PlayerCard';
import type { Player } from './PlayerCard';
import { Users } from 'lucide-react';

interface LineupPlannerProps {
  squad: Player[];
  lineup: (Player | undefined)[];
  onUpdateLineup: (newLineup: (Player | undefined)[]) => void;
}

type Formation = '4-3-3' | '3-4-3' | '4-4-2' | '3-5-2';

export function LineupPlanner({ squad, lineup, onUpdateLineup }: LineupPlannerProps) {
  const [formation, setFormation] = useState<Formation>('4-3-3');
  const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  // Position slots count based on formation
  // Index layout inside lineup array (length 11):
  // Index 0: GK
  // Indexes 1 to 4: DEF slots
  // Indexes 5 to 8: MID slots
  // Indexes 9 to 10: FWD slots
  // Note: Depending on formation, we map each lineup index to its correct position.
  // Let's create a robust mapping:
  const getFormationStructure = (form: Formation) => {
    switch (form) {
      case '3-4-3':
        return { GK: 1, DEF: 3, MID: 4, FWD: 3 };
      case '4-4-2':
        return { GK: 1, DEF: 4, MID: 4, FWD: 2 };
      case '3-5-2':
        return { GK: 1, DEF: 3, MID: 5, FWD: 2 };
      case '4-3-3':
      default:
        return { GK: 1, DEF: 4, MID: 3, FWD: 3 };
    }
  };

  const structure = getFormationStructure(formation);

  // Helper to get active lineup counts
  const filledLineup = lineup.filter(Boolean) as Player[];
  const totalXp = filledLineup.reduce((sum, p) => sum + p.xp, 0);
  const totalCost = filledLineup.reduce((sum, p) => sum + p.price, 0);

  // Get index list for each section
  const getSlotIndices = (pos: 'GK' | 'DEF' | 'MID' | 'FWD') => {
    const indices: number[] = [];
    if (pos === 'GK') {
      indices.push(0);
    } else if (pos === 'DEF') {
      for (let i = 1; i <= structure.DEF; i++) indices.push(i);
    } else if (pos === 'MID') {
      for (let i = 5; i < 5 + structure.MID; i++) indices.push(i);
    } else if (pos === 'FWD') {
      for (let i = 11 - structure.FWD; i < 11; i++) indices.push(i);
    }
    return indices;
  };

  const handleOpenSelector = (index: number) => {
    setActiveSlotIndex(index);
    setShowSelector(true);
  };

  const handleSelectPlayer = (player: Player) => {
    if (activeSlotIndex === null) return;
    
    // Create copy of lineup
    const newLineup = [...lineup];

    // Remove player if already in another position in lineup to prevent duplicates
    const existingIndex = newLineup.findIndex(p => p?.id === player.id);
    if (existingIndex !== -1) {
      newLineup[existingIndex] = undefined;
    }

    // Set player to selected slot
    newLineup[activeSlotIndex] = player;
    onUpdateLineup(newLineup);

    setShowSelector(false);
    setActiveSlotIndex(null);
  };

  const handleRemovePlayer = (index: number) => {
    const newLineup = [...lineup];
    newLineup[index] = undefined;
    onUpdateLineup(newLineup);
  };

  const getPositionForIndex = (index: number): 'GK' | 'DEF' | 'MID' | 'FWD' => {
    if (index === 0) return 'GK';
    if (index >= 1 && index <= 4) return 'DEF';
    if (index >= 5 && index <= 9) return 'MID'; // up to index 9 depending on formation
    return 'FWD';
  };

  // Find eligible players for selection
  const getEligiblePlayersForActiveSlot = () => {
    if (activeSlotIndex === null) return [];
    const targetPos = getPositionForIndex(activeSlotIndex);
    
    // Players in squad matching the position, who are NOT already in the lineup
    return squad.filter(player => {
      const isCorrectPosition = player.position === targetPos;
      const isAlreadyInLineup = lineup.some(p => p?.id === player.id);
      return isCorrectPosition && !isAlreadyInLineup;
    });
  };

  const eligiblePlayers = getEligiblePlayersForActiveSlot();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">Aufstellungs-Planer</h1>
          <p className="text-xs text-successor-textMuted font-mono font-bold">Maximiere deine xP-Ausbeute auf dem Platz</p>
        </div>

        {/* Formation Selector Toggle */}
        <div className="flex bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl p-1">
          {(['4-3-3', '3-4-3', '4-4-2', '3-5-2'] as const).map((form) => (
            <button
              key={form}
              onClick={() => {
                setFormation(form);
                // Clear lineup slots that fall outside the new formation structure
                const newStruct = getFormationStructure(form);
                const newLineup = [...lineup];
                
                // Clear unused DEF indices (e.g. index 4 in 3-man defense)
                if (newStruct.DEF < 4) newLineup[4] = undefined;
                // Clear unused MID indices (e.g. index 8 in 3-midfielder setup)
                if (newStruct.MID < 5) newLineup[9] = undefined; // cleanup index 9
                if (newStruct.MID < 4) newLineup[8] = undefined;
                if (newStruct.MID < 3) newLineup[7] = undefined;
                // Clear unused FWD indices (e.g. index 9 in 2-forward setup)
                if (newStruct.FWD < 3) newLineup[10] = undefined;

                onUpdateLineup(newLineup);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all uppercase ${
                formation === form
                  ? 'bg-white text-black font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {form}
            </button>
          ))}
        </div>
      </div>

      {/* STATS BAR */}
      <div className="grid grid-cols-3 gap-3 p-4 bg-successor-card border border-white/[0.04] rounded-2xl text-center">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-successor-textMuted">Kalkulierte xP</div>
          <div className="text-lg font-black text-[#00ff88]">{totalXp} Pkt.</div>
        </div>
        <div className="border-x border-white/[0.06]">
          <div className="text-[9px] uppercase tracking-wider text-successor-textMuted">Lineup-Wert</div>
          <div className="text-lg font-black text-white">{(totalCost / 1000000).toFixed(1)}M €</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-wider text-successor-textMuted">Roster Status</div>
          <div className="text-lg font-black text-white">{filledLineup.length} / 11</div>
        </div>
      </div>

      {/* FOOTBALL PITCH container */}
      <div className="soccer-pitch p-6 min-h-[480px] xs:min-h-[540px] sm:min-h-[620px] flex flex-col justify-between items-center relative overflow-hidden select-none">
        
        {/* FIELD LINE MARKINGS (SVG backdrop) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <svg className="w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="none">
            {/* Outer border */}
            <rect x="10" y="10" width="380" height="580" fill="none" stroke="white" strokeWidth="1.5" />
            
            {/* Center circle */}
            <circle cx="200" cy="300" r="50" fill="none" stroke="white" strokeWidth="1.5" />
            <line x1="10" y1="300" x2="390" y2="300" stroke="white" strokeWidth="1.5" />
            
            {/* Goal Areas */}
            {/* Top area */}
            <rect x="100" y="10" width="200" height="70" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x="150" y="10" width="100" height="25" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="200" cy="80" r="2" fill="white" />
            
            {/* Bottom area */}
            <rect x="100" y="520" width="200" height="70" fill="none" stroke="white" strokeWidth="1.5" />
            <rect x="150" y="565" width="100" height="25" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="200" cy="520" r="2" fill="white" />
          </svg>
        </div>

        {/* 1. GOALKEEPER ROW */}
        <div className="relative z-10 w-full flex justify-center pt-2">
          {getSlotIndices('GK').map((idx) => (
            <PlayerCard
              key={idx}
              player={lineup[idx]}
              positionLabel="GK"
              onRemove={() => handleRemovePlayer(idx)}
              onClick={() => handleOpenSelector(idx)}
            />
          ))}
        </div>

        {/* 2. DEFENDERS ROW */}
        <div className="relative z-10 w-full flex justify-center gap-3 sm:gap-6 py-2 px-1">
          {getSlotIndices('DEF').map((idx) => (
            <PlayerCard
              key={idx}
              player={lineup[idx]}
              positionLabel="DEF"
              onRemove={() => handleRemovePlayer(idx)}
              onClick={() => handleOpenSelector(idx)}
            />
          ))}
        </div>

        {/* 3. MIDFIELDERS ROW */}
        <div className="relative z-10 w-full flex justify-center gap-3 sm:gap-6 py-2 px-1">
          {getSlotIndices('MID').map((idx) => (
            <PlayerCard
              key={idx}
              player={lineup[idx]}
              positionLabel="MID"
              onRemove={() => handleRemovePlayer(idx)}
              onClick={() => handleOpenSelector(idx)}
            />
          ))}
        </div>

        {/* 4. FORWARDS ROW */}
        <div className="relative z-10 w-full flex justify-center gap-3 sm:gap-6 pb-2 px-1">
          {getSlotIndices('FWD').map((idx) => (
            <PlayerCard
              key={idx}
              player={lineup[idx]}
              positionLabel="FWD"
              onRemove={() => handleRemovePlayer(idx)}
              onClick={() => handleOpenSelector(idx)}
            />
          ))}
        </div>
      </div>

      {/* PLAYER SELECTOR MODAL OVERLAY */}
      {showSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSelector(false)} />
          <div className="relative glass-card rounded-2xl max-w-md w-full p-5 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-white/[0.06] mb-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Users size={16} className="text-successor-mint" />
                Spieler auswählen
              </h3>
              <button onClick={() => setShowSelector(false)} className="text-gray-400 hover:text-white text-xs font-mono">
                Schließen
              </button>
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {eligiblePlayers.length === 0 ? (
                <div className="py-6 text-center text-xs text-successor-textMuted font-mono">
                  Keine verfügbaren Spieler auf dieser Position im Kader. Kaufe zuerst Spieler im Transfer-Helfer!
                </div>
              ) : (
                eligiblePlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player)}
                    className="w-full flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-successor-mint/30 hover:bg-white/[0.04] transition-all text-left"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{player.name}</div>
                      <div className="text-[9px] text-successor-textMuted font-mono uppercase">{player.team} • {player.xp} xP</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-white">{(player.price / 1000000).toFixed(1)}M €</div>
                      <div className="text-[8.5px] text-successor-mint font-black">Form: {player.form.toFixed(1)}x</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
