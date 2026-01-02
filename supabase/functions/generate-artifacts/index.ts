import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Pattern {
  category: string;
  title: string;
  description: string;
  signal_count: number;
}

interface ArtifactRequest {
  patterns: Pattern[];
  roleTitle: string;
  company?: string;
  quarterLabel: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patterns, roleTitle, company, quarterLabel }: ArtifactRequest = await req.json();

    if (!patterns || patterns.length === 0) {
      return new Response(
        JSON.stringify({ error: "No confirmed patterns provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format patterns for the prompt
    const patternsSummary = patterns.map((p, i) => 
      `${i + 1}. [${p.category.toUpperCase()}] ${p.title}\n   ${p.description}\n   (Supported by ${p.signal_count} signals)`
    ).join("\n\n");

    const roleContext = company ? `${roleTitle} at ${company}` : roleTitle;

    const systemPrompt = `You are an expert career coach and professional writer who helps professionals articulate their achievements for resumes, performance reviews, and interviews.

Your task is to transform career patterns into polished professional artifacts. Be specific, quantify impact where possible, and use strong action verbs.`;

    const userPrompt = `Based on the following confirmed career patterns from ${quarterLabel} for a ${roleContext}, generate three types of career artifacts:

PATTERNS:
${patternsSummary}

Generate the following artifacts in JSON format:

1. **Resume Bullets**: 4-6 concise, impactful bullet points suitable for a resume. Each should start with a strong action verb and quantify impact where possible. Format: achievement-focused, past tense.

2. **Self-Review Draft**: 2-3 paragraphs summarizing key accomplishments for a performance self-review. Include specific examples, demonstrate growth, and highlight impact. Write in first person.

3. **STAR Stories**: 2-3 complete STAR (Situation, Task, Action, Result) stories that could be used in behavioral interviews. Each story should clearly demonstrate a valuable competency.

Return your response as valid JSON with this exact structure:
{
  "resumeBullets": ["bullet1", "bullet2", ...],
  "selfReview": "Full self-review text here...",
  "starStories": [
    {
      "title": "Story title describing the competency",
      "situation": "Context and background",
      "task": "What was required",
      "action": "What you did specifically",
      "result": "The outcome and impact"
    }
  ]
}`;

    console.log(`Generating artifacts for ${roleContext} - ${quarterLabel} with ${patterns.length} patterns`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate artifacts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No artifacts generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let artifacts;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        artifacts = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(
        JSON.stringify({ error: "Failed to parse generated artifacts" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully generated artifacts");

    return new Response(JSON.stringify({ artifacts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-artifacts function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});