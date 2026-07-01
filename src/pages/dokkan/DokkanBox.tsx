import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ELEMENT_MAP } from './DokkanCatalog';
import { DokkanCard } from '../../components/DokkanCard';
import categoriesData from '../../data/categories.json';
import linksData from '../../data/links.json';
import { 
  FolderHeart, 
  Trash2, 
  TrendingUp,
  Loader,
  Search,
  X,
  Shield,
  Flame,
  Award,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RARITY_MAP: Record<number, string> = {
  1: 'N',
  2: 'R',
  3: 'SSR',
  4: 'UR',
  5: 'LR',
};

interface BoxItem {
  user_id: string;
  card_id: number;
  level: number;
  sa_level: number;
  potential_percentage: number;
  my_rating: number | null;
  my_notes: string | null;
  created_at: string;
  character: {
    id: number;
    name: string;
    subname: string;
    rarity: number;
    element: number;
    leader_skill: string;
    passive_skill_name?: string;
    passive_skill_description?: string;
    active_skill_name?: string;
    active_skill_condition?: string;
    active_skill_effect?: string;
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
    meta_evaluation?: {
      tier: string;
      viability: string;
      slot: string;
      verdict: string;
      pros: string[];
      cons: string[];
    } | null;
  };
}

export const DokkanBox: React.FC = () => {
  const { user } = useAuth();
  const [boxItems, setBoxItems] = useState<BoxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Profile modal viewing state tracking the active player profile layout
  const [viewingProfileChar, setViewingProfileChar] = useState<BoxItem['character'] | null>(null);
  const [statTab, setStatTab] = useState<'base' | 'max' | 'rainbow'>('max');

  useEffect(() => {
    fetchBoxItems();
  }, [user]);

  // Lock background scroll when character profile modal is open
  useEffect(() => {
    if (viewingProfileChar !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewingProfileChar]);

  const fetchBoxItems = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('dokkan_user_box')
        .select(`
          *,
          character:dokkan_characters(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      if (data) {
        setBoxItems(data as BoxItem[]);
      }
    } catch (err) {
      console.error('Error fetching box items:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, cardId: number) => {
    e.stopPropagation(); // Stops the modal popup invocation trigger safely
    if (!user) return;

    if (!confirm('Are you sure you want to remove this character from your box?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('dokkan_user_box')
        .delete()
        .eq('user_id', user.id)
        .eq('card_id', cardId);

      if (error) throw error;
      setBoxItems(prev => prev.filter(item => item.card_id !== cardId));
    } catch (err) {
      console.error('Error deleting box item:', err);
    }
  };

  const getTierBadgeStyle = (tier: string) => {
    const tierStyles: Record<string, string> = {
      'Z+': 'text-red-400 bg-red-500/10 border-red-500/20',
      'S': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
      'A': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      'B': 'text-blue-400 bg-blue-400/10 border-blue-500/20',
      'F': 'text-gray-500 bg-gray-800 border-gray-700'
    };
    return tierStyles[tier] || tierStyles['F'];
  };

  const getCategoryName = (id: number) => {
    const cat = categoriesData.find((c: any) => c.id === id);
    return cat ? cat.name : `Category ${id}`;
  };

  const getLinkName = (id: number) => {
    const lk = linksData.find((l: any) => l.id === id);
    return lk ? lk.name : `Link ${id}`;
  };

  const filteredItems = boxItems.filter(item => 
    item.character?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.character?.subname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FolderHeart className="w-8 h-8 text-emerald-500" />
            My Collected Card Box
          </h1>
          <p className="text-gray-400 text-sm">
            Evaluate, track tiers, and verify live database standalone execution parameters.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search owned cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#161F30]/60 border border-[#23324C] focus:border-emerald-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all font-medium text-xs"
          />
        </div>
      </div>

      {/* Main card grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-[#161F30]/40 rounded-2xl border border-[#23324C] max-w-xl mx-auto p-8 space-y-4">
          <FolderHeart className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-lg font-bold text-white">Your Box is Empty</h3>
          <p className="text-sm text-gray-400">
            You haven't added any characters to your personal box yet. Go to the Catalog page to start collection building.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const char = item.character;
            if (!char) return null;

            const elInfo = ELEMENT_MAP[char.element] || { type: 'AGL', class: 'Super', color: 'bg-gray-500', border: 'border-gray-400', label: 'Unknown' };
            const evalInfo = char.meta_evaluation || { tier: 'F', viability: 'Pending Index' };

            return (
              <motion.div
                key={char.id}
                onClick={() => setViewingProfileChar(char)} // Triggers direct catalog profile viewer popup modal
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
                className="bg-[#161F30]/75 border border-[#23324C] hover:border-emerald-500/50 rounded-2xl p-5 flex gap-4 cursor-pointer relative overflow-hidden transition-all shadow-lg group"
              >
                {/* Typing color stripe side */}
                <div className={`absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b ${
                  elInfo.class === 'Super' ? 'from-blue-500 to-emerald-500' : 'from-purple-500 to-red-500'
                }`} />

                {/* Left side: Artwork thumb */}
                <DokkanCard
                  cardId={char.id}
                  name={char.name}
                  rarity={char.rarity}
                  element={char.element}
                  size="md"
                />

                {/* Right side: Information */}
                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                  <div className="space-y-0.5">
                    <div className="flex justify-between items-start gap-1">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold text-white uppercase tracking-wider ${elInfo.color}`}>
                        {elInfo.label}
                      </span>
                      <button
                        onClick={(e) => handleDeleteItem(e, char.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 rounded transition-all hover:bg-red-500/10 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[10px] font-semibold text-gray-400 truncate">{char.subname}</p>
                    <h4 className="font-extrabold text-sm text-white truncate leading-tight">{char.name}</h4>
                  </div>

                  {/* Upgraded Box Stats footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#23324C]/40">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] font-black text-gray-300">
                        {item.potential_percentage === 100 ? 'Rainbow 🌈' : `${item.potential_percentage}%`}
                      </span>
                    </div>

                    <div className={`text-[8px] font-black tracking-wide border rounded px-1.5 py-0.2 leading-none ${getTierBadgeStyle(evalInfo.tier)}`}>
                      {evalInfo.tier} Tier
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Fully Integrated Profile Viewer Modal */}
      <AnimatePresence>
        {viewingProfileChar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161F30] border border-[#23324C] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              {/* Modal header accent */}
              <div className={`h-2 bg-gradient-to-r ${
                ELEMENT_MAP[viewingProfileChar.element]?.class === 'Super' 
                  ? 'from-blue-500 to-emerald-500' 
                  : 'from-purple-500 to-red-500'
              }`} />
              
              {/* Close Button */}
              <button
                onClick={() => setViewingProfileChar(null)}
                className="absolute top-4 right-4 bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-white p-2 rounded-xl transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Scrollable Container */}
              <div className="p-8 overflow-y-auto space-y-6">
                {/* Header Profile */}
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <DokkanCard
                    cardId={viewingProfileChar.id}
                    name={viewingProfileChar.name}
                    rarity={viewingProfileChar.rarity}
                    element={viewingProfileChar.element}
                    size="xl"
                    className="shrink-0"
                  />
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold text-white tracking-wider ${
                        ELEMENT_MAP[viewingProfileChar.element]?.color
                      }`}>
                        {ELEMENT_MAP[viewingProfileChar.element]?.label}
                      </span>
                      <span className="px-2.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] font-extrabold text-gray-300 tracking-wider">
                        {RARITY_MAP[viewingProfileChar.rarity]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-blue-400 leading-none">{viewingProfileChar.subname}</p>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{viewingProfileChar.name}</h3>
                  </div>
                </div>

                {/* Overhauled Meta Evaluation Panel */}
                {(() => {
                  const evalResult = viewingProfileChar.meta_evaluation || {
                    tier: 'F',
                    viability: 'Pending Evaluation',
                    slot: 'Floater',
                    verdict: 'No evaluation parameters found for this asset in the active storage layer.',
                    pros: [],
                    cons: []
                  };

                  return (
                    <div className="bg-[#0B0F19]/40 border border-[#23324C]/60 rounded-2xl p-5 space-y-4 shadow-inner">
                      <div className="flex flex-wrap gap-4 items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-14 h-14 rounded-full bg-gradient-to-r flex items-center justify-center font-black text-2xl tracking-tighter shadow-lg shrink-0 border ${getTierBadgeStyle(evalResult.tier)}`}>
                            {evalResult.tier}
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Meta Evaluation Rating</span>
                            <span className="text-sm font-extrabold text-white">
                              {evalResult.viability} &bull; {evalResult.slot} Recommendation
                            </span>
                          </div>
                        </div>

                        {/* Position Badges */}
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 bg-[#1E283F] border border-[#23324C] text-gray-300">
                            {evalResult.slot === 'Slot 1' && <Shield className="w-3 h-3 text-blue-400 animate-pulse" />}
                            {evalResult.slot === 'Slot 2' && <Flame className="w-3 h-3 text-red-400" />}
                            {evalResult.slot === 'Floater' && <Award className="w-3 h-3 text-amber-400" />}
                            {evalResult.slot}
                          </span>
                        </div>
                      </div>

                      {/* Verdict Description */}
                      <p className="text-xs text-gray-300 leading-relaxed font-medium bg-[#0B0F19]/40 p-3 rounded-xl border border-[#23324C]/40">
                        {evalResult.verdict}
                      </p>

                      {/* Pros & Cons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Strengths</span>
                          <ul className="space-y-1">
                            {evalResult.pros.map((pro, i) => (
                              <li key={i} className="text-[11px] text-gray-300 flex items-center gap-1.5 font-medium">
                                <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block">Weaknesses</span>
                          <ul className="space-y-1">
                            {evalResult.cons.map((con, i) => (
                              <li key={i} className="text-[11px] text-gray-300 flex items-center gap-1.5 font-medium">
                                <ThumbsDown className="w-3.5 h-3.5 text-red-400 shrink-0" />
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Level Stat Matrix Toggles */}
                <div className="space-y-3">
                  <div className="flex gap-2 bg-[#0B0F19]/40 p-1 rounded-xl border border-[#23324C]/60 w-fit">
                    {(['base', 'max', 'rainbow'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setStatTab(tab)}
                        className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all ${
                          statTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {tab === 'base' ? 'Base Lvl 1' : tab === 'max' ? 'Max Lvl (EZA)' : 'Rainbow (100%)'}
                      </button>
                    ))}
                  </div>

                  {viewingProfileChar.max_hp !== null && (
                    <div className="grid grid-cols-3 gap-4 bg-[#0B0F19]/60 p-4 rounded-2xl border border-[#23324C]">
                      <div className="text-center space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">HP</span>
                        <p className="text-lg font-black text-white">
                          {(statTab === 'base' ? viewingProfileChar.base_hp : statTab === 'max' ? viewingProfileChar.max_hp : viewingProfileChar.rainbow_hp)?.toLocaleString() ?? '-'}
                        </p>
                      </div>
                      <div className="text-center space-y-0.5 border-x border-[#23324C]">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ATK</span>
                        <p className="text-lg font-black text-white">
                          {(statTab === 'base' ? viewingProfileChar.base_atk : statTab === 'max' ? viewingProfileChar.max_atk : viewingProfileChar.rainbow_atk)?.toLocaleString() ?? '-'}
                        </p>
                      </div>
                      <div className="text-center space-y-0.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">DEF</span>
                        <p className="text-lg font-black text-white">
                          {(statTab === 'base' ? viewingProfileChar.base_def : statTab === 'max' ? viewingProfileChar.max_def : viewingProfileChar.rainbow_def)?.toLocaleString() ?? '-'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Skill Explanations */}
                <div className="space-y-4">
                  {viewingProfileChar.leader_skill && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-blue-400">Leader Skill</span>
                      <div className="bg-[#0B0F19]/40 p-4 rounded-xl border border-[#23324C] text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                        {viewingProfileChar.leader_skill}
                      </div>
                    </div>
                  )}

                  {viewingProfileChar.passive_skill_name && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Passive: {viewingProfileChar.passive_skill_name}
                      </span>
                      <div className="bg-[#0B0F19]/40 p-4 rounded-xl border border-[#23324C] text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                        {viewingProfileChar.passive_skill_description}
                      </div>
                    </div>
                  )}

                  {viewingProfileChar.active_skill_name && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-purple-400">
                        Active: {viewingProfileChar.active_skill_name}
                      </span>
                      <div className="bg-[#0B0F19]/40 p-4 rounded-xl border border-[#23324C] text-sm text-gray-300 font-medium leading-relaxed whitespace-pre-line">
                        <p className="font-bold text-white text-xs mb-1.5 uppercase text-purple-400">Condition:</p>
                        <p className="mb-3 text-xs italic text-gray-400">{viewingProfileChar.active_skill_condition}</p>
                        <p className="font-bold text-white text-xs mb-1.5 uppercase text-purple-400">Effect:</p>
                        <p>{viewingProfileChar.active_skill_effect}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Categories & Links breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Link Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProfileChar.link_ids.map(id => (
                        <span key={id} className="px-2.5 py-1 bg-gray-800/80 border border-gray-700 text-xs text-gray-300 font-semibold rounded-lg">
                          {getLinkName(id)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-bold uppercase tracking-wider text-gray-400">Categories</span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingProfileChar.category_ids.map(id => (
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
