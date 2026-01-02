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
  quarter?: string;
}

type ArtifactType = "resume" | "self-review" | "star";

interface ArtifactRequest {
  patterns: Pattern[];
  roleTitle: string;
  company?: string;
  dateRange: string;
  artifactType: ArtifactType;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { patterns, roleTitle, company, dateRange, artifactType }: ArtifactRequest = await req.json();

    if (!patterns || patterns.length === 0) {
      return new Response(
        JSON.stringify({ error: "No confirmed patterns provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!artifactType) {
      return new Response(
        JSON.stringify({ error: "Artifact type not specified" }),
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
      `${i + 1}. [${p.category.toUpperCase()}]${p.quarter ? ` (${p.quarter})` : ""} ${p.title}\n   ${p.description}\n   (Supported by ${p.signal_count} signals)`
    ).join("\n\n");

    const roleContext = company ? `${roleTitle} at ${company}` : roleTitle;

    const systemPrompt = `You are an expert career coach and professional writer who helps professionals articulate their achievements for resumes, performance reviews, and interviews.

Your task is to transform career patterns into polished professional artifacts. Be specific, quantify impact where possible, and use strong action verbs.`;

    let userPrompt: string;
    let expectedFormat: string;

    switch (artifactType) {
      case "resume":
        userPrompt = `Based on the following confirmed career patterns from ${dateRange} for a ${roleContext}, generate resume bullets.

PATTERNS:
${patternsSummary}

Generate 5-8 concise, impactful bullet points suitable for a resume. Each should:
- Start with a strong action verb
- Quantify impact where possible
- Be achievement-focused and in past tense
- Synthesize patterns across the time period to show sustained impact

Return your response as valid JSON with this exact structure:
{
  "resumeBullets": ["bullet1", "bullet2", ...]
}`;
        expectedFormat = "resumeBullets";
        break;

      case "self-review":
        userPrompt = `Based on the following confirmed career patterns from ${dateRange} for a ${roleContext}, generate a self-review draft.

PATTERNS:
${patternsSummary}

Generate 3-4 paragraphs summarizing key accomplishments for a performance self-review. The review should:
- Include specific examples from the patterns
- Demonstrate growth and development over the period
- Highlight impact and contributions
- Be written in first person
- Synthesize themes across quarters to show consistent excellence

Return your response as valid JSON with this exact structure:
{
  "selfReview": "Full self-review text here with multiple paragraphs..."
}`;
        expectedFormat = "selfReview";
        break;

      case "star":
        userPrompt = `Based on the following confirmed career patterns from ${dateRange} for a ${roleContext}, generate STAR stories for behavioral interviews.

PATTERNS:
${patternsSummary}

Generate 3-4 complete STAR (Situation, Task, Action, Result) stories. Each story should:
- Clearly demonstrate a valuable competency
- Be detailed enough for a 2-3 minute interview answer
- Show quantifiable results where possible
- Draw from patterns that show the strongest evidence

Return your response as valid JSON with this exact structure:
{
  "starStories": [
    {
      "title": "Story title describing the competency demonstrated",
      "situation": "Context and background - what was the challenge or opportunity",
      "task": "What was your specific responsibility or goal",
      "action": "What you did specifically - the steps you took",
      "result": "The outcome and impact - quantify if possible"
    }
  ]
}`;
        expectedFormat = "starStories";
        break;
    }

    console.log(`Generating ${artifactType} artifact for ${roleContext} - ${dateRange} with ${patterns.length} patterns`);

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
        JSON.stringify({ error: "Failed to generate artifact" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No artifact generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let artifact;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        artifact = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(
        JSON.stringify({ error: "Failed to parse generated artifact" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully generated ${artifactType} artifact`);

    return new Response(JSON.stringify({ artifact }), {
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