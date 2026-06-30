import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import categoriesData from '../../data/categories.json';
import linksData from '../../data/links.json';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Check, 
  Plus, 
  Minus,
  Loader,
  X,
  Award,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Constant mappings derived from dataset exploration
export const ELEMENT_MAP: Record<number, { type: 'AGL' | 'TEQ' | 'INT' | 'STR' | 'PHY'; class: 'Super' | 'Extreme'; color: string; border: string; label: string }> = {
  10: { type: 'AGL', class: 'Super', color: 'bg-blue-500', border: 'border-blue-400', label: 'Super AGL' },
  11: { type: 'TEQ', class: 'Super', color: 'bg-emerald-500', border: 'border-emerald-400', label: 'Super TEQ' },
  12: { type: 'INT', class: 'Super', color: 'bg-purple-500', border: 'border-purple-400', label: 'Super INT' },
  13: { type: 'STR', class: 'Super', color: 'bg-red-500', border: 'border-red-400', label: 'Super STR' },
  14: { type: 'PHY', class: 'Super', color: 'bg-amber-500', border: 'border-amber-400', label: 'Super PHY' },
  20: { type: 'AGL', class: 'Extreme', color: 'bg-blue-600', border: 'border-blue-500', label: 'Extreme AGL' },
  21: { type: 'TEQ', class: 'Extreme', color: 'bg-emerald-600', border: 'border-emerald-500', label: 'Extreme TEQ' },
  22: { type: 'INT', class: 'Extreme', color: 'bg-purple-600', border: 'border-purple-500', label: 'Extreme INT' },
  23: { type: 'STR', class: 'Extreme', color: 'bg-red-600', border: 'border-red-500', label: 'Extreme STR' },
  24: { type: 'PHY', class: 'Extreme', color: 'bg-amber-600', border: 'border-amber-500', label: 'Extreme PHY' },
};

export const RARITY_MAP: Record<number, string> = {
  1: 'N',
  2: 'R',
  3: 'SSR',
  4: 'UR',
  5: 'LR',
};

interface Character {
  id: number;
  name: string;
  subname: string;
  rarity: number;
  element: number;
  character_id: number;
  card_unique_info_id: number;
  leader_skill: string;
  passive_skill_name: string;
  passive_skill_description: string;
  active_skill_name: string;
  active_skill_effect: string;
  active_skill_condition: string;
  category_ids: number[];
  link_ids: number[];
  max_hp: number | null;
  max_atk: number | null;
  max_def: number | null;
  base_hp: number | null;
  base_atk: number | null;
  base_def: number | null;
  rainbow_hp: number | null;
  rainbow_atk: number | null;
  rainbow_def: number | null;
  tag: string;
}

export const DokkanCatalog: React.FC = () => {
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [boxIds, setBoxIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarities, setSelectedRarities] = useState<number[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

  // Modal details state
  const [selectedChar, setSelectedChar] = useState<Character | null>(null);
  const [boxActionLoading, setBoxActionLoading] = useState<number | null>(null);

  const pageSize = 48;

  // Fetch characters and box items on mount and filters change
  useEffect(() => {
    setPage(0);
    setCharacters([]);
    setHasMore(true);
    fetchCharacters(0, true);
    fetchUserBox();
  }, [searchTerm, selectedRarities, selectedTypes, selectedClasses, selectedCategory]);

  const fetchCharacters = async (currentPage: number, reset = false) => {
    setLoading(true);
    try {
      let query = supabase
        .from('dokkan_characters')
        .select('*')
        .order('id', { ascending: false });

      // Apply Search
      if (searchTerm.trim()) {
        query = query.or(`name.ilike.%${searchTerm}%,subname.ilike.%${searchTerm}%`);
      }

      // Apply Rarity filter
      if (selectedRarities.length > 0) {
        query = query.in('rarity', selectedRarities);
      }

      // Apply Class filter
      if (selectedClasses.length > 0) {
        const targetElements: number[] = [];
        Object.entries(ELEMENT_MAP).forEach(([key, val]) => {
          if (selectedClasses.includes(val.class)) {
            targetElements.push(Number(key));
          }
        });
        query = query.in('element', targetElements);
      }

      // Apply Type filter
      if (selectedTypes.length > 0) {
        const targetElements: number[] = [];
        Object.entries(ELEMENT_MAP).forEach(([key, val]) => {
          if (selectedTypes.includes(val.type)) {
            // If class filter is also active, must match both
            if (selectedClasses.length === 0 || selectedClasses.includes(val.class)) {
              targetElements.push(Number(key));
            }
          }
        });
        query = query.in('element', targetElements);
      }

      // Apply Category filter
      if (selectedCategory !== null) {
        query = query.contains('category_ids', [selectedCategory]);
      }

      // Pagination
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        if (reset) {
          setCharacters(data);
        } else {
          setCharacters(prev => [...prev, ...data]);
        }
        setHasMore(data.length === pageSize);
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBox = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('dokkan_user_box')
        .select('card_id')
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) {
        setBoxIds(data.map(item => item.card_id));
      }
    } catch (err) {
      console.error('Error fetching user box keys:', err);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchCharacters(nextPage);
  };

  const toggleRarity = (rarity: number) => {
    setSelectedRarities(prev => 
      prev.includes(rarity) ? prev.filter(r => r !== rarity) : [...prev, rarity]
    );
  };

  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  const handleBoxAction = async (e: React.MouseEvent, charId: number, inBox: boolean) => {
    e.stopPropagation();
    if (!user) return;
    setBoxActionLoading(charId);

    try {
      if (inBox) {
        // Remove from box
        const { error } = await supabase
          .from('dokkan_user_box')
          .delete()
          .eq('user_id', user.id)
          .eq('card_id', charId);

        if (error) throw error;
        setBoxIds(prev => prev.filter(id => id !== charId));
      } else {
        // Add to box
        const { error } = await supabase
          .from('dokkan_user_box')
          .insert({
            user_id: user.id,
            card_id: charId,
            level: 1,
            sa_level: 1,
            potential_percentage: 0
          });

        if (error) throw error;
        setBoxIds(prev => [...prev, charId]);
      }
    } catch (err) {
      console.error('Error modifying box:', err);
    } finally {
      setBoxActionLoading(null);
    }
  };

  const getCategoryName = (id: number) => {
    const cat = categoriesData.find((c: any) => c.id === id);
    return cat ? cat.name : `Category ${id}`;
  };

  const getLinkName = (id: number) => {
    const lk = linksData.find((l: any) => l.id === id);
    return lk ? lk.name : `Link ${id}`;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-500" />
            Dokkan Character Catalog
          </h1>
          <p className="text-gray-400 text-sm">
            Search cards, inspect skill details, and build your box list.
          </p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-[#161F30]/60 border border-[#23324C] rounded-2xl p-6 space-y-5 shadow-lg">
        {/* Row 1: Search & Category */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search by name, title, subname..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#0B0F19]/80 border border-[#23324C] focus:border-blue-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all font-medium text-sm"
            />
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
              <Filter className="w-5 h-5" />
            </span>
            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
              className="w-full pl-11 pr-8 py-2.5 bg-[#0B0F19]/80 border border-[#23324C] focus:border-blue-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all font-semibold text-sm appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              {categoriesData.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
              <ChevronDown className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Row 2: Rarity, Type, Class */}
        <div className="flex flex-wrap gap-6 items-center">
          {/* Rarities */}
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Rarity</span>
            <div className="flex gap-1.5 bg-[#0B0F19]/60 p-1 rounded-xl border border-[#23324C]">
              {[3, 4, 5].map((r) => (
                <button
                  key={r}
                  onClick={() => toggleRarity(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-wider transition-all ${
                    selectedRarities.includes(r)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {RARITY_MAP[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Classes */}
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Class</span>
            <div className="flex gap-1.5 bg-[#0B0F19]/60 p-1 rounded-xl border border-[#23324C]">
              {['Super', 'Extreme'].map((c) => (
                <button
                  key={c}
                  onClick={() => toggleClass(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedClasses.includes(c)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Types */}
          <div className="space-y-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Type</span>
            <div className="flex gap-1.5 bg-[#0B0F19]/60 p-1 rounded-xl border border-[#23324C]">
              {['AGL', 'TEQ', 'INT', 'STR', 'PHY'].map((t) => {
                const colors: Record<string, string> = {
                  AGL: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  TEQ: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                  INT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
                  STR: 'bg-red-500/20 text-red-400 border-red-500/30',
                  PHY: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                };
                const activeColors: Record<string, string> = {
                  AGL: 'bg-blue-500 text-white border-blue-400 shadow-blue-500/20',
                  TEQ: 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20',
                  INT: 'bg-purple-500 text-white border-purple-400 shadow-purple-500/20',
                  STR: 'bg-red-500 text-white border-red-400 shadow-red-500/20',
                  PHY: 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20',
                };
                const isActive = selectedTypes.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold tracking-wider border transition-all ${
                      isActive
                        ? `${activeColors[t]} shadow-md`
                        : `${colors[t]} hover:bg-opacity-30`
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        {characters.map((char) => {
          const elInfo = ELEMENT_MAP[char.element] || { type: 'AGL', class: 'Super', color: 'bg-gray-500', border: 'border-gray-400', label: 'Unknown' };
          const inBox = boxIds.includes(char.id);
          const thumbUrl = `${supabaseUrl}/storage/v1/object/public/character-thumbnails/card_${char.id}_thumb.png`;

          return (
            <motion.div
              key={char.id}
              onClick={() => setSelectedChar(char)}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className={`bg-[#161F30] border hover:border-gray-500 rounded-2xl p-4 flex flex-col justify-between cursor-pointer relative overflow-hidden group shadow-lg ${
                inBox ? 'border-emerald-500/40 bg-emerald-950/5' : 'border-[#23324C]'
              }`}
            >
              {/* Type Badge top-right */}
              <div className="absolute top-2 right-2 flex gap-1">
                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold text-white uppercase tracking-wider ${elInfo.color}`}>
                  {elInfo.type}
                </span>
                <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-[9px] font-extrabold text-gray-300 uppercase tracking-wider">
                  {RARITY_MAP[char.rarity]}
                </span>
              </div>

              {/* Character Artwork */}
              <div className="w-full aspect-square relative rounded-xl overflow-hidden bg-[#0B0F19] flex items-center justify-center border border-[#23324C]/60 mb-3.5 group-hover:shadow-md transition-shadow">
                <img
                  src={thumbUrl}
                  alt={char.name}
                  loading="lazy"
                  className="w-[90%] h-[90%] object-contain"
                  onError={(e) => {
                    // Fallback to initials if image doesn't load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const div = document.createElement('div');
                      div.className = 'text-center font-extrabold text-2xl text-gray-600 uppercase';
                      div.innerText = char.name.substring(0, 2);
                      parent.appendChild(div);
                    }
                  }}
                />
                
                {/* In Box checkmark overlay */}
                {inBox && (
                  <div className="absolute top-1 left-1 bg-emerald-500 rounded-full p-1 border border-[#0B0F19] shadow-md">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="space-y-1 text-center mb-3">
                <p className="text-xs font-semibold text-gray-400 truncate tracking-wide max-w-full px-1">{char.subname || ' '}</p>
                <h4 className="font-extrabold text-sm text-white truncate max-w-full leading-tight">{char.name}</h4>
              </div>

              {/* Add/Remove box button */}
              <button
                onClick={(e) => handleBoxAction(e, char.id, inBox)}
                disabled={boxActionLoading === char.id}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                  inBox
                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/10'
                }`}
              >
                {boxActionLoading === char.id ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : inBox ? (
                  <>
                    <Minus className="w-3.5 h-3.5" />
                    Remove Box
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add to Box
                  </>
                )}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && characters.length === 0 && (
        <div className="text-center py-16 bg-[#161F30]/40 rounded-2xl border border-[#23324C] max-w-xl mx-auto p-8 space-y-3">
          <Award className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">No Characters Found</h3>
          <p className="text-sm text-gray-400">
            No characters matched your active filters or search terms. Try loosening your search criteria.
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center py-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-8 py-3 bg-[#161F30] border border-[#23324C] hover:border-gray-600 hover:bg-[#1C283F] text-sm font-bold text-white rounded-xl shadow-lg transition-all flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Loading Chunks...
              </>
            ) : (
              'Load More Characters'
            )}
          </button>
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {selectedChar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161F30] border border-[#23324C] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              {/* Modal header accent */}
              <div className={`h-2 bg-gradient-to-r ${
                ELEMENT_MAP[selectedChar.element]?.class === 'Super' 
                  ? 'from-blue-500 to-emerald-500' 
                  : 'from-purple-500 to-red-500'
              }`} />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedChar(null)}
                className="absolute top-4 right-4 bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-white p-2 rounded-xl transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scrollable Container */}
              <div className="p-8 overflow-y-auto space-y-6">
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#0B0F19] border border-[#23324C] flex items-center justify-center p-2 shrink-0">
                    <img
                      src={`${supabaseUrl}/storage/v1/object/public/character-thumbnails/card_${selectedChar.id}_thumb.png`}
                      alt={selectedChar.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold text-white tracking-wider ${
                        ELEMENT_MAP[selectedChar.element]?.color
                      }`}>
                        {ELEMENT_MAP[selectedChar.element]?.label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] font-extrabold text-gray-300 tracking-wider">
                        {RARITY_MAP[selectedChar.rarity]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-blue-400 leading-none">{selectedChar.subname}</p>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{selectedChar.name}</h3>
                  </div>
                </div>

                {/* Grid stats */}
                {selectedChar.max_hp !== null && selectedChar.max_atk !== null && selectedChar.max_def !== null && (
                  <div className="grid grid-cols-3 gap-4 bg-[#0B0F19]/60 p-4 rounded-2xl border border-[#23324C]">
                    <div className="text-center space-y-0.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Max HP</span>
                      <p className="text-lg font-black text-white">{selectedChar.max_hp.toLocaleString()}</p>
                    </div>
                    <div className="text-center space-y-0.5 border-x border-[#23324C]">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Max ATK</span>
                      <p className="text-lg font-black text-white">{selectedChar.max_atk.toLocaleString()}</p>
                    </div>
                    <div className="text-center space-y-0.5">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Max DEF</span>
                      <p className="text-lg font-black text-white">{selectedChar.max_def.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                {/* Skills Container */}
                <div className="space-y-4">
                  {/* Leader Skill */}
                  {selectedChar.leader_skill && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-blue-400 font-sans">Leader Skill</span>
                      <div className="bg-[#0B0F19]/40 p-4 rounded-xl border border-[#23324C] text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                        {selectedChar.leader_skill}
                      </div>
                    </div>
                  )}

                  {/* Passive Skill */}
                  {selectedChar.passive_skill_name && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400 font-sans">
                        Passive: {selectedChar.passive_skill_name}
                      </span>
                      <div className="bg-[#0B0F19]/40 p-4 rounded-xl border border-[#23324C] text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                        {/* Remove raw HTML tags or template images if any */}
                        {selectedChar.passive_skill_description?.replace(/\{passiveImg:[^}]+\}/g, '')}
                      </div>
                    </div>
                  )}

                  {/* Active Skill */}
                  {selectedChar.active_skill_name && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-purple-400 font-sans">
                        Active: {selectedChar.active_skill_name}
                      </span>
                      <div className="bg-[#0B0F19]/40 p-4 rounded-xl border border-[#23324C] text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                        <p className="font-bold text-white text-xs mb-1.5 uppercase text-purple-400">Condition:</p>
                        <p className="mb-3 text-xs italic text-gray-400">{selectedChar.active_skill_condition}</p>
                        <p className="font-bold text-white text-xs mb-1.5 uppercase text-purple-400">Effect:</p>
                        <p>{selectedChar.active_skill_effect}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories & Links Tab */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Link Skills */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Link Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedChar.link_ids.map(id => (
                        <span key={id} className="px-2.5 py-1 bg-gray-800/80 border border-gray-700 text-xs text-gray-300 font-semibold rounded-lg">
                          {getLinkName(id)}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Categories</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedChar.category_ids.map(id => (
                        <span key={id} className="px-2.5 py-1 bg-blue-900/10 border border-blue-500/20 text-xs text-blue-300 font-semibold rounded-lg">
                          {getCategoryName(id)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sudscqbmhbpgmwibnkco.supabase.co';