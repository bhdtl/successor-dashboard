import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseKey || !openrouterKey) {
  console.error("Missing required environment variables within GitHub Secrets.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to calculate the exact mathematical median of a dataset key
function calculateMedian(array, key) {
  const values = array
    .map(item => item[key])
    .filter(val => val !== null && val !== undefined && !isNaN(val))
    .sort((a, b) => a - b);
  
  if (values.length === 0) return 0;
  const half = Math.floor(values.length / 2);
  
  if (values.length % 2 !== 0) {
    return values[half];
  }
  return (values[half - 1] + values[half]) / 2.0;
}

// Helper function to sanitize rogue strings before JSON parsing takes place
function cleanJsonString(rawString) {
  let cleaned = rawString.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
  }
  // Removes potential trailing commas before closing braces that zaps small models
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1');
  // Replaces rogue unescaped control characters
  cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  return cleaned;
}

async function evaluateCharacters() {
  console.log("Initiating paginated retrieval sequence across the entire Supabase matrix...");
  
  let allCharacters = [];
  let fromRange = 0;
  let toRange = 999;
  let keepFetching = true;

  // Pagination loop to completely bypass the Supabase 1000-row limit threshold dynamically
  while (keepFetching) {
    const { data: batch, error } = await supabase
      .from('dokkan_characters')
      .select('*')
      .range(fromRange, toRange);

    if (error) {
      console.error("Error connecting to Supabase database during pagination:", error);
      process.exit(1);
    }

    if (!batch || batch.length === 0) {
      keepFetching = false;
    } else {
      allCharacters = allCharacters.concat(batch);
      if (batch.length < 1000) {
        keepFetching = false;
      } else {
        fromRange += 1000;
        toRange += 1000;
      }
    }
  }

  const totalCount = allCharacters.length;
  console.log(`Successfully fetched complete catalog layer. Total assets found: ${totalCount}`);

  if (totalCount === 0) {
    console.log("Database matrix empty. Aborting pipeline.");
    return;
  }

  // Calculate dynamic database medians to feed comparative anchors directly into the LLM
  const globalMedianHP = calculateMedian(allCharacters, 'max_hp');
  const globalMedianATK = calculateMedian(allCharacters, 'max_atk');
  const globalMedianDEF = calculateMedian(allCharacters, 'max_def');

  console.log(`Global Database Baselines Calculated -> Median HP: ${globalMedianHP} | Median ATK: ${globalMedianATK} | Median DEF: ${globalMedianDEF}`);
  console.log("Beginning strict database-wide meta evaluation pipeline update...");

  for (const char of allCharacters) {
    console.log(`Analyzing asset: ${char.name} (${char.subname || 'No Title'}) [ID: ${char.id}]`);
    
    const systemPrompt = `You are an elite, hyper-objective Dragon Ball Z Dokkan Battle analytics intelligence engine specialized in standalone card calibration within the 2026 endgame meta ecosystem.

CRITICAL INSTRUCTION: You must evaluate this character as a self-contained unit. Do NOT automatically compare it to or rank it against recent premium benchmark cards like LR Beast Gohan unless specifically analyzing card-name link requirements. Evaluate what this unit brings to the table on its own merits, adjusted strictly for its release layout, mechanical traits, and current maximum awakening tier.

You are supplied with the global mathematical MEDIAN baselines of the entire game database. You must run a strict mathematical capability-to-median ratio analysis to assess if their raw maximum stats are low, average, or premium tier.

Apply an uncompromisingly strict multi-dimensional tier metric framework:
1D (Offensive Output Performance): Ratio compared to median stats, absolute stack potential, additional/critical build pathways, and active damage multi-triggers.
2D (Defensive Preservation & Sovereignty): Baseline values vs medians, presence of native damage reduction percentages, active or unconditional All-Guard, defensive stacking capabilities, and threshold immunities. Heavy weight allocation for endgame survivability.
3D (Leader Skill Scaling): Full 200% meta relevance gets prime credit, standard 170% gets average tier indexing, legacy sub-170% builds receive critical score reductions.
4D (Intangibles & Strategic Utility): Active turn-stalling framework optimization (Giant Form/Rage mechanics, active Ghost Usher manipulation), healing/revival triggers, rotational support buffers, and slot customization fluidity (True Slot 1 anchor vs strict Slot 3 floater).

Strict Tier Ratings Definition:
- "Z+" (Meta-Defining Dominator): Flawless standalone design covering multiple protective dimensions. Immune to endgame powercreep.
- "S" (Premium Rotation Anchor): Powerful kit with minimal limitations. Dominates its categories but might require item assistance under extreme pressure.
- "A" (Dependable Sub-Unit / Counter-Pick): Structurally solid or specialized link partner, but bears spürbare survival risks if caught by a super attack.
- "B" (Restricted Niche Filler): Highly situational choice. Stat-locked or mechanically outdated for top-tier challenges.
- "F" (Powercrept / Deprecated): Outclassed stats below or near the median, zero damage reduction or guard layers. Unusable in maximum difficulty.

You must strictly return a minified, valid JSON string object containing exactly these keys:
- tier: String (Must strictly be one of: "Z+", "S", "A", "B", "F")
- viability: String (A short meta classification description, e.g., "Meta-Defining Dominator", "Premium Rotation Anchor", "Niche Counter-Pick Asset")
- slot: String (Must strictly be one of: "Slot 1", "Slot 2", "Floater")
- verdict: String (A deep, technical text meta analysis in English outlining their exact standalone parameters, comparison to global medians, and endgame viability)
- pros: Array of Strings (Core functional standalone strengths)
- cons: Array of Strings (Key design drawbacks or situational vulnerabilities)

Do not use unescaped quotation marks inside text strings. Do not wrap the object inside markdown code blocks or backticks. Return ONLY the raw valid JSON string.`;

    const userPrompt = `Global Database Median Statistics Context:
- Database Median HP: ${globalMedianHP}
- Database Median ATK: ${globalMedianATK}
- Database Median DEF: ${globalMedianDEF}

Character Under Evaluation Parameters:
- Name: ${char.name}
- Title/Subname: ${char.subname}
- Rarity Code: ${char.rarity} (3=SSR, 4=UR, 5=LR)
- Leader Skill Data: ${char.leader_skill || 'None'}
- Passive Skill Data: Name: ${char.passive_skill_name || 'None'} | Description: ${char.passive_skill_description || 'None'}
- Active Skill Data: Name: ${char.active_skill_name || 'None'} | Condition: ${char.active_skill_condition || 'None'} | Effect: ${char.active_skill_effect || 'None'}
- Character Maximum Stats: HP: ${char.max_hp || 0}, ATK: ${char.max_atk || 0}, DEF: ${char.max_def || 0}`;

    // Setup Native AbortController for the 30-second processing safety fuse
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "X-Title": "Dokkan SaaS Analytics Engine"
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-v4-flash", // Upgraded to DeepSeek V4 Flash for maximized execution velocity and low latency throughput
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1
        }),
        signal: controller.signal // Links the fetch request directly to our safety abort fuse
      });

      // Clear timeout immediately upon successful api response resolve
      clearTimeout(timeoutId);

      const jsonRes = await response.json();
      
      if (jsonRes.error) {
        console.error("OpenRouter API Error Object Detected:", JSON.stringify(jsonRes.error, null, 2));
      }

      if (!jsonRes.choices || jsonRes.choices.length === 0) {
        throw new Error("Empty response from OpenRouter API.");
      }

      const rawContent = jsonRes.choices[0].message.content;
      const cleanedContent = cleanJsonString(rawContent);

      // Parse sanitized JSON payload safely
      const parsedEval = JSON.parse(cleanedContent);
      
      const { error: updateError } = await supabase
        .from('dokkan_characters')
        .update({ meta_evaluation: parsedEval })
        .eq('id', char.id);

      if (updateError) {
        console.error(`Database commit failed for ID ${char.id}:`, updateError);
      } else {
        console.log(`Successfully stored standalone evaluation parameters for ${char.name} [Tier: ${parsedEval.tier}]`);
      }

    } catch (processError) {
      clearTimeout(timeoutId); // Ensure cleanup in case of normal errors
      if (processError.name === 'AbortError') {
        console.error(`Skipping Asset: ${char.name} [ID: ${char.id}] -> Execution exceeded strict 30-second processing threshold.`);
      } else {
        console.error(`Failed to complete evaluation sequence for ID ${char.id}:`, processError.message);
      }
    }
    
    // Controlled throttling delay to protect endpoint parameters safely
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  console.log("Full database evaluation process completed successfully!");
}

evaluateCharacters();
