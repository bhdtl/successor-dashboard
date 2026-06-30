// Pseudocode für dein Skript
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

async function runEvaluation() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
  
  // Hole alle Chars ohne Bewertung
  const { data: characters } = await supabase.from('dokkan_characters').select('*').is('meta_evaluation', null);
  
  for (const char of characters) {
    const aiResponse = await callOpenRouter(char); // Hier geht der Prompt hin
    await supabase.from('dokkan_characters').update({ meta_evaluation: aiResponse }).eq('id', char.id);
  }
}
