import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ELEMENT_MAP } from './DokkanCatalog';
import { DokkanCard } from '../../components/DokkanCard';
import categoriesData from '../../data/categories.json';
import linksData from '../../data/links.json';
import { 
  Swords, 
  Plus, 
  X, 
  ShieldAlert, 
  Search,
  Sparkles,
  HelpCircle,
  TrendingUp,
  AlertTriangle
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
  max_hp: number | null;
  max_atk: number | null;
  max_def: number | null;
  base_hp: number | null;
  base_atk: number | null;
  base_def: number | null;
  rainbow_hp: number | null;
  rainbow_atk: number | null;
  rainbow_def: number | null;
  tag?: string;
}

interface TeamSlot {
  role: 'Leader' | 'Sub' | 'Friend';
  character: Character | null;
}

export const TeamBuilder: React.FC = () => {
  const { user } = useAuth();
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [boxIds, setBoxIds] = useState<number[]>([]);
  const [highlightedSlotIdx, setHighlightedSlotIdx] = useState<number>(0);

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
        // Fetch all characters with full stats
        const { data: chars } = await supabase
          .from('dokkan_characters')
          .select('id, name, subname, element, rarity, leader_skill, category_ids, link_ids, max_hp, max_atk, max_def, base_hp, base_atk, base_def, rainbow_hp, rainbow_atk, rainbow_def, tag');
        
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

  // Helper: check if a character matches a leader skill
  const evaluateLeaderSkill = (leader: Character, target: Character): { matched: boolean; pct: number } => {
    if (leader.id === target.id) return { matched: true, pct: 170 }; // default self-boost
    
    const skillText = (leader.leader_skill || '').toLowerCase();
    
    let maxPct = 0;
    let matched = false;

    // 1. Check categories mentioned in leader skill
    categoriesData.forEach((cat: any) => {
      const catName = cat.name.toLowerCase();
      // Match category names inside quotes or as boundaries
      if (skillText.includes(`"${catName}"`) || skillText.includes(catName)) {
        if (target.category_ids?.includes(cat.id)) {
          matched = true;
          let pct = 150; // default base boost

          // Detect boost percentage
          if (skillText.includes('200%') || (skillText.includes('plus an additional') && skillText.includes('+50%'))) {
            // Check if card also qualifies for the additional +50% sub-categories
            const extraCats = ['full power', 'bond of master and disciple', 'earth-protecting heroes', 'kamehameha', 'super saiyans', 'power beyond super saiyan'];
            const hasExtra = target.category_ids?.some(cid => {
              const cName = categoriesData.find(c => c.id === cid)?.name.toLowerCase();
              return cName && extraCats.includes(cName) && skillText.includes(cName);
            });
            pct = hasExtra ? 200 : 170;
          } else if (skillText.includes('170%')) {
            pct = 170;
          } else if (skillText.includes('150%')) {
            pct = 150;
          } else if (skillText.includes('130%')) {
            pct = 130;
          }
          maxPct = Math.max(maxPct, pct);
        }
      }
    });

    // 2. Check Type/Element
    const elInfo = ELEMENT_MAP[target.element];
    if (elInfo) {
      const typeLabel = elInfo.type.toLowerCase();
      if (skillText.includes(`${typeLabel} type`)) {
        matched = true;
        maxPct = Math.max(maxPct, 120);
      }
    }

    return { matched, pct: matched ? maxPct : 0 };
  };

  const handleSelectCharacter = (char: Character) => {
    if (activeSlotIdx === null) return;
    
    setTeam(prev => {
      const copy = [...prev];
      copy[activeSlotIdx] = { ...copy[activeSlotIdx], character: char };
      return copy;
    });
    
    setHighlightedSlotIdx(activeSlotIdx);
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

  // Enforce same name warnings (Dokkan Battle rule: no identical character names except friend)
  const hasSameNameWarning = (char: Character, slotIdx: number): boolean => {
    return team.some((slot, idx) => 
      slot.character && 
      idx !== slotIdx && 
      idx !== 6 && // skip friend slot same-name check
      slotIdx !== 6 && // skip if we are editing friend slot
      slot.character.name === char.name
    );
  };

  // Get active links of a character with the rest of the team
  const getSharedLinksWithTeam = (char: Character, slotIdx: number) => {
    const otherMembers = team.filter((s, idx) => s.character && idx !== slotIdx).map(s => s.character) as Character[];
    if (otherMembers.length === 0) return [];
    
    const sharedIds = (char.link_ids || []).filter(lid => 
      otherMembers.some(m => m.link_ids?.includes(lid))
    );
    
    return sharedIds.map(lid => {
      const link = linksData.find(l => l.id === lid);
      return link ? link.name : `Link ${lid}`;
    });
  };

  // Filter and SORT candidates by link synergy + leader boost
  const getCandidates = () => {
    let list = onlyBox
      ? allCharacters.filter(c => boxIds.includes(c.id))
      : allCharacters;

    if (searchTerm.trim()) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.tag && c.tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (activeSlotIdx !== null) {
      const leader = team[0].character;
      const friend = team[6].character;

      // Map candidates to add sorting metadata
      const scoredList = list.map(c => {
        // Calculate shared links with other team members
        const otherMembers = team.filter((s, idx) => s.character && idx !== activeSlotIdx).map(s => s.character) as Character[];
        const sharedLinksCount = otherMembers.length > 0
          ? (c.link_ids || []).filter(lid => otherMembers.some(m => m.link_ids?.includes(lid))).length
          : 0;

        // Calculate leader boosts
        const lBoost = leader ? evaluateLeaderSkill(leader, c).pct : 0;
        const fBoost = friend ? evaluateLeaderSkill(friend, c).pct : 0;
        const totalBoost = lBoost + fBoost;

        return {
          char: c,
          sharedLinksCount,
          totalBoost,
          sameName: hasSameNameWarning(c, activeSlotIdx)
        };
      });

      // Sort by: No same-name penalty first, then Shared Links desc, then Leader Boost desc
      scoredList.sort((a, b) => {
        if (a.sameName !== b.sameName) return a.sameName ? 1 : -1;
        if (a.sharedLinksCount !== b.sharedLinksCount) return b.sharedLinksCount - a.sharedLinksCount;
        return b.totalBoost - a.totalBoost;
      });

      return scoredList.map(item => item.char).slice(0, 30);
    }

    return list.slice(0, 30);
  };

  // Get Top Linking Partner recommendations for a selected slot
  const getLinkingPartnerRecommendations = (char: Character, limit = 5) => {
    const list = onlyBox
      ? allCharacters.filter(c => boxIds.includes(c.id))
      : allCharacters;

    const scored = list
      .filter(c => c.id !== char.id && c.name !== char.name) // Skip same character/name
      .map(c => {
        const shared = (c.link_ids || []).filter(lid => char.link_ids?.includes(lid));
        return {
          char: c,
          sharedLinks: shared.map(lid => linksData.find(l => l.id === lid)?.name || `Link ${lid}`)
        };
      })
      .sort((a, b) => b.sharedLinks.length - a.sharedLinks.length);

    return scored.slice(0, limit);
  };

  // Autobuild Team around selected leader
  const handleAutobuild = () => {
    const leader = team[0].character;
    if (!leader) return;

    // Parse categories from leader skill text
    const skillText = (leader.leader_skill || '').toLowerCase();
    const leaderCatIds = categoriesData
      .filter(cat => skillText.includes(cat.name.toLowerCase()))
      .map(cat => cat.id);

    // Candidates inside user's Box
    const candidates = allCharacters.filter(c => boxIds.includes(c.id) && c.id !== leader.id);

    if (candidates.length === 0) {
      alert("Add more characters to your Box in the Catalog to use Autobuild!");
      return;
    }

    // Score candidates
    const scored = candidates.map(c => {
      const leaderBoost = evaluateLeaderSkill(leader, c).pct;
      const sharedLinks = (c.link_ids || []).filter(lid => leader.link_ids?.includes(lid)).length;
      const matchesCategory = c.category_ids?.some(cid => leaderCatIds.includes(cid)) ? 1 : 0;
      
      // Calculate score prioritizing leader boost and links
      const score = (leaderBoost * 10) + (sharedLinks * 50) + (matchesCategory * 100);

      return { char: c, score, name: c.name };
    });

    // Sort by score desc
    scored.sort((a, b) => b.score - a.score);

    // Pick top 5 unique names
    const selected: Character[] = [];
    const usedNames = new Set<string>([leader.name]);

    for (const item of scored) {
      if (!usedNames.has(item.name)) {
        selected.push(item.char);
        usedNames.add(item.name);
      }
      if (selected.length >= 5) break;
    }

    // Assign to team slots
    setTeam(prev => {
      const copy = [...prev];
      // Assign sub-units
      for (let i = 1; i <= 5; i++) {
        copy[i] = { ...copy[i], character: selected[i - 1] || null };
      }
      // Assign Friend Leader (preferably same as leader)
      copy[6] = { ...copy[6], character: leader };
      return copy;
    });

    setHighlightedSlotIdx(0);
  };

  // Compute team analysis
  const computeTeamAnalysis = () => {
    const leader = team[0].character;
    const friend = team[6].character;
    const members = team.filter(slot => slot.character !== null).map(slot => slot.character) as Character[];

    // Leader boosts
    const boosts = members.map(member => {
      let leaderPct = leader ? evaluateLeaderSkill(leader, member).pct : 0;
      let friendPct = friend ? evaluateLeaderSkill(friend, member).pct : 0;
      return {
        member,
        leaderPct,
        friendPct,
        total: leaderPct + friendPct
      };
    });

    // Active links
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

    // Shared categories
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
  const highlightedChar = team[highlightedSlotIdx]?.character;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Swords className="w-8 h-8 text-blue-500 animate-pulse" />
            Interactive Team Builder
          </h1>
          <p className="text-gray-400 text-sm">
            Assemble rotations, verify links overlap, and match fully awakened EZA/SEZA leader boosts.
          </p>
        </div>

        {team[0].character && (
          <button
            onClick={handleAutobuild}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
            Autobuild from Box
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left/Middle: Team Slots Canvas */}
        <div className="xl:col-span-3 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
            {team.map((slot, idx) => {
              const char = slot.character;
              const hasWarn = char ? hasSameNameWarning(char, idx) : false;
              const boostVal = char ? (analysis.boosts.find(b => b.member.id === char.id)?.total ?? 0) : 0;
              const activeLinksCount = char ? getSharedLinksWithTeam(char, idx).length : 0;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setHighlightedSlotIdx(idx);
                    setActiveSlotIdx(idx);
                  }}
                  className={`bg-[#161F30]/80 border rounded-2xl p-4 flex flex-col items-center justify-between min-h-[240px] transition-all cursor-pointer relative group ${
                    highlightedSlotIdx === idx 
                      ? 'border-blue-500 ring-1 ring-blue-500/20 bg-[#161F30]' 
                      : char 
                      ? 'border-[#23324C] hover:border-blue-500/50' 
                      : 'border-dashed border-gray-700 hover:border-gray-500 hover:bg-[#161F30]/40'
                  }`}
                >
                  {/* Role badge */}
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${
                    slot.role === 'Leader' 
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : slot.role === 'Friend'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {slot.role}
                  </span>

                  {/* Same Name Warning */}
                  {hasWarn && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-black p-1 rounded-lg z-20 shadow-md animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Card Display */}
                  {char ? (
                    <div className="relative">
                      <DokkanCard
                        cardId={char.id}
                        name={char.name}
                        rarity={char.rarity}
                        element={char.element}
                        size="md"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCharacter(idx);
                        }}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full border border-[#0B0F19] shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-500 group-hover:text-gray-300 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                  )}

                  {/* Info footer */}
                  {char ? (
                    <div className="text-center w-full mt-2.5 space-y-1">
                      <p className="text-[10px] font-extrabold text-white truncate px-1 leading-tight">{char.name}</p>
                      
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className={`text-[8px] font-black px-1.5 py-0.2 rounded mx-auto ${
                          boostVal > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                        }`}>
                          {boostVal > 0 ? `+${boostVal}% Boost` : '0% Boost'}
                        </span>
                        {activeLinksCount > 0 && (
                          <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded mx-auto">
                            🔗 {activeLinksCount} Links Active
                          </span>
                        )}
                      </div>
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

          {/* Warnings & Notices */}
          <div className="space-y-3">
            {(!team[0].character || !team[6].character) && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200 leading-relaxed font-medium">
                  Make sure to set both the <strong>Leader</strong> (1st slot) and <strong>Friend Leader</strong> (7th slot) to correctly calculate synergy stats and autobuild lists.
                </p>
              </div>
            )}

            {team.some((slot, idx) => slot.character && hasSameNameWarning(slot.character, idx)) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3 animate-pulse">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-200 leading-relaxed font-medium">
                  <strong>Same Name Warning:</strong> You have multiple cards with the exact same name on your team. Except for the Friend Leader slot, this is not allowed in most battle events!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Highlighted Slot Recommendations Sidebar */}
        <div className="space-y-6">
          <div className="bg-[#161F30] border border-[#23324C] rounded-3xl p-6 space-y-6 shadow-xl relative">
            
            {/* Highlighted unit details */}
            {highlightedChar ? (
              <div className="space-y-4">
                <div className="flex gap-3 items-center border-b border-[#23324C]/60 pb-4">
                  <div className="w-10 h-10 shrink-0">
                    <DokkanCard
                      cardId={highlightedChar.id}
                      name={highlightedChar.name}
                      rarity={highlightedChar.rarity}
                      element={highlightedChar.element}
                      size="sm"
                    />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black uppercase text-blue-400 leading-none">Slot {highlightedSlotIdx + 1} Profile</span>
                    <h4 className="text-sm font-bold text-white truncate leading-tight mt-0.5">{highlightedChar.name}</h4>
                  </div>
                </div>

                {/* Shared links lists */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Active Links ({getSharedLinksWithTeam(highlightedChar, highlightedSlotIdx).length})</span>
                  <div className="flex flex-wrap gap-1">
                    {getSharedLinksWithTeam(highlightedChar, highlightedSlotIdx).map((name, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-300 rounded">
                        {name}
                      </span>
                    ))}
                    {getSharedLinksWithTeam(highlightedChar, highlightedSlotIdx).length === 0 && (
                      <p className="text-[11px] text-gray-500 italic">No links active with other members.</p>
                    )}
                  </div>
                </div>

                {/* Best linking partners lists */}
                <div className="space-y-3 pt-2 border-t border-[#23324C]/60">
                  <div className="flex justify-between items-center">
                    <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">Best Partners (Box)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {getLinkingPartnerRecommendations(highlightedChar, 5).map((item) => (
                      <div
                        key={item.char.id}
                        onClick={() => {
                          // Find first empty slot or replace active slot if clicked
                          setTeam(prev => {
                            const copy = [...prev];
                            const emptyIdx = copy.findIndex(s => s.character === null);
                            const targetIdx = emptyIdx !== -1 ? emptyIdx : highlightedSlotIdx;
                            copy[targetIdx] = { ...copy[targetIdx], character: item.char };
                            return copy;
                          });
                        }}
                        className="flex items-center gap-3 p-2 bg-[#0B0F19]/40 border border-[#23324C]/40 hover:border-emerald-500/50 hover:bg-[#0B0F19]/80 rounded-xl transition-all cursor-pointer group"
                      >
                        <div className="w-8 h-8 shrink-0">
                          <DokkanCard
                            cardId={item.char.id}
                            name={item.char.name}
                            rarity={item.char.rarity}
                            element={item.char.element}
                            size="sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">{item.char.name}</p>
                          <p className="text-[8px] font-medium text-gray-400 truncate mt-0.5">Shares: {item.sharedLinks.length} Links</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <HelpCircle className="w-12 h-12 text-gray-600 mx-auto" />
                <p className="text-xs text-gray-500 italic max-w-[200px] mx-auto leading-relaxed">
                  Select a filled slot to inspect links and find the best matching partners.
                </p>
              </div>
            )}
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
                  <p className="text-xs text-gray-400">Choose a card. Sorted automatically by synergy & links match.</p>
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
                    const otherMembers = team.filter((s, idx) => s.character && idx !== activeSlotIdx).map(s => s.character) as Character[];
                    const sharedCount = otherMembers.length > 0
                      ? (char.link_ids || []).filter(lid => otherMembers.some(m => m.link_ids?.includes(lid))).length
                      : 0;

                    const leader = team[0].character;
                    const friend = team[6].character;
                    const lBoost = leader ? evaluateLeaderSkill(leader, char).pct : 0;
                    const fBoost = friend ? evaluateLeaderSkill(friend, char).pct : 0;
                    const totalBoost = lBoost + fBoost;
                    const hasWarn = hasSameNameWarning(char, activeSlotIdx);

                    return (
                      <button
                        key={char.id}
                        onClick={() => handleSelectCharacter(char)}
                        className="w-full text-left p-3 hover:bg-[#1C283F] bg-[#0B0F19]/30 border border-[#23324C]/60 rounded-2xl flex items-center gap-3 transition-colors group"
                      >
                        <DokkanCard
                          cardId={char.id}
                          name={char.name}
                          rarity={char.rarity}
                          element={char.element}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-semibold text-gray-400 truncate leading-none">{char.subname}</p>
                            {hasWarn && (
                              <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded uppercase">
                                Same Name
                              </span>
                            )}
                          </div>
                          
                          <p className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-blue-400 transition-colors">{char.name}</p>
                          
                          <div className="flex gap-1.5 mt-1.5">
                            {sharedCount > 0 && (
                              <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                                🔗 {sharedCount} Shared Links
                              </span>
                            )}
                            <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${
                              totalBoost > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500 bg-gray-800'
                            }`}>
                              +{totalBoost}% Boost
                            </span>
                          </div>
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
