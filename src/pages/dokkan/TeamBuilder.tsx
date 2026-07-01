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
  role: 'Leader' | 'Rotation 1 Partner' | 'Rotation 2 Anchor' | 'Rotation 2 Partner' | 'Floater 1' | 'Floater 2' | 'Friend';
  character: Character | null;
}

export const TeamBuilder: React.FC = () => {
  const { user } = useAuth();
  const [allCharacters, setAllCharacters] = useState<Character[]>([]);
  const [boxIds, setBoxIds] = useState<number[]>([]);
  const [highlightedSlotIdx, setHighlightedSlotIdx] = useState<number>(0);

  // Team slots (6 slots + friend leader)
  const [team, setTeam] = useState<TeamSlot[]>([
    { role: 'Leader', character: null },              // Index 0: Rotation 1 Tank/Anchor
    { role: 'Rotation 1 Partner', character: null },  // Index 1: Rotation 1 Bridge/Dps
    { role: 'Rotation 2 Anchor', character: null },   // Index 2: Rotation 2 Tank/Anchor
    { role: 'Rotation 2 Partner', character: null },  // Index 3: Rotation 2 Bridge/Dps
    { role: 'Floater 1', character: null },           // Index 4: Float Support/Utility
    { role: 'Floater 2', character: null },           // Index 5: Float Support/Utility
    { role: 'Friend', character: null },              // Index 6: Friend Leader (Floater/Flex)
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

  // Context-Sensitive Linking Partner Calculator matching Dokkan.fyi algorithms perfectly
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

  // Advanced Candidate Generation Layer filtering strictly by Category Missions if toggled
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
      const leader = team[0].character;
      const friend = team[6].character;

      let rotationPartner: Character | null = null;
      if (activeSlotIdx === 0) rotationPartner = team[1].character;
      else if (activeSlotIdx === 1) rotationPartner = team[0].character;
      else if (activeSlotIdx === 2) rotationPartner = team[3].character;
      else if (activeSlotIdx === 3) rotationPartner = team[2].character;

      const scoredList = list.map(c => {
        let sharedLinksCount = 0;
        if (rotationPartner) {
          sharedLinksCount = (c.link_ids || []).filter(lid => rotationPartner?.link_ids?.includes(lid)).length;
        } else {
          const otherMembers = team.filter((s, idx) => s.character && idx !== activeSlotIdx).map(s => s.character) as Character[];
          sharedLinksCount = otherMembers.length > 0 ? (c.link_ids || []).filter(lid => otherMembers.some(m => m.link_ids?.includes(lid))).length : 0;
        }

        const lBoost = leader ? evaluateLeaderSkill(leader, c).pct : 0;
        const fBoost = friend ? evaluateLeaderSkill(friend, c).pct : 0;
        const totalBoost = lBoost + fBoost;
        
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

      scoredList.sort((a, b) => {
        if (a.sameName !== b.sameName) return a.sameName ? 1 : -1;
        if (a.sharedLinksCount !== b.sharedLinksCount) return b.sharedLinksCount - a.sharedLinksCount;
        if (a.aiWeight !== b.aiWeight) return b.aiWeight - a.aiWeight;
        return b.totalBoost - a.totalBoost;
      });

      return scoredList.map(item => item.char).slice(0, 30);
    }

    return list.slice(0, 30);
  };

  const getLinkingPartnerRecommendations = (char: Character, limit = 5) => {
    let list = onlyBox ? allCharacters.filter(c => boxIds.includes(c.id)) : allCharacters;
    
    if (selectedEventCategory !== null) {
      list = list.filter(c => c.category_ids?.includes(selectedEventCategory));
    }

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

  const handleAutobuild = () => {
    const leader = team[0].character;
    if (!leader) return;

    let pool = allCharacters.filter(c => boxIds.includes(c.id) && c.id !== leader.id);
    if (selectedEventCategory !== null) {
      pool = pool.filter(c => c.category_ids?.includes(selectedEventCategory));
    }

    if (pool.length === 0) {
      alert("No matching characters in your box match the active category filter layers!");
      return;
    }

    const usedIds = new Set<number>([leader.id]);
    const usedNames = new Set<string>([leader.name]);
    const builtTeam: (Character | null)[] = [leader, null, null, null, null, null];

    // --- STEP 1: Build Rotation 1 DPS Partner ---
    let rot1PartnerScored = pool
      .filter(c => !usedNames.has(c.name))
      .map(c => {
        const boost = evaluateLeaderSkill(leader, c).pct;
        const linksCount = (c.link_ids || []).filter(lid => leader.link_ids?.includes(lid)).length;
        const aiWeight = getTierWeight(c.meta_evaluation?.tier || 'F');
        return { char: c, score: (linksCount * 250) + (boost * 15) + (aiWeight * 40) };
      }).sort((a, b) => b.score - a.score);

    if (rot1PartnerScored.length > 0) {
      const choice = rot1PartnerScored[0].char;
      builtTeam[1] = choice;
      usedIds.add(choice.id);
      usedNames.add(choice.name);
    }

    // --- STEP 2: Build Rotation 2 Primary Tank ---
    let rot2AnchorScored = pool
      .filter(c => !usedNames.has(c.name) && !usedIds.has(c.id))
      .map(c => {
        const boost = evaluateLeaderSkill(leader, c).pct;
        const aiEval = c.meta_evaluation || { tier: 'F', slot: 'Slot 2' };
        const isSlot1Tank = aiEval.slot === 'Slot 1' ? 400 : 0;
        const aiWeight = getTierWeight(aiEval.tier);
        return { char: c, score: isSlot1Tank + (aiWeight * 150) + (boost * 10) };
      }).sort((a, b) => b.score - a.score);

    if (rot2AnchorScored.length > 0) {
      const choice = rot2AnchorScored[0].char;
      builtTeam[2] = choice;
      usedIds.add(choice.id);
      usedNames.add(choice.name);
    }

    // --- STEP 3: Build Rotation 2 Partner ---
    const r2Anchor = builtTeam[2];
    if (r2Anchor) {
      let rot2PartnerScored = pool
        .filter(c => !usedNames.has(c.name) && !usedIds.has(c.id))
        .map(c => {
          const boost = evaluateLeaderSkill(leader, c).pct;
          const linksCount = (c.link_ids || []).filter(lid => r2Anchor.link_ids?.includes(lid)).length;
          const aiWeight = getTierWeight(c.meta_evaluation?.tier || 'F');
          return { char: c, score: (linksCount * 250) + (boost * 15) + (aiWeight * 40) };
        }).sort((a, b) => b.score - a.score);

      if (rot2PartnerScored.length > 0) {
        const choice = rot2PartnerScored[0].char;
        builtTeam[3] = choice;
        usedIds.add(choice.id);
        usedNames.add(choice.name);
      }
    }

    // --- STEP 4: Fill Floater Slots ---
    for (let fIdx = 4; fIdx <= 5; fIdx++) {
      let floaterScored = pool
        .filter(c => !usedNames.has(c.name) && !usedIds.has(c.id))
        .map(c => {
          const boost = evaluateLeaderSkill(leader, c).pct;
          const aiEval = c.meta_evaluation || { tier: 'F', slot: 'Floater' };
          const isFloaterBadge = aiEval.slot === 'Floater' ? 100 : 0;
          const aiWeight = getTierWeight(aiEval.tier);
          return { char: c, score: isFloaterBadge + (aiWeight * 120) + (boost * 15) };
        }).sort((a, b) => b.score - a.score);

      if (floaterScored.length > 0) {
        const choice = floaterScored[0].char;
        builtTeam[fIdx] = choice;
        usedIds.add(choice.id);
        usedNames.add(choice.name);
      }
    }

    setTeam(prev => {
      const copy = [...prev];
      for (let i = 0; i <= 5; i++) {
        copy[i] = { ...copy[i], character: builtTeam[i] };
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

          {team[0].character && (
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
                    className={`bg-[#161F30]/80 border rounded-2xl p-5 flex items-center gap-5 transition-all cursor-pointer relative group ${
                      highlightedSlotIdx === idx ? 'border-blue-500 bg-[#161F30]' : 'border-[#23324C] hover:border-blue-500/40'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {char ? (
                        <>
                          <DokkanCard cardId={char.id} name={char.name} rarity={char.rarity} element={char.element} size="md" />
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setViewingProfileChar(char); }} className="bg-blue-600 p-1 rounded-lg text-white"><HelpCircle className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveSlotIdx(idx); }} className="bg-indigo-600 p-1 rounded-lg text-white"><Search className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveCharacter(idx); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full border border-[#0B0F19] opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                        </>
                      ) : (
                        <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-500"><Plus className="w-5 h-5" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[8px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{slot.role}</span>
                      <h4 className="text-sm font-bold text-white truncate mt-1">{char ? char.name : 'Empty Tactical Slot'}</h4>
                      {char && (
                        <div className="flex gap-1.5 flex-wrap pt-0.5">
                          <span className={`text-[8px] font-black border rounded px-1.5 py-0.2 ${getTierBadgeStyle(char.meta_evaluation?.tier || 'F')}`}>{char.meta_evaluation?.tier || 'F'} Tier</span>
                          <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">+{boostVal}% Boost</span>
                          {activeLinksCount > 0 && <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">🔗 {activeLinksCount} Partner Links</span>}
                        </div>
                      )}
                    </div>
                    {hasWarn && <div className="absolute top-3 right-3 text-amber-500"><AlertTriangle className="w-4 h-4 animate-pulse" /></div>}
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
                    className={`bg-[#161F30]/80 border rounded-2xl p-5 flex items-center gap-5 transition-all cursor-pointer relative group ${
                      highlightedSlotIdx === idx ? 'border-purple-500 bg-[#161F30]' : 'border-[#23324C] hover:border-purple-500/40'
                    }`}
                  >
                    <div className="relative shrink-0">
                      {char ? (
                        <>
                          <DokkanCard cardId={char.id} name={char.name} rarity={char.rarity} element={char.element} size="md" />
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setViewingProfileChar(char); }} className="bg-blue-600 p-1 rounded-lg text-white"><HelpCircle className="w-3.5 h-3.5" /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveSlotIdx(idx); }} className="bg-indigo-600 p-1 rounded-lg text-white"><Search className="w-3.5 h-3.5" /></button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveCharacter(idx); }} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white p-1 rounded-full border border-[#0B0F19] opacity-0 group-hover:opacity-100"><X className="w-3 h-3" /></button>
                        </>
                      ) : (
                        <div className="w-16 h-16 rounded-full border border-dashed border-gray-700 flex items-center justify-center text-gray-500"><Plus className="w-5 h-5" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[8px] font-black uppercase text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">{slot.role}</span>
                      <h4 className="text-sm font-bold text-white truncate mt-1">{char ? char.name : 'Empty Tactical Slot'}</h4>
                      {char && (
                        <div className="flex gap-1.5 flex-wrap pt-0.5">
                          <span className={`text-[8px] font-black border rounded px-1.5 py-0.2 ${getTierBadgeStyle(char.meta_evaluation?.tier || 'F')}`}>{char.meta_evaluation?.tier || 'F'} Tier</span>
                          <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">+{boostVal}% Boost</span>
                          {activeLinksCount > 0 && <span className="text-[8px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded">🔗 {activeLinksCount} Partner Links</span>}
                        </div>
                      )}
                    </div>
                    {hasWarn && <div className="absolute top-3 right-3 text-amber-500"><AlertTriangle className="w-4 h-4 animate-pulse" /></div>}
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
                      highlightedSlotIdx === idx ? 'border-gray-500 bg-[#161F30]' : 'border-[#23324C] hover:border-gray-500/30'
                    }`}
                  >
                    <span className="text-[8px] font-black uppercase text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{slot.role}</span>
                    <div className="relative my-2">
                      {char ? (
                        <>
                          <DokkanCard cardId={char.id} name={char.name} rarity={char.rarity} element={char.element} size="md" />
                          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.stopPropagation(); setViewingProfileChar(char); }} className="bg-blue-600 p-1 rounded-lg text-white"><HelpCircle className="w-3 h-3" /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setActiveSlotIdx(idx); }} className="bg-indigo-600 p-1 rounded-lg text-white"><Search className="w-3 h-3" /></button>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveCharacter(idx); }} className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full border border-[#0B0F19] opacity-0 group-hover:opacity-100"><X className="w-2.5 h-2.5" /></button>
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
                    {hasWarn && <div className="absolute top-2 right-2 text-amber-500"><AlertTriangle className="w-3.5 h-3.5" /></div>}
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
                    const leader = team[0].character;
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
