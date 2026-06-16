import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { niche, country, platform } = await request.json();

    if (!niche) {
      return NextResponse.json(
        { error: "Niche parameter is required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    // If API Key is present, attempt to call OpenAI
    if (apiKey && apiKey !== "your_openai_api_key_here") {
      try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: `You are a viral content research AI for a marketing platform. Your job is to return a list of 5 trending topics for a given niche, country, and social media platform in JSON format.
The JSON output must contain a single root key "trends" which is an array of objects.
Each object in the "trends" array must have the following structure:
{
  "id": "unique alphanumeric string (e.g. t_123456)",
  "topic": "Trending topic or keyword (highly specific and relevant to the niche)",
  "trendScore": integer between 60 and 100 (representing popularity/volume),
  "growthRate": string (e.g. "+250%", "+1500%"),
  "viralProbability": "High" | "Medium" | "Low",
  "contentAngles": [
    "A creative content hook or angle idea 1",
    "A creative content hook or angle idea 2",
    "A creative content hook or angle idea 3"
  ]
}
Maintain high relevance to the platform, niche, and country. Output ONLY valid JSON. Do not include markdown code block formatting in the raw API response (just return the raw JSON object).`
              },
              {
                role: "user",
                content: `Niche: "${niche}", Country Code/Name: "${country || "Global"}", Platform: "${platform || "General"}".`
              }
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 1000,
          }),
        });

        if (aiResponse.ok) {
          const result = await aiResponse.json();
          const parsedContent = JSON.parse(result.choices[0].message.content);
          if (parsedContent.trends && Array.isArray(parsedContent.trends)) {
            return NextResponse.json(parsedContent.trends);
          }
        } else {
          console.warn("OpenAI API call failed, falling back to mock data.", await aiResponse.text());
        }
      } catch (aiError) {
        console.error("OpenAI call error, falling back to mock data:", aiError);
      }
    }

    // --- High-Quality Mock Fallback ---
    // Generate 5 structured trends customized based on the inputs
    const mockTrends = generateMockTrends(niche, country || "Global", platform || "General");
    return NextResponse.json(mockTrends);

  } catch (error: any) {
    console.error("Error in trends API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Mock trends generator based on inputs
function generateMockTrends(niche: string, country: string, platform: string) {
  const cleanNiche = niche.trim();
  const titleNiche = cleanNiche.charAt(0).toUpperCase() + cleanNiche.slice(1);
  const platformName = platform === "General" ? "Social Media" : platform;

  // Curated templates based on common niches
  const lowerNiche = cleanNiche.toLowerCase();
  let topicTemplates = [
    `${titleNiche} Hacks for Beginners`,
    `Why Traditional ${titleNiche} is Dead`,
    `The Ultimate 30-Day ${titleNiche} Challenge`,
    `5 Biggest Mistakes in ${titleNiche} (And How to Fix Them)`,
    `Budget-Friendly ${titleNiche} Tips for 2026`
  ];

  let angleTemplates = [
    [
      `Show a quick 15-second shortcut for ${cleanNiche} that saves 2 hours.`,
      `Compare a rookie mistake with a pro tip side-by-side.`,
      `Explain the psychological trick behind successful ${cleanNiche}.`
    ],
    [
      `Bust a popular myth in ${cleanNiche} with controversial proof.`,
      `Tell a story of how a change in ${cleanNiche} style doubled someone's results.`,
      `Share a checklist of what to avoid when starting out.`
    ],
    [
      `Invite followers to join you on a daily challenge sheet.`,
      `Show Day 1 vs Day 30 transformations/results.`,
      `Give away a free tracker link in your bio.`
    ],
    [
      `Call out the single worst advice gurus give about ${cleanNiche}.`,
      `Do a reaction video highlighting common user errors.`,
      `Give an easy 3-step action plan to recover from a setback.`
    ],
    [
      `Review cheap equipment or tools vs premium ones.`,
      `Show how to execute a ${cleanNiche} project with under $20.`,
      `Draft a resource directory of free templates.`
    ]
  ];

  // Tailor topics for specific common niches
  if (lowerNiche.includes("fit") || lowerNiche.includes("health") || lowerNiche.includes("gym")) {
    topicTemplates = [
      "Zone 2 Cardio vs HIIT for Longevity",
      "Somatic Exercises for Stress Release",
      "High-Protein Breakfasts Under 10 Mins",
      "Functional Mobility Routine for Office Workers",
      "Hypertrophy Science: The 80/20 Rule"
    ];
    angleTemplates = [
      ["Animate heart rate zones explaining why slower cardio burns more fat.", "Share a 7-day steady cardio planner.", "Mythbust: You don't need to sweat to build endurance."],
      ["Demonstrate 3 pelvic floor and hip opening exercises.", "Explain the connection between tight hips and emotional stress.", "Show a 5-minute morning routine for energy."],
      ["Cook a savory oatmeal with 35g of protein on camera.", "Show your grocery haul highlighting key protein sources under $50.", "Compare protein bar nutrition vs whole foods."],
      ["Demonstrate 3 desk stretches that relieve lower back pain.", "Show a posture correction routine that takes 2 minutes.", "Explain why stretching helps afternoon productivity."],
      ["Explain the difference between training to failure vs close to failure.", "Animate muscle fibers contracting during slow reps.", "Provide a workout split sheet for 3 days/week."]
    ];
  } else if (lowerNiche.includes("tech") || lowerNiche.includes("ai") || lowerNiche.includes("code") || lowerNiche.includes("software")) {
    topicTemplates = [
      "No-Code AI Agents for Solopreneurs",
      "Clean Code Architecture: Clean vs Cluttered",
      "Locally Run LLMs: Privacy and Offline Speed",
      "Next.js 16 File Routing & Proxy Secrets",
      "Must-Have Developer Tools for productivity"
    ];
    angleTemplates = [
      ["Build a customer support AI agent in 3 minutes without writing code.", "Show how to automate your email inbox using free tools.", "Review top 3 no-code platforms side-by-side."],
      ["Show a refactoring session turning spaghetti code into clean modules.", "Explain the single responsibility principle with real-world examples.", "Show how bad naming conventions delay team speed."],
      ["Demonstrate installing Llama 3 on an older laptop.", "Explain why local models are safer for private company source code.", "Benchmark processing speeds of local vs cloud API calls."],
      ["Explain the difference between middleware.ts and proxy.ts.", "Show a secure route protection redirect logic block.", "Demo handling session cookies in Server Actions."],
      ["Do a screen recording of your custom developer workspace settings.", "Review a keyboard shortcut configuration that saves 30 minutes daily.", "Show your top 5 VS Code extensions for speed."]
    ];
  } else if (lowerNiche.includes("finance") || lowerNiche.includes("money") || lowerNiche.includes("invest") || lowerNiche.includes("crypto")) {
    topicTemplates = [
      "High-Yield Savings Accounts (HYSA) Comparison",
      "Index Fund Investing: The Set-and-Forget Strategy",
      "Side Hustles Utilizing Free AI Tools",
      "How to Negotiate a 15% Salary Raise",
      "Credit Card Points: Travel for Free in 2026"
    ];
    angleTemplates = [
      ["Compare 1% bank interest vs 4.5% HYSA interest over 10 years.", "Show a screenshot of top 3 HYSAs currently offering highest APY.", "Step-by-step instructions to open an online savings account."],
      ["Explain compound interest using a simple growth chart.", "Show why picking individual stocks loses to index funds 90% of the time.", "Share your personal automate-savings percentages."],
      ["Create print-on-demand designs using ChatGPT and Midjourney.", "Offer a template for freelance copy writing using AI assistance.", "Show a daily log of making your first $100 side hustle sale."],
      ["Roleplay a salary negotiation conversation with boss.", "Give a list of key metrics to prepare before asking for a raise.", "Show script examples of handling pushback from HR."],
      ["Detail a credit card points roadmap that funded a flight to Japan.", "Compare cash-back vs travel rewards cards.", "Explain how to pay off cards monthly to avoid interest charges."]
    ];
  }

  // Adjust templates based on platform styles
  const isVideoPlatform = ["TikTok", "Instagram", "YouTube"].includes(platform);
  
  return topicTemplates.map((topic, index) => {
    const seed = index + topic.length + cleanNiche.length;
    const score = 75 + (seed % 21); // 75 to 95
    const growth = `+${(120 + (seed % 8) * 75)}%`; // +120% to +720%
    const probability = score > 88 ? "High" : score > 80 ? "Medium" : "Low";
    
    // Customize angles for specific platforms
    let angles = angleTemplates[index];
    if (platform === "TikTok") {
      angles = angles.map(a => `[HOOK: Text overlay] ${a} Keep it under 25 seconds, use trending audio.`);
    } else if (platform === "LinkedIn") {
      angles = angles.map(a => `[POST TEXT] Write a 3-paragraph thought leadership post on: ${a} Include a PDF carousel.`);
    } else if (isVideoPlatform) {
      angles = angles.map(a => `[VIDEO ANGLE] ${a} Include a clear hook in the first 3 seconds.`);
    }

    return {
      id: `t_${index}_${topic.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, seed).toString(36).replace("-", "0").substring(0, 8)}`,
      topic: `${topic} (${country})`,
      trendScore: score,
      growthRate: growth,
      viralProbability: probability,
      contentAngles: angles
    };
  });
}
