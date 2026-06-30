import React, { useEffect, useState } from 'react';
import { supabase, getDokkanThumbUrl } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ELEMENT_MAP, RARITY_MAP } from './DokkanCatalog';
import categoriesData from '../../data/categories.json';
import linksData from '../../data/links.json';
import { 
  Swords, 
  Plus, 
  X, 
  ShieldAlert, 
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Character {
  id: number;
  name: string;
  subname: string;
  rarity: number;
  element: number;
  leader_skill: string;
  category_ids: number[];
  link_ids: number[];
}

interface TeamSlot {
  role: 'Leader' | 'Sub' | 'Friend';
  character: Character | null;
}

export const TeamBuilder: React.FC = () => {
  const { user } = useAuth();
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);

  // Team slots (6 slots + friend leader)
  const [team, setTeam] = useState<TeamSlot[]>([
    { role: 'Leader', character: null },
    { role: 'Sub', character: null },
    { role: 'Sub', character: null },
    { role: 'Sub', character: null },
    { role: 'Sub', character: null },
    { role: 'Sub', character: null },
    { role: 'Friend', character: null },
  ]);

  // Modal selector states
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyBox, setOnlyBox] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all characters
        const { data: chars } = await supabase
          .from('dokkan_characters')
          .select('id, name, subname, element, rarity, leader_skill, category_ids, link_ids');
        
        if (chars) setAllCharacters(chars as Character[]);

        // Fetch user box
        if (user) {
          const { data: box } = await supabase
            .from('dokkan_user_box')
            .select('card_id')
            .eq('user_id', user.id);
          if (box) setBoxIds(box.map(item => item.card_id));
        }
      } catch (err) {
        console.error('Error fetching team builder data:', err);
      }
    };
    fetchData();
  }, [user]);

  const [boxIds, setBoxIds] = useState<number[]>([]);

  // Filter candidates for the selection modal
  const getCandidates = () => {
    let list = onlyBox
      ? allCharacters.filter(c => boxIds.includes(c.id))
      : allCharacters;

    if (searchTerm.trim()) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subname?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list.slice(0, 30); // Limit display for speed
  };

  const handleSelectCharacter = (char: Character) => {
    if (activeSlotIdx === null) return;
    
    setTeam(prev => {
      const copy = [...prev];
      copy[activeSlotIdx] = { ...copy[activeSlotIdx], character: char };
      return copy;
    });
    
    setActiveSlotIdx(null);
    setSearchTerm('');
  };

  const handleRemoveCharacter = (idx: number) => {
    setTeam(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], character: null };
      return copy;
    });
  };

  // Helper: check if a character matches a leader skill
  const evaluateLeaderSkill = (leader: Character, target: Character): { matched: boolean; pct: number } => {
    if (leader.id === target.id) return { matched: true, pct: 170 }; // default base self-boost
    
    const skillText = (leader.leader_skill || '').toLowerCase();
    
    // 1. Check categories
    // Find all categories that are in the leader's skill text and match the target's categories
    let maxPct = 0;
    let matched = false;

    categoriesData.forEach((cat: any) => {
      const catName = cat.name.toLowerCase();
      if (skillText.includes(`"${catName}"`) || skillText.includes(catName)) {
        if (target.category_ids?.includes(cat.id)) {
          matched = true;
          // Simple parsing of percentage from the string
          // We look for percentages like "+170%", "+200%", "+150%"
          // For simplicity we estimate based on typical values:
          if (skillText.includes('200%') || skillText.includes('plus an additional') && skillText.includes('+50%')) {
            maxPct = Math.max(maxPct, 200);
          } else if (skillText.includes('170%')) {
            maxPct = Math.max(maxPct, 170);
          } else if (skillText.includes('150%')) {
            maxPct = Math.max(maxPct, 150);
          } else if (skillText.includes('130%')) {
            maxPct = Math.max(maxPct, 130);
          } else {
            maxPct = Math.max(maxPct, 150); // fallback
          }
        }
      }
    });

    // 2. Check Type/Element
    const elInfo = ELEMENT_MAP[target.element];
    if (elInfo) {
      const typeLabel = elInfo.type.toLowerCase(); // agl, teq, etc.
      if (skillText.includes(`${typeLabel} type`)) {
        matched = true;
        maxPct = Math.max(maxPct, 120); // typical type leader boost
      }
    }

    return { matched, pct: matched ? maxPct : 0 };
  };

  // Compute stats for team members
  const computeTeamAnalysis = () => {
    const leader = team[0].character;
    const friend = team[6].character;
    const members = team.filter(slot => slot.character !== null).map(slot => slot.character) as Character[];

    // Calculate leader boosts for each member
    const boosts = members.map(member => {
      let leaderPct = 0;
      let friendPct = 0;
      
      if (leader) {
        const evalLeader = evaluateLeaderSkill(leader, member);
        leaderPct = evalLeader.pct;
      }
      if (friend) {
        const evalFriend = evaluateLeaderSkill(friend, member);
        friendPct = evalFriend.pct;
      }

      return {
        member,
        leaderPct,
        friendPct,
        total: leaderPct + friendPct
      };
    });

    // Calculate active links
    // A link is active if at least 2 characters on the team have it
    const linkCounts: Record<number, number> = {};
    members.forEach(member => {
      member.link_ids?.forEach(id => {
        linkCounts[id] = (linkCounts[id] || 0) + 1;
      });
    });

    const activeLinks = Object.entries(linkCounts)
      .filter(([_, count]) => count >= 2)
      .map(([id, count]) => ({
        id: Number(id),
        name: linksData.find((l: any) => l.id === Number(id))?.name || `Link ${id}`,
        count
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate shared categories
    const catCounts: Record<number, number> = {};
    members.forEach(member => {
      member.category_ids?.forEach(id => {
        catCounts[id] = (catCounts[id] || 0) + 1;
      });
    });

    const sharedCategories = Object.entries(catCounts)
      .filter(([_, count]) => count >= 2)
      .map(([id, count]) => ({
        id: Number(id),
        name: categoriesData.find((c: any) => c.id === Number(id))?.name || `Category ${id}`,
        count
      }))
      .sort((a, b) => b.count - a.count);

    return { boosts, activeLinks, sharedCategories };
  };

  const analysis = computeTeamAnalysis();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Swords className="w-8 h-8 text-blue-500 animate-pulse" />
          Interactive Team Builder
        </h1>
        <p className="text-gray-400 text-sm">
          Assemble your rotations, evaluate leader skill boosts, and check active link skills synergies.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left/Middle: Team Slots Canvas */}
        <div className="xl:col-span-3 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {team.map((slot, idx) => {
              const char = slot.character;
              const thumbUrl = char ? getDokkanThumbUrl(char.id) : '';

              return (
                <div
                  key={idx}
                  onClick={() => setActiveSlotIdx(idx)}
                  className={`bg-[#161F30]/80 border rounded-2xl p-4 flex flex-col items-center justify-between min-h-[220px] transition-all cursor-pointer relative group ${
                    char 
                      ? 'border-[#23324C] hover:border-blue-500/50' 
                      : 'border-dashed border-gray-700 hover:border-gray-500 hover:bg-[#161F30]/40'
                  }`}
                >
                  {/* Top Role Tag */}
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                    slot.role === 'Leader' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : slot.role === 'Friend'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {slot.role}
                  </span>

                  {/* Character Thumbnail / Add icon */}
                  {char ? (
                    <div className="w-20 h-20 bg-[#0B0F19] border border-[#23324C]/60 rounded-xl flex items-center justify-center p-1 relative">
                      <img src={thumbUrl} alt={char.name} className="w-full h-full object-contain" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCharacter(idx);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white p-1 rounded-full border border-red-500/30 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-500 group-hover:text-gray-300 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                  )}

                  {/* Character Meta or Slot Label */}
                  {char ? (
                    <div className="text-center w-full mt-2.5 space-y-1">
                      <p className="text-[10px] font-extrabold text-white truncate px-1 leading-tight">{char.name}</p>
                      {/* Show Leader boost summary */}
                      <span className="inline-block text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded mt-1">
                        +{analysis.boosts.find(b => b.member.id === char.id)?.total}% Boost
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-500 group-hover:text-gray-400 transition-colors mt-2">
                      Empty Slot
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Leader skill warning if leader slots empty */}
          {(!team[0].character || !team[6].character) && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-200 leading-relaxed font-medium">
                Make sure to fill both the <strong>Leader</strong> (first slot) and <strong>Friend Leader</strong> (last slot) to see the calculated leader skill stat boosts for the rest of your team.
              </p>
            </div>
          )}
        </div>

        {/* Right side: Team Synergy Analysis Sidebar */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Team Synergy Analysis</h3>

          <div className="bg-[#161F30] border border-[#23324C] rounded-3xl p-6 space-y-6 shadow-xl">
            {/* 1. Active Link Skills */}
            <div className="space-y-3">
              <span className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Shared Links</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {analysis.activeLinks.map((link) => (
                  <div key={link.id} className="flex justify-between items-center bg-[#0B0F19]/60 border border-[#23324C]/60 p-2.5 rounded-xl">
                    <span className="text-xs text-gray-200 font-bold">{link.name}</span>
                    <span className="text-[10px] font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                      {link.count} units
                    </span>
                  </div>
                ))}
                {analysis.activeLinks.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No shared links active yet.</p>
                )}
              </div>
            </div>

            {/* 2. Shared Categories */}
            <div className="space-y-3 border-t border-[#23324C]/60 pt-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">Common Categories</span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {analysis.sharedCategories.slice(0, 6).map((cat) => (
                  <div key={cat.id} className="flex justify-between items-center bg-[#0B0F19]/60 border border-[#23324C]/60 p-2.5 rounded-xl">
                    <span className="text-xs text-gray-200 font-bold truncate max-w-[130px]">{cat.name}</span>
                    <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {cat.count} units
                    </span>
                  </div>
                ))}
                {analysis.sharedCategories.length === 0 && (
                  <p className="text-xs text-gray-500 italic">No shared categories.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Select Character Modal */}
      <AnimatePresence>
        {activeSlotIdx !== null && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161F30] border border-[#23324C] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveSlotIdx(null)}
                className="absolute top-4 right-4 bg-gray-900/60 hover:bg-gray-800 text-gray-400 hover:text-white p-2 rounded-xl transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-8 space-y-6 flex flex-col h-full overflow-y-auto">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">Select Character</h3>
                  <p className="text-xs text-gray-400">Choose a character to assign to this team slot.</p>
                </div>

                {/* Filter / Search Inputs */}
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                      <Search className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search character name or title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#0B0F19]/60 border border-[#23324C] focus:border-blue-500 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all font-medium text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlyBox(true)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        onlyBox
                          ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-transparent text-gray-500 border-transparent hover:text-gray-400'
                      }`}
                    >
                      From My Box Only
                    </button>
                    <button
                      type="button"
                      onClick={() => setOnlyBox(false)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        !onlyBox
                          ? 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                          : 'bg-transparent text-gray-500 border-transparent hover:text-gray-400'
                      }`}
                    >
                      Search All Catalog
                    </button>
                  </div>
                </div>

                {/* Candidates List */}
                <div className="space-y-2 overflow-y-auto pr-1">
                  {getCandidates().map((char) => {
                    const elInfo = ELEMENT_MAP[char.element] || { type: 'AGL', color: 'bg-gray-500', label: 'Unknown' };
                    const thumbUrl = getDokkanThumbUrl(char.id);

                    return (
                      <button
                        key={char.id}
                        onClick={() => handleSelectCharacter(char)}
                        className="w-full text-left p-3 hover:bg-[#1C283F] bg-[#0B0F19]/30 border border-[#23324C]/60 rounded-2xl flex items-center gap-3 transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#0B0F19] border border-[#23324C]/60 flex items-center justify-center p-0.5 shrink-0">
                          <img src={thumbUrl} alt={char.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-gray-400 truncate leading-none">{char.subname}</p>
                          <p className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-blue-400 transition-colors">{char.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold text-white uppercase tracking-wider ${elInfo.color}`}>
                            {elInfo.type}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 text-[8px] font-extrabold text-gray-300">
                            {RARITY_MAP[char.rarity]}
                          </span>
                        </div>
                      </button>
                    );
                  })}

                  {getCandidates().length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-xs italic">
                      No matching characters found.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

