import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RoleData {
  id: string;
  title: string;
  company: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

interface PatternData {
  id: string;
  title: string;
  description: string;
  category: string;
  signal_count: number;
}

interface RoleWithPatterns {
  role: RoleData;
  patterns: PatternData[];
}

interface GenerateResumeRequest {
  rolesWithPatterns: RoleWithPatterns[];
  targetJobTitle?: string;
  targetIndustry?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { rolesWithPatterns, targetJobTitle, targetIndustry } = await req.json() as GenerateResumeRequest;

    if (!rolesWithPatterns || rolesWithPatterns.length === 0) {
      return new Response(
        JSON.stringify({ error: 'At least one role with patterns is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for AI
    const rolesContext = rolesWithPatterns.map(({ role, patterns }) => {
      const dateRange = role.start_date 
        ? `${role.start_date}${role.end_date ? ` to ${role.end_date}` : ' to Present'}`
        : '';
      
      const patternsText = patterns.length > 0
        ? patterns.map(p => `- ${p.title}: ${p.description} (Category: ${p.category}, Evidence count: ${p.signal_count})`).join('\n')
        : 'No patterns recorded for this role.';

      return `
Role: ${role.title}${role.company ? ` at ${role.company}` : ''}
Period: ${dateRange || 'Dates not specified'}
${role.description ? `Description: ${role.description}` : ''}

Verified Patterns/Achievements:
${patternsText}
`;
    }).join('\n---\n');

    const targetContext = targetJobTitle || targetIndustry
      ? `\nTarget Position: ${targetJobTitle || 'Not specified'}\nTarget Industry: ${targetIndustry || 'Not specified'}`
      : '';

    const systemPrompt = `You are an expert resume writer specializing in creating impactful, ATS-friendly resumes. You transform verified career achievements into compelling bullet points that demonstrate value and impact.

Key principles:
1. Start each bullet with a strong action verb
2. Quantify achievements whenever possible (numbers, percentages, timeframes)
3. Focus on results and impact, not just responsibilities
4. Use industry-standard keywords for ATS optimization
5. Keep bullets concise (1-2 lines each)
6. Maintain consistency in tense and formatting`;

    const userPrompt = `Based on the following verified career achievements and patterns, generate professional resume content.
${targetContext}

ROLES AND VERIFIED ACHIEVEMENTS:
${rolesContext}

For each role, generate:
1. 3-6 impactful bullet points based on the verified patterns
2. Link each bullet to its source pattern by ID when possible

Also generate a professional summary (2-3 sentences) that synthesizes the candidate's overall value proposition across all roles.

Respond in this exact JSON format:
{
  "summary": "Professional summary text here...",
  "roles": [
    {
      "roleId": "uuid-of-role",
      "bullets": [
        {
          "text": "Bullet point text...",
          "sourcePatternId": "uuid-of-pattern-or-null"
        }
      ]
    }
  ]
}`;

    console.log("Calling Lovable AI Gateway for resume generation...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please check your account." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to generate resume content" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON from response (handle markdown code blocks)
    let parsedContent;
    try {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsedContent = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      return new Response(
        JSON.stringify({ error: "Failed to parse generated content" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Successfully generated resume content");

    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in generate-resume function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
