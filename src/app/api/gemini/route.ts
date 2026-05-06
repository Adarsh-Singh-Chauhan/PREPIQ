import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Return a simulated response when no API key is configured
      return NextResponse.json({ text: getSimulatedResponse(prompt) });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ text: getSimulatedResponse(prompt) });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('Error in Gemini API route:', error);
    return NextResponse.json({ text: getSimulatedResponse('') });
  }
}

// Comprehensive simulated responses for demo mode
function getSimulatedResponse(prompt: string): string {
  let userQuery = prompt;
  
  // Isolate the user's actual question from the system context
  if (prompt.includes('Student:')) {
    const parts = prompt.split('Student:');
    userQuery = parts[parts.length - 1].replace('Sage:', '').trim();
  } else if (prompt.includes('Candidate Answer:') || prompt.includes('Evaluate the answer')) {
    userQuery = 'evaluation_request';
  }

  const lowerPrompt = userQuery.toLowerCase();

  let candidateAnswer = "";
  if (prompt.includes('Candidate Answer:')) {
    candidateAnswer = prompt.split('Candidate Answer:')[1].split('Evaluate')[0].trim();
  }

  // ── Evaluation/Scoring Requests ──
  if (lowerPrompt === 'evaluation_request' || lowerPrompt.includes('score') || lowerPrompt.includes('evaluate')) {
    
    // Smart Dynamic Evaluation for Demo Mode
    if (candidateAnswer && candidateAnswer.length < 15) {
      return `SCORE: ${Math.floor(10 + Math.random() * 15)}\nFEEDBACK: Your answer is too short and incorrect. You need to provide a detailed explanation addressing the core concepts.`;
    } else if (candidateAnswer && (candidateAnswer.toLowerCase().includes('don\'t know') || candidateAnswer.toLowerCase().includes('no idea'))) {
      return `SCORE: 0\nFEEDBACK: It is okay to not know, but try to talk about what you DO know related to the topic instead of giving up immediately.`;
    }

    const score = Math.floor(65 + Math.random() * 30);
    const feedbacks = [
      'Good understanding, but could include more specific examples and edge cases.',
      'Solid answer with clear structure. Consider adding complexity analysis for a stronger response.',
      'Great explanation! Try to mention alternative approaches for a more complete answer.',
      'Well articulated. Adding real-world applications would make it stand out in an interview.',
      'Decent attempt. Focus on being more precise with technical terminology.',
    ];
    return `SCORE: ${score}\nFEEDBACK: ${feedbacks[Math.floor(Math.random() * feedbacks.length)]}`;
  }

  // ── Interview Questions by Domain ──
  if (lowerPrompt.includes('dsa') || lowerPrompt.includes('data structure') || lowerPrompt.includes('algorithm') || lowerPrompt.includes('technical')) {
    const questions = [
      'Explain the difference between a stack and a queue. Provide a real-world use case for each data structure.',
      'What is the time complexity of searching in a balanced BST vs an unbalanced BST? Why does balancing matter?',
      'Describe how you would detect a cycle in a linked list. What algorithm would you use and what is its time complexity?',
      'Explain Dynamic Programming. How does memoization differ from tabulation? Give an example of each approach.',
      'What is a hash collision? Explain two methods to resolve it (chaining vs open addressing) with their trade-offs.',
      'How would you find the Kth largest element in an unsorted array? Discuss multiple approaches with their complexities.',
      'Explain BFS vs DFS. When would you prefer one over the other? Give a practical use case for each.',
      'What is the difference between merge sort and quick sort? Compare their best/worst/average case complexities.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('python')) {
    const questions = [
      'What are Python decorators? Explain with a practical example of a timing decorator that measures function execution time.',
      'Explain the difference between a list and a tuple in Python. When would you use each? What about memory implications?',
      'What is the Global Interpreter Lock (GIL) in Python? How does it affect multithreading? What are the alternatives?',
      'Explain list comprehensions vs generator expressions. When should you prefer one over the other? Demonstrate with code.',
      'What are *args and **kwargs in Python? How do they work with function signatures? Provide a practical example.',
      'Explain Python\'s garbage collection mechanism. How does reference counting work alongside the cyclic garbage collector?',
      'What are context managers in Python? Explain the `with` statement and how to create a custom context manager.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('java')) {
    const questions = [
      'Explain the difference between an abstract class and an interface in Java 17+. When would you use each?',
      'What is the Java Collections Framework? Compare ArrayList vs LinkedList in terms of time complexity for common operations.',
      'Explain garbage collection in Java. What are the different GC algorithms (G1, ZGC, Shenandoah) and when to use each?',
      'What are Java Streams? How do they differ from traditional loops? Demonstrate with a practical data processing example.',
      'Explain multithreading in Java. Compare extending Thread vs implementing Runnable vs using ExecutorService.',
      'What are Java Generics? Explain type erasure and bounded type parameters with practical examples.',
      'Explain the SOLID principles with Java examples. How do they improve code maintainability?',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('system design')) {
    const questions = [
      'How would you design a URL shortener like bit.ly? Discuss the database schema, hashing strategy, and API design.',
      'Design a real-time chat application like WhatsApp. What technologies, protocols, and architecture patterns would you use?',
      'How would you design a rate limiter? Discuss different algorithms like token bucket, leaky bucket, and sliding window.',
      'Explain how you would design a notification system that handles millions of users with different channels (push, email, SMS).',
      'Design a file storage service like Google Drive. How would you handle uploads, storage, sharing, and concurrent edits?',
      'How would you design a social media news feed? Discuss pull vs push models and ranking algorithms.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('soft skill') || lowerPrompt.includes('hr') || lowerPrompt.includes('behavioural') || lowerPrompt.includes('behavioral')) {
    const questions = [
      'Tell me about a time when you had to work with a difficult team member. How did you handle the situation and what was the outcome?',
      'Describe a situation where you had to meet a tight deadline. What was your approach and what did you learn from it?',
      'What is your greatest strength and how has it helped you achieve results in your academic or professional life?',
      'Where do you see yourself in 5 years? How does this role align with your long-term career goals?',
      'Tell me about a project you are most proud of. What was your specific role, what challenges did you face, and what did you learn?',
      'Describe a time when you failed at something. How did you handle it and what did you learn from the experience?',
      'How do you prioritize tasks when you have multiple deadlines? Give a specific example from your experience.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  // ── Chatbot/Coach Responses ──
  if (lowerPrompt.includes('weak area') || lowerPrompt.includes('improve')) {
    return `Based on your recent sessions, here are your key areas for improvement:\n\n**1. System Design** — You haven't practiced this domain much yet. Start with HLD basics like load balancing and caching.\n\n**2. HR & Behavioral** — Your communication score has been improving (+12% this week!), but try using the STAR method more consistently.\n\n**3. Time Complexity Analysis** — In your last DSA session, you solved the problems correctly but missed discussing the complexity trade-offs.\n\n**Action plan:**\n• Complete 2 system design mock interviews this week\n• Practice 3 behavioral questions using STAR method\n• Add complexity analysis to every coding solution\n\nShall I give you a practice question in any of these areas? 🎯`;
  }

  if (lowerPrompt.includes('schedule') || lowerPrompt.includes('plan') || lowerPrompt.includes('study')) {
    return `Here's a recommended weekly study plan based on your Phase 1 progress (60% done):\n\n**Monday-Wednesday: Technical Deep Dive**\n• 1 hour DSA (LeetCode Medium problems)\n• 30 min concept revision\n• 1 mock interview session\n\n**Thursday-Friday: Communication & Soft Skills**\n• Practice behavioral questions (STAR method)\n• Record yourself answering and review\n• 1 HR mock interview\n\n**Saturday: System Design Intro**\n• Study 1 system design concept\n• Watch design walkthrough videos\n• Take notes and discuss with Sage\n\n**Sunday: Review & Rest**\n• Review the week's progress\n• Revisit weak areas\n• Light practice only\n\nYou're on track to finish Phase 1 in about 2 weeks! 🚀`;
  }

  if (lowerPrompt.includes('tip') || lowerPrompt.includes('advice')) {
    return `Here are my top interview tips for you, John:\n\n**Technical Interviews:**\n• Always clarify the problem before coding — ask about constraints, edge cases, and expected output\n• Think out loud — interviewers evaluate your thought process, not just the final answer\n• Start with a brute force approach, then optimize\n• Always discuss time and space complexity\n\n**HR Interviews:**\n• Use the **STAR method** (Situation, Task, Action, Result) for behavioral questions\n• Prepare 5-6 stories from your experience that can be adapted to different questions\n• Research the company thoroughly — know their products, values, and recent news\n• Ask thoughtful questions at the end\n\n**General:**\n• Practice under time pressure — set a timer for each question\n• Mock interviews are your best friend — do at least 2-3 per week\n• Sleep well before the interview — your brain needs rest to perform\n\nWant me to do a mock interview right now? 💪`;
  }

  // ── Default/General Response ──
  return `⚠️ **Demo Mode Active**\n\nYou asked: "${userQuery}"\n\nI am currently running in **Offline Demo Mode** because there is no API Key configured in your \`.env.local\` file. Therefore, I can only answer pre-scripted questions or evaluate interview answers.\n\n**To make me work exactly like real ChatGPT/Gemini and answer anything:**\n1. Get a free API Key from Google AI Studio.\n2. Add it to your \`.env.local\` as \`NEXT_PUBLIC_GEMINI_API_KEY=your_key_here\`.\n3. Restart the server.\n\nFor now, try clicking one of the suggestion chips above! 🎯`;
}
