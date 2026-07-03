import { useState } from 'react';
import type { Player } from './PlayerCard';
import { Shield, Plus, Trash2, Database, RefreshCw, Check } from 'lucide-react';

interface AdminCMSProps {
  players: Player[];
  onAddPlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  onBulkAdd: (newPlayers: Player[]) => void;
}

export function AdminCMS({ players, onAddPlayer, onDeletePlayer, onBulkAdd }: AdminCMSProps) {
  const [name, setName] = useState('');
  const [position, setPosition] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('MID');
  const [price, setPrice] = useState(10000000);
  const [xp, setXp] = useState(85);
  const form = 1.0;
  const [team, setTeam] = useState('FC Bayern');
  const [opponent, setOpponent] = useState('BVB');
  const [isHome, setIsHome] = useState(true);
  const [avatarColor, setAvatarColor] = useState('from-red-600 to-black');
  
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPlayer: Player = {
      id: 'custom-' + Date.now(),
      name,
      position,
      price,
      xp,
      form,
      team,
      opponent,
      isHome,
      avatarColor
    };

    onAddPlayer(newPlayer);
    
    // Reset Form
    setName('');
    setXp(90);
    setPrice(10000000);
  };

  // Mock scraper to simulate scraping Transfermarkt
  const handleScrapeTransfermarkt = () => {
    setSyncing(true);
    setSyncSuccess(false);

    setTimeout(() => {
      // Create some newly scraped mock players from Bundesliga
      const scraped: Player[] = [
        { id: 'tm-1', name: 'Wirtz', position: 'MID', price: 42000000, xp: 210, form: 1.4, team: 'Leverkusen', opponent: 'FC Bayern', isHome: false, avatarColor: 'from-red-600 to-black' },
        { id: 'tm-2', name: 'Musiala', position: 'MID', price: 39500000, xp: 195, form: 1.3, team: 'FC Bayern', opponent: 'Leverkusen', isHome: true, avatarColor: 'from-red-600 to-red-950' },
        { id: 'tm-3', name: 'Grimaldo', position: 'DEF', price: 34000000, xp: 180, form: 1.2, team: 'Leverkusen', opponent: 'FC Bayern', isHome: false, avatarColor: 'from-red-600 to-black' },
        { id: 'tm-4', name: 'Kane', position: 'FWD', price: 46000000, xp: 240, form: 1.2, team: 'FC Bayern', opponent: 'Leverkusen', isHome: true, avatarColor: 'from-red-600 to-red-950' },
        { id: 'tm-5', name: 'Kobel', position: 'GK', price: 21000000, xp: 110, form: 1.0, team: 'Dortmund', opponent: 'Stuttgart', isHome: true, avatarColor: 'from-yellow-500 to-black' },
        { id: 'tm-6', name: 'Schlotterbeck', position: 'DEF', price: 24000000, xp: 125, form: 1.1, team: 'Dortmund', opponent: 'Stuttgart', isHome: true, avatarColor: 'from-yellow-500 to-black' },
        { id: 'tm-7', name: 'Simons', position: 'MID', price: 31000000, xp: 155, form: 1.2, team: 'RB Leipzig', opponent: 'Frankfurt', isHome: false, avatarColor: 'from-blue-600 to-red-600' },
      ];

      onBulkAdd(scraped);
      setSyncing(false);
      setSyncSuccess(true);
      
      // Hide success mark after 3s
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Shield size={24} className="text-successor-mint" />
            Admin CMS
          </h1>
          <p className="text-xs text-successor-textMuted font-mono">
            Datenbanksteuerung &amp; Transfermarkt Scraper Panel (Nur sichtbar für bh.dtl@web.de)
          </p>
        </div>

        {/* Sync Button */}
        <button
          onClick={handleScrapeTransfermarkt}
          disabled={syncing}
          className="btn-mint flex items-center gap-2"
        >
          {syncing ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : syncSuccess ? (
            <Check size={14} />
          ) : (
            <Database size={14} />
          )}
          <span>{syncing ? 'Scraping...' : syncSuccess ? 'Synchronisiert!' : 'Transfermarkt Scraper starten'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ADD PLAYER FORM (1/3 width) */}
        <div className="glass-card rounded-2xl p-5 h-fit space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-white">Spieler hinzufügen</h2>
          
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="z.B. Wirtz"
                className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3.5 text-xs text-white placeholder-gray-700 focus:border-successor-mint/50 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Position</label>
                <select
                  value={position}
                  onChange={e => setPosition(e.target.value as any)}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white focus:border-successor-mint/50 focus:outline-none transition-all"
                >
                  <option value="GK">GK</option>
                  <option value="DEF">DEF</option>
                  <option value="MID">MID</option>
                  <option value="FWD">FWD</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Verein</label>
                <input
                  type="text"
                  required
                  value={team}
                  onChange={e => setTeam(e.target.value)}
                  placeholder="z.B. Leverkusen"
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3.5 text-xs text-white placeholder-gray-700 focus:border-successor-mint/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Marktwert (€)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={e => setPrice(parseInt(e.target.value))}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3.5 text-xs text-white focus:border-successor-mint/50 focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Expected Points (xP)</label>
                <input
                  type="number"
                  required
                  value={xp}
                  onChange={e => setXp(parseInt(e.target.value))}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3.5 text-xs text-white focus:border-successor-mint/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Gegner</label>
                <input
                  type="text"
                  required
                  value={opponent}
                  onChange={e => setOpponent(e.target.value)}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3.5 text-xs text-white focus:border-successor-mint/50 focus:outline-none transition-all"
                />
              </div>
              <div className="flex items-end pb-1.5 pl-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
                  <input
                    type="checkbox"
                    checked={isHome}
                    onChange={e => setIsHome(e.target.checked)}
                    className="rounded border-white/10 bg-[#0d0e10] text-successor-mint focus:ring-0 focus:ring-offset-0"
                  />
                  Heimspiel
                </label>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Team-Farben (Gradiant from-to)</label>
              <select
                value={avatarColor}
                onChange={e => setAvatarColor(e.target.value)}
                className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3 text-xs text-white focus:border-successor-mint/50 focus:outline-none transition-all"
              >
                <option value="from-red-600 to-black">Rot / Schwarz (Leverkusen, Bayern)</option>
                <option value="from-yellow-500 to-black">Gelb / Schwarz (Dortmund)</option>
                <option value="from-blue-600 to-black">Blau / Schwarz (Bochum)</option>
                <option value="from-emerald-500 to-black">Grün / Schwarz (Werder)</option>
                <option value="from-sky-500 to-blue-900">Blau / Weiß (Schalke, Hoffenheim)</option>
                <option value="from-gray-500 to-black">Grau / Schwarz (Möchengladbach)</option>
              </select>
            </div>

            <button type="submit" className="w-full btn-mint py-2.5 flex items-center justify-center gap-2">
              <Plus size={14} />
              <span>Spieler anlegen</span>
            </button>
          </form>
        </div>

        {/* DATABASE TABLE (2/3 width) */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white mb-4">Lokale Spieldatenbank ({players.length} Spieler)</h2>
            
            <div className="overflow-y-auto max-h-[420px] pr-1 space-y-2">
              {players.map((player) => (
                <div key={player.id} className="flex justify-between items-center p-3 bg-white/[0.01] border border-white/[0.03] rounded-xl hover:bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center font-bold text-xs uppercase text-successor-mint">
                      {player.name.substring(0, 2)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{player.name}</div>
                      <div className="text-[8.5px] text-successor-textMuted font-mono uppercase">{player.position} • {player.team}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right text-xs font-mono font-bold text-white">
                      {(player.price / 1000000).toFixed(1)}M €
                    </div>
                    <button
                      onClick={() => onDeletePlayer(player.id)}
                      className="p-1.5 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 hover:text-white hover:bg-red-600 transition-colors"
                      title="Spieler löschen"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
