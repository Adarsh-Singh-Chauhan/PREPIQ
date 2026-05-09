# PrepIQ 🚀

> **"Know where you're going. Practice until you get there."**

PrepIQ is a full-stack AI-powered career preparation platform for students. It combines mock interviews, performance analytics, career objective setting, personalised roadmaps, face-based identity, certificate validation, internship matching, smart scheduling, and a 24/7 AI coaching chatbot — all in one product.

## Features

- 🎯 **AI Mock Interviews** — Real-time video interviews with emotion detection & confidence scoring
- 🗺️ **Career Roadmap** — AI-generated personalised roadmap based on your career goal
- 📊 **Performance Analytics** — Detailed scorecards, radar charts, and AI-driven insights  
- 🤖 **Sage AI Coach** — 24/7 context-aware chatbot that knows your goals and progress
- 🛡️ **Certificate Validator** — OCR-powered AI verification of certificates
- 💼 **Internship Matching** — Skills-based matching with match % scores
- 📅 **Smart Timetable** — AI-generated study schedule based on weak areas
- 👤 **Face Login** — Secure face-based authentication with liveness detection

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **Backend**: Supabase (DB, Auth, Storage, Edge Functions)
- **AI**: Gemini 1.5 Pro, face-api.js, Web Speech API, Tesseract.js

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Mode

Click "Try Demo" on the landing page to explore all features with pre-loaded data. No account required!

## Implementation Path & Integration Status
- ✅ **Supabase Database Integration**: All user data including mock interview results, roadmaps, resume checker scores, and certificate validations are connected to Supabase live tables.
- ✅ **Row-Level Security (RLS)**: Bypassed correctly using the Supabase Service Role Key to enable smooth backend inserts without blocking the client.
- ✅ **AI Strict Evaluator**: Gemini AI prompt updated to strictly grade interviews. Incorrect answers are strictly given 0 marks.
- ✅ **Email Reporting API**: Fixed Resend API Key bug. Generates PDF scorecards and emails them to the user. *(Note: Ensure the email sent to is verified on your Resend free tier).*
- ✅ **Vercel Ready**: Project is completely ready to be deployed live on Vercel or Netlify.

## Deployment Guide (Live on Vercel)

Vercel is the best platform to host Next.js apps. Follow these exact steps to push your local code to GitHub and deploy it live.

### Step 1: Push to GitHub
Open your terminal and run these exact commands one by one to save and push your project:

\`\`\`bash
# 1. Add all files to staging
git add .

# 2. Commit the files with a message
git commit -m "feat: Finalize Supabase integration, AI strict grading, and email fixes"

# 3. Push to your main branch on GitHub
git push origin main
\`\`\`
*(If `git push origin main` fails, you might be on the `master` branch. Try `git push origin master` instead).*

### Step 2: Deploy to Vercel
1. Go to [Vercel.com](https://vercel.com/) and log in with your GitHub account.
2. Click **"Add New..."** -> **"Project"**.
3. You will see your GitHub repositories. Find **PREPIQ** and click **Import**.
4. In the **Configure Project** screen, scroll down to **Environment Variables**.
5. Copy all the variables from your local `.env.local` file and paste them into Vercel. You must add:
   - \`NEXT_PUBLIC_SUPABASE_URL\`
   - \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
   - \`SUPABASE_SERVICE_ROLE_KEY\`
   - \`NEXT_PUBLIC_GEMINI_API_KEY\`
   - \`RESEND_API_KEY\`
6. Click **Deploy**. Vercel will build the project and provide you with a live URL.

### Custom Domains on Vercel
To add a custom domain (like `prepiq.com`):
1. Go to your project dashboard on Vercel.
2. Click **Settings** -> **Domains**.
3. Type in your domain name and click **Add**.
4. Vercel will give you DNS records (usually an A Record and a CNAME). Copy these.
5. Go to your domain registrar (GoDaddy, Namecheap, Hostinger, etc.).
6. Open the DNS Settings for your domain and paste the records provided by Vercel.
7. Wait a few minutes (up to an hour) for Vercel to verify the domain and issue a free SSL certificate.

## License

MIT © PrepIQ 2026
