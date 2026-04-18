// Mock AI Service for Phase 5
// Simulates LLM analysis (auto-tagging and sentiment)

function extractTags(text) {
  if (!text) return [];
  const content = text.toLowerCase();
  const tags = new Set();

  const rules = {
    "Birthday": ["birthday", "bday", "cake", "party", "born"],
    "Confession": ["confess", "secret", "truth", "admit", "guilty", "sorry"],
    "Goals": ["goal", "plan", "future", "achieve", "success", "will be", "hope to"],
    "Love": ["love", "heart", "miss", "care", "together", "forever"],
    "Career": ["job", "work", "career", "promotion", "business", "company"],
    "Travel": ["travel", "trip", "vacation", "fly", "world", "country"],
  };

  for (const [tag, keywords] of Object.entries(rules)) {
    if (keywords.some(kw => content.includes(kw))) {
      tags.add(tag);
    }
  }

  // Fallback random tags if none matched to simulate AI finding latent topics
  if (tags.size === 0 && content.length > 20) {
    const fallbacks = ["Life", "Memories", "Reflections", "Personal"];
    tags.add(fallbacks[Math.floor(Math.random() * fallbacks.length)]);
  }

  return Array.from(tags);
}

function analyzeSentiment(text) {
  if (!text) return "Neutral";
  const content = text.toLowerCase();

  let scoreHappy = 0;
  let scoreNostalgic = 0;
  let scoreSerious = 0;

  const happyWords = ["happy", "joy", "excited", "great", "awesome", "love", "beautiful", "smile", "laugh"];
  const nostalgicWords = ["remember", "miss", "past", "used to", "memory", "nostalgia", "childhood", "back then"];
  const seriousWords = ["serious", "hard", "difficult", "pain", "sad", "secret", "confess", "important", "worry"];

  happyWords.forEach(w => { if (content.includes(w)) scoreHappy += 1; });
  nostalgicWords.forEach(w => { if (content.includes(w)) scoreNostalgic += 1; });
  seriousWords.forEach(w => { if (content.includes(w)) scoreSerious += 1; });

  const max = Math.max(scoreHappy, scoreNostalgic, scoreSerious);

  if (max === 0) return "Neutral";
  if (max === scoreHappy && max > scoreNostalgic && max > scoreSerious) return "Happy";
  if (max === scoreNostalgic && max > scoreHappy && max > scoreSerious) return "Nostalgic";
  if (max === scoreSerious) return "Serious";
  
  return "Mixed";
}

/**
 * Runs a simulated AI analysis on a batch of capsules.
 * Excludes encrypted capsules.
 * @param {Array} capsules - Array of capsule objects
 */
function runInsights(capsules) {
  const tagsCount = {};
  const sentimentCount = {
    Happy: 0,
    Nostalgic: 0,
    Serious: 0,
    Mixed: 0,
    Neutral: 0
  };

  // Only analyze unencrypted and unlocked capsules
  const unencrypted = capsules.filter(c => !c.isEncrypted && (c.status === "unlocked" || c.rule === "none"));

  unencrypted.forEach(c => {
    const text = c.text || "";
    
    // Sentiments
    const sentiment = analyzeSentiment(text);
    sentimentCount[sentiment]++;

    // Tags
    const tags = extractTags(text);
    tags.forEach(t => {
      tagsCount[t] = (tagsCount[t] || 0) + 1;
    });
  });

  // Sort tags by frequency
  const popularTags = Object.entries(tagsCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  return {
    analyzedCount: unencrypted.length,
    sentimentDistribution: sentimentCount,
    popularTags
  };
}

module.exports = {
  runInsights
};
