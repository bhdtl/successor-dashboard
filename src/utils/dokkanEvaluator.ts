export interface EvaluationResult {
  tier: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
  slot: 'Slot 1' | 'Slot 2' | 'Floater';
  viability: 'God Tier' | 'High Tier' | 'Mid Tier' | 'Low Tier' | 'Outclassed';
  verdict: string;
  pros: string[];
  cons: string[];
}

// Manual overrides for key meta cards from recent 2026 Tanabata/EZA tier lists
const METADB_OVERRIDES: Record<number, EvaluationResult> = {
  1034341: {
    tier: 'S+',
    slot: 'Slot 1',
    viability: 'God Tier',
    verdict: 'The absolute pinnacle of the modern meta. Gohan (Beast) combines unbreachable slot 1 defense (58% damage reduction + active guard) with an active skill that shields the entire team from K.O. attacks. An absolute must-run.',
    pros: ['Guards all attacks', '58% Damage Reduction', 'Active Skill team invincibility', 'High Ki self-sufficiency'],
    cons: ['Requires Piccolo units for full ally support buffs']
  },
  1034241: {
    tier: 'S',
    slot: 'Slot 2',
    viability: 'High Tier',
    verdict: 'Piccolo (RR Army) is a phenomenal utility unit and Gohan (Beast)\'s premium linking partner. Delivers substantial stats, activates key defensive links, and thrives in slot 2/3.',
    pros: ['High synergy with Beast Gohan', 'Excellent linkset', 'Great start-of-turn stats'],
    cons: ['Needs to attack first to build full defense']
  },
  1010441: {
    tier: 'S',
    slot: 'Slot 2',
    viability: 'High Tier',
    verdict: 'Super EZA Broly is an offensive monster. Launches multiple guaranteed super attacks and maintains high crit chance. Extremely dominant in slot 2 for Extreme teams.',
    pros: ['Super EZA stat boosts', 'Multiple guaranteed Super Attacks', 'High critical hit rate'],
    cons: ['Defense can be vulnerable before attacking']
  },
  1032521: {
    tier: 'S',
    slot: 'Slot 2',
    viability: 'High Tier',
    verdict: '1000-Days LR Goku after Super EZA is a top-tier utility player. High stats, heals 7,777 HP per Ki sphere, and provides strong team-wide buffs.',
    pros: ['Massive HP recovery', 'EZA and SEZA double awakening stats', 'All Types leader skill boost'],
    cons: ['Requires collecting many Ki spheres to maximize DEF']
  },
  1009091: {
    tier: 'S',
    slot: 'Slot 2',
    viability: 'High Tier',
    verdict: 'EZA Cooler (Final Form) is an Extreme PHY powerhouse. Launches multiple additional attacks, provides high Extreme support (+40% ATK & DEF), and crushes Super class enemies.',
    pros: ['Support buffs for Extreme Class', 'High offensive output', 'Strong links with final form units'],
    cons: ['Needs a Slot 1 defender to protect him early']
  },
  1013771: {
    tier: 'A',
    slot: 'Floater',
    viability: 'Mid Tier',
    verdict: 'LR Beerus & Whis is a reliable healing unit on Realm of Gods teams, but their defense has aged slightly. Best utilized as a support floater.',
    pros: ['Strong links with Beerus units', 'HP recovery on super attacks'],
    cons: ['Vulnerable to modern Red Zone bosses']
  }
};

export const evaluateCard = (card: {
  id: number;
  name: string;
  subname: string;
  rarity: number;
  element: number;
  leader_skill: string;
  passive_skill_description: string;
  category_ids: number[];
  link_ids: number[];
}): EvaluationResult => {
  // 1. Check if we have a manual override
  if (METADB_OVERRIDES[card.id]) {
    return METADB_OVERRIDES[card.id];
  }

  // 2. Default fallback heuristics
  const passive = (card.passive_skill_description || '').toLowerCase();
  const idStr = String(card.id);
  const rarity = card.rarity;

  // Determine Slot Potential
  let slot: 'Slot 1' | 'Slot 2' | 'Floater' = 'Slot 2';
  const hasGuard = passive.includes('guard') || passive.includes('guards');
  const hasDR = passive.includes('damage reduction') || passive.includes('reduces damage') || passive.includes('damage reduced');
  const hasSupport = passive.includes('allies') && (passive.includes('atk') || passive.includes('def') || passive.includes('ki'));

  if ((hasGuard && hasDR) || (hasDR && passive.includes('50%')) || (hasGuard && rarity === 5)) {
    slot = 'Slot 1'; // High defensive capability
  } else if (hasSupport && !hasGuard) {
    slot = 'Floater'; // Support utility
  }

  // Determine Tier and Viability
  let tier: 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
  let viability: 'God Tier' | 'High Tier' | 'Mid Tier' | 'Low Tier' | 'Outclassed' = 'Outclassed';

  // Base tier on release card ID range (Powercreep proxy) and rarity
  const isModern2025_2026 = idStr.startsWith('103') || idStr.startsWith('1028') || idStr.startsWith('1029');
  const isMidEra = idStr.startsWith('102') || idStr.startsWith('101');
  
  if (rarity === 5) { // LR
    if (isModern2025_2026) {
      tier = 'S';
      viability = 'High Tier';
    } else if (isMidEra) {
      tier = 'A';
      viability = 'Mid Tier';
    } else {
      tier = 'B';
      viability = 'Low Tier';
    }
  } else if (rarity === 4) { // UR
    if (isModern2025_2026) {
      tier = 'A';
      viability = 'Mid Tier';
    } else if (isMidEra) {
      tier = 'B';
      viability = 'Low Tier';
    } else {
      tier = 'C';
      viability = 'Low Tier';
    }
  } else { // SSR or lower
    tier = 'D';
    viability = 'Outclassed';
  }

  // EZA / SEZA boosts the tier
  const hasEzaDesc = passive.includes('extreme z-awakening') || passive.includes('eza');
  if (hasEzaDesc) {
    if (tier === 'A') tier = 'S';
    if (tier === 'B') tier = 'A';
    if (tier === 'C') tier = 'B';
    if (viability === 'Low Tier') viability = 'Mid Tier';
    if (viability === 'Mid Tier') viability = 'High Tier';
  }

  // Adjust by specific strong mechanics
  if (hasGuard || hasDR) {
    if ((tier as string) !== 'S+' && (tier as string) !== 'S') {
      // Upgrade tier for defensive units
      const tiers: ('S+' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F')[] = ['F', 'D', 'C', 'B', 'A', 'S', 'S+'];
      const idx = tiers.indexOf(tier);
      if (idx !== -1 && idx < tiers.length - 1) {
        tier = tiers[idx + 1];
      }
    }
  }

  // Pros & Cons generation
  const pros: string[] = [];
  const cons: string[] = [];

  if (hasGuard) pros.push('Built-in attack guard');
  if (hasDR) pros.push('Damage reduction capabilities');
  if (hasSupport) pros.push('Provides support to allies');
  if (passive.includes('additional attack') || passive.includes('launches an additional')) pros.push('Launches multiple additional attacks');
  if (passive.includes('critical') || passive.includes('crit')) pros.push('High critical hit potential');

  if (pros.length === 0) pros.push('Good basic stats scaling');

  if (!hasGuard && !hasDR) cons.push('Lacks direct damage reduction or guard');
  if (passive.includes('received') && passive.includes('atk')) cons.push('Requires getting hit to build passive stats');
  if (card.rarity < 4) cons.push('Low stats due to low base rarity');
  
  if (cons.length === 0) cons.push('Vulnerable to extreme slot 1 attacks before supering');

  // Verdict text
  let verdict = '';
  if (tier === 'S' || tier === 'S+') {
    verdict = `An absolute meta powerhouse. Excellent choice for high-difficulty content (Red Zone). High utility in ${slot}.`;
  } else if (tier === 'A') {
    verdict = `Highly usable in the current meta. Functions very well in ${slot} when placed on its optimal category teams.`;
  } else if (tier === 'B') {
    verdict = `Decent option, but starting to show signs of age or requires specific setups. Safe in ${slot} with caution.`;
  } else if (tier === 'C') {
    verdict = `Mainly used for Clash (Ultimate Battlefield) or older events. Mostly outclassed for modern hard events.`;
  } else {
    verdict = `Outclassed by newer releases. Not recommended for modern team rotations.`;
  }

  return {
    tier,
    slot,
    viability,
    verdict,
    pros,
    cons
  };
};
