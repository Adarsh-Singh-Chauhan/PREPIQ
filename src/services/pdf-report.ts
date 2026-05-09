/**
 * pdf-report.ts — Generate professional interview PDF reports
 * Uses jsPDF for server-compatible PDF generation.
 * Called from the send-report API route.
 */

// This module is used in the API route (server-side)
// It generates a PDF buffer that can be attached to emails

export interface ReportData {
  candidateName: string;
  email: string;
  interviewDate: string;
  domain: string;
  difficulty: string;
  communicationScore: number;
  confidenceScore: number;
  technicalScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  summary: string;
  questionBreakdown: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
}

/**
 * Generate PDF report as base64 string
 * Uses jsPDF — must be called on server side
 */
export async function generatePDFReport(data: ReportData): Promise<string> {
  // Dynamic import to avoid bundling issues
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 20;

  // Helper functions
  const addText = (text: string, size: number, color: [number, number, number] = [255, 255, 255], bold = false) => {
    doc.setFontSize(size);
    doc.setTextColor(...color);
    if (bold) doc.setFont('helvetica', 'bold');
    else doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.5) + 4;
  };

  const checkPage = (needed: number) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 20;
    }
  };

  const drawScoreBar = (label: string, score: number, x: number, barY: number) => {
    doc.setFontSize(9);
    doc.setTextColor(180, 180, 180);
    doc.text(label, x, barY);
    
    // Background bar
    doc.setFillColor(40, 40, 60);
    doc.roundedRect(x, barY + 2, 70, 6, 3, 3, 'F');
    
    // Score bar
    const barColor: [number, number, number] = score >= 80 ? [34, 197, 94] : score >= 60 ? [251, 191, 36] : [239, 68, 68];
    doc.setFillColor(...barColor);
    doc.roundedRect(x, barY + 2, (score / 100) * 70, 6, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(...barColor);
    doc.text(`${score}%`, x + 74, barY + 7);
  };

  // === Dark background ===
  doc.setFillColor(15, 15, 25);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

  // === Header ===
  doc.setFillColor(25, 25, 45);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Accent line
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 0, pageWidth, 3, 'F');

  y = 15;
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PrepIQ', margin, y);
  doc.setFontSize(10);
  doc.setTextColor(139, 92, 246);
  doc.text('Interview Analysis Report', margin + 50, y);

  y = 28;
  doc.setFontSize(10);
  doc.setTextColor(160, 160, 180);
  doc.text(`Candidate: ${data.candidateName}`, margin, y);
  doc.text(`Date: ${data.interviewDate}`, pageWidth - margin - 60, y);
  y = 36;
  doc.text(`Domain: ${data.domain} | Difficulty: ${data.difficulty}`, margin, y);

  // === Overall Score ===
  y = 55;
  checkPage(40);
  doc.setFillColor(25, 25, 50);
  doc.roundedRect(margin, y - 5, contentWidth, 35, 5, 5, 'F');
  doc.setFillColor(139, 92, 246);
  doc.roundedRect(margin, y - 5, 4, 35, 2, 2, 'F');

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Performance', margin + 12, y + 5);

  const scoreColor: [number, number, number] = data.overallScore >= 80 ? [34, 197, 94] : data.overallScore >= 60 ? [251, 191, 36] : [239, 68, 68];
  doc.setFontSize(28);
  doc.setTextColor(...scoreColor);
  doc.text(`${data.overallScore}`, pageWidth - margin - 30, y + 10);
  doc.setFontSize(12);
  doc.text('/100', pageWidth - margin - 10, y + 10);

  y += 40;

  // === Score Breakdown ===
  checkPage(50);
  doc.setFillColor(20, 20, 40);
  doc.roundedRect(margin, y - 5, contentWidth, 45, 5, 5, 'F');
  
  drawScoreBar('Communication', data.communicationScore, margin + 5, y);
  drawScoreBar('Confidence', data.confidenceScore, margin + 5, y + 14);
  drawScoreBar('Technical', data.technicalScore, margin + 5, y + 28);

  y += 55;

  // === Summary ===
  checkPage(30);
  addText('Executive Summary', 14, [255, 255, 255], true);
  y += 2;
  addText(data.summary, 10, [200, 200, 210]);
  y += 5;

  // === Strengths ===
  checkPage(30);
  addText('💪 Key Strengths', 13, [34, 197, 94], true);
  data.strengths.forEach(s => {
    checkPage(10);
    addText(`  ✓ ${s}`, 10, [180, 220, 180]);
  });
  y += 5;

  // === Weaknesses ===
  checkPage(30);
  addText('⚠️ Areas for Improvement', 13, [251, 191, 36], true);
  data.weaknesses.forEach(w => {
    checkPage(10);
    addText(`  • ${w}`, 10, [220, 200, 150]);
  });
  y += 5;

  // === Suggestions ===
  checkPage(30);
  addText('🎯 AI Improvement Suggestions', 13, [139, 92, 246], true);
  data.suggestions.forEach((s, i) => {
    checkPage(10);
    addText(`  ${i + 1}. ${s}`, 10, [200, 190, 230]);
  });
  y += 5;

  // === Question Breakdown ===
  if (data.questionBreakdown.length > 0) {
    doc.addPage();
    doc.setFillColor(15, 15, 25);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');
    y = 20;

    addText('Question-by-Question Breakdown', 16, [255, 255, 255], true);
    y += 5;

    data.questionBreakdown.forEach((q, i) => {
      checkPage(45);

      doc.setFillColor(25, 25, 45);
      doc.roundedRect(margin, y - 3, contentWidth, 38, 4, 4, 'F');

      const qColor: [number, number, number] = q.score >= 80 ? [34, 197, 94] : q.score >= 60 ? [251, 191, 36] : [239, 68, 68];
      doc.setFillColor(...qColor);
      doc.roundedRect(margin, y - 3, 3, 38, 1.5, 1.5, 'F');

      doc.setFontSize(10);
      doc.setTextColor(139, 92, 246);
      doc.setFont('helvetica', 'bold');
      doc.text(`Q${i + 1}`, margin + 6, y + 3);

      doc.setFontSize(9);
      doc.setTextColor(...qColor);
      doc.text(`${q.score}/100`, pageWidth - margin - 15, y + 3);

      const qLines = doc.splitTextToSize(q.question, contentWidth - 30);
      doc.setTextColor(230, 230, 240);
      doc.setFont('helvetica', 'normal');
      doc.text(qLines.slice(0, 1), margin + 18, y + 3);

      const aLines = doc.splitTextToSize(`Answer: ${q.answer.slice(0, 100)}...`, contentWidth - 15);
      doc.setTextColor(170, 170, 185);
      doc.setFontSize(8);
      doc.text(aLines.slice(0, 2), margin + 6, y + 14);

      const fLines = doc.splitTextToSize(`Feedback: ${q.feedback}`, contentWidth - 15);
      doc.setTextColor(139, 92, 246);
      doc.text(fLines.slice(0, 1), margin + 6, y + 28);

      y += 44;
    });
  }

  // === Footer ===
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(25, 25, 45);
    doc.rect(0, 285, pageWidth, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 140);
    doc.text('PrepIQ — AI Interview Coach & Career Planner', margin, 292);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 20, 292);
  }

  // Return as base64
  return doc.output('datauristring').split(',')[1];
}
