/**
 * interview-analysis.ts — AI-powered interview analysis
 * Calls the backend API route which uses Gemini to analyze transcripts.
 */

export interface InterviewAnalysis {
  communication_score: number;
  confidence_score: number;
  technical_score: number;
  overall_score: number;
  strengths: string[];
  weaknesses: string[];
  improvement_suggestions: string[];
  summary: string;
  question_breakdown: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
}

/**
 * Analyze an interview transcript using the backend Gemini API
 */
export async function analyzeInterview(
  transcript: string,
  domain: string,
  difficulty: string,
  candidateName: string
): Promise<{ success: boolean; analysis?: InterviewAnalysis; error?: string }> {
  try {
    const response = await fetch('/api/analyze-interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript,
        domain,
        difficulty,
        candidateName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Analysis failed (${response.status})`);
    }

    const data = await response.json();
    return { success: true, analysis: data.analysis };
  } catch (err: any) {
    console.error('[Analysis] Error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Build a structured transcript string from question results
 */
export function buildTranscript(
  questionResults: { question: string; answer: string; llmScore: number; verdict: string; feedback: string }[]
): string {
  return questionResults
    .map((r, i) => `Q${i + 1}: ${r.question}\nAnswer: ${r.answer}\nScore: ${r.llmScore}/100 — ${r.verdict}\nFeedback: ${r.feedback}`)
    .join('\n\n---\n\n');
}
