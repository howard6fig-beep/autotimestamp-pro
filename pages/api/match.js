export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { resume, jobDesc } = req.body;

  if (!resume || !jobDesc) {
    return res.status(400).json({ error: 'Please provide both resume and job description.' });
  }

  // Simple stop words list to filter out common words
  const stopWords = new Set(["a", "an", "the", "and", "or", "but", "is", "are", "on", "in", "at", "to", "for", "with", "of", "by", "your", "you", "will", "our", "we", "us", "it", "this", "that", "be", "as", "not", "they", "their", "can", "have", "do", "i", "me", "my"]);

  function getKeywords(text) {
    // Lowercase, remove punctuation, split by space
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
    // Filter out stop words and short words, return unique set
    const keywords = new Set();
    words.forEach(word => {
      if (word.length > 2 && !stopWords.has(word)) {
        keywords.add(word);
      }
    });
    return keywords;
  }

  try {
    const resumeKeywords = getKeywords(resume);
    const jobKeywords = getKeywords(jobDesc);

    let matchedCount = 0;
    let missingKeywords = [];

    // Compare job keywords against resume keywords
    jobKeywords.forEach(kw => {
      if (resumeKeywords.has(kw)) {
        matchedCount++;
      } else {
        missingKeywords.push(kw);
      }
    });

    const totalJobKeywords = jobKeywords.size;
    const matchPercentage = totalJobKeywords > 0 ? Math.round((matchedCount / totalJobKeywords) * 100) : 0;

    // Alphabetize the missing keywords for a cleaner report
    missingKeywords.sort();

    res.status(200).json({
      matchPercentage,
      missingKeywords
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to analyze resume.' });
  }
}
