import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, resumeContext, mode } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

    // Build enhanced prompt with RAG context if provided
    let enhancedPrompt = prompt;
    if (resumeContext) {
      enhancedPrompt = `${resumeContext}\n\n${prompt}`;
    }

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({ text: getSimulatedResponse(prompt, mode) });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            temperature: mode === 'evaluation' ? 0.3 : 0.7,
            maxOutputTokens: mode === 'evaluation' ? 2048 : 1024,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', await response.text());
      return NextResponse.json({ text: getSimulatedResponse(prompt, mode) });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Error in Gemini API route:', error);
    return NextResponse.json({ text: getSimulatedResponse('', '') });
  }
}

function getSimulatedResponse(prompt: string, mode?: string): string {
  let userQuery = prompt;
  
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

  // ── Evaluation with detailed JSON response ──
  if (mode === 'evaluation' || lowerPrompt === 'evaluation_request' || lowerPrompt.includes('evaluate')) {
    if (candidateAnswer && candidateAnswer.length < 15) {
      return `SCORE: ${Math.floor(10 + Math.random() * 15)}\nVERDICT: poor\nFEEDBACK: Your answer is too short. Provide a detailed explanation with examples.\nIDEAL_ANSWER: A strong answer should cover the core concept definition, implementation details, time/space complexity, and real-world use cases.\nKEYWORDS: definition,implementation,complexity,example,use-case`;
    }
    if (candidateAnswer && (candidateAnswer.toLowerCase().includes("don't know") || candidateAnswer.toLowerCase().includes('no idea'))) {
      return `SCORE: 5\nVERDICT: poor\nFEEDBACK: Try to discuss what you DO know related to the topic instead of giving up.\nIDEAL_ANSWER: Even partial knowledge shows problem-solving mindset. Discuss related concepts you understand.\nKEYWORDS: partial-knowledge,related-concepts,approach`;
    }
    const score = Math.floor(55 + Math.random() * 40);
    const verdict = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'average' : 'poor';
    const feedbacks = [
      'Good understanding shown. Add specific examples and edge cases for a stronger answer.',
      'Solid answer with clear structure. Mention time/space complexity for technical depth.',
      'Great explanation! Mention alternative approaches to show breadth of knowledge.',
      'Well articulated. Adding real-world applications would make it stand out.',
      'Decent attempt. Be more precise with technical terminology and definitions.',
    ];
    return `SCORE: ${score}\nVERDICT: ${verdict}\nFEEDBACK: ${feedbacks[Math.floor(Math.random() * feedbacks.length)]}\nIDEAL_ANSWER: A comprehensive answer should include: clear definition, implementation approach, complexity analysis, trade-offs, and practical examples.\nKEYWORDS: definition,implementation,complexity,trade-offs,examples,edge-cases`;
  }

  // ── Resume-based question generation ──
  if (mode === 'resume_question' || prompt.includes('CANDIDATE PROFILE')) {
    const questions = [
      'Based on your resume, I see you have experience with React. Can you explain the Virtual DOM and how React\'s reconciliation algorithm optimizes rendering performance?',
      'Your resume mentions Python projects. Explain how Python\'s memory management works, including reference counting and the garbage collector.',
      'I notice you have SQL experience. How would you optimize a slow database query? Walk me through your approach from identifying the bottleneck to implementing the solution.',
      'Your projects involve API development. Explain the differences between REST and GraphQL. When would you choose one over the other?',
      'Based on your skills, explain how you would design a scalable microservices architecture for an e-commerce platform.',
      'You mention Git in your skills. Explain your branching strategy for a team project. How do you handle merge conflicts?',
      'Your resume shows data structures knowledge. Explain when you would use a HashMap vs TreeMap. What are the time complexity trade-offs?',
      'I see machine learning in your skills. Explain the bias-variance tradeoff and how you would address overfitting in a model.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  // ── Interview Questions by Domain ──
  if (lowerPrompt.includes('dsa') || lowerPrompt.includes('data structure') || lowerPrompt.includes('algorithm') || lowerPrompt.includes('technical')) {
    const questions = [
      'Explain the difference between a stack and a queue. Provide a real-world use case for each data structure.',
      'What is the time complexity of searching in a balanced BST vs an unbalanced BST? Why does balancing matter?',
      'Describe how you would detect a cycle in a linked list. What algorithm would you use and what is its time complexity?',
      'Explain Dynamic Programming. How does memoization differ from tabulation? Give an example of each approach.',
      'What is a hash collision? Explain two methods to resolve it with their trade-offs.',
      'How would you find the Kth largest element in an unsorted array? Discuss multiple approaches.',
      'Explain BFS vs DFS. When would you prefer one over the other?',
      'What is the difference between merge sort and quick sort? Compare their complexities.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('python')) {
    const questions = [
      'What are Python decorators? Explain with a practical example.',
      'Explain the difference between a list and a tuple in Python. When would you use each?',
      'What is the GIL in Python? How does it affect multithreading?',
      'Explain list comprehensions vs generator expressions.',
      'What are *args and **kwargs in Python?',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('java')) {
    const questions = [
      'Explain abstract class vs interface in Java. When would you use each?',
      'Compare ArrayList vs LinkedList in terms of time complexity.',
      'Explain garbage collection in Java and different GC algorithms.',
      'What are Java Streams and how do they differ from traditional loops?',
      'Explain multithreading: Thread vs Runnable vs ExecutorService.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('machine learning') || lowerPrompt.includes('ml') || lowerPrompt.includes('deep learning') || lowerPrompt.includes('dl')) {
    const questions = [
      'Explain the bias-variance tradeoff. How would you diagnose and fix underfitting vs overfitting?',
      'Compare supervised, unsupervised, and reinforcement learning with real-world examples for each.',
      'Explain gradient descent and its variants (SGD, Adam, RMSProp). When would you use each?',
      'What is backpropagation? Walk me through the math of updating weights in a neural network.',
      'Explain CNNs vs RNNs vs Transformers. When would you choose each architecture?',
      'What are activation functions (ReLU, Sigmoid, Tanh)? Why is ReLU preferred in deep networks?',
      'Explain regularization techniques: L1, L2, Dropout, and Batch Normalization.',
      'What is transfer learning? How would you fine-tune a pre-trained model like BERT or ResNet?',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('system design')) {
    const questions = [
      'How would you design a URL shortener? Discuss the database schema and hashing strategy.',
      'Design a real-time chat application. What technologies and architecture would you use?',
      'How would you design a rate limiter? Discuss token bucket vs sliding window.',
      'Design a notification system for millions of users across push, email, and SMS.',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('aptitude')) {
    const questions = [
      'A train 150m long is running at a speed of 54 km/hr. How much time will it take to cross a platform 250m long?',
      'If 5 pipes can fill a tank in 24 minutes, how many pipes are required to fill the same tank in 15 minutes?',
      'The average age of a class of 20 students is 15 years. If the teacher\'s age is included, the average increases by 1. What is the teacher\'s age?',
      'A shopkeeper sells an item at a 20% profit. If he had bought it for 10% less and sold it for $12 less, he would have gained 30%. What is the cost price?',
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  if (lowerPrompt.includes('reasoning')) {
    const questions = [
      'In a certain code, "COMPUTER" is written as "RFUVQNPC". How will "MEDICINE" be written in that code?',
      'Pointing to a photograph, a man said, "I have no brother or sister but that man\'s father is my father\'s son." Whose photograph was it?',
      'Find the missing number in the series: 2, 6, 12, 20, 30, ?',
      'If "Red" means "Green", "Green" means "Blue", "Blue" means "Yellow", what is the color of the clear sky?',
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
    return `Based on your recent sessions, here are your key areas for improvement:\n\n**1. System Design** — Start with HLD basics like load balancing and caching.\n\n**2. HR & Behavioral** — Your communication score is improving (+12% this week!), but use the STAR method more.\n\n**3. Time Complexity Analysis** — You solved problems correctly but missed discussing complexity trade-offs.\n\n**Action plan:**\n• Complete 2 system design mock interviews this week\n• Practice 3 behavioral questions using STAR method\n• Add complexity analysis to every coding solution\n\nShall I give you a practice question? 🎯`;
  }

  if (lowerPrompt.includes('schedule') || lowerPrompt.includes('plan') || lowerPrompt.includes('study')) {
    return `Here's your recommended weekly study plan:\n\n**Mon-Wed: Technical Deep Dive**\n• 1 hour DSA (LeetCode Medium)\n• 30 min concept revision\n• 1 mock interview session\n\n**Thu-Fri: Communication & Soft Skills**\n• Behavioral questions (STAR method)\n• Record and review yourself\n• 1 HR mock interview\n\n**Saturday: System Design**\n• Study 1 design concept\n• Watch design walkthroughs\n\n**Sunday: Review & Rest**\n• Review the week's progress\n• Light practice only\n\nYou're on track to finish Phase 1 in about 2 weeks! 🚀`;
  }

  if (lowerPrompt.includes('tip') || lowerPrompt.includes('advice')) {
    return `Top interview tips:\n\n**Technical:**\n• Clarify the problem before coding\n• Think out loud — interviewers evaluate your thought process\n• Start brute force, then optimize\n• Always discuss time and space complexity\n\n**HR:**\n• Use the **STAR method** for behavioral questions\n• Prepare 5-6 adaptable stories\n• Research the company thoroughly\n\n**General:**\n• Practice under time pressure\n• Do 2-3 mock interviews per week\n• Sleep well before interviews 💪`;
  }

  return `Great question! Here's what I think:\n\nBased on your profile and preparation progress, I'd recommend focusing on strengthening your core technical skills while building communication confidence.\n\n**Key areas to focus on:**\n• Practice DSA problems daily (aim for 2-3 medium problems)\n• Review system design concepts weekly\n• Do mock interviews to build confidence\n\nWant me to give you a practice question or help with a specific topic? 🎯`;
}
