/**
 * POST /api/send-report
 * Generates a PDF report and sends it via Resend email.
 * - Generates PDF with jsPDF (server-side)
 * - Sends email with PDF attachment + signed recording link
 * - All API keys are server-side only
 */

import { NextRequest, NextResponse } from 'next/server';
import { generatePDFReport, type ReportData } from '@/services/pdf-report';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_VP34QqRt_AgKHBia7CjAUJRTiQMd68ocM';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      candidateName,
      email,
      interviewDate,
      domain,
      difficulty,
      communicationScore,
      confidenceScore,
      technicalScore,
      overallScore,
      strengths,
      weaknesses,
      suggestions,
      summary,
      questionBreakdown,
      recordingUrl,
    } = body;

    // Validate required fields
    if (!candidateName || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    if (!RESEND_API_KEY || RESEND_API_KEY.includes('YOUR_') || RESEND_API_KEY.length < 10) {
      console.warn('[SendReport] Resend API key not configured — skipping email delivery');
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'Analysis complete! Email delivery is not configured yet.'
      });
    }

    // Generate PDF report
    console.log('[SendReport] Generating PDF...');
    const reportData: ReportData = {
      candidateName,
      email,
      interviewDate: interviewDate || new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      domain: domain || 'General',
      difficulty: difficulty || 'Intermediate',
      communicationScore: communicationScore || 0,
      confidenceScore: confidenceScore || 0,
      technicalScore: technicalScore || 0,
      overallScore: overallScore || 0,
      strengths: strengths || [],
      weaknesses: weaknesses || [],
      suggestions: suggestions || [],
      summary: summary || 'No summary available.',
      questionBreakdown: questionBreakdown || [],
    };

    const pdfBase64 = await generatePDFReport(reportData);
    console.log('[SendReport] ✅ PDF generated');

    // Build email HTML
    const scoreColor = overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#fbbf24' : '#ef4444';

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0f0f19;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f19;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#1a1a2e;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
        
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#8b5cf6 0%,#6366f1 100%);padding:32px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:800;">Prep<span style="opacity:0.9;">IQ</span></h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">AI Interview Analysis Report</p>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:32px 32px 16px;">
          <h2 style="color:#fff;margin:0 0 8px;font-size:20px;">Hi ${candidateName} 👋</h2>
          <p style="color:#a0a0b8;margin:0;font-size:14px;line-height:1.6;">
            Your AI interview analysis is ready! Here's a summary of how you performed.
          </p>
        </td></tr>

        <!-- Overall Score -->
        <tr><td style="padding:16px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f19;border-radius:12px;border:1px solid rgba(255,255,255,0.05);">
            <tr><td style="padding:24px;text-align:center;">
              <p style="color:#a0a0b8;margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:2px;">Overall Score</p>
              <p style="color:${scoreColor};margin:0;font-size:48px;font-weight:900;">${overallScore}<span style="font-size:20px;color:#666;">/100</span></p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Score Breakdown -->
        <tr><td style="padding:16px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:8px;text-align:center;width:33%;"><p style="color:#a0a0b8;font-size:11px;margin:0;">Communication</p><p style="color:#8b5cf6;font-size:24px;font-weight:700;margin:4px 0;">${communicationScore}%</p></td>
              <td style="padding:8px;text-align:center;width:33%;"><p style="color:#a0a0b8;font-size:11px;margin:0;">Confidence</p><p style="color:#06b6d4;font-size:24px;font-weight:700;margin:4px 0;">${confidenceScore}%</p></td>
              <td style="padding:8px;text-align:center;width:33%;"><p style="color:#a0a0b8;font-size:11px;margin:0;">Technical</p><p style="color:#22c55e;font-size:24px;font-weight:700;margin:4px 0;">${technicalScore}%</p></td>
            </tr>
          </table>
        </td></tr>

        <!-- Summary -->
        <tr><td style="padding:16px 32px;">
          <div style="background:#0f0f19;border-radius:12px;padding:20px;border-left:4px solid #8b5cf6;">
            <p style="color:#8b5cf6;font-size:11px;text-transform:uppercase;letter-spacing:2px;margin:0 0 8px;">Summary</p>
            <p style="color:#d0d0e0;font-size:14px;line-height:1.6;margin:0;">${summary}</p>
          </div>
        </td></tr>

        <!-- Strengths -->
        ${strengths && strengths.length > 0 ? `
        <tr><td style="padding:16px 32px;">
          <p style="color:#22c55e;font-size:13px;font-weight:700;margin:0 0 8px;">💪 Strengths</p>
          ${strengths.map((s: string) => `<p style="color:#b0c4b0;font-size:13px;margin:4px 0;padding-left:16px;">✓ ${s}</p>`).join('')}
        </td></tr>` : ''}

        <!-- Weaknesses -->
        ${weaknesses && weaknesses.length > 0 ? `
        <tr><td style="padding:16px 32px;">
          <p style="color:#fbbf24;font-size:13px;font-weight:700;margin:0 0 8px;">⚠️ Areas to Improve</p>
          ${weaknesses.map((w: string) => `<p style="color:#d4c490;font-size:13px;margin:4px 0;padding-left:16px;">• ${w}</p>`).join('')}
        </td></tr>` : ''}

        <!-- Recording Link -->
        ${recordingUrl ? `
        <tr><td style="padding:16px 32px;">
          <a href="${recordingUrl}" style="display:block;background:#0f0f19;border:1px solid rgba(139,92,246,0.3);border-radius:12px;padding:16px;text-decoration:none;text-align:center;">
            <p style="color:#8b5cf6;font-size:13px;font-weight:600;margin:0;">🎥 Watch Your Interview Recording</p>
            <p style="color:#666;font-size:11px;margin:4px 0 0;">Secure link • Expires in 24 hours</p>
          </a>
        </td></tr>` : ''}

        <!-- Footer -->
        <tr><td style="padding:24px 32px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
          <p style="color:#666;font-size:11px;margin:0;">
            PDF report is attached below. Keep practicing with PrepIQ! 🚀
          </p>
          <p style="color:#444;font-size:10px;margin:8px 0 0;">
            © ${new Date().getFullYear()} PrepIQ — AI Interview Coach & Career Planner
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send email via Resend
    console.log('[SendReport] Sending email via Resend to:', email);

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'PrepIQ <onboarding@resend.dev>',
        to: [email],
        subject: 'Your PrepIQ Interview Analysis Report',
        html: emailHtml,
        attachments: [
          {
            filename: `PrepIQ_Report_${candidateName.replace(/\s+/g, '_')}.pdf`,
            content: pdfBase64,
            content_type: 'application/pdf',
          },
        ],
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json().catch(() => ({ message: 'Unknown email error' }));
      const errorMsg = errorData.message || errorData.error || 'Email delivery failed';
      console.warn('[SendReport] Resend error:', errorMsg);

      // Detect Resend free-tier domain restriction
      if (errorMsg.includes('verify a domain') || errorMsg.includes('not verified') || resendResponse.status === 403) {
        return NextResponse.json({
          success: true,
          skipped: true,
          domainError: true,
          message: `Analysis complete! Email could not be sent because Resend requires a verified domain to send to ${email}. On the free tier, emails can only be sent to your Resend account email.`,
        });
      }

      return NextResponse.json({
        success: true,
        skipped: true,
        message: `Analysis complete! Email delivery failed: ${errorMsg}`,
      });
    }

    const resendData = await resendResponse.json();
    console.log('[SendReport] ✅ Email sent:', resendData);

    return NextResponse.json({
      success: true,
      emailId: resendData.id,
      message: `Report sent to ${email}`
    });

  } catch (err: any) {
    console.error('[SendReport] Error:', err);
    return NextResponse.json({
      success: true,
      skipped: true,
      message: `Analysis complete! Email could not be sent: ${err.message || 'Unknown error'}`,
    });
  }
}
