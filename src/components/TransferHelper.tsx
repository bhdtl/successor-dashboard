import type { Player } from './PlayerCard';
import { Plus } from 'lucide-react';

interface TransferHelperProps {
  players: Player[];
  onAddToSquad: (player: Player) => void;
  squadIds: Set<string>;
}

export function TransferHelper({ players, onAddToSquad, squadIds }: TransferHelperProps) {
  // Logic to identify picks:
  // "Top Value Picks": Players who have high expected points relative to price. (Ratio xP / Price > 3.0, sorted by xP)
  // "Underpriced Targets": Players whose price is low but form is high. (Price < 15M and Form >= 1.1, sorted by price ascending)
  
  const allAvailablePlayers = players.filter(p => !squadIds.has(p.id));

  const topValuePicks = [...allAvailablePlayers]
    .filter(p => p.price > 0 && (p.xp / (p.price / 1000000)) >= 2.5)
    .sort((a, b) => b.xp - a.xp)
    .slice(0, 5);

  const underpricedTargets = [...allAvailablePlayers]
    .filter(p => p.price <= 15000000 && p.form >= 1.1)
    .sort((a, b) => a.price - b.price)
    .slice(0, 5);

  const formatMoney = (val: number) => {
    return (val / 1000000).toFixed(1) + ' Mio. €';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-wider text-white">Transfer-Helfer</h1>
        <p className="text-xs text-successor-textMuted font-mono">Algorithmisch gefilterte Kaufempfehlungen</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COLUMN 1: TOP VALUE PICKS */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Top Value Picks</h2>
              <span className="text-[10px] font-mono text-successor-mint">Effizienz-Fokus</span>
            </div>
            <p className="text-[10px] text-successor-textMuted font-mono mb-4">
              Spieler mit dem besten Verhältnis aus Punkte-Potenzial und Marktwert
            </p>

            <div className="space-y-3">
              {topValuePicks.length === 0 ? (
                <div className="text-xs text-successor-textMuted text-center py-8">
                  Keine Empfehlungen verfügbar.
                </div>
              ) : (
                topValuePicks.map((player) => {
                  const ratio = (player.xp / (player.price / 1000000)).toFixed(2);
                  return (
                    <div key={player.id} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-successor-mint/20 hover:bg-white/[0.03] transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center font-bold text-xs uppercase text-successor-mint">
                          {player.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-successor-mint transition-colors">{player.name}</div>
                          <div className="text-[8.5px] text-successor-textMuted font-mono uppercase">{player.position} • {player.team}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs font-black text-white">{player.xp} xP</div>
                          <div className="text-[9.5px] font-mono text-successor-mint font-bold">{ratio} pts/Mio</div>
                        </div>
                        <button
                          onClick={() => onAddToSquad(player)}
                          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-black hover:bg-successor-mint hover:border-successor-mint transition-all"
                          title="In den Kader kaufen"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* COLUMN 2: UNDERPRICED TARGETS */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Underpriced Targets</h2>
              <span className="text-[10px] font-mono text-[#ff8800]">Marktwert-Bargains</span>
            </div>
            <p className="text-[10px] text-successor-textMuted font-mono mb-4">
              Günstige Spieler im Aufwärtstrend – ideal zum Spekulieren
            </p>

            <div className="space-y-3">
              {underpricedTargets.length === 0 ? (
                <div className="text-xs text-successor-textMuted text-center py-8">
                  Keine Schnäppchen verfügbar.
                </div>
              ) : (
                underpricedTargets.map((player) => {
                  return (
                    <div key={player.id} className="flex justify-between items-center p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:border-successor-mint/20 hover:bg-white/[0.03] transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center font-bold text-xs uppercase text-successor-mint">
                          {player.name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-successor-mint transition-colors">{player.name}</div>
                          <div className="text-[8.5px] text-successor-textMuted font-mono uppercase">{player.position} • {player.team} • Form: {player.form}x</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs font-black text-white">{formatMoney(player.price)}</div>
                          <div className="text-[9.5px] font-mono text-[#00ff88] font-bold">+{player.xp} xP</div>
                        </div>
                        <button
                          onClick={() => onAddToSquad(player)}
                          className="p-1.5 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-black hover:bg-successor-mint hover:border-successor-mint transition-all"
                          title="In den Kader kaufen"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
