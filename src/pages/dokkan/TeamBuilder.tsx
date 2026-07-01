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
  AlertTriangle,
  Info,
  Shield,
  Flame,
  Award,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Character {
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
  tag?: string;
  meta_evaluation?: {
    tier: string;
    viability: string;
    slot: string;
    verdict: string;
    pros: string[];
    cons: string[];
  } | null;
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

  // Modal selector and viewer states
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [viewingProfileChar, setViewingProfileChar] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyBox, setOnlyBox] = useState(true);
  const [statTab, setStatTab] = useState<'base' | 'max' | 'rainbow'>('max');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all characters including the freshly piped meta_evaluation column
        const { data: chars } = await supabase
          .from('dokkan_characters')
          .select('id, name, subname, element, rarity, leader_skill, passive_skill_name, passive_skill_description, active_skill_name, active_skill_condition, active_skill_effect, category_ids, link_ids, max_hp, max_atk, max_def, base_hp, base_atk, base_def, rainbow_hp, rainbow_atk, rainbow_def, tag, meta_evaluation');
        
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

  // Lock background scroll when character selection modal or profile viewer is open
  useEffect(() => {
    if (activeSlotIdx !== null || viewingProfileChar !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [activeSlotIdx, viewingProfileChar]);

  // Helper mapping to translate character evaluations into unified styling tags
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

  // Helper: map character tier string to an internal weight coefficient for database sorting matrix
  const getTierWeight = (tier: string): number => {
    const weights: Record<string, number> = { 'Z+': 5, 'S': 4, 'A': 3, 'B': 2, 'F': 1 };
    return weights[tier] || 1;
  };

  // Helper: check if a character matches a leader skill
  const evaluateLeaderSkill = (leader: Character, target: Character): { matched: boolean; pct: number } => {
    if (leader.id === target.id) return { matched: true, pct: 170 };
    
    const skillText = (leader.leader_skill || '').toLowerCase();
    let maxPct = 0;
    let matched = false;

    // 1. Check categories mentioned in leader skill
    categoriesData.forEach((cat: any) => {
      const catName = cat.name.toLowerCase();
      if (skillText.includes(`"${catName}"`) || skillText.includes(catName)) {
        if (target.category_ids?.includes(cat.id)) {
          matched = true;
          let pct = 150;

          if (skillText.includes('200%') || (skillText.includes('plus an additional') && skillText.includes('+50%'))) {
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

  const hasSameNameWarning = (char: Character, slotIdx: number): boolean => {
    return team.some((slot, idx) => 
      slot.character && 
      idx !== slotIdx && 
      idx !== 6 && 
      slotIdx !== 6 && 
      slot.character.name === char.name
    );
  };

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

  // Enhanced Candidate Query Pipeline: Blends link synergy algorithms with database AI metadata evaluations
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

      const scoredList = list.map(c => {
        const otherMembers = team.filter((s, idx) => s.character && idx !== activeSlotIdx).map(s => s.character) as Character[];
        const sharedLinksCount = otherMembers.length > 0
          ? (c.link_ids || []).filter(lid => otherMembers.some(m => m.link_ids?.includes(lid))).length
          : 0;

        const lBoost = leader ? evaluateLeaderSkill(leader, c).pct : 0;
        const fBoost = friend ? evaluateLeaderSkill(friend, c).pct : 0;
        const totalBoost = lBoost + fBoost;
        
        // Extract database tier evaluations coefficient
        const aiEval = c.meta_evaluation || { tier: 'F' };
        const aiWeight = getTierWeight(aiEval.tier);

        return {
          char: c,
          sharedLinksCount,
          totalBoost,
          aiWeight,
          sameName: hasSameNameWarning(c, activeSlotIdx)
        };
      });

      // Sort Priority: No Name-Clash penalty, high AI Meta Tier, high Active Shared Links, high Leader Skill percentage
      scoredList.sort((a, b) => {
        if (a.sameName !== b.sameName) return a.sameName ? 1 : -1;
        if (a.aiWeight !== b.aiWeight) return b.aiWeight - a.aiWeight;
        if (a.sharedLinksCount !== b.sharedLinksCount) return b.sharedLinksCount - a.sharedLinksCount;
        return b.totalBoost - a.totalBoost;
      });

      return scoredList.map(item => item.char).slice(0, 30);
    }

    return list.slice(0, 30);
  };

  const getLinkingPartnerRecommendations = (char: Character, limit = 5) => {
    const list = onlyBox
      ? allCharacters.filter(c => boxIds.includes(c.id))
      : allCharacters;

    const scored = list
      .filter(c => c.id !== char.id && c.name !== char.name)
      .map(c => {
        const shared = (c.link_ids || []).filter(lid => char.link_ids?.includes(lid));
        const aiEval = c.meta_evaluation || { tier: 'F' };
        return {
          char: c,
          sharedLinks: shared.map(lid => linksData.find(l => l.id === lid)?.name || `Link ${lid}`),
          aiWeight: getTierWeight(aiEval.tier)
        };
      })
      .sort((a, b) => {
        if (a.sharedLinks.length !== b.sharedLinks.length) {
          return b.sharedLinks.length - a.sharedLinks.length;
        }
        return b.aiWeight - a.aiWeight;
      });

    return scored.slice(0, limit);
  };

  // Smart AI-Driven Team Autobuilder Engine
  const handleAutobuild = () => {
    const leader = team[0].character;
    if (!leader) return;

    const skillText = (leader.leader_skill || '').toLowerCase();
    const leaderCatIds = categoriesData
      .filter(cat => skillText.includes(cat.name.toLowerCase()))
      .map(cat => cat.id);

    const candidates = allCharacters.filter(c => boxIds.includes(c.id) && c.id !== leader.id);

    if (candidates.length === 0) {
      alert("Add more characters to your Box in the Catalog to use Autobuild!");
      return;
    }

    const scored = candidates.map(c => {
      const leaderBoost = evaluateLeaderSkill(leader, c).pct;
      const sharedLinks = (c.link_ids || []).filter(lid => leader.link_ids?.includes(lid)).length;
      const matchesCategory = c.category_ids?.some(cid => leaderCatIds.includes(cid)) ? 1 : 0;
      
      const aiEval = c.meta_evaluation || { tier: 'F' };
      const aiWeight = getTierWeight(aiEval.tier);
      
      // Multi-dimensional evaluation formula prioritizing compatibility alongside global AI meta tiers
      const score = (leaderBoost * 20) + (sharedLinks * 70) + (matchesCategory * 150) + (aiWeight * 200);

      return { char: c, score, name: c.name };
    });

    scored.sort((a, b) => b.score - a.score);

    const selected: Character[] = [];
    const usedNames = new Set<string>([leader.name]);

    for (const item of scored) {
      if (!usedNames.has(item.name)) {
        selected.push(item.char);
        usedNames.add(item.name);
      }
      if (selected.length >= 5) break;
    }

    setTeam(prev => {
      const copy = [...prev];
      for (let i = 1; i <= 5; i++) {
        copy[i] = { ...copy[i], character: selected[i - 1] || null };
      }
      copy[6] = { ...copy[6], character: leader };
      return copy;
    });

    setHighlightedSlotIdx(0);
  };

  const computeTeamAnalysis = () => {
    const leader = team[0].character;
    const friend = team[6].character;
    const members = team.filter(slot => slot.character !== null).map(slot => slot.character) as Character[];

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

  const getCategoryName = (id: number) => {
    const cat = categoriesData.find((c: any) => c.id === id);
    return cat ? cat.name : `Category ${id}`;
  };

  const getLinkName = (id: number) => {
    const lk = linksData.find((l: any) => l.id === id);
    return lk ? lk.name : `Link ${id}`;
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
            Smart AI Autobuild
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
              const evalInfo = char?.meta_evaluation || { tier: 'F' };

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setHighlightedSlotIdx(idx);
                    if (!char) {
                      setActiveSlotIdx(idx);
                    }
                  }}
                  className={`bg-[#161F30]/80 border rounded-2xl p-4 flex flex-col items-center justify-between min-h-[260px] transition-all cursor-pointer relative group ${
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
                      
                      {/* Action Overlays for filled slots */}
                      <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          type="button"
                          title="View Profile"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingProfileChar(char);
                          }}
                          className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg shadow-md transition-all active:scale-90"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Change Character"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveSlotIdx(idx);
                          }}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg shadow-md transition-all active:scale-90"
                        >
                          <Search className="w-3.5 h-3.5" />
                        </button>
                      </div>

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
                      
                      {evalInfo.tier && (
                        <p className={`text-[8px] font-black tracking-wide border rounded px-1.5 py-0.2 mx-auto w-max leading-none my-0.5 ${getTierBadgeStyle(evalInfo.tier)}`}>
                          {evalInfo.tier} Tier
                        </p>
                      )}

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
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase text-blue-400 leading-none">Slot {highlightedSlotIdx + 1} Profile</span>
                    <h4 className="text-sm font-bold text-white truncate leading-tight mt-0.5">{highlightedChar.name}</h4>
                    {highlightedChar.meta_evaluation?.tier && (
                      <span className={`inline-block text-[8px] font-black border rounded px-1.5 py-0.2 mt-1 ${getTierBadgeStyle(highlightedChar.meta_evaluation.tier)}`}>
                        {highlightedChar.meta_evaluation.tier} Tier ({highlightedChar.meta_evaluation.slot})
                      </span>
                    )}
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

                {/* Best linking partners lists based on box assets & meta parameters */}
                <div className="space-y-3 pt-2 border-t border-[#23324C]/60">
                  <div className="flex justify-between items-center">
                    <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">Best Partners (Box)</span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {getLinkingPartnerRecommendations(highlightedChar, 5).map((item) => {
                      const partnerTier = item.char.meta_evaluation?.tier || 'F';
                      return (
                        <div
                          key={item.char.id}
                          onClick={() => {
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
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-[8px] font-medium text-gray-400 truncate">Shares: {item.sharedLinks.length} Links</p>
                              <span className={`text-[7px] font-extrabold border rounded px-1 scale-90 origin-right ${getTierBadgeStyle(partnerTier)}`}>
                                {partnerTier}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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

      {/* Select Character Selection Modal */}
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
                  <p className="text-xs text-gray-400">Choose a card. Sorted automatically by live database meta tier layers, synergy & links match.</p>
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

                {/* Candidates List Displaying Database Tiers */}
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
                    const cardTier = char.meta_evaluation?.tier || 'F';

                    return (
                      <button
                        type="button"
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
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] font-black border rounded px-1.5 py-0.2 tracking-wide uppercase leading-none ${getTierBadgeStyle(cardTier)}`}>
                                {cardTier} Tier
                              </span>
                              {hasWarn && (
                                <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded uppercase leading-none">
                                  Same Name
                                </span>
                              )}
                            </div>
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

      {/* Full Integrated Profile Viewer Modal (Matches Catalog Mechanics perfectly) */}
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

              {/* Scrollable Profile Content */}
              <div className="p-8 overflow-y-auto space-y-6">
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

                {/* AI Evaluation Framework Summary */}
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
                      </div>

                      <p className="text-xs text-gray-300 leading-relaxed font-medium bg-[#0B0F19]/40 p-3 rounded-xl border border-[#23324C]/40">
                        {evalResult.verdict}
                      </p>

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

                {/* Full Descriptions Details */}
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
