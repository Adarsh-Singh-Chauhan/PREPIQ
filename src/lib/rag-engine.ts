// RAG Engine — Retrieval Augmented Generation for PrepIQ
// Implements document chunking, TF-IDF vectorization, cosine similarity scoring

export interface ResumeData {
  rawText: string;
  skills: string[];
  experience: string[];
  education: string[];
  projects: string[];
  certifications: string[];
  role: string;
}

export interface SimilarityResult {
  score: number; // 0-100
  matchedKeywords: string[];
  missedKeywords: string[];
  verdict: "excellent" | "good" | "average" | "poor";
}

// ── TF-IDF Vectorizer ──
function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  tokens.forEach(t => tf.set(t, (tf.get(t) || 0) + 1));
  const total = tokens.length || 1;
  tf.forEach((v, k) => tf.set(k, v / total));
  return tf;
}

function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0, magA = 0, magB = 0;
  const allKeys = new Set([...vecA.keys(), ...vecB.keys()]);
  allKeys.forEach(key => {
    const a = vecA.get(key) || 0;
    const b = vecB.get(key) || 0;
    dotProduct += a * b;
    magA += a * a;
    magB += b * b;
  });
  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude === 0 ? 0 : dotProduct / magnitude;
}

// ── Semantic Similarity Scoring ──
export function computeSemanticSimilarity(
  candidateAnswer: string,
  idealAnswer: string,
  questionKeywords: string[]
): SimilarityResult {
  const candidateTokens = tokenize(candidateAnswer);
  const idealTokens = tokenize(idealAnswer);

  const candidateTF = termFrequency(candidateTokens);
  const idealTF = termFrequency(idealTokens);

  const rawScore = cosineSimilarity(candidateTF, idealTF);

  // Keyword matching boost
  const lowerAnswer = candidateAnswer.toLowerCase();
  const matchedKeywords = questionKeywords.filter(kw => lowerAnswer.includes(kw.toLowerCase()));
  const missedKeywords = questionKeywords.filter(kw => !lowerAnswer.includes(kw.toLowerCase()));

  const keywordBonus = questionKeywords.length > 0
    ? (matchedKeywords.length / questionKeywords.length) * 30
    : 0;

  // Length penalty — too short answers get penalized
  const lengthRatio = Math.min(candidateTokens.length / Math.max(idealTokens.length, 1), 1.5);
  const lengthFactor = lengthRatio < 0.3 ? 0.5 : lengthRatio > 1.2 ? 0.95 : 1;

  const finalScore = Math.min(100, Math.round((rawScore * 70 + keywordBonus) * lengthFactor));

  let verdict: SimilarityResult["verdict"];
  if (finalScore >= 80) verdict = "excellent";
  else if (finalScore >= 60) verdict = "good";
  else if (finalScore >= 40) verdict = "average";
  else verdict = "poor";

  return { score: finalScore, matchedKeywords, missedKeywords, verdict };
}

// ── Resume Parser (RAG Document Extraction) ──
export function parseResumeText(text: string): ResumeData {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const skillPatterns = /\b(python|java|javascript|typescript|react|angular|vue|node|express|django|flask|spring|sql|nosql|mongodb|postgresql|mysql|redis|docker|kubernetes|aws|azure|gcp|git|linux|html|css|c\+\+|c#|rust|go|swift|kotlin|tensorflow|pytorch|scikit|pandas|numpy|machine learning|deep learning|nlp|computer vision|data science|hadoop|spark|kafka|graphql|rest api|microservices|agile|scrum|devops|ci\/cd|jenkins|terraform|ansible)\b/gi;

  const foundSkills = new Set<string>();
  text.match(skillPatterns)?.forEach(s => foundSkills.add(s.toLowerCase()));

  const experience: string[] = [];
  const education: string[] = [];
  const projects: string[] = [];
  const certifications: string[] = [];

  let currentSection = '';
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('experience') || lower.includes('work')) currentSection = 'exp';
    else if (lower.includes('education') || lower.includes('academic')) currentSection = 'edu';
    else if (lower.includes('project')) currentSection = 'proj';
    else if (lower.includes('certif') || lower.includes('course')) currentSection = 'cert';
    else {
      if (currentSection === 'exp' && line.length > 10) experience.push(line);
      if (currentSection === 'edu' && line.length > 10) education.push(line);
      if (currentSection === 'proj' && line.length > 10) projects.push(line);
      if (currentSection === 'cert' && line.length > 10) certifications.push(line);
    }
  }

  // Detect role from resume context
  const rolePatterns = ['software engineer', 'data scientist', 'frontend', 'backend', 'full stack', 'devops', 'ml engineer', 'data analyst'];
  const detectedRole = rolePatterns.find(r => text.toLowerCase().includes(r)) || 'software engineer';

  return {
    rawText: text,
    skills: [...foundSkills],
    experience,
    education,
    projects,
    certifications,
    role: detectedRole,
  };
}

// ── RAG Context Builder ──
export function buildRAGContext(resumeData: ResumeData, domain: string): string {
  const ctx = [
    `CANDIDATE PROFILE (from Resume):`,
    `- Target Role: ${resumeData.role}`,
    `- Skills: ${resumeData.skills.join(', ') || 'Not specified'}`,
    `- Experience: ${resumeData.experience.slice(0, 3).join('; ') || 'Fresher'}`,
    `- Education: ${resumeData.education.slice(0, 2).join('; ') || 'Not specified'}`,
    `- Projects: ${resumeData.projects.slice(0, 3).join('; ') || 'None listed'}`,
    `- Certifications: ${resumeData.certifications.slice(0, 3).join('; ') || 'None listed'}`,
    ``,
    `INTERVIEW DOMAIN: ${domain}`,
    `Generate questions that are relevant to the candidate's skills and role.`,
    `For technical questions, focus on skills they claim to have.`,
    `For HR questions, reference their experience and projects.`,
  ];
  return ctx.join('\n');
}

// ── ML/DL Confidence Scoring Model (lightweight client-side) ──
export function mlConfidenceScore(params: {
  answerLength: number;
  keywordHits: number;
  totalKeywords: number;
  responseTimeSec: number;
  semanticScore: number;
}): { confidence: number; factors: { name: string; value: number; weight: number }[] } {
  // Simple neural-network-inspired weighted scoring
  const weights = {
    contentDepth: 0.30,
    keywordCoverage: 0.25,
    semanticMatch: 0.30,
    responseTime: 0.15,
  };

  // Sigmoid-like activation for answer length (sweet spot 50-300 words)
  const wordCount = params.answerLength;
  const contentDepth = Math.min(100, (1 / (1 + Math.exp(-0.02 * (wordCount - 50)))) * 100);

  // Keyword coverage
  const keywordCoverage = params.totalKeywords > 0
    ? (params.keywordHits / params.totalKeywords) * 100
    : 50;

  // Time factor — penalize very fast (< 10s) or very slow (> 300s) answers
  const timeFactor = params.responseTimeSec < 10 ? 40
    : params.responseTimeSec > 300 ? 60
    : 80 + Math.min(20, (params.responseTimeSec - 10) / 15);

  const confidence = Math.round(
    contentDepth * weights.contentDepth +
    keywordCoverage * weights.keywordCoverage +
    params.semanticScore * weights.semanticMatch +
    timeFactor * weights.responseTime
  );

  return {
    confidence: Math.min(100, Math.max(0, confidence)),
    factors: [
      { name: "Content Depth", value: Math.round(contentDepth), weight: weights.contentDepth },
      { name: "Keyword Coverage", value: Math.round(keywordCoverage), weight: weights.keywordCoverage },
      { name: "Semantic Match", value: params.semanticScore, weight: weights.semanticMatch },
      { name: "Response Time", value: Math.round(timeFactor), weight: weights.responseTime },
    ],
  };
}
