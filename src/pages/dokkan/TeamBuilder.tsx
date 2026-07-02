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
  Search,
  Sparkles,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  role: 'Rotation 1 - Slot 1 (Tank)' | 'Rotation 1 - Slot 2 (DPS)' | 'Rotation 2 - Slot 1 (Tank)' | 'Rotation 2 - Slot 2 (DPS)' | 'Floater 1 (Slot 3)' | 'Floater 2 (Slot 3)' | 'Friend Leader Flex';
  character: Character | null;
}

export const TeamBuilder: React.FC = () => {
  const { user } = useAuth();
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [boxIds, setBoxIds] = useState<number[]>([]);
  const [highlightedSlotIdx, setHighlightedSlotIdx] = useState<number>(0);
  const [leaderSlotIdx, setLeaderSlotIdx] = useState<number>(0); // Tracks which slot anchors team-wide leader boosts

  // Tactical Pro-Rotation Grid slots - Fixed mismatch layout string criteria safely
  const [team, setTeam] = useState<TeamSlot[]>([
    { role: 'Rotation 1 - Slot 1 (Tank)', character: null }, // Index 0
    { role: 'Rotation 1 - Slot 2 (DPS)', character: null },  // Index 1
    { role: 'Rotation 2 - Slot 1 (Tank)', character: null }, // Index 2
    { role: 'Rotation 2 - Slot 2 (DPS)', character: null },  // Index 3
    { role: 'Floater 1 (Slot 3)', character: null },         // Index 4 -> Fixed typo assignment perfectly here
    { role: 'Floater 2 (Slot 3)', character: null },         // Index 5
    { role: 'Friend Leader Flex', character: null },         // Index 6
  ]);

  // Modal selector and viewer states
  const [activeSlotIdx, setActiveSlotIdx] = useState<number | null>(null);
  const [viewingProfileChar, setViewingProfileChar] = useState<Character | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyBox, setOnlyBox] = useState(true);
  const [selectedEventCategory, setSelectedEventCategory] = useState<number | null>(null);
  const [statTab, setStatTab] = useState<'base' | 'max' | 'rainbow'>('max');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: chars } = await supabase
          .from('dokkan_characters')
          .select('id, name, subname, element, rarity, leader_skill, passive_skill_name, passive_skill_description, active_skill_name, active_skill_condition, active_skill_effect, category_ids, link_ids, max_hp, max_atk, max_def, base_hp, base_atk, base_def, rainbow_hp, rainbow_atk, rainbow_def, tag, meta_evaluation');
        
        if (chars) setAllCharacters(chars as Character[]);

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

  const getTierWeight = (tier: string): number => {
    const weights: Record<string, number> = { 'Z+': 5, 'S': 4, 'A': 3, 'B': 2, 'F': 1 };
    return weights[tier] || 1;
  };

  const evaluateLeaderSkill = (leader: Character, target: Character): { matched: boolean; pct: number } => {
    if (leader.id === target.id) return { matched: true, pct: 170 };
    
    const skillText = (leader.leader_skill || '').toLowerCase();
    let maxPct = 0;
    let matched = false;

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
    let targetPartners: Character[] = [];
    
    if (slotIdx === 0 && team[1].character) targetPartners.push(team[1].character);
    else if (slotIdx === 1 && team[0].character) targetPartners.push(team[0].character);
    else if (slotIdx === 2 && team[3].character) targetPartners.push(team[3].character);
    else if (slotIdx === 3 && team[2].character) targetPartners.push(team[2].character);
    else {
      targetPartners = team.filter((s, idx) => s.character && idx !== slotIdx).map(s => s.character) as Character[];
    }

    if (targetPartners.length === 0) return [];
    
    const sharedIds = (char.link_ids || []).filter(lid => 
      targetPartners.some(m => m.link_ids?.includes(lid))
    );
    
    return sharedIds.map(lid => {
      const link = linksData.find(l => l.id === lid);
      return link ? link.name : `Link ${lid}`;
    });
  };

  const getCandidates = () => {
    let list = onlyBox ? allCharacters.filter(c => boxIds.includes(c.id)) : allCharacters;

    if (selectedEventCategory !== null) {
      list = list.filter(c => c.category_ids?.includes(selectedEventCategory));
    }

    if (searchTerm.trim()) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.tag && c.tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (activeSlotIdx !== null) {
      const leader = team[leaderSlotIdx]?.character;

      let rotationPartner: Character | null = null;
      if (activeSlotIdx === 0) rotationPartner = team[1].character;
      else if (activeSlotIdx === 1) rotationPartner = team[0].character;
      else if (activeSlotIdx === 2) rotationPartner = team[3].character;
      else if (activeSlotIdx === 3) rotationPartner = team[2].character;

      const scoredList = list
        .map(c => {
          const lBoost = leader ? evaluateLeaderSkill(leader, c).pct : 0;
          
          let sharedLinksCount = 0;
          if (rotationPartner) {
            sharedLinksCount = (c.link_ids || []).filter(lid => rotationPartner?.link_ids?.includes(lid)).length;
          } else {
            const otherMembers = team.filter((s, idx) => s.character && idx !== activeSlotIdx).map(s => s.character) as Character[];
            sharedLinksCount = otherMembers.length > 0 ? (c.link_ids || []).filter(lid => otherMembers.some(m => m.link_ids?.includes(lid))).length : 0;
          }

          const aiEval = c.meta_evaluation || { tier: 'F' };
          const aiWeight = getTierWeight(aiEval.tier);

          return {
            char: c,
            sharedLinksCount,
            lBoost,
            aiWeight,
            sameName: hasSameNameWarning(c, activeSlotIdx)
          };
        })
        .filter(item => leader === null || item.lBoost > 0);

      scoredList.sort((a, b) => {
        if (a.sameName !== b.sameName) return a.sameName ? 1 : -1;
        if (b.lBoost !== a.lBoost) return b.lBoost - a.lBoost;
        if (a.sharedLinksCount !== b.sharedLinksCount) return b.sharedLinksCount - a.sharedLinksCount;
        return b.aiWeight - a.aiWeight;
      });

      return scoredList.map(item => item.char).slice(0, 30);
    }

    return list.slice(0, 30);
  };

  const getLinkingPartnerRecommendations = (char: Character, limit = 5) => {
    let list = onlyBox ? allCharacters.filter(c => boxIds.includes(c.id)) : allCharacters;
    const leader = team[leaderSlotIdx]?.character;
    
    if (selectedEventCategory !== null) {
      list = list.filter(c => c.category_ids?.includes(selectedEventCategory));
    }

    const scored = list
      .filter(c => c.id !== char.id && c.name !== char.name)
      .map(c => {
        const boost = leader ? evaluateLeaderSkill(leader, c).pct : 170;
        const shared = (c.link_ids || []).filter(lid => char.link_ids?.includes(lid));
        const aiEval = c.meta_evaluation || { tier: 'F' };
        return {
          char: c,
          boost,
          sharedLinks: shared.map(lid => linksData.find(l => l.id === lid)?.name || `Link ${lid}`),
          aiWeight: getTierWeight(aiEval.tier)
        };
      })
      .filter(item => item.boost > 0)
      .sort((a, b) => {
        if (a.sharedLinks.length !== b.sharedLinks.length) {
          return b.sharedLinks.length - a.sharedLinks.length;
        }
        if (b.boost !== a.boost) return b.boost - a.boost;
        return b.aiWeight - a.aiWeight;
      });

    return scored.slice(0, limit);
  };

  const handleAutobuild = () => {
    const primaryInputLeader = team[leaderSlotIdx]?.character;
    if (!primaryInputLeader) {
      alert("Please select a character in any slot first and set them as Leader Anchor to start the intelligent Pro-Build system!");
      return;
    }

    let pool = allCharacters.filter(c => boxIds.includes(c.id) && c.id !== primaryInputLeader.id);
    if (selectedEventCategory !== null) {
      pool = pool.filter(c => c.category_ids?.includes(selectedEventCategory));
    }

    pool = pool.filter(c => evaluateLeaderSkill(primaryInputLeader, c).pct > 0);

    if (pool.length === 0) {
      alert("No valid units in your box qualify under this leader skill and active mission filter layer combination!");
      return;
    }

    const usedIds = new Set<number>([primaryInputLeader.id]);
    const usedNames = new Set<string>([primaryInputLeader.name]);
    const builtTeam: (Character | null)[] = [null, null, null, null, null, null];

    const leaderSlotRole = primaryInputLeader.meta_evaluation?.slot || 'Slot 2';
    let newLeaderIdx = 0;

    if (leaderSlotRole === 'Slot 1') {
      builtTeam[0] = primaryInputLeader;
      newLeaderIdx = 0;
    } else if (leaderSlotRole === 'Slot 2') {
      builtTeam[1] = primaryInputLeader;
      newLeaderIdx = 1;
    } else {
      builtTeam[4] = primaryInputLeader;
      newLeaderIdx = 4;
    }

    if (builtTeam[0] && !builtTeam[1]) {
      let bestBridge = pool
        .filter(c => !usedNames.has(c.name))
        .map(c => {
          const boost = evaluateLeaderSkill(primaryInputLeader, c).pct;
          const links = (c.link_ids || []).filter(l => builtTeam[0]?.link_ids?.includes(l)).length;
          const weight = getTierWeight(c.meta_evaluation?.tier || 'F');
          return { char: c, score: (links * 300) + (boost * 20) + (weight * 30) };
        }).sort((a, b) => b.score - a.score)[0];
      if (bestBridge) {
        builtTeam[1] = bestBridge.char; usedIds.add(bestBridge.char.id); usedNames.add(bestBridge.char.name);
      }
    } else if (builtTeam[1] && !builtTeam[0]) {
      let bestTank = pool
        .filter(c => !usedNames.has(c.name) && c.meta_evaluation?.slot === 'Slot 1')
        .map(c => {
          const boost = evaluateLeaderSkill(primaryInputLeader, c).pct;
          const links = (c.link_ids || []).filter(l => builtTeam[1]?.link_ids?.includes(l)).length;
          const weight = getTierWeight(c.meta_evaluation?.tier || 'F');
          return { char: c, score: (links * 200) + (boost * 20) + (weight * 100) };
        }).sort((a, b) => b.score - a.score)[0];
      if (bestTank) {
        builtTeam[0] = bestTank.char; usedIds.add(bestTank.char.id); usedNames.add(bestTank.char.name);
      }
    }

    let r2Tank = pool
      .filter(c => !usedNames.has(c.name) && !usedIds.has(c.id) && c.meta_evaluation?.slot === 'Slot 1')
      .map(c => {
        const boost = evaluateLeaderSkill(primaryInputLeader, c).pct;
        const weight = getTierWeight(c.meta_evaluation?.tier || 'F');
        return { char: c, score: (weight * 300) + (boost * 20) };
      }).sort((a, b) => b.score - a.score)[0]?.char;

    if (!r2Tank) {
      r2Tank = pool
        .filter(c => !usedNames.has(c.name) && !usedIds.has(c.id))
        .sort((a, b) => getTierWeight(b.meta_evaluation?.tier || 'F') - getTierWeight(a.meta_evaluation?.tier || 'F'))[0];
    }

    if (r2Tank) {
      builtTeam[2] = r2Tank; usedIds.add(r2Tank.id); usedNames.add(r2Tank.name);
      let r2Bridge = pool
        .filter(c => !usedNames.has(c.name) && !usedIds.has(c.id))
        .map(c => {
          const boost = evaluateLeaderSkill(primaryInputLeader, c).pct;
          const links = (c.link_ids || []).filter(l => r2Tank?.link_ids?.includes(l)).length;
          return { char: c, score: (links * 400) + (boost * 15) };
        }).sort((a, b) => b.score - a.score)[0]?.char;
      if (r2Bridge) {
        builtTeam[3] = r2Bridge; usedIds.add(r2Bridge.id); usedNames.add(r2Bridge.name);
      }
    }

    for (let i = 4; i <= 5; i++) {
      if (builtTeam[i]) continue;
      let bestFloater = pool
        .filter(c => !usedNames.has(c.name) && !usedIds.has(c.id))
        .map(c => {
          const boost = evaluateLeaderSkill(primaryInputLeader, c).pct;
          const isFloaterRoleBadge = c.meta_evaluation?.slot === 'Floater' ? 150 : 0;
          const weight = getTierWeight(c.meta_evaluation?.tier || 'F');
          return { char: c, score: isFloaterRoleBadge + (weight * 100) + (boost * 10) };
        }).sort((a, b) => b.score - a.score)[0]?.char;
      if (bestFloater) {
        builtTeam[i] = bestFloater; usedIds.add(bestFloater.id); usedNames.add(bestFloater.name);
      }
    }

    setTeam(prev => {
      const copy = [...prev];
      for (let i = 0; i <= 5; i++) {
        copy[i] = { ...copy[i], character: builtTeam[i] };
      }
      copy[6] = { ...copy[6], character: primaryInputLeader };
      return copy;
    });

    setLeaderSlotIdx(newLeaderIdx);
    setHighlightedSlotIdx(newLeaderIdx);
  };

  const computeTeamAnalysis = () => {
    const leader = team[leaderSlotIdx]?.character;
    const friend = team[6].character;
    const members = team.filter(slot => slot.character !== null).map(slot => slot.character) as Character[];

    const boosts = members.map(member => {
      let leaderPct = leader ? evaluateLeaderSkill(leader, member).pct : 0;
      let friendPct = friend ? evaluateLeaderSkill(friend, member).pct : 0;
      return { member, leaderPct, friendPct, total: leaderPct + friendPct };
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
      })).sort((a, b) => b.count - a.count);

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
      })).sort((a, b) => b.count - a.count);

    return { boosts, activeLinks, sharedCategories };
  };

  const analysis = computeTeamAnalysis();
  const highlightedChar = team[highlightedSlotIdx]?.character;

  return (
    <div className="p-8 space-y-6">
      {/* Header Layout */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Swords className="w-8 h-8 text-blue-500 animate-pulse" />
            Interactive Team Builder Pro
          </h1>
          <p className="text-gray-400 text-sm">
            Map professional dual rotations, isolate localized link chains, and filter missions criteria.
          </p>
        </div>

        {/* Global Event Category Mission Context Filter Layer */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
              <Filter className="w-4 h-4" />
            </span>
            <select
              value={selectedEventCategory || ''}
              onChange={(e) => setSelectedEventCategory(e.target.value ? Number(e.target.value) : null)}
              className="pl-9 pr-8 py-2 bg-[#161F30] border border-[#23324C] text-xs text-white font-bold rounded-xl focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              <option value="">No Active Mission Filter</option>
              {categoriesData.map((cat: any) => (
                <option key={cat.id} value={cat.id}>Mission: [{cat.name}]</option>
              ))}
            </select>
            <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
              <ChevronDown className="w-3.5 h-3.5" />
            </span>
          </div>

          {(team[0].character || team[1].character || team[4].character) && (
            <button
              onClick={handleAutobuild}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 animate-bounce" />
              Pro Rotation Autobuild
            </button>
          )}
        </div>
      </div>

      {/* Structural Rotation Grid Blocks */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          
          {/* ROTATION ALPHA BLOCK */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest pl-1">CORE ROTATION 1: Main Vanguard Core</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {[0, 1].map((idx) => {
                const slot = team[idx];
                const char = slot.character;
                const hasWarn = char ? hasSameNameWarning(char, idx) : false;
                const boostVal = char ? (analysis.boosts.find(b => b.member.id === char.id)?.total ?? 0) : 0;
                const activeLinksCount = char ? getSharedLinksWithTeam(char, idx).length : 0;
                return (
                  <div
                    key={idx}
                    onClick={() => { setHighlightedSlotIdx(idx); if (!char) setActiveSlotIdx(idx); }}
                    className={`bg-[#161F30]/80 border rounded-2xl p-4 flex flex-col items-center justify-between min-h-[260px] transition-all cursor-pointer relative group ${
                      highlightedSlotIdx === idx ? 'border-blue-500 ring-1 ring-blue-500/20 bg-[#161F30]' : 'border-[#23324C]'
                    }`}
                  >
                    <div className="w-full flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        {slot.role}
                      </span>
                      {leaderSlotIdx === idx && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Crown Leader
                        </span>
                      )}
                    </div>

                    {hasWarn && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-black p-1 rounded-lg z-20 shadow-md animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {char ? (
                      <div className="relative">
                        <DokkanCard cardId={char.id} name={char.name} rarity={char.rarity} element={char.element} size="md" />
                        
                        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setViewingProfileChar(char); }}
                            className="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg shadow-md text-xs font-bold"
                          >
                            Profile
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setActiveSlotIdx(idx); }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white p-1.5 rounded-lg shadow-md text-xs font-bold"
                          >
                            Swap
                          </button>
                        </div>

                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveCharacter(idx); }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full z-20 opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-500">
                        <Plus className="w-6 h-6" />
                      </div>
                    )}

                    {char ? (
                      <div className="text-center w-full mt-2.5 space-y-1">
                        <p className="text-[10px] font-extrabold text-white truncate px-1">{char.name}</p>
                        {char.meta_evaluation?.tier && (
                          <p className={`text-[8px] font-black tracking-wide border rounded px-1.5 py-0.2 mx-auto w-max ${getTierBadgeStyle(char.meta_evaluation.tier)}`}>
                            {char.meta_evaluation.tier} Tier
                          </p>
                        )}
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded mx-auto ${boostVal > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {boostVal > 0 ? `+${boostVal}% Boost` : '0% Boost'}
                          </span>
                          {activeLinksCount > 0 && (
                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded mx-auto">
                              🔗 {activeLinksCount} Links
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-gray-500 mt-2">Empty Slot</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ROTATION BETA BLOCK */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest pl-1">CORE ROTATION 2: Secondary Vanguard Core</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
              {[2, 3].map((idx) => {
                const slot = team[idx];
                const char = slot.character;
                const hasWarn = char ? hasSameNameWarning(char, idx) : false;
                const boostVal = char ? (analysis.boosts.find(b => b.member.id === char.id)?.total ?? 0) : 0;
                const activeLinksCount = char ? getSharedLinksWithTeam(char, idx).length : 0;
                return (
                  <div
                    key={idx}
                    onClick={() => { setHighlightedSlotIdx(idx); if (!char) setActiveSlotIdx(idx); }}
                    className={`bg-[#161F30]/80 border rounded-2xl p-4 flex flex-col items-center justify-between min-h-[260px] transition-all cursor-pointer relative group ${
                      highlightedSlotIdx === idx ? 'border-blue-500 ring-1 ring-blue-500/20 bg-[#161F30]' : 'border-[#23324C]'
                    }`}
                  >
                    <div className="w-full flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        {slot.role}
                      </span>
                      {leaderSlotIdx === idx && (
                        <span className="flex items-center gap-1 text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                          Crown Leader
                        </span>
                      )}
                    </div>

                    {hasWarn && (
                      <div className="absolute top-2 right-2 bg-amber-500 text-black p-1 rounded-lg z-20 shadow-md animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </div>
                    )}

                    {char ? (
                      <div className="relative">
                        <DokkanCard cardId={char.id} name={char.name} rarity={char.rarity} element={char.element} size="md" />
                        
                        <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setViewingProfileChar(char); }} className="bg-blue-600 p-1 rounded-lg text-white text-xs font-bold px-2 py-1">Profile</button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); setActiveSlotIdx(idx); }} className="bg-indigo-600 p-1 rounded-lg text-white text-xs font-bold px-2 py-1">Swap</button>
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); handleRemoveCharacter(idx); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full z-20 opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-500"><Plus className="w-4 h-4" /></div>
                    )}

                    {char ? (
                      <div className="text-center w-full mt-2.5 space-y-1">
                        <p className="text-[10px] font-extrabold text-white truncate px-1">{char.name}</p>
                        {char.meta_evaluation?.tier && (
                          <p className={`text-[8px] font-black tracking-wide border rounded px-1.5 py-0.2 mx-auto w-max ${getTierBadgeStyle(char.meta_evaluation.tier)}`}>
                            {char.meta_evaluation.tier} Tier
                          </p>
                        )}
                        <div className="flex flex-col gap-0.5 mt-1">
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded mx-auto ${boostVal > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
                            {boostVal > 0 ? `+${boostVal}% Boost` : '0% Boost'}
                          </span>
                          {activeLinksCount > 0 && (
                            <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded mx-auto">
                              🔗 {activeLinksCount} Links
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-gray-500 mt-2">Empty Slot</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* PRO-FLOATERS MATRIX BLOCK */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-1">SUPPORTIVE PRO-FLOATERS: Slot 3 Assets</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-4">
              {[4, 5, 6].map((idx) => {
                const slot = team[idx];
                const char = slot.character;
                const hasWarn = char ? hasSameNameWarning(char, idx) : false;
                const boostVal = char ? (analysis.boosts.find(b => b.member.id === char.id)?.total ?? 0) : 0;
                return (
                  <div
                    key={idx}
                    onClick={() => { setHighlightedSlotIdx(idx); if (!char) setActiveSlotIdx(idx); }}
                    className={`bg-[#161F30]/80 border rounded-2xl p-4 flex flex-col items-center justify-between text-center transition-all cursor-pointer relative group min-h-[220px] ${
                      highlightedSlotIdx === idx ? 'border-gray-500 bg-[#161F30]' : 'border-[#23324C]'
                    }`}
                  >
                    <div className="w-full flex justify-between items-center mb-1">
                      <span className="text-[8px] font-black uppercase text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{slot.role}</span>
                      {leaderSlotIdx === idx && (
                        <span className="flex items-center gap-0.5 text-[8px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded-full">
                          Crown Leader
                        </span>
                      )}
                    </div>
                    
                    <div className="relative my-2">
                      {char ? (
                        <>
                          <DokkanCard cardId={char.id} name={char.name} rarity={char.rarity} element={char.element} size="md" />
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setViewingProfileChar(char); }} className="bg-blue-600 p-1 rounded-lg text-white"><HelpCircle className="w-3 h-3" /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveSlotIdx(idx); }} className="bg-indigo-600 p-1 rounded-lg text-white"><Search className="w-3 h-3" /></button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveCharacter(idx); }} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full border border-[#0B0F19]"><X className="w-2.5 h-2.5" /></button>
                        </>
                      ) : (
                        <div className="w-14 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-500"><Plus className="w-4 h-4" /></div>
                      )}
                    </div>
                    <p className="text-[10px] font-extrabold text-white truncate max-w-full px-1">{char ? char.name : 'Empty Floater Slot'}</p>
                    {char && (
                      <div className="flex flex-col gap-0.5 w-full mt-1">
                        <span className={`text-[7px] font-black border rounded px-1 w-max mx-auto ${getTierBadgeStyle(char.meta_evaluation?.tier || 'F')}`}>{char.meta_evaluation?.tier} Tier</span>
                        <span className="text-[7px] font-black text-emerald-400 bg-emerald-500/10 rounded w-max mx-auto px-1">+{boostVal}% Boost</span>
                      </div>
                    )}
                    {hasWarn && <div className="absolute top-2 right-2 bg-amber-500 p-1 rounded"><AlertTriangle className="w-3.5 h-3.5 text-black" /></div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Highlighted Partner Analytics */}
        <div className="space-y-6">
          <div className="bg-[#161F30] border border-[#23324C] rounded-3xl p-6 space-y-6 shadow-xl relative">
            {highlightedChar ? (
              <div className="space-y-4">
                <div className="flex gap-3 items-center border-b border-[#23324C]/60 pb-4">
                  <div className="w-10 h-10 shrink-0">
                    <DokkanCard cardId={highlightedChar.id} name={highlightedChar.name} rarity={highlightedChar.rarity} element={highlightedChar.element} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[9px] font-black uppercase text-blue-400 leading-none">Slot {highlightedSlotIdx + 1} Selected</span>
                    <h4 className="text-sm font-bold text-white truncate leading-tight mt-0.5">{highlightedChar.name}</h4>
                    {highlightedChar.meta_evaluation?.tier && (
                      <span className={`inline-block text-[8px] font-black border rounded px-1.5 py-0.2 mt-1 ${getTierBadgeStyle(highlightedChar.meta_evaluation.tier)}`}>
                        {highlightedChar.meta_evaluation.tier} Tier &bull; {highlightedChar.meta_evaluation.slot}
                      </span>
                    )}
                  </div>
                </div>

                {/* Strategy Assignment */}
                <button
                  type="button"
                  onClick={() => setLeaderSlotIdx(highlightedSlotIdx)}
                  className={`w-full py-2 rounded-xl text-xs font-black border tracking-wide transition-all ${
                    leaderSlotIdx === highlightedSlotIdx 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-inner' 
                      : 'bg-[#0B0F19]/60 text-gray-400 border-[#23324C] hover:text-white hover:bg-[#1C283F]'
                  }`}
                >
                  {leaderSlotIdx === highlightedSlotIdx ? '👑 Active Team Leader Anchor' : 'Set as Team Leader'}
                </button>

                <div className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-indigo-400">Rotation Active Links ({getSharedLinksWithTeam(highlightedChar, highlightedSlotIdx).length})</span>
                  <div className="flex flex-wrap gap-1">
                    {getSharedLinksWithTeam(highlightedChar, highlightedSlotIdx).map((name, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-300 rounded">{name}</span>
                    ))}
                    {getSharedLinksWithTeam(highlightedChar, highlightedSlotIdx).length === 0 && (
                      <p className="text-[11px] text-gray-500 italic">No shared links activated inside this rotation node layout.</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-[#23324C]/60">
                  <div className="flex justify-between items-center">
                    <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">Best Sync Partners</span>
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
                            <DokkanCard cardId={item.char.id} name={item.char.name} rarity={item.char.rarity} element={item.char.element} size="sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white truncate leading-tight group-hover:text-emerald-400 transition-colors">{item.char.name}</p>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <p className="text-[8px] font-medium text-gray-400 truncate">Shares: {item.sharedLinks.length} Links</p>
                              <span className={`text-[7px] font-extrabold border rounded px-1 scale-90 origin-right ${getTierBadgeStyle(partnerTier)}`}>{partnerTier}</span>
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
                <p className="text-xs text-gray-500 italic max-w-[200px] mx-auto leading-relaxed">Select a filled slot to inspect rotation parameters.</p>
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
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161F30] border border-[#23324C] w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[80vh]"
            >
              <button onClick={() => setActiveSlotIdx(null)} className="absolute top-4 right-4 bg-gray-900/60 text-gray-400 p-2 rounded-xl"><X className="w-5 h-5" /></button>

              <div className="p-8 space-y-6 flex flex-col h-full overflow-y-auto">
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">Select Character</h3>
                  <p className="text-xs text-gray-400">Choose a card. Sorted automatically by dual rotation sync, direct links compatibility & meta parameters.</p>
                </div>

                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500"><Search className="w-4 h-4" /></span>
                    <input
                      type="text" placeholder="Search character name or title..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#0B0F19]/60 border border-[#23324C] text-white rounded-xl focus:outline-none focus:border-blue-500 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setOnlyBox(true)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${onlyBox ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30' : 'text-gray-500'}`}>From My Box Only</button>
                    <button type="button" onClick={() => setOnlyBox(false)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${!onlyBox ? 'bg-blue-600/10 text-blue-400 border-blue-500/30' : 'text-gray-500'}`}>Search All Catalog</button>
                  </div>
                </div>

                <div className="space-y-2 overflow-y-auto pr-1">
                  {getCandidates().map((char) => {
                    const leader = team[leaderSlotIdx]?.character;
                    const friend = team[6].character;
                    const lBoost = leader ? evaluateLeaderSkill(leader, char).pct : 0;
                    const fBoost = friend ? evaluateLeaderSkill(friend, char).pct : 0;
                    const totalBoost = lBoost + fBoost;
                    const hasWarn = hasSameNameWarning(char, activeSlotIdx);
                    const cardTier = char.meta_evaluation?.tier || 'F';

                    let rotationPartner: Character | null = null;
                    if (activeSlotIdx === 0) rotationPartner = team[1].character;
                    else if (activeSlotIdx === 1) rotationPartner = team[0].character;
                    else if (activeSlotIdx === 2) rotationPartner = team[3].character;
                    else if (activeSlotIdx === 3) rotationPartner = team[2].character;

                    let linksCount = 0;
                    if (rotationPartner) {
                      linksCount = (char.link_ids || []).filter(lid => rotationPartner?.link_ids?.includes(lid)).length;
                    }

                    return (
                      <button
                        type="button" key={char.id} onClick={() => handleSelectCharacter(char)}
                        className="w-full text-left p-3 hover:bg-[#1C283F] bg-[#0B0F19]/30 border border-[#23324C]/60 rounded-2xl flex items-center gap-3 transition-colors group"
                      >
                        <DokkanCard cardId={char.id} name={char.name} rarity={char.rarity} element={char.element} size="sm" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[10px] font-semibold text-gray-400 truncate leading-none">{char.subname}</p>
                            <span className={`text-[8px] font-black border rounded px-1.5 py-0.2 uppercase leading-none ${getTierBadgeStyle(cardTier)}`}>{cardTier} Tier</span>
                          </div>
                          
                          <p className="text-xs font-bold text-white truncate mt-0.5 group-hover:text-blue-400 transition-colors">{char.name}</p>
                          
                          <div className="flex gap-1.5 mt-1.5">
                            {rotationPartner && (
                              <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">
                                🔗 {linksCount} Rotation Links Active
                              </span>
                            )}
                            <span className={`text-[8px] font-black px-1.5 py-0.2 rounded ${totalBoost > 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-gray-500'}`}>+{totalBoost}% Boost</span>
                            {hasWarn && <span className="text-[8px] font-black text-amber-400 bg-amber-500/10 px-1 py-0.2 rounded">Same Name Clash</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal Layer */}
      <AnimatePresence>
        {viewingProfileChar && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#161F30] border border-[#23324C] w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]"
            >
              <div className={`h-2 bg-gradient-to-r ${ELEMENT_MAP[viewingProfileChar.element]?.class === 'Super' ? 'from-blue-500 to-emerald-500' : 'from-purple-500 to-red-500'}`} />
              <button onClick={() => setViewingProfileChar(null)} className="absolute top-4 right-4 bg-gray-900/60 text-gray-400 p-2 rounded-xl z-10"><X className="w-5 h-5" /></button>

              <div className="p-8 overflow-y-auto space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <DokkanCard cardId={viewingProfileChar.id} name={viewingProfileChar.name} rarity={viewingProfileChar.rarity} element={viewingProfileChar.element} size="xl" className="shrink-0" />
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold text-white tracking-wider ${ELEMENT_MAP[viewingProfileChar.element]?.color}`}>{ELEMENT_MAP[viewingProfileChar.element]?.label}</span>
                      <span className="px-2.5 py-0.5 rounded bg-gray-800 border border-gray-700 text-[10px] font-extrabold text-gray-300 tracking-wider">{RARITY_MAP[viewingProfileChar.rarity]}</span>
                    </div>
                    <p className="text-sm font-semibold text-blue-400 leading-none">{viewingProfileChar.subname}</p>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight leading-tight">{viewingProfileChar.name}</h3>
                  </div>
                </div>

                {(() => {
                  const evalResult = viewingProfileChar.meta_evaluation || { tier: 'F', viability: 'Pending Evaluation', slot: 'Floater', verdict: 'Missing details layer.', pros: [], cons: [] };
                  return (
                    <div className="bg-[#0B0F19]/40 border border-[#23324C]/60 rounded-2xl p-5 space-y-4 shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className={`w-14 h-14 rounded-full bg-gradient-to-r flex items-center justify-center font-black text-2xl tracking-tighter border ${getTierBadgeStyle(evalResult.tier)}`}>{evalResult.tier}</div>
                        <div>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Meta Evaluation Rating</span>
                          <span className="text-sm font-extrabold text-white">{evalResult.viability} &bull; {evalResult.slot}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed font-medium bg-[#0B0F19]/40 p-3 rounded-xl">{evalResult.verdict}</p>
                    </div>
                  );
                })()}

                {/* Level Stat Matrix Toggles */}
                <div className="space-y-3">
                  <div className="flex gap-2 bg-[#0B0F19]/40 p-1 rounded-xl border border-[#23324C]/60 w-fit">
                    {(['base', 'max', 'rainbow'] as const).map((tab) => (
                      <button
                        key={tab} onClick={() => setStatTab(tab)}
                        className={`px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg transition-all ${statTab === tab ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                      >
                        {tab === 'base' ? 'Base Lvl 1' : tab === 'max' ? 'Max Lvl (EZA)' : 'Rainbow (100%)'}
                      </button>
                    ))}
                  </div>

                  {viewingProfileChar.max_hp !== null && (
                    <div className="grid grid-cols-3 gap-4 bg-[#0B0F19]/60 p-4 rounded-2xl border border-[#23324C]">
                      <div className="text-center space-y-0.5"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">HP</span><p className="text-lg font-black text-white">{(statTab === 'base' ? viewingProfileChar.base_hp : statTab === 'max' ? viewingProfileChar.max_hp : viewingProfileChar.rainbow_hp)?.toLocaleString() ?? '-'}</p></div>
                      <div className="text-center space-y-0.5 border-x border-[#23324C]"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">ATK</span><p className="text-lg font-black text-white">{(statTab === 'base' ? viewingProfileChar.base_atk : statTab === 'max' ? viewingProfileChar.max_atk : viewingProfileChar.rainbow_atk)?.toLocaleString() ?? '-'}</p></div>
                      <div className="text-center space-y-0.5"><span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">DEF</span><p className="text-lg font-black text-white">{(statTab === 'base' ? viewingProfileChar.base_def : statTab === 'max' ? viewingProfileChar.max_def : viewingProfileChar.rainbow_def)?.toLocaleString() ?? '-'}</p></div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {viewingProfileChar.leader_skill && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-blue-400">Leader Skill</span>
                      <div className="bg-[#0B0F19]/40 p-4 rounded-xl border border-[#23324C] text-sm text-gray-300 font-medium whitespace-pre-line">{viewingProfileChar.leader_skill}</div>
                    </div>
                  )}
                  {viewingProfileChar.passive_skill_name && (
                    <div className="space-y-1.5">
                      <span className="block text-xs font-bold uppercase tracking-wider text-emerald-400">Passive: {viewingProfileChar.passive_skill_name}</span>
                      <div className="bg-[#0B0F19]/40 p-4 rounded-xl border border-[#23324C] text-sm text-gray-300 font-medium whitespace-pre-line">{viewingProfileChar.passive_skill_description}</div>
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
