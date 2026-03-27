const GEMINI_KEY = process.env.GEMINI_KEY_1;

async function handleGeminiRequest(reviewArr) {
  if (!reviewArr || reviewArr.length === 0) {
      throw new Error("No reviews found to summarize.");
  }

  if (!GEMINI_KEY) {
      console.error("FATAL: GEMINI_KEY is undefined. Check your .env file!");
      throw new Error("Server configuration error: Missing API Key.");
  }

  const prompt = `Summarize these reviews in 150 words or less and Be concise, accurate, and include both pros and cons:\n${reviewArr.join('\n')}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );

    if (!res.ok) {
        const errorDetails = await res.text(); // Grab the error body from Google
        console.error("Google API Error Details:", errorDetails);
        throw new Error(`Gemini API Error: ${res.status} - Check backend terminal for details.`);
    }

    const data = await res.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!answer) {
        throw new Error("Gemini returned an empty response.");
    }

    return answer; 

  } catch (err) {
    console.error('[Backend Gemini Helper] Error:', err.message);
    throw err;
  }
}

module.exports = handleGeminiRequest;