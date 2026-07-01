import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const openrouterKey = process.env.OPENROUTER_API_KEY;

if (!supabaseUrl || !supabaseKey || !openrouterKey) {
  console.error("Missing required environment variables within GitHub Secrets.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function evaluateCharacters() {
  console.log("Fetching all characters from Supabase matrix for a full database update sequence...");
  
  // Overhauled query: Removed the null-check constraint completely to ensure ALL assets receive a fresh evaluation update
  const { data: characters, error } = await supabase
    .from('dokkan_characters')
    .select('*');

  if (error) {
    console.error("Error connecting to Supabase database:", error);
    process.exit(1);
  }

  if (!characters || characters.length === 0) {
    console.log("No characters discovered in the database matrix.");
    return;
  }

  console.log(`Processing full database pipeline update for ${characters.length} character(s).`);

  for (const char of characters) {
    console.log(`Analyzing asset: ${char.name} (${char.subname || 'No Title'}) [ID: ${char.id}]`);
    
    const systemPrompt = `You are an elite, objective Dragon Ball Z Dokkan Battle analytics intelligence engine specialized in the standalone calibration of cards within the current endgame meta framework. 

CRITICAL DIRECTIVE: Evaluate the provided character entirely on its own individual standalone capabilities, kit design, and structural parameters. Do NOT default to, fixate on, or compare the asset against a specific benchmark card like LR Beast Gohan unless evaluating a literal name-synergy link. Treat every unit as a self-contained kit.

Calibrate your scoring using a rigorous, multi-dimensional execution matrix:
1D (Offensive Output Potential): Analyze base attack multipliers, absolute damage accumulation scaling, type effectiveness, and critical/additional frequency thresholds.
2D (Defensive Integrity & Survival Mechanics): Assess absolute damage reduction percentages, active or unconditional All-Guard mechanics, raw defense stacking properties, and definitive survival thresholds. This is heavily weighted for the endgame ecosystem.
3D (Leader Skill Architecture Relevance): Evaluate absolute stat team-wide amplification limits, grading modern full 200% leader spreads exceptionally high while heavily penalizing legacy, obsolete sub-170% leader parameters.
4D (Intangibles & Strategic Multi-Slot Versatility): Gauge turn-stalling frameworks (Giant Form mechanics, active Ghost Usher turn delays), health recovery/revival mechanisms, unconditional rotation buffers, action-breaking locks, and versatile slot allocation functionality (Slot 1 anchoring presence vs flexible Slot 3 floater utility).

You must strictly return a minified, valid JSON string object containing exactly these keys:
- tier: String (Must strictly be one of: "Z+", "S", "A", "B", "F")
- viability: String (A concise meta categorization description, e.g., "Meta-Defining Dominator", "Premium Rotation Anchor", "Niche Counter-Pick Asset")
- slot: String (Must strictly be one of: "Slot 1", "Slot 2", "Floater")
- verdict: String (A deep, technical text meta analysis in English outlining their exact standalone kit parameters, defensive safety thresholds, and endgame content applicability)
- pros: Array of Strings (Core standalone mechanical and tactical strengths)
- cons: Array of Strings (Key design drawbacks, restriction locks, or statistical vulnerabilities)

Do not wrap the output object inside markdown blocks or backticks. Return ONLY the raw valid JSON string payload.`;

    const userPrompt = `Character Data Input Parameters:
Name: ${char.name}
Title/Subname: ${char.subname}
Rarity Code: ${char.rarity} (3=SSR, 4=UR, 5=LR)
Leader Skill Data: ${char.leader_skill || 'None'}
Passive Skill Data: Name: ${char.passive_skill_name || 'None'} | Description: ${char.passive_skill_description || 'None'}
Active Skill Data: Name: ${char.active_skill_name || 'None'} | Condition: ${char.active_skill_condition || 'None'} | Effect: ${char.active_skill_effect || 'None'}
Max Base Stats Matrix: HP: ${char.max_hp}, ATK: ${char.max_atk}, DEF: ${char.max_def}`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "X-Title": "Dokkan SaaS Analytics Engine"
        },
        body: JSON.stringify({
          model: "arcee-ai/trinity-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1
        })
      });

      const jsonRes = await response.json();
      
      if (jsonRes.error) {
        console.error("OpenRouter API Error Object Detected:", JSON.stringify(jsonRes.error, null, 2));
      }

      if (!jsonRes.choices || jsonRes.choices.length === 0) {
        throw new Error("Empty completion returned from OpenRouter API.");
      }

      let content = jsonRes.choices[0].message.content.trim();
      
      if (content.startsWith("```json")) {
        content = content.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (content.startsWith("```")) {
        content = content.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsedEval = JSON.parse(content);
      
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
      console.error(`Failed to complete evaluation sequence for ID ${char.id}:`, processError);
    }
    
    // Controlled throttling delay to maintain clean api limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

evaluateCharacters();
