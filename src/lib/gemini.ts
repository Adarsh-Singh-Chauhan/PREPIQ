// Gemini AI client with RAG support
export const generateAIResponse = async (
  prompt: string,
  options?: { resumeContext?: string; mode?: string }
): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        resumeContext: options?.resumeContext || '',
        mode: options?.mode || '',
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    return data.text || 'No response generated.';
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "Sorry, I'm having trouble connecting right now. Please try again.";
  }
};
