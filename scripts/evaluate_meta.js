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
  console.log("Fetching unevaluated characters from Supabase matrix...");
  
  // Fetches a batch of 10 characters per workflow run to respect OpenRouter rate limits cleanly
  const { data: characters, error } = await supabase
    .from('dokkan_characters')
    .select('*')
    .is('meta_evaluation', null)
    .limit(10);

  if (error) {
    console.error("Error connecting to Supabase database:", error);
    process.exit(1);
  }

  if (!characters || characters.length === 0) {
    console.log("All current catalog assets are fully evaluated! No actions required.");
    return;
  }

  console.log(`Processing batch pipeline for ${characters.length} character(s).`);

  for (const char of characters) {
    console.log(`Analyzing: ${char.name} (${char.subname || 'No Title'}) [ID: ${char.id}]`);
    
    const systemPrompt = `You are an elite Dragon Ball Z Dokkan Battle analytics engine specialized in the current June 2026 meta framework. Analyze the raw character data metrics provided. Evaluate them strictly multi-dimensionally: 
1D (Raw Offensive Damage Potential), 
2D (Defensive durability metrics via Damage Reduction percentages, All-Guard passives, or high raw Defense values), 
3D (Leader Skill optimization, prioritizing modern 200% leads and heavily penalizing obsolete sub-170% builds), 
4D (Intangibles like Giant Form turn-stalling mechanics, ghost-usher delays, supportive rotation buffs, and core strategic linking synergy with top-tier meta units like Tanabata LR Beast Gohan or modern LRs).

You must strictly return a minified, valid JSON object with exactly the following keys:
- tier: String (Must strictly be one of: "Z+", "S", "A", "B", "F")
- viability: String (A short meta classification, e.g., "Meta-Defining Dominator", "Top Tier Core Piece", "Viable Counter-Pick")
- slot: String (Must strictly be one of: "Slot 1", "Slot 2", "Floater")
- verdict: String (A deep, technical text meta analysis in English outlining their exact value and performance parameters)
- pros: Array of Strings (Core functional strengths)
- cons: Array of Strings (Key mathematical or situational limitations)

Do not wrap the output in markdown backticks, markdown code blocks, or include introductory/concluding text. Return ONLY the raw valid JSON string.`;

    const userPrompt = `Character Data Input:
Name: ${char.name}
Title/Subname: ${char.subname}
Rarity Code: ${char.rarity} (3=SSR, 4=UR, 5=LR)
Leader Skill: ${char.leader_skill || 'None'}
Passive Skill: Name: ${char.passive_skill_name || 'None'} | Description: ${char.passive_skill_description || 'None'}
Active Skill: Name: ${char.active_skill_name || 'None'} | Condition: ${char.active_skill_condition || 'None'} | Effect: ${char.active_skill_effect || 'None'}
Max Base Stats: HP: ${char.max_hp}, ATK: ${char.max_atk}, DEF: ${char.max_def}`;

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openrouterKey}`,
          "Content-Type": "application/json",
          "X-Title": "Dokkan SaaS Analytics Engine"
        },
        body: JSON.stringify({
          model: "xiaomi/mimo-v2.5", // Switched to Xiaomi Mimo per user request
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.1
        })
      });

      const jsonRes = await response.json();
      
      // New Error Inspection Feature: Logs official API rejections out directly
      if (jsonRes.error) {
        console.error("OpenRouter API Error Object Detected:", JSON.stringify(jsonRes.error, null, 2));
      }

      if (!jsonRes.choices || jsonRes.choices.length === 0) {
        throw new Error("Empty completion returned from OpenRouter API.");
      }

      let content = jsonRes.choices[0].message.content.trim();
      
      // Sanitization fallback in case the LLM disregards formatting rules and appends markdown wraps
      if (content.startsWith("```json")) {
        content = content.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (content.startsWith("```")) {
        content = content.replace(/^```/, "").replace(/```$/, "").trim();
      }

      // Validates structural integrity before database write
      const parsedEval = JSON.parse(content);
      
      const { error: updateError } = await supabase
        .from('dokkan_characters')
        .update({ meta_evaluation: parsedEval })
        .eq('id', char.id);

      if (updateError) {
        console.error(`Database commit failed for ID ${char.id}:`, updateError);
      } else {
        console.log(`Successfully stored evaluation parameters for ${char.name} [Tier: ${parsedEval.tier}]`);
      }

    } catch (processError) {
      console.error(`Failed to complete evaluation sequence for ID ${char.id}:`, processError);
    }
    
    // Controlled throttling delay to maintain clean api limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

evaluateCharacters();
