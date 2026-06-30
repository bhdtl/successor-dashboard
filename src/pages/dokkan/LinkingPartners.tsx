import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ELEMENT_MAP, RARITY_MAP } from './DokkanCatalog';
import linksData from '../../data/links.json';
import { 
  Sparkles, 
  Search, 
  HelpCircle,
  Loader,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Character {
  id: number;
  name: string;
  subname: string;
  rarity: number;
  element: number;
  link_ids: number[];
}

interface PartnerResult {
  character: Character;
  sharedLinks: number[]; // array of link IDs
  count: number;
}

export const LinkingPartners: React.FC = () => {
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [searchResults, setSearchResults] = useState<Character[]>([]);
  const [partners, setPartners] = useState<PartnerResult[]>([]);

  // Fetch all characters minimal data for fast client-side calculations
  useEffect(() => {
    const fetchAllChars = async () => {
      try {
        const { data, error } = await supabase
          .from('dokkan_characters')
          .select('id, name, subname, element, rarity, link_ids');
        
        if (error) throw error;
        if (data) {
          setAllCharacters(data as Character[]);
        }
      } catch (err) {
        console.error('Error fetching characters for partners:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllChars();
  }, []);

  // Search filter
  useEffect(() => {
    if (searchTerm.trim().length >= 2) {
      const filtered = allCharacters.filter(char => 
        char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        char.subname?.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 8); // limit dropdown choices
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, allCharacters]);

  // Calculate partners when a character is selected
  const handleSelectChar = (char: Character) => {
    setSelectedChar(char);
    setSearchTerm('');
    setSearchResults([]);

    // Calculate shared links for all other characters
    const results: PartnerResult[] = [];
    const selectedLinkSet = new Set(char.link_ids);

    allCharacters.forEach(other => {
      if (other.id === char.id) return; // Skip self

      const shared = other.link_ids.filter(id => selectedLinkSet.has(id));
      if (shared.length > 0) {
        results.push({
          character: other,
          sharedLinks: shared,
          count: shared.length
        });
      }
    });

    // Sort by count descending, then by rarity descending (LVs/URs first)
    results.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return b.character.rarity - a.character.rarity;
    });

    // Take top 24 partners
    setPartners(results.slice(0, 24));
  };

  const getLinkName = (id: number) => {
    const lk = linksData.find((l: any) => l.id === id);
    return lk ? lk.name : `Link ${id}`;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-indigo-500" />
          Linking Partner Finder
        </h1>
        <p className="text-gray-400 text-sm">
          Select any Dokkan character to instantly calculate its optimal linking partners based on shared link skills.
        </p>
      </div>

      {/* Selector input area */}
      <div className="relative max-w-xl mx-auto z-30">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </span>
          <input
            type="text"
            disabled={loading}
            placeholder={loading ? "Loading database..." : "Type character name (e.g. Beast Gohan, Beast, Goku...)"}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#161F30]/80 border border-[#23324C] focus:border-indigo-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all font-semibold text-sm"
          />
        </div>

        {/* Dropdown search results */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#161F30] border border-[#23324C] rounded-2xl overflow-hidden shadow-2xl">
            {searchResults.map((char) => {
              const elInfo = ELEMENT_MAP[char.element] || { type: 'AGL', color: 'bg-gray-500', label: 'Unknown' };
              const thumbUrl = `https://www.dokkandb.com/assets/character/thumb/card_${char.id}_thumb.png`;

              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectChar(char)}
                  className="w-full text-left px-5 py-3 hover:bg-[#1C283F] border-b border-[#23324C]/60 last:border-0 flex items-center gap-3 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#0B0F19] border border-[#23324C]/60 flex items-center justify-center p-0.5 shrink-0">
                    <img src={thumbUrl} alt={char.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-gray-400 truncate leading-none">{char.subname}</p>
                    <p className="text-sm font-bold text-white truncate mt-0.5">{char.name}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold text-white tracking-wider ${elInfo.color}`}>
                    {elInfo.type}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main calculation layout */}
      {selectedChar ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Selected character details card */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Selected Character</h3>
            <div className="bg-[#161F30] border border-[#23324C] rounded-3xl p-6 space-y-5 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-500" />
              
              <div className="flex flex-col items-center text-center space-y-3 pt-2">
                <div className="w-24 h-24 rounded-2xl bg-[#0B0F19] border border-[#23324C] flex items-center justify-center p-2">
                  <img
                    src={`https://www.dokkandb.com/assets/character/thumb/card_${selectedChar.id}_thumb.png`}
                    alt={selectedChar.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-indigo-400">{selectedChar.subname}</p>
                  <h4 className="font-extrabold text-lg text-white leading-tight">{selectedChar.name}</h4>
                  <div className="flex justify-center gap-1.5 pt-1">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-extrabold text-white tracking-wider ${
                      ELEMENT_MAP[selectedChar.element]?.color
                    }`}>
                      {ELEMENT_MAP[selectedChar.element]?.label}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-[9px] font-extrabold text-gray-300 tracking-wider">
                      {RARITY_MAP[selectedChar.rarity]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Link skills list */}
              <div className="space-y-2 border-t border-[#23324C]/60 pt-4">
                <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Active Link Skills ({selectedChar.link_ids.length})</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedChar.link_ids.map(id => (
                    <span key={id} className="px-2.5 py-1 bg-[#0B0F19]/60 border border-[#23324C] text-[10px] text-gray-300 font-semibold rounded-lg">
                      {getLinkName(id)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Partners results list */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Top Optimal Linking Partners
            </h3>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
              {partners.map((partner, index) => {
                const char = partner.character;
                const elInfo = ELEMENT_MAP[char.element] || { type: 'AGL', color: 'bg-gray-500', label: 'Unknown' };
                const thumbUrl = `https://www.dokkandb.com/assets/character/thumb/card_${char.id}_thumb.png`;

                return (
                  <motion.div
                    key={char.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.3 }}
                    className="bg-[#161F30]/75 border border-[#23324C] hover:border-indigo-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-md"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Number Rank */}
                      <span className="text-xs font-black text-gray-500 w-5 shrink-0">#{index + 1}</span>

                      {/* Artwork thumbnail */}
                      <div className="w-12 h-12 rounded-xl bg-[#0B0F19] border border-[#23324C]/60 flex items-center justify-center p-1 shrink-0">
                        <img src={thumbUrl} alt={char.name} className="w-full h-full object-contain" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-gray-400 truncate leading-none">{char.subname}</p>
                        <p className="text-sm font-extrabold text-white truncate mt-0.5">{char.name}</p>
                        <div className="flex gap-1.5 mt-1">
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold text-white uppercase tracking-wider ${elInfo.color}`}>
                            {elInfo.type}
                          </span>
                          <span className="px-1.5 py-0.2 rounded bg-gray-800 border border-gray-700 text-[8px] font-extrabold text-gray-300">
                            {RARITY_MAP[char.rarity]}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Shared Links Badges */}
                    <div className="flex flex-col sm:items-end gap-2 shrink-0 w-full sm:w-auto">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                          {partner.count} Shared Links
                        </span>
                      </div>
                      <div className="flex flex-wrap sm:justify-end gap-1">
                        {partner.sharedLinks.map(id => (
                          <span key={id} className="px-2 py-0.5 bg-[#0B0F19]/40 border border-[#23324C]/60 text-[9px] font-semibold text-gray-300 rounded-md">
                            {getLinkName(id)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {partners.length === 0 && (
                <div className="text-center py-10 bg-[#161F30]/40 rounded-2xl border border-[#23324C] p-6 text-gray-400 text-sm">
                  No partners found sharing active links.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-[#161F30]/20 rounded-3xl border border-[#23324C] max-w-xl mx-auto p-8 space-y-4">
          <HelpCircle className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Find optimal partners</h3>
          <p className="text-sm text-gray-400">
            Use the search bar above to look up any character (e.g. Gohan, Goku, Broly) and calculate their perfect linking partners.
          </p>
        </div>
      )}
    </div>
  );
};
