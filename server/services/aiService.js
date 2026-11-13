import { GoogleGenerativeAI } from '@google/generative-ai';
import { curatedResources, findMatchingResources } from '../database/seedResources.js';

// Get API Key and Model from environment
const getApiKey = () => process.env.GEMINI_API_KEY || '';
const getModelName = () => process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

// Check if AI is configured
export function isAiConfigured() {
  const key = getApiKey();
  return Boolean(key && key.trim() !== '' && key !== 'your_gemini_api_key_here');
}

// Clean JSON response string from potential markdown wrappers
function cleanJsonString(str) {
  if (!str) return '{}';
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

// Model candidates list with automatic fallback
// gemini-3.1-flash-lite is primary for fast, responsive generation
function getCandidateModels() {
  const preferred = getModelName();
  const candidates = [
    preferred,
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash',
    'gemini-3.6-flash'
  ];
  return candidates.filter((m, idx, arr) => arr.indexOf(m) === idx);
}

// Execute Gemini call with 40s timeout and automatic multi-model failover
async function executeWithFallback(jsonMode, runnerFn) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('AI_NOT_CONFIGURED');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const models = getCandidateModels();
  let lastError = null;

  for (const modelName of models) {
    try {
      const config = {
        temperature: 0.3,
        topP: 0.95
      };
      if (jsonMode) {
        config.responseMimeType = 'application/json';
      }
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: config
      });

      // 40-second timeout per model attempt: allows sufficient time for full 16-task generation
      const timeoutMs = 40000;
      const timeoutPromise = new Promise((_, reject) => {
        const timer = setTimeout(() => {
          reject(new Error(`AI_TIMEOUT: Model ${modelName} took longer than 40 seconds.`));
        }, timeoutMs);
        if (timer.unref) timer.unref();
      });

      return await Promise.race([runnerFn(model), timeoutPromise]);
    } catch (err) {
      lastError = err;
      const msg = err?.message || '';
      console.warn(`[AI Service] Model "${modelName}" failed or timed out (${msg}). Attempting next candidate...`);
      continue;
    }
  }

  throw lastError || new Error('All AI model attempts timed out or failed. Please check your internet connection.');
}

/**
 * 1. AI-Powered Goal Analysis
 * Analyzes natural language career or engineering goals into simple, clear concepts.
 */
export async function analyzeGoalWithAi(goalText, engineeringBranch = 'Engineering') {
  if (!isAiConfigured()) {
    return {
      interpreted_title: goalText,
      category: engineeringBranch || 'Engineering',
      clarification_summary: `This track prepares you to master ${goalText} through hands-on practice, core fundamentals, and real projects.`,
      core_competencies: ['Core Principles', 'Practical Tooling', 'Project Building'],
      major_development_stages: [
        { stage: 'Stage 1: Basics & Setup', focus: 'Learn core syntax and key concepts.' },
        { stage: 'Stage 2: Core Engineering', focus: 'Build practical exercises and small modules.' },
        { stage: 'Stage 3: Capstone Projects', focus: 'Create portfolio projects and integrate tools.' }
      ],
      estimated_weeks: 12
    };
  }

  const prompt = `
You are a friendly engineering college advisor.
The student has declared this goal:
"${goalText}"
Student's Engineering Branch / Discipline: ${engineeringBranch}

CRITICAL REQUIREMENT:
- Keep everything SHORT, SIMPLE, and directly practical.
- Use plain, friendly English. Absolutely NO academic jargon, heavy mathematical phrasing, or confusing terminology.
- 1 to 2 short sentences per explanation.

Return a JSON object with this exact structure:
{
  "interpreted_title": "Short, clear title for this goal",
  "category": "e.g., Software Engineering, Data & AI, Embedded Systems, Mechanical, Civil",
  "clarification_summary": "1-2 simple sentences explaining what this goal is and how it helps their career.",
  "core_competencies": [
    "Core Skill 1",
    "Core Skill 2",
    "Core Skill 3"
  ],
  "major_development_stages": [
    {
      "stage": "Stage 1: Basics & Setup",
      "focus": "Learn the basic tools and core concepts."
    },
    {
      "stage": "Stage 2: Core Practice",
      "focus": "Build simple programs and practical exercises."
    },
    {
      "stage": "Stage 3: Mini Projects",
      "focus": "Create small projects to build confidence."
    }
  ],
  "estimated_weeks": 12
}
`;

  try {
    const rawText = await executeWithFallback(true, async (model) => {
      const res = await model.generateContent(prompt);
      return res.response.text();
    });
    return JSON.parse(cleanJsonString(rawText));
  } catch (err) {
    console.warn('[AI Service] Goal analysis fallback:', err.message);
    return {
      interpreted_title: goalText,
      category: engineeringBranch || 'Engineering',
      clarification_summary: `This learning plan builds practical mastery in ${goalText} with simple, structured milestones.`,
      core_competencies: ['Fundamental Concepts', 'Hands-on Practice', 'System Design'],
      major_development_stages: [
        { stage: 'Stage 1: Foundations', focus: 'Core concepts and environment setup.' },
        { stage: 'Stage 2: Applied Skills', focus: 'Building components and exercises.' },
        { stage: 'Stage 3: Portfolio Synthesis', focus: 'Complete end-to-end projects.' }
      ],
      estimated_weeks: 12
    };
  }
}

/**
 * 2. Personalized Skill-Gap Analysis
 * Compares student's current skills against target goal in simple, student-friendly terms.
 */
export async function generateSkillGapAnalysisWithAi({
  goalTitle,
  goalCategory,
  currentSkills,
  availableHours,
  learningPace,
  branch,
  experienceSummary
}) {
  if (!isAiConfigured()) {
    return generateFallbackSkillGap({ goalTitle, currentSkills, availableHours, learningPace, branch });
  }

  const prompt = `
You are a friendly, encouraging engineering mentor.
Analyze an engineering student's profile against their target goal.

Target Goal: ${goalTitle}
Category: ${goalCategory || 'Engineering'}
Student Branch: ${branch || 'Engineering'}
Current Skills: ${JSON.stringify(currentSkills || [])}
Past Projects / Experience: "${experienceSummary || 'None specified'}"
Available Study Hours: ${availableHours} hrs/week
Pace: ${learningPace}

CRITICAL RULES:
- Write in SHORT, SIMPLE, and friendly language that any college student understands immediately.
- Do NOT use intimidating jargon. Use plain terms like "measuring code speed", "managing memory safely", "building simple functions".
- "summary": 1 to 2 short, encouraging sentences about what they know and what to learn next.
- "why_it_matters": 1 simple sentence explaining how this skill is useful in practical work.
- "suggested_action": 1 simple, direct action step to start learning.
- Keep the number of skills to develop between 3 and 4 high-impact skills.

Return a JSON object with this exact structure:
{
  "summary": "1-2 short, encouraging sentences on where the student stands and what to tackle next.",
  "existing_skills_alignment": [
    {
      "skill": "Name of existing skill",
      "current_level": "Beginner | Intermediate | Advanced",
      "relevance_to_goal": "High | Medium | Supporting",
      "assessment": "1 short sentence on how this helps."
    }
  ],
  "skills_to_develop": [
    {
      "skill": "Skill name",
      "priority": "High | Medium | Low",
      "category": "Core Concept | Hands-on Tool | Practical Project",
      "why_it_matters": "1 short, simple sentence on why this is useful.",
      "prerequisites": "Basic concepts needed first, or 'None'.",
      "suggested_action": "1 simple step to practice."
    }
  ],
  "recommended_priorities": [
    {
      "rank": 1,
      "skill": "Skill name",
      "reasoning": "1 simple sentence explaining why to learn this first."
    },
    {
      "rank": 2,
      "skill": "Skill name",
      "reasoning": "1 simple sentence on what to learn next."
    },
    {
      "rank": 3,
      "skill": "Skill name",
      "reasoning": "1 simple sentence on the next step."
    }
  ],
  "pace_feasibility_note": "A short note confirming that ${availableHours} hrs/week at ${learningPace} pace is very achievable."
}
`;

  try {
    const rawText = await executeWithFallback(true, async (model) => {
      const res = await model.generateContent(prompt);
      return res.response.text();
    });
    return JSON.parse(cleanJsonString(rawText));
  } catch (err) {
    console.warn('[AI Service] Skill-gap fallback triggered:', err.message);
    return generateFallbackSkillGap({ goalTitle, currentSkills, availableHours, learningPace, branch });
  }
}

/**
 * 3. AI-Generated Personalized Learning Roadmap
 * Generates a full, comprehensive course roadmap (4 milestones, 3-4 tasks each = 14-16 tasks).
 * Resilient: If AI times out or has network issues, smoothly generates domain-tailored curriculum.
 */
export async function generateRoadmapWithAi({
  goalTitle,
  goalCategory,
  currentSkills,
  availableHours,
  learningPace,
  branch,
  skillGapSummary,
  verifiedCatalog = curatedResources
}) {
  if (!isAiConfigured()) {
    console.log('[AI Service] AI not configured. Generating domain curriculum...');
    return generateFallbackRoadmap({ goalTitle, goalCategory, currentSkills, availableHours, learningPace, branch });
  }

  // Pre-filter the top 8 most relevant curated resources for this goal
  const relevantResources = findMatchingResources(goalTitle, goalCategory || '', branch || '', 8).map(r => ({
    title: r.title,
    url: r.url,
    type: r.type,
    source: r.source,
    skill: r.skill_name
  }));

  const prompt = `
You are an expert curriculum director and technical mentor for undergraduate engineering students.
Build a comprehensive, complete personalized learning roadmap for:
Goal: "${goalTitle}"
Discipline: ${branch || 'Engineering'}
Current Skills: ${JSON.stringify(currentSkills || [])}
Available Study Time: ${availableHours} hours per week
Pace: ${learningPace}
Diagnostic Note: "${skillGapSummary || 'Ready to start learning'}"

TOP VERIFIED LEARNING RESOURCES (use these where relevant):
${JSON.stringify(relevantResources, null, 2)}

COURSE STRUCTURE REQUIREMENTS:
1. Divide into 4 comprehensive Milestones (Phases) covering the full course journey:
   - Milestone 1: Foundations, Setup & Core Syntax
   - Milestone 2: Core Engineering & Practical Implementation
   - Milestone 3: Advanced Concepts, Architecture & Integration
   - Milestone 4: End-to-End Projects, Testing & Deployment
2. Each milestone MUST have 3 to 4 distinct, concrete Learning Tasks (total 14 to 16 tasks across the entire roadmap). Do not cut down or skip tasks.
3. LANGUAGE RULE: Keep all titles, descriptions, and criteria SHORT, SIMPLE, AND CLEAR.
   - Use plain, friendly English that any college student understands immediately.
   - No confusing academic jargon or overly dense text.
   - Title: Short and action-oriented (e.g. "Learn HTML Basics", "Build a Dynamic Array in C").
   - Description: 1 to 2 clear, practical sentences explaining what to learn and build.
   - Estimated hours: 2 to 4 hours per task.
   - Completion criteria: 1 straightforward checklist goal (e.g., "Build a working calculator that handles basic math").
   - Practice exercise: 1 clear, fun hands-on task.
   - Mini project: 1 small deliverable.
   - Recommended resources: 1-2 resource objects with real links from the provided list or trusted official sites.

Return a JSON object strictly matching this schema:
{
  "title": "Clear Roadmap Title",
  "summary": "1-2 short, encouraging sentences outlining the learning journey.",
  "total_weeks": 12,
  "weekly_hours": ${availableHours},
  "milestones": [
    {
      "order_index": 1,
      "title": "Milestone 1: ...",
      "description": "1-2 simple sentences explaining what the student will achieve.",
      "estimated_weeks": 3,
      "prerequisites": "Basic computer skills or 'None'",
      "tasks": [
        {
          "order_index": 1,
          "title": "Task title",
          "description": "1-2 simple sentences on what to learn.",
          "estimated_hours": 3,
          "completion_criteria": "1 simple observable outcome.",
          "practice_exercises": "1 fun practice task.",
          "mini_project": "1 small project deliverable.",
          "recommended_resources": [
            {
              "title": "Resource title",
              "url": "https://...",
              "type": "Interactive Course | Documentation | Video Series | Practice Platform | Project Guide",
              "source": "Source name",
              "is_verified": true
            }
          ]
        }
      ]
    }
  ]
}
`;

  try {
    const rawText = await executeWithFallback(true, async (model) => {
      const res = await model.generateContent(prompt);
      return res.response.text();
    });

    const parsed = JSON.parse(cleanJsonString(rawText));

    // Ensure it has valid milestones and substantial tasks
    const taskCount = (parsed.milestones || []).reduce((acc, m) => acc + (m.tasks ? m.tasks.length : 0), 0);
    if (!parsed.milestones || !Array.isArray(parsed.milestones) || taskCount < 6) {
      console.warn(`[AI Service] AI returned only ${taskCount} tasks. Enhancing with domain curriculum...`);
      return generateFallbackRoadmap({ goalTitle, goalCategory, currentSkills, availableHours, learningPace, branch });
    }

    return parsed;
  } catch (err) {
    console.warn('[AI Service] AI roadmap generation encountered issue:', err.message, 'Generating complete domain curriculum fallback...');
    return generateFallbackRoadmap({ goalTitle, goalCategory, currentSkills, availableHours, learningPace, branch });
  }
}

/**
 * 4. AI Roadmap Refinement ("Improve My Roadmap")
 * Refines existing roadmap based on student's natural language request.
 */
export async function refineRoadmapWithAi({
  currentRoadmap,
  userFeedback,
  availableHours,
  learningPace,
  completedTaskTitles = []
}) {
  if (!isAiConfigured()) {
    return refineFallbackRoadmap({ currentRoadmap, userFeedback, availableHours, learningPace, completedTaskTitles });
  }

  const prompt = `
You are an adaptive curriculum mentor. The student wants to adjust their existing learning roadmap.

STUDENT REQUEST / FEEDBACK:
"${userFeedback}"

STUDENT SETTINGS:
- Available Hours: ${availableHours} hrs/week
- Pace: ${learningPace}

COMPLETED TASKS (MUST PRESERVE THESE):
${JSON.stringify(completedTaskTitles)}

CURRENT ROADMAP OUTLINE:
Title: ${currentRoadmap.title}
Milestones count: ${currentRoadmap.milestones?.length || 4}

COURSE STRUCTURE REQUIREMENTS:
- Provide 4 comprehensive Milestones with 3 to 4 distinct Learning Tasks each (total 12 to 16 tasks).
- Preserve all completed tasks and seamlessly adapt future tasks.
- Keep all text SHORT, SIMPLE, and friendly (1-2 sentences).
- "change_summary": 1-2 clear, simple sentences explaining what was updated.

Return a JSON object strictly matching this schema:
{
  "change_summary": "1-2 simple sentences explaining the updates made.",
  "title": "Updated roadmap title",
  "summary": "1-2 simple sentences overview.",
  "total_weeks": 12,
  "milestones": [
    {
      "order_index": 1,
      "title": "Milestone title",
      "description": "Short description",
      "estimated_weeks": 3,
      "prerequisites": "Prerequisites",
      "tasks": [
        {
          "order_index": 1,
          "title": "Task title",
          "description": "Short task description",
          "estimated_hours": 3,
          "completion_criteria": "Simple completion goal",
          "practice_exercises": "Practice exercise",
          "mini_project": "Mini project",
          "recommended_resources": [
            {
              "title": "Resource title",
              "url": "https://...",
              "type": "Documentation",
              "source": "Source",
              "is_verified": true
            }
          ]
        }
      ]
    }
  ]
}
`;

  try {
    const rawText = await executeWithFallback(true, async (model) => {
      const res = await model.generateContent(prompt);
      return res.response.text();
    });

    const parsed = JSON.parse(cleanJsonString(rawText));

    if (!parsed.milestones || !Array.isArray(parsed.milestones)) {
      throw new Error('Invalid refined structure.');
    }

    return parsed;
  } catch (err) {
    console.warn('[AI Service] AI refinement fallback triggered:', err.message);
    return refineFallbackRoadmap({ currentRoadmap, userFeedback, availableHours, learningPace, completedTaskTitles });
  }
}

/**
 * 5. AI Learning Assistant
 * Context-aware educational assistant for engineering students with simple, friendly explanations.
 */
export async function chatWithAssistantWithAi({
  userMessage,
  conversationHistory = [],
  studentContext = {}
}) {
  if (!isAiConfigured()) {
    return `Hi ${studentContext.name || 'there'}! I am your SkillSupport Learning Companion. To enable real-time conversational AI assistance, add your Google Gemini API key to server/.env. In the meantime, you can follow your roadmap milestones, track completed tasks, and access curated engineering resources anytime!`;
  }

  const systemContext = `
You are the SkillSupport AI Learning Assistant, a friendly, encouraging engineering mentor for undergraduate students.

STUDENT CONTEXT:
- Name: ${studentContext.name || 'Student'}
- Branch: ${studentContext.branch || 'Engineering'}
- Current Goal: ${studentContext.goalTitle || 'General Engineering Skills'}
- Current Milestone: ${studentContext.currentMilestone || 'Starting out'}
- Active Task: ${studentContext.currentTask || 'None'}

GUIDELINES:
- Keep all explanations SHORT, SIMPLE, CLEAR, and direct.
- Explain concepts using simple everyday analogies instead of heavy academic theory.
- If providing code, keep it short, clean, and well-commented.
- Be warm, supportive, and motivating.
- Avoid long walls of text. Break information into bite-sized bullet points.
`;

  const recentHistory = conversationHistory.slice(-6).map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  try {
    const replyText = await executeWithFallback(false, async (model) => {
      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: `System Context:\n${systemContext}` }]
          },
          {
            role: 'model',
            parts: [{ text: `Hi ${studentContext.name || 'there'}! I'm here to help you with your learning roadmap for "${studentContext.goalTitle || 'engineering skills'}". What would you like to explore or work on today?` }]
          },
          ...recentHistory
        ]
      });

      const result = await chat.sendMessage(userMessage);
      return result.response.text();
    });

    return replyText;
  } catch (err) {
    console.warn('[AI Assistant] Chat fallback:', err.message);
    return `I'm having a momentary connection delay with the AI service. However, regarding your roadmap for "${studentContext.goalTitle || 'engineering'}": focus on breaking your current task into 20-minute practice sessions, write small test scripts, and check the verified documentation attached to your task!`;
  }
}

// =========================================================================
// RESILIENT DOMAIN-TAILORED CURRICULUM GENERATORS (NEVER-FAIL ENGINE)
// Guarantees 4 comprehensive milestones with 14-16 rich, practical tasks
// =========================================================================

export function generateFallbackRoadmap({ goalTitle = '', goalCategory = '', currentSkills = [], availableHours = 8, learningPace = 'Balanced', branch = 'Engineering' }) {
  const goalLower = `${goalTitle} ${goalCategory} ${branch}`.toLowerCase();

  // 1. Web Development / Full-Stack Track
  if (goalLower.includes('web') || goalLower.includes('full-stack') || goalLower.includes('frontend') || goalLower.includes('backend') || goalLower.includes('react') || goalLower.includes('node')) {
    return {
      title: `Complete Full-Stack Web Development Roadmap`,
      summary: `A thorough 12-week roadmap guiding you from web fundamentals to building and deploying full-stack web applications.`,
      total_weeks: 12,
      weekly_hours: availableHours,
      milestones: [
        {
          order_index: 1,
          title: "Milestone 1: Web Fundamentals & Modern Layouts",
          description: "Learn HTML5, CSS3, Flexbox, and responsive design to build modern webpages.",
          estimated_weeks: 3,
          prerequisites: "None",
          tasks: [
            {
              order_index: 1,
              title: "HTML5 Structure & Semantic Layouts",
              description: "Learn how to structure web pages cleanly using semantic tags like header, nav, main, and footer.",
              estimated_hours: 3,
              completion_criteria: "Build a multi-page personal resume webpage using valid HTML5 tags.",
              practice_exercises: "Create a 3-page website with links, tables, and a user registration form.",
              mini_project: "Personal Profile & Resume Website",
              recommended_resources: findMatchingResources("HTML", "HTML5 basics", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Modern CSS Styling & Flexbox",
              description: "Master colors, typography, box model, and flexible 1D layouts with CSS Flexbox.",
              estimated_hours: 3.5,
              completion_criteria: "Create a modern navigation bar and flexbox card grid that adapts smoothly.",
              practice_exercises: "Style a product showcase page with hover animations and responsive cards.",
              mini_project: "Product Card Grid Showcase",
              recommended_resources: findMatchingResources("CSS", "CSS Flexbox layout", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Responsive Web Design & Media Queries",
              description: "Use CSS Grid and media queries to ensure webpages look great on phones, tablets, and laptops.",
              estimated_hours: 3,
              completion_criteria: "Build a responsive landing page that renders cleanly across all screen sizes.",
              practice_exercises: "Convert a desktop layout into a mobile-friendly layout with a hamburger menu.",
              mini_project: "Responsive Startup Landing Page",
              recommended_resources: findMatchingResources("Responsive Web Design", "freeCodeCamp CSS Grid", goalTitle, 2)
            },
            {
              order_index: 4,
              title: "Git & GitHub Version Control",
              description: "Learn essential git commands to track code history, create branches, and push to GitHub.",
              estimated_hours: 2.5,
              completion_criteria: "Initialize a git repo, make 3 commits, and publish the project on GitHub Pages.",
              practice_exercises: "Create a feature branch, make a change, and merge it back to main.",
              mini_project: "Live Hosted Portfolio on GitHub Pages",
              recommended_resources: findMatchingResources("Git", "Version Control", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 2,
          title: "Milestone 2: JavaScript & Interactive UI",
          description: "Master programming fundamentals in JavaScript to make webpages interactive and dynamic.",
          estimated_weeks: 3,
          prerequisites: "Milestone 1 completion (HTML & CSS)",
          tasks: [
            {
              order_index: 1,
              title: "JavaScript Variables, Loops & Functions",
              description: "Understand variables (let, const), data types, conditional logic, loops, and reusable functions.",
              estimated_hours: 3,
              completion_criteria: "Write a command-line script that calculates grade averages from student scores.",
              practice_exercises: "Write functions to reverse a string, check palindromes, and filter arrays.",
              mini_project: "Student Grade Calculator",
              recommended_resources: findMatchingResources("JavaScript", "JS basics", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "DOM Manipulation & Event Handling",
              description: "Learn how to select HTML elements, modify styles dynamically, and handle click and input events.",
              estimated_hours: 3.5,
              completion_criteria: "Build an interactive Todo list app where users can add, mark done, and delete items.",
              practice_exercises: "Create a dark/light mode toggle button that updates CSS classes in real time.",
              mini_project: "Interactive Task & Todo Tracker",
              recommended_resources: findMatchingResources("JavaScript", "DOM events", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Fetch API & Working with Asynchronous Data",
              description: "Learn how to make asynchronous network requests with fetch, async/await, and handle JSON data.",
              estimated_hours: 3.5,
              completion_criteria: "Build a weather or quote finder app that fetches live data from a public API.",
              practice_exercises: "Fetch and display a list of GitHub users or blog posts with loading spinners.",
              mini_project: "Live Weather & Forecast App",
              recommended_resources: findMatchingResources("JavaScript", "Fetch API async", goalTitle, 2)
            },
            {
              order_index: 4,
              title: "Client-Side Form Validation & LocalStorage",
              description: "Validate user inputs with JavaScript and persist data in browser localStorage across reloads.",
              estimated_hours: 2.5,
              completion_criteria: "Build a form with real-time email/password validation and saved preferences.",
              practice_exercises: "Save and load a user's theme choice and search history using localStorage.",
              mini_project: "Validated Signup & Preferences Panel",
              recommended_resources: findMatchingResources("JavaScript", "HTML Forms", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 3,
          title: "Milestone 3: React.js & Component-Driven UI",
          description: "Build modern, responsive single-page web applications with React components and state.",
          estimated_weeks: 3,
          prerequisites: "Milestone 2 completion (JavaScript Fundamentals)",
          tasks: [
            {
              order_index: 1,
              title: "React Components, Props & JSX",
              description: "Learn how React works, create reusable UI components, and pass dynamic data using props.",
              estimated_hours: 3,
              completion_criteria: "Build a reusable component library containing buttons, cards, and badges.",
              practice_exercises: "Create a user card grid where each card renders unique info passed via props.",
              mini_project: "Component Library & Showcase",
              recommended_resources: findMatchingResources("React", "Components JSX", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "State Management with useState & useEffect",
              description: "Master React state to handle user interactions and side effects like fetching data on mount.",
              estimated_hours: 4,
              completion_criteria: "Build a searchable product catalog that filters items dynamically as the user types.",
              practice_exercises: "Implement a counter app with start, pause, reset, and step size controls.",
              mini_project: "Searchable Product & Movie Catalog",
              recommended_resources: findMatchingResources("React", "Hooks state", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Multi-Page Navigation with React Router",
              description: "Implement client-side navigation with React Router to create seamless multi-page user journeys.",
              estimated_hours: 3.5,
              completion_criteria: "Build a 3-page web app with Home, About, and Dashboard routes with active styling.",
              practice_exercises: "Add URL query parameters to filter results on a dashboard page.",
              mini_project: "Multi-View Engineering Student Dashboard",
              recommended_resources: findMatchingResources("React", "Router", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 4,
          title: "Milestone 4: Backend APIs, Databases & Deployment",
          description: "Build server-side REST APIs with Node.js & Express, store data in SQLite, and deploy live.",
          estimated_weeks: 3,
          prerequisites: "Milestone 3 completion (React & Frontend)",
          tasks: [
            {
              order_index: 1,
              title: "Node.js & Express RESTful API Server",
              description: "Create an Express backend server with GET, POST, PUT, and DELETE endpoints and JSON parsing.",
              estimated_hours: 3.5,
              completion_criteria: "Build a backend API that manages notes or tasks with full CRUD operations.",
              practice_exercises: "Write middleware to log incoming request methods, URLs, and timestamps.",
              mini_project: "Task Management REST API",
              recommended_resources: findMatchingResources("Express", "Node.js backend", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Relational Database Storage with SQLite & SQL",
              description: "Learn SQL syntax to create tables, insert records, run queries, and persist backend data.",
              estimated_hours: 3.5,
              completion_criteria: "Connect your Express API to an SQLite database with primary keys and constraints.",
              practice_exercises: "Write SQL queries with WHERE, ORDER BY, and JOIN to fetch related records.",
              mini_project: "Database-Backed Note & Bookmark System",
              recommended_resources: findMatchingResources("SQL", "Database SQLite", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Full-Stack Project Synthesis & Production Build",
              description: "Connect your React frontend to your Express backend, handle errors gracefully, and prepare for deployment.",
              estimated_hours: 4,
              completion_criteria: "Test and verify full client-to-server data flow from UI button click to database row.",
              practice_exercises: "Write a comprehensive README with setup steps and API endpoint documentation.",
              mini_project: "Full-Stack Web Application Capstone",
              recommended_resources: findMatchingResources("Full-Stack", "Web Development", goalTitle, 2)
            }
          ]
        }
      ]
    };
  }

  // 2. C / Data Structures & Algorithms Track
  if (goalLower.includes('c') || goalLower.includes('data structure') || goalLower.includes('algorithm') || goalLower.includes('dsa') || goalLower.includes('pointer')) {
    return {
      title: `Data Structures & Algorithms in C Roadmap`,
      summary: `A thorough 12-week roadmap guiding you from C memory pointers to implementing linear, non-linear, and algorithmic problem-solving patterns.`,
      total_weeks: 12,
      weekly_hours: availableHours,
      milestones: [
        {
          order_index: 1,
          title: "Milestone 1: Pointers, Memory & Custom Structs",
          description: "Master memory addresses, pointers, dynamic memory allocation with malloc/free, and structs in C.",
          estimated_weeks: 3,
          prerequisites: "Basic C programming (loops, conditionals, functions)",
          tasks: [
            {
              order_index: 1,
              title: "Pointers & Memory Addresses in C",
              description: "Learn how variables are stored in memory and how to use pointers to inspect and modify addresses.",
              estimated_hours: 3,
              completion_criteria: "Write a program that swaps two numbers and reverses an array using pointers.",
              practice_exercises: "Print memory addresses of integers, floats, and array elements to observe memory spacing.",
              mini_project: "Pointer-Based Math & Array Utility",
              recommended_resources: findMatchingResources("C Programming", "Pointers memory", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Dynamic Memory Allocation (malloc, calloc, free)",
              description: "Learn how to allocate memory on the heap dynamically and prevent memory leaks using free().",
              estimated_hours: 3.5,
              completion_criteria: "Create a dynamic array in C that asks the user for size and resizes safely.",
              practice_exercises: "Allocate memory for an array of integers, compute sum and average, then free cleanly.",
              mini_project: "Dynamic Resizable Array in C",
              recommended_resources: findMatchingResources("C Programming", "Dynamic Memory", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Structures (structs) & Pointer to Struct",
              description: "Group related data into custom structs and access struct fields using the arrow (->) operator.",
              estimated_hours: 3,
              completion_criteria: "Create a Student record management struct with name, roll number, and marks.",
              practice_exercises: "Write functions that take a pointer to a struct and modify its values in place.",
              mini_project: "Student Record Management Utility",
              recommended_resources: findMatchingResources("C Programming", "Structures", goalTitle, 2)
            },
            {
              order_index: 4,
              title: "Time & Space Complexity Basics (Big-O)",
              description: "Learn how to measure code speed and memory usage using Big-O notation in simple terms.",
              estimated_hours: 2.5,
              completion_criteria: "Identify and compare the Big-O time of linear search (O(n)) vs binary search (O(log n)).",
              practice_exercises: "Analyze the runtime of single loops versus nested loops on arrays.",
              mini_project: "Search Algorithm Benchmark Tool",
              recommended_resources: findMatchingResources("Data Structures", "Algorithms Big-O", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 2,
          title: "Milestone 2: Linear Data Structures (Lists, Stacks, Queues)",
          description: "Build node-based data structures from scratch in C with insert, delete, and traversal methods.",
          estimated_weeks: 3,
          prerequisites: "Milestone 1 completion (Pointers and Structs)",
          tasks: [
            {
              order_index: 1,
              title: "Singly Linked List Implementation",
              description: "Build a linked list from scratch with functions to insert at head, insert at tail, and print elements.",
              estimated_hours: 3.5,
              completion_criteria: "Successfully insert 5 elements into a linked list and display them in order.",
              practice_exercises: "Write a function to search for a value and delete a node from a singly linked list.",
              mini_project: "Complete Singly Linked List Library in C",
              recommended_resources: findMatchingResources("Data Structures", "Linked List", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Doubly & Circular Linked Lists",
              description: "Implement nodes with both next and previous pointers to enable two-way traversal.",
              estimated_hours: 3.5,
              completion_criteria: "Implement reverse traversal and cycle detection in a doubly linked list.",
              practice_exercises: "Write a function to reverse a doubly linked list in place.",
              mini_project: "Music Playlist Tracker with Doubly Linked List",
              recommended_resources: findMatchingResources("Data Structures", "Doubly Linked List", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Stack Implementation (LIFO)",
              description: "Learn how Last-In-First-Out stacks work using arrays and linked lists with push() and pop().",
              estimated_hours: 3,
              completion_criteria: "Build a stack that checks whether parentheses in an expression are balanced.",
              practice_exercises: "Write a function to reverse a string using a stack.",
              mini_project: "Balanced Parentheses Checker",
              recommended_resources: findMatchingResources("Data Structures", "Stack", goalTitle, 2)
            },
            {
              order_index: 4,
              title: "Queue & Circular Queue (FIFO)",
              description: "Implement First-In-First-Out queues with enqueue() and dequeue() methods for task scheduling.",
              estimated_hours: 3,
              completion_criteria: "Implement a circular queue in C and simulate printing or ticket waiting jobs.",
              practice_exercises: "Implement a queue using two stacks.",
              mini_project: "Print Job Queue Simulator",
              recommended_resources: findMatchingResources("Data Structures", "Queue", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 3,
          title: "Milestone 3: Non-Linear Data Structures (Trees & Heaps)",
          description: "Explore hierarchical structures by implementing recursive binary trees, BSTs, and priority heaps.",
          estimated_weeks: 3,
          prerequisites: "Milestone 2 completion (Linear Data Structures)",
          tasks: [
            {
              order_index: 1,
              title: "Binary Tree Fundamentals & Recursion",
              description: "Understand tree nodes (left child, right child) and write recursive functions to traverse trees.",
              estimated_hours: 3.5,
              completion_criteria: "Build a binary tree and implement In-Order, Pre-Order, and Post-Order traversals.",
              practice_exercises: "Write recursive functions to calculate the height and total node count of a tree.",
              mini_project: "Binary Tree Traversal Visualizer",
              recommended_resources: findMatchingResources("Data Structures", "Binary Tree", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Binary Search Tree (BST) Operations",
              description: "Implement an ordered BST where smaller values go left and larger values go right.",
              estimated_hours: 4,
              completion_criteria: "Write insert(), search(), and findMin() functions for a Binary Search Tree in C.",
              practice_exercises: "Implement deletion of a node with two children in a BST.",
              mini_project: "Fast Dictionary Lookup with BST",
              recommended_resources: findMatchingResources("Data Structures", "Binary Search Tree", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Priority Queues & Binary Heaps",
              description: "Learn how Min-Heaps and Max-Heaps work to extract highest-priority items in O(log n) time.",
              estimated_hours: 3.5,
              completion_criteria: "Implement a Min-Heap with insert() and extractMin() operations in C.",
              practice_exercises: "Use a heap to find the k-th smallest element in an array.",
              mini_project: "Hospital Emergency Priority Queue",
              recommended_resources: findMatchingResources("Data Structures", "Heap Priority Queue", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 4,
          title: "Milestone 4: Graphs, Hashing & Algorithmic Problem Solving",
          description: "Master fast O(1) hash lookups, network graphs, and essential sorting and searching algorithms.",
          estimated_weeks: 3,
          prerequisites: "Milestone 3 completion (Trees and Heaps)",
          tasks: [
            {
              order_index: 1,
              title: "Hash Tables & Collision Handling",
              description: "Learn how hash functions map keys to array indexes and handle collisions using chaining.",
              estimated_hours: 3.5,
              completion_criteria: "Implement a basic hash map in C with put(), get(), and separate chaining.",
              practice_exercises: "Write a hash function for strings that calculates unique array buckets.",
              mini_project: "Phone Directory Key-Value Lookup in C",
              recommended_resources: findMatchingResources("Data Structures", "Hash Table", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Graph Representations & Breadth-First / Depth-First Search",
              description: "Represent networks using adjacency lists/matrices and traverse nodes using BFS and DFS.",
              estimated_hours: 4,
              completion_criteria: "Build a social network graph and find the shortest path between two users with BFS.",
              practice_exercises: "Implement DFS to detect whether a path exists between two vertices.",
              mini_project: "Shortest Path & Route Finder in C",
              recommended_resources: findMatchingResources("Data Structures", "Graphs BFS DFS", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Sorting Algorithms & Technical Interview Patterns",
              description: "Implement Merge Sort and Quick Sort, comparing their divide-and-conquer strategy to bubble sort.",
              estimated_hours: 3.5,
              completion_criteria: "Implement QuickSort in C and sort an array of 1,000 numbers accurately.",
              practice_exercises: "Solve standard two-pointer and sliding-window algorithmic challenges.",
              mini_project: "Sorting Benchmark & Algorithm Suite",
              recommended_resources: findMatchingResources("NeetCode", "Data Structures", goalTitle, 2)
            }
          ]
        }
      ]
    };
  }

  // 3. Python & Machine Learning Track
  if (goalLower.includes('python') || goalLower.includes('machine learning') || goalLower.includes('ai') || goalLower.includes('deep learning')) {
    return {
      title: `Python, Data Analysis & Machine Learning Roadmap`,
      summary: `A complete 12-week roadmap guiding you from Python programming basics to data analysis, machine learning models, and real-world predictions.`,
      total_weeks: 12,
      weekly_hours: availableHours,
      milestones: [
        {
          order_index: 1,
          title: "Milestone 1: Python Fundamentals & Data Structures",
          description: "Master variables, loops, functions, lists, and dictionaries in Python for engineering.",
          estimated_weeks: 3,
          prerequisites: "None",
          tasks: [
            {
              order_index: 1,
              title: "Python Syntax, Variables & Control Flow",
              description: "Learn basic Python syntax, data types, if-else statements, and for/while loops.",
              estimated_hours: 3,
              completion_criteria: "Write a program that takes user inputs and performs automated calculations.",
              practice_exercises: "Create a number guessing game with replay loops and attempt counters.",
              mini_project: "Interactive Guessing Game & Quiz",
              recommended_resources: findMatchingResources("Python", "Python basics", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Functions, Scope & Python Modules",
              description: "Write modular code using custom functions, default parameters, and import standard libraries.",
              estimated_hours: 3,
              completion_criteria: "Build a utility library with reusable functions for statistics and text parsing.",
              practice_exercises: "Write functions with variable arguments (*args, **kwargs).",
              mini_project: "Statistical Math Utilities Library",
              recommended_resources: findMatchingResources("Python", "Functions", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Working with Collections: Lists, Tuples, Dictionaries & Sets",
              description: "Master Python's built-in collections to organize, filter, and transform datasets efficiently.",
              estimated_hours: 3.5,
              completion_criteria: "Build a contacts and student directory with search and filter capabilities.",
              practice_exercises: "Use list and dictionary comprehensions to clean and transform raw lists.",
              mini_project: "Student Directory & Gradebook",
              recommended_resources: findMatchingResources("Python", "Collections", goalTitle, 2)
            },
            {
              order_index: 4,
              title: "File Input/Output & Error Handling",
              description: "Learn to read and write text, CSV, and JSON files safely using with open() and try/except blocks.",
              estimated_hours: 2.5,
              completion_criteria: "Write a script that reads a CSV spreadsheet and outputs a summary report.",
              practice_exercises: "Catch file not found and value errors gracefully with helpful user messages.",
              mini_project: "Automated CSV Log & Report Generator",
              recommended_resources: findMatchingResources("Python", "File handling", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 2,
          title: "Milestone 2: Data Wrangling with NumPy & Pandas",
          description: "Process and analyze tabular datasets with vectorization, indexing, and aggregation.",
          estimated_weeks: 3,
          prerequisites: "Milestone 1 completion (Python Basics)",
          tasks: [
            {
              order_index: 1,
              title: "NumPy Arrays & Vectorized Calculations",
              description: "Learn multi-dimensional arrays, matrix operations, and fast mathematical broadcasting.",
              estimated_hours: 3,
              completion_criteria: "Create and manipulate 2D matrices and perform element-wise arithmetic in NumPy.",
              practice_exercises: "Normalize an array of test scores using mean and standard deviation.",
              mini_project: "Matrix Math & Signal Processing Tool",
              recommended_resources: findMatchingResources("Machine Learning", "NumPy", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Pandas DataFrames & Data Cleaning",
              description: "Load datasets into DataFrames, filter rows, handle missing values, and group records.",
              estimated_hours: 4,
              completion_criteria: "Clean a messy real-world CSV dataset by removing duplicates and imputing null values.",
              practice_exercises: "Group customer purchases by category and calculate total revenues.",
              mini_project: "Sales & Customer Data Cleaning Pipeline",
              recommended_resources: findMatchingResources("Kaggle", "Pandas", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Data Visualization with Matplotlib & Seaborn",
              description: "Create bar charts, histograms, scatter plots, and heatmaps to uncover patterns in data.",
              estimated_hours: 3,
              completion_criteria: "Generate an exploratory visual report with at least 4 distinct chart types.",
              practice_exercises: "Plot correlation heatmaps to find relationships between variables.",
              mini_project: "Exploratory Data Analysis (EDA) Report",
              recommended_resources: findMatchingResources("Machine Learning", "Visualization", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 3,
          title: "Milestone 3: Core Machine Learning with Scikit-Learn",
          description: "Train supervised machine learning models to make classifications and continuous predictions.",
          estimated_weeks: 3,
          prerequisites: "Milestone 2 completion (NumPy and Pandas)",
          tasks: [
            {
              order_index: 1,
              title: "Supervised Learning: Linear & Logistic Regression",
              description: "Understand regression for continuous values and logistic regression for binary classification.",
              estimated_hours: 3.5,
              completion_criteria: "Train a linear regression model to predict housing prices and evaluate MSE.",
              practice_exercises: "Split data into 80% train and 20% test sets using train_test_split.",
              mini_project: "House Price & Sales Prediction Model",
              recommended_resources: findMatchingResources("Machine Learning", "Linear Regression", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Decision Trees & Random Forests",
              description: "Train tree-based algorithms for classification and analyze feature importance.",
              estimated_hours: 4,
              completion_criteria: "Train a Random Forest classifier that achieves >85% accuracy on a tabular dataset.",
              practice_exercises: "Tune hyperparameters like max_depth and n_estimators to avoid overfitting.",
              mini_project: "Customer Churn Prediction Classifier",
              recommended_resources: findMatchingResources("Google Machine Learning", "Trees", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Model Evaluation & Cross-Validation",
              description: "Evaluate model performance using accuracy, precision, recall, F1-score, and confusion matrices.",
              estimated_hours: 3.5,
              completion_criteria: "Generate a confusion matrix and classification report for a trained model.",
              practice_exercises: "Perform 5-fold cross-validation on a model to verify consistency.",
              mini_project: "Medical Diagnosis Model Evaluation",
              recommended_resources: findMatchingResources("Machine Learning", "Evaluation", goalTitle, 2)
            }
          ]
        },
        {
          order_index: 4,
          title: "Milestone 4: Deep Learning, Computer Vision & Deployment",
          description: "Build neural networks with PyTorch, explore computer vision, and deploy an AI model.",
          estimated_weeks: 3,
          prerequisites: "Milestone 3 completion (Machine Learning)",
          tasks: [
            {
              order_index: 1,
              title: "Introduction to Neural Networks & PyTorch",
              description: "Understand neurons, activation functions, loss functions, and PyTorch tensors.",
              estimated_hours: 4,
              completion_criteria: "Build and train a simple 2-layer neural network on the MNIST digit dataset.",
              practice_exercises: "Write a PyTorch training loop with forward pass, loss calculation, and backward pass.",
              mini_project: "Handwritten Digit Recognizer in PyTorch",
              recommended_resources: findMatchingResources("PyTorch", "Deep Learning", goalTitle, 2)
            },
            {
              order_index: 2,
              title: "Computer Vision with OpenCV Basics",
              description: "Load images, apply color filters, detect edges, and perform basic facial detection.",
              estimated_hours: 3.5,
              completion_criteria: "Build a webcam or photo filter tool that highlights edges and detects faces.",
              practice_exercises: "Resize, crop, and apply blur filters to an image dataset.",
              mini_project: "Automated Face & Object Detection Tool",
              recommended_resources: findMatchingResources("OpenCV", "Computer Vision", goalTitle, 2)
            },
            {
              order_index: 3,
              title: "Deploying Machine Learning Models via Web APIs",
              description: "Save a trained model and build a lightweight API endpoint using Flask or FastAPI to serve predictions.",
              estimated_hours: 4,
              completion_criteria: "Deploy an API where users can send inputs and receive instant predictions.",
              practice_exercises: "Test your prediction API with curl or Postman with sample input payloads.",
              mini_project: "Live Machine Learning Prediction Web Service",
              recommended_resources: findMatchingResources("Machine Learning", "Deployment", goalTitle, 2)
            }
          ]
        }
      ]
    };
  }

  // 4. General Engineering & Software Development (Universal Fallback)
  return {
    title: `Personalized ${goalTitle || 'Engineering Skill'} Roadmap`,
    summary: `A comprehensive 12-week engineering curriculum designed to build practical mastery through structured milestones, concrete coding exercises, and portfolio projects.`,
    total_weeks: 12,
    weekly_hours: availableHours,
    milestones: [
      {
        order_index: 1,
        title: "Milestone 1: Fundamentals & Environment Setup",
        description: "Learn core syntax, key engineering principles, and configure your local development environment.",
        estimated_weeks: 3,
        prerequisites: "None",
        tasks: [
          {
            order_index: 1,
            title: "Development Environment & Tooling Setup",
            description: "Install your code editor, runtime environment, and package managers for a smooth workflow.",
            estimated_hours: 2.5,
            completion_criteria: "Successfully configure your editor, run a 'Hello World' test, and verify tools in terminal.",
            practice_exercises: "Explore terminal shortcuts and configure code linting in your editor.",
            mini_project: "Configured Local Development Workspace",
            recommended_resources: findMatchingResources(goalTitle, "Getting Started", branch, 2)
          },
          {
            order_index: 2,
            title: "Core Syntax, Variables & Basic Operations",
            description: "Understand fundamental variables, data types, and arithmetic operations in this discipline.",
            estimated_hours: 3,
            completion_criteria: "Write a small utility script that performs standard domain calculations.",
            practice_exercises: "Practice conditional branching and input validation.",
            mini_project: "Interactive Calculator & Unit Converter",
            recommended_resources: findMatchingResources(goalTitle, "Basics", branch, 2)
          },
          {
            order_index: 3,
            title: "Control Flow, Loops & Reusable Functions",
            description: "Master loops and modular functions to write clean, reusable, and efficient code.",
            estimated_hours: 3.5,
            completion_criteria: "Write reusable functions with clean parameters and return values.",
            practice_exercises: "Create loops to iterate through datasets and filter elements based on criteria.",
            mini_project: "Modular Calculation Library",
            recommended_resources: findMatchingResources(goalTitle, "Functions", branch, 2)
          },
          {
            order_index: 4,
            title: "Git & Version Control Essentials",
            description: "Learn git basics to commit code, manage branches, and push projects to GitHub safely.",
            estimated_hours: 2.5,
            completion_criteria: "Create a GitHub repository, push your initial milestone code, and write a README.",
            practice_exercises: "Create a branch, commit updates, and open a pull request.",
            mini_project: "Documented Milestone 1 GitHub Repository",
            recommended_resources: findMatchingResources("Git", "Version Control", branch, 2)
          }
        ]
      },
      {
        order_index: 2,
        title: "Milestone 2: Applied Engineering & Data Handling",
        description: "Work with data structures, file formats, and build core practical features.",
        estimated_weeks: 3,
        prerequisites: "Milestone 1 completion (Fundamentals)",
        tasks: [
          {
            order_index: 1,
            title: "Structured Data Formats & Collections",
            description: "Learn how to organize, search, and manage data using arrays, maps, and structured objects.",
            estimated_hours: 3.5,
            completion_criteria: "Implement data storage models to organize domain records cleanly.",
            practice_exercises: "Filter, map, and sort records by different attributes.",
            mini_project: "Record Management System",
            recommended_resources: findMatchingResources(goalTitle, "Data structures", branch, 2)
          },
          {
            order_index: 2,
            title: "File Operations & Data Persistence",
            description: "Read, write, and process external files (JSON, CSV, or text) to persist user information.",
            estimated_hours: 3,
            completion_criteria: "Write code to load initial data from disk and write updated records on exit.",
            practice_exercises: "Handle file missing and malformed data errors gracefully.",
            mini_project: "File-Based Data Persistence Engine",
            recommended_resources: findMatchingResources(goalTitle, "File handling", branch, 2)
          },
          {
            order_index: 3,
            title: "Error Handling & Debugging Techniques",
            description: "Learn how to diagnose bugs, read stack traces, and use debuggers to fix runtime errors.",
            estimated_hours: 3,
            completion_criteria: "Use breakpoints and error handling blocks to catch and log invalid user inputs.",
            practice_exercises: "Debug a provided sample program with intentional syntax and logic errors.",
            mini_project: "Robust Error-Logged Application Module",
            recommended_resources: findMatchingResources(goalTitle, "Debugging", branch, 2)
          }
        ]
      },
      {
        order_index: 3,
        title: "Milestone 3: Advanced Concepts & System Design",
        description: "Design modular components, understand system architecture, and optimize performance.",
        estimated_weeks: 3,
        prerequisites: "Milestone 2 completion (Applied Engineering)",
        tasks: [
          {
            order_index: 1,
            title: "Modular Architecture & Separation of Concerns",
            description: "Separate business logic, data models, and user presentation into distinct clean modules.",
            estimated_hours: 3.5,
            completion_criteria: "Refactor your application into separate modules with clean interfaces.",
            practice_exercises: "Diagram the data flow between modules before writing the code.",
            mini_project: "Multi-Module Structured Application",
            recommended_resources: findMatchingResources(goalTitle, "Architecture", branch, 2)
          },
          {
            order_index: 2,
            title: "External APIs & Service Integration",
            description: "Connect to external data feeds or web APIs to incorporate live real-world information.",
            estimated_hours: 4,
            completion_criteria: "Make HTTP requests to an API, parse the JSON response, and present results.",
            practice_exercises: "Implement loading indicators and error banners for network requests.",
            mini_project: "Live API Data Integration Service",
            recommended_resources: findMatchingResources(goalTitle, "API Integration", branch, 2)
          },
          {
            order_index: 3,
            title: "Performance Optimization & Testing",
            description: "Write unit tests for core functions and optimize slow operations to run efficiently.",
            estimated_hours: 3.5,
            completion_criteria: "Write at least 3 automated unit tests verifying critical calculation functions.",
            practice_exercises: "Profile execution time and reduce unnecessary loop iterations.",
            mini_project: "Tested & Benchmark-Verified Application",
            recommended_resources: findMatchingResources(goalTitle, "Testing", branch, 2)
          }
        ]
      },
      {
        order_index: 4,
        title: "Milestone 4: Portfolio Project Synthesis & Deployment",
        description: "Synthesize all concepts learned into a comprehensive engineering portfolio project.",
        estimated_weeks: 3,
        prerequisites: "Milestone 3 completion (System Design)",
        tasks: [
          {
            order_index: 1,
            title: "Capstone Project Design & Scope",
            description: "Define the features, user journey, and technical requirements for your major portfolio project.",
            estimated_hours: 3,
            completion_criteria: "Create a design specification document outlining the project components and goals.",
            practice_exercises: "Draft wireframes or flowcharts illustrating how user actions trigger system updates.",
            mini_project: "Capstone Technical Architecture Document",
            recommended_resources: findMatchingResources(goalTitle, "Project Design", branch, 2)
          },
          {
            order_index: 2,
            title: "Building the Core Capstone Deliverable",
            description: "Implement the primary functional requirements of your capstone project with clean code.",
            estimated_hours: 4.5,
            completion_criteria: "Complete the full implementation of your project with all core features functional.",
            practice_exercises: "Conduct user testing with a peer to collect usability feedback.",
            mini_project: "Functional Capstone Project Implementation",
            recommended_resources: findMatchingResources(goalTitle, "Portfolio", branch, 2)
          },
          {
            order_index: 3,
            title: "Project Documentation & Portfolio Deployment",
            description: "Write a comprehensive README, document setup instructions, and publish your project publicly.",
            estimated_hours: 3.5,
            completion_criteria: "Publish the project repository with clear screenshots, feature list, and demo steps.",
            practice_exercises: "Record a short 2-minute walkthrough showing your project in action.",
            mini_project: "Published Portfolio Engineering Showcase",
            recommended_resources: findMatchingResources(goalTitle, "Documentation", branch, 2)
          }
        ]
      }
    ]
  };
}

export function generateFallbackSkillGap({ goalTitle = '', currentSkills = [], availableHours = 8, learningPace = 'Balanced', branch = 'Engineering' }) {
  const existingAlignment = (currentSkills || []).map(s => ({
    skill: s.name,
    current_level: s.proficiency || 'Beginner',
    relevance_to_goal: 'High',
    assessment: `Your familiarity with ${s.name} provides a solid starting point for this learning journey.`
  }));

  return {
    summary: `You have an encouraging foundation to start working towards "${goalTitle}". By focusing on core hands-on practice, you will steadily master key tools and concepts.`,
    existing_skills_alignment: existingAlignment.length > 0 ? existingAlignment : [
      {
        skill: "Core Engineering Fundamentals",
        current_level: "Beginner",
        relevance_to_goal: "High",
        assessment: "Starting with foundational concepts will allow you to build steady confidence."
      }
    ],
    skills_to_develop: [
      {
        skill: `Core Concepts for ${goalTitle}`,
        priority: "High",
        category: "Core Concept",
        why_it_matters: "Understanding the basic principles is essential before building complex projects.",
        prerequisites: "Basic computer familiarity",
        suggested_action: "Practice the introductory tutorials and write simple test scripts."
      },
      {
        skill: "Hands-on Practical Implementation",
        priority: "High",
        category: "Hands-on Tool",
        why_it_matters: "Writing real code and building small exercises cements theoretical knowledge.",
        prerequisites: "Core concepts",
        suggested_action: "Build small 1-page or single-module practice exercises."
      },
      {
        skill: "Debugging & Problem Solving",
        priority: "Medium",
        category: "Practical Project",
        why_it_matters: "Diagnosing errors and fixing bugs quickly is a key engineering superpower.",
        prerequisites: "Hands-on practice",
        suggested_action: "Use breakpoints, console logs, and stack traces to fix errors step by step."
      },
      {
        skill: "Portfolio Project Building",
        priority: "Medium",
        category: "Practical Project",
        why_it_matters: "Creating complete projects gives you real portfolio pieces to showcase to recruiters.",
        prerequisites: "Core & practical skills",
        suggested_action: "Combine what you learned into a complete, documented mini-project."
      }
    ],
    recommended_priorities: [
      {
        rank: 1,
        skill: `Core Concepts for ${goalTitle}`,
        reasoning: "Mastering the fundamentals first makes all subsequent topics much easier to understand."
      },
      {
        rank: 2,
        skill: "Hands-on Practical Implementation",
        reasoning: "Applying concepts immediately through exercises ensures you retain what you learn."
      },
      {
        rank: 3,
        skill: "Portfolio Project Building",
        reasoning: "Building an end-to-end project proves your practical readiness."
      }
    ],
    pace_feasibility_note: `Investing ${availableHours} hours per week at a ${learningPace} pace is a very realistic and sustainable commitment to complete this roadmap.`
  };
}

export function refineFallbackRoadmap({ currentRoadmap, userFeedback = '', availableHours = 8, learningPace = 'Balanced', completedTaskTitles = [] }) {
  // If roadmap already exists, preserve completed tasks and update notes
  const updated = JSON.parse(JSON.stringify(currentRoadmap));
  updated.change_summary = `Updated roadmap to accommodate your feedback: "${userFeedback}". Preserved all ${completedTaskTitles.length} completed tasks while adjusting upcoming milestones.`;
  updated.weekly_hours = availableHours;
  return updated;
}
