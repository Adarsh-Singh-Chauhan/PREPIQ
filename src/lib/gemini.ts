// Gemini AI client — calls our own API route to avoid needing @google/generative-ai SDK
export const generateAIResponse = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.text || 'No response generated.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Sorry, I'm having trouble connecting to my brain right now. Please try again.";
  }
};
