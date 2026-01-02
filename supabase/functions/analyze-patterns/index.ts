import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Signal {
  signal_flag: string;
  context: string | null;
  entry_date: string;
  accomplishments: string | null;
  decisions: string | null;
}

interface PatternSuggestion {
  category: string;
  title: string;
  description: string;
  signal_count: number;
  related_signals: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { signals, roleTitle, quarterLabel } = await req.json();

    if (!signals || signals.length === 0) {
      return new Response(
        JSON.stringify({ patterns: [], message: "No signals to analyze" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format signals for the prompt
    const signalsSummary = signals.map((s: Signal, i: number) => 
      `${i + 1}. [${s.signal_flag.toUpperCase()}] ${s.entry_date}: ${s.context || s.accomplishments || s.decisions || "No context"}`
    ).join("\n");

    const systemPrompt = `You are a career analyst helping professionals identify patterns in their work. 
You analyze weekly work signals to surface meaningful patterns for quarterly reviews.

Available pattern categories:
- growth: Professional development, new skills, expanding capabilities
- scope_change: Taking on new responsibilities, role evolution
- sustained_impact: Consistent delivery, ongoing contributions
- skill_development: Learning new technologies, methods, or domains
- leadership: Mentoring, guiding teams, driving decisions
- collaboration: Cross-functional work, partnerships, teamwork

For each pattern you identify:
1. Choose the most fitting category
2. Create a clear, specific title (not generic)
3. Write a brief description grounded in the evidence
4. List which signal numbers support this pattern

Respond ONLY with valid JSON in this exact format:
{
  "patterns": [
    {
      "category": "growth",
      "title": "Specific pattern title",
      "description": "2-3 sentence description of the pattern",
      "signal_count": 3,
      "related_signals": ["1", "4", "7"]
    }
  ]
}`;

    const userPrompt = `Analyze these work signals from ${quarterLabel} for the role "${roleTitle}" and identify 3-5 meaningful patterns:

${signalsSummary}

Focus on patterns that show:
- Recurring themes across multiple weeks
- Evolution or growth over time
- Consistent impact areas
- Emerging leadership or expanded scope

Return only the JSON with identified patterns.`;

    console.log(`Analyzing ${signals.length} signals for patterns`);

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
        temperature: 0.7,
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
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let patterns: PatternSuggestion[];
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      const parsed = JSON.parse(jsonMatch[0]);
      patterns = parsed.patterns || [];
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response");
    }

    console.log(`Identified ${patterns.length} patterns`);

    return new Response(
      JSON.stringify({ patterns }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-patterns:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
