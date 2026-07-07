import { useState } from 'react';
import type { Player } from './PlayerCard';
import { Shield, Plus, Trash2, Database, RefreshCw, Check, Upload, Calendar } from 'lucide-react';
import { supabase, isOfflineMode } from '../lib/supabase';

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
  const [avatarColor, setAvatarColor] = useState('from-red-600 to-black');
  
  // Custom picture states
  const [image, setImage] = useState<string>('');
  const [imageName, setImageName] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Spielplan states
  const [spielplan, setSpielplan] = useState<any>(null);
  const [spielplanName, setSpielplanName] = useState('');

  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Convert uploaded image to base64 for instant preview, keep reference to file for upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileToUpload(file);
    setImageName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Parse uploaded Spielplan file
  const handleSpielplanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSpielplanName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        setSpielplan(parsed);
      } catch (err) {
        alert('Ungültiges Spielplan-Format. Bitte lade eine korrekte JSON-Datei hoch.');
        setSpielplanName('');
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSyncing(true);
    let finalImageUrl = image; // Fallback to base64 string if offline

    try {
      // 1. If online and file selected, upload to Supabase Storage
      if (!isOfflineMode && fileToUpload) {
        const fileExt = fileToUpload.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('player-images')
          .upload(filePath, fileToUpload);

        if (uploadError) throw uploadError;

        // Retrieve public URL from bucket
        const { data: urlData } = supabase.storage
          .from('player-images')
          .getPublicUrl(filePath);

        finalImageUrl = urlData.publicUrl;
      }

      const newPlayer: Player = {
        id: 'custom-' + Date.now(),
        name,
        position,
        price,
        xp,
        form,
        team,
        opponent: 'TBD',
        isHome: true,
        avatarColor,
        image: finalImageUrl
      };

      // 2. If online, insert player record in players table
      if (!isOfflineMode) {
        const { error: dbError } = await supabase
          .from('players')
          .insert({
            id: newPlayer.id,
            name: newPlayer.name,
            position: newPlayer.position,
            price: newPlayer.price,
            xp: newPlayer.xp,
            form: newPlayer.form,
            team: newPlayer.team,
            opponent: newPlayer.opponent,
            is_home: newPlayer.isHome,
            avatar_color: newPlayer.avatarColor,
            image: newPlayer.image
          });

        if (dbError) throw dbError;
      }

      onAddPlayer(newPlayer);
      
      // Reset Form
      setName('');
      setXp(85);
      setPrice(10000000);
      setImage('');
      setImageName('');
      setFileToUpload(null);
    } catch (err: any) {
      alert('Fehler beim Speichern: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async (playerId: string) => {
    if (!confirm('Möchtest du diesen Spieler wirklich aus der Datenbank löschen?')) return;

    if (!isOfflineMode) {
      try {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('id', playerId);

        if (error) throw error;
      } catch (err: any) {
        alert('Fehler beim Löschen: ' + err.message);
        return;
      }
    }

    onDeletePlayer(playerId);
  };

  // Mock scraper to simulate scraping Transfermarkt
  const handleScrapeTransfermarkt = async () => {
    setSyncing(true);
    setSyncSuccess(false);

    try {
      const scraped: Player[] = [
        { id: 'tm-1', name: 'Florian Wirtz', position: 'MID', price: 42000000, xp: 215, form: 1.4, team: 'Bayer Leverkusen', opponent: 'FC Bayern', isHome: false, avatarColor: 'from-red-600 to-black' },
        { id: 'tm-2', name: 'Jamal Musiala', position: 'MID', price: 39500000, xp: 195, form: 1.3, team: 'FC Bayern', opponent: 'Leverkusen', isHome: true, avatarColor: 'from-red-600 to-red-950' },
        { id: 'tm-3', name: 'Harry Kane', position: 'FWD', price: 46000000, xp: 240, form: 1.2, team: 'FC Bayern', opponent: 'Leverkusen', isHome: true, avatarColor: 'from-red-600 to-red-950' },
        { id: 'tm-4', name: 'Alejandro Grimaldo', position: 'DEF', price: 34000000, xp: 185, form: 1.3, team: 'Bayer Leverkusen', opponent: 'FC Bayern', isHome: false, avatarColor: 'from-red-600 to-black' },
        { id: 'tm-5', name: 'Gregor Kobel', position: 'GK', price: 21000000, xp: 115, form: 1.0, team: 'Dortmund', opponent: 'Stuttgart', isHome: true, avatarColor: 'from-yellow-500 to-black' },
        { id: 'tm-6', name: 'Nico Schlotterbeck', position: 'DEF', price: 24000000, xp: 130, form: 1.1, team: 'Dortmund', opponent: 'Stuttgart', isHome: true, avatarColor: 'from-yellow-500 to-black' },
        { id: 'tm-7', name: 'Xavi Simons', position: 'MID', price: 31000000, xp: 160, form: 1.1, team: 'RB Leipzig', opponent: 'Frankfurt', isHome: false, avatarColor: 'from-blue-600 to-red-600' },
      ];

      if (!isOfflineMode) {
        // Bulk insert to Supabase database (overwrite on conflict or skip duplicates)
        // Convert to database snake_case keys
        const dbRows = scraped.map(p => ({
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
      }

      onBulkAdd(scraped);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err: any) {
      alert('Scraper Sync Fehler: ' + err.message);
    } finally {
      setSyncing(false);
    }
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
            Datenbanksteuerung &amp; Scraper Panel (Sicherheitsgeschützt für bh.dtl@web.de)
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
        
        {/* ADD PLAYER FORM */}
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
                placeholder="z.B. Florian Wirtz"
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
                <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Exp. Points (xP)</label>
                <input
                  type="number"
                  required
                  value={xp}
                  onChange={e => setXp(parseInt(e.target.value))}
                  className="w-full bg-[#0d0e10]/80 border border-white/[0.06] rounded-xl py-2 px-3.5 text-xs text-white focus:border-successor-mint/50 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Custom image selector */}
            <div>
              <label className="text-[9px] font-mono uppercase text-successor-textMuted block mb-1">Spieler-Bild (Foto)</label>
              <div className="relative flex items-center">
                <input
                  type="file"
                  id="player-image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="player-image-upload"
                  className="w-full flex items-center justify-between px-3.5 py-2 border border-white/[0.06] bg-[#0d0e10]/80 rounded-xl text-xs text-gray-400 hover:text-white hover:border-successor-mint/30 cursor-pointer transition-all"
                >
                  <span className="truncate">{imageName || 'Bild auswählen...'}</span>
                  <Upload size={13} className="text-gray-500" />
                </label>
              </div>
              {image && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/10 bg-successor-card">
                    <img src={image} alt="Vorschau" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] text-successor-mint font-bold font-mono">Vorschau bereit</span>
                </div>
              )}
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
              <span>{syncing ? 'Verarbeite...' : 'Spieler anlegen'}</span>
            </button>
          </form>
        </div>

        {/* SPIELPLAN UPLOAD & LIST */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Spielplan-Modul */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Calendar size={16} className="text-successor-mint" />
                Spielplan (Spieltage)
              </h2>
              <span className="text-[9px] font-mono text-successor-textMuted">Data Input</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <input
                type="file"
                id="spielplan-upload"
                accept=".json"
                onChange={handleSpielplanChange}
                className="hidden"
              />
              <label
                htmlFor="spielplan-upload"
                className="flex items-center gap-2 px-4 py-2 border border-white/[0.06] bg-[#0d0e10]/80 rounded-xl text-xs text-gray-300 hover:text-white hover:border-successor-mint/30 cursor-pointer transition-all"
              >
                <Upload size={13} className="text-gray-500" />
                <span>{spielplanName || 'Spielplan-Datei (.json) hochladen'}</span>
              </label>
              <span className="text-[10px] text-successor-textMuted font-mono">
                ODER lade die spielplan_template.json aus /public/data
              </span>
            </div>

            {/* List matches if parsed */}
            {spielplan && (
              <div className="bg-[#0d0e10]/60 border border-white/[0.04] rounded-xl p-4 max-h-[160px] overflow-y-auto space-y-2 no-scrollbar">
                <div className="text-[10px] font-black text-successor-mint uppercase tracking-wider mb-2">
                  Geladene Partien (Spieltag {spielplan.spieltage?.[0]?.spieltag || 1}):
                </div>
                {spielplan.spieltage?.[0]?.matches?.map((match: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs py-1 border-b border-white/[0.03] last:border-0 font-mono text-gray-300">
                    <span>{match.home}</span>
                    <span className="text-successor-textMuted">vs.</span>
                    <span>{match.away}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Database list */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-sm font-black uppercase tracking-wider text-white mb-4">Lokale Spieldatenbank ({players.length} Spieler)</h2>
            <div className="overflow-y-auto max-h-[220px] pr-1 space-y-2 no-scrollbar">
              {players.length === 0 ? (
                <div className="py-6 text-center text-xs text-successor-textMuted font-mono">
                  Datenbank ist leer. Klicke oben rechts auf den Scraper, um Demo-Daten zu laden!
                </div>
              ) : (
                players.map((player) => (
                  <div key={player.id} className="flex justify-between items-center p-2.5 bg-white/[0.01] border border-white/[0.03] rounded-xl hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      {player.image ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10">
                          <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/5 flex items-center justify-center font-bold text-xs uppercase text-successor-mint">
                          {player.name.substring(0, 2)}
                        </div>
                      )}
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
                        onClick={() => handleDelete(player.id)}
                        className="p-1.5 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 hover:text-white hover:bg-red-600 transition-colors"
                        title="Spieler löschen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
