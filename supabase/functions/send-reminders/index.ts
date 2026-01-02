import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationSettings {
  user_id: string;
  daily_reminder_enabled: boolean;
  daily_reminder_time: string;
  weekly_reminder_enabled: boolean;
  weekly_reminder_day: number;
  weekly_reminder_time: string;
  quarterly_reminder_enabled: boolean;
  quarterly_reminder_day: number;
  quarterly_reminder_time: string;
  email_notifications_enabled: boolean;
  timezone: string;
}

interface Profile {
  user_id: string;
  email: string | null;
  display_name: string | null;
}

interface Role {
  id: string;
  title: string;
  user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log("Starting reminder check...");
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentMinute = now.getUTCMinutes();
    const currentDay = now.getUTCDay(); // 0 = Sunday
    const todayStr = now.toISOString().split("T")[0];

    // Get quarter info
    const currentMonth = now.getMonth();
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const quarterStart = new Date(now.getFullYear(), quarterStartMonth, 1);
    const prevQuarterStart = new Date(now.getFullYear(), quarterStartMonth - 3, 1);
    const prevQuarterEnd = new Date(prevQuarterStart.getFullYear(), prevQuarterStart.getMonth() + 3, 0);
    
    // Check if we're in the 7-day window after prev quarter
    const daysSinceQuarterEnd = Math.floor((now.getTime() - prevQuarterEnd.getTime()) / (1000 * 60 * 60 * 24));
    const inFinalizationWindow = daysSinceQuarterEnd >= 1 && daysSinceQuarterEnd <= 7;

    // Fetch all users with notification settings
    const { data: allSettings, error: settingsError } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("email_notifications_enabled", true);

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw settingsError;
    }

    console.log(`Found ${allSettings?.length || 0} users with email notifications enabled`);

    const remindersSent: string[] = [];

    for (const settings of allSettings || []) {
      const s = settings as NotificationSettings;

      // Get user profile and email
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .eq("user_id", s.user_id)
        .single() as { data: Profile | null };

      if (!profile?.email) {
        console.log(`Skipping user ${s.user_id} - no email`);
        continue;
      }

      // Get user's active roles
      const { data: roles } = await supabase
        .from("roles")
        .select("id, title, user_id")
        .eq("user_id", s.user_id)
        .eq("is_active", true) as { data: Role[] | null };

      if (!roles?.length) continue;

      const userName = profile.display_name || profile.email.split("@")[0];

      // Check daily reminder
      if (s.daily_reminder_enabled) {
        const [reminderHour, reminderMinute] = s.daily_reminder_time.split(":").map(Number);
        
        // Simple hour match (in production, would handle timezone)
        if (currentHour === reminderHour && currentMinute < 15) {
          for (const role of roles) {
            // Check if today's entry exists
            const { data: entry } = await supabase
              .from("journal_entries")
              .select("id")
              .eq("role_id", role.id)
              .eq("entry_date", todayStr)
              .maybeSingle();

            if (!entry) {
              // Check if reminder already sent today
              const { data: sent } = await supabase
                .from("sent_reminders")
                .select("id")
                .eq("user_id", s.user_id)
                .eq("reminder_type", "daily")
                .eq("reminder_date", todayStr)
                .eq("role_id", role.id)
                .maybeSingle();

              if (!sent) {
                await sendReminderEmail(
                  profile.email,
                  userName,
                  "daily",
                  role.title
                );

                await supabase.from("sent_reminders").insert({
                  user_id: s.user_id,
                  reminder_type: "daily",
                  reminder_date: todayStr,
                  role_id: role.id,
                });

                remindersSent.push(`daily:${s.user_id}:${role.id}`);
              }
            }
          }
        }
      }

      // Check weekly reminder
      if (s.weekly_reminder_enabled && currentDay === s.weekly_reminder_day) {
        const [reminderHour] = s.weekly_reminder_time.split(":").map(Number);
        
        if (currentHour === reminderHour && currentMinute < 15) {
          // Get current week start
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
          const weekStartStr = weekStart.toISOString().split("T")[0];

          for (const role of roles) {
            const { data: reflection } = await supabase
              .from("weekly_reflections")
              .select("id")
              .eq("role_id", role.id)
              .eq("week_start_date", weekStartStr)
              .maybeSingle();

            if (!reflection) {
              const { data: sent } = await supabase
                .from("sent_reminders")
                .select("id")
                .eq("user_id", s.user_id)
                .eq("reminder_type", "weekly")
                .eq("reminder_date", weekStartStr)
                .eq("role_id", role.id)
                .maybeSingle();

              if (!sent) {
                await sendReminderEmail(
                  profile.email,
                  userName,
                  "weekly",
                  role.title
                );

                await supabase.from("sent_reminders").insert({
                  user_id: s.user_id,
                  reminder_type: "weekly",
                  reminder_date: weekStartStr,
                  role_id: role.id,
                });

                remindersSent.push(`weekly:${s.user_id}:${role.id}`);
              }
            }
          }
        }
      }

      // Check quarterly reminder
      if (s.quarterly_reminder_enabled && inFinalizationWindow && daysSinceQuarterEnd === s.quarterly_reminder_day) {
        const [reminderHour] = s.quarterly_reminder_time.split(":").map(Number);
        
        if (currentHour === reminderHour && currentMinute < 15) {
          const prevQuarterStartStr = prevQuarterStart.toISOString().split("T")[0];

          for (const role of roles) {
            const { data: record } = await supabase
              .from("quarterly_records")
              .select("id, status")
              .eq("role_id", role.id)
              .eq("quarter_start_date", prevQuarterStartStr)
              .maybeSingle();

            if (!record || record.status !== "finalized") {
              const { data: sent } = await supabase
                .from("sent_reminders")
                .select("id")
                .eq("user_id", s.user_id)
                .eq("reminder_type", "quarterly")
                .eq("reminder_date", prevQuarterStartStr)
                .eq("role_id", role.id)
                .maybeSingle();

              if (!sent) {
                await sendReminderEmail(
                  profile.email,
                  userName,
                  "quarterly",
                  role.title,
                  7 - daysSinceQuarterEnd
                );

                await supabase.from("sent_reminders").insert({
                  user_id: s.user_id,
                  reminder_type: "quarterly",
                  reminder_date: prevQuarterStartStr,
                  role_id: role.id,
                });

                remindersSent.push(`quarterly:${s.user_id}:${role.id}`);
              }
            }
          }
        }
      }
    }

    console.log(`Sent ${remindersSent.length} reminders`);

    return new Response(
      JSON.stringify({ success: true, remindersSent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in send-reminders:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

async function sendReminderEmail(
  email: string,
  name: string,
  type: "daily" | "weekly" | "quarterly",
  roleTitle: string,
  daysRemaining?: number
) {
  const subjects = {
    daily: `📝 Don't forget your daily journal log (${roleTitle})`,
    weekly: `✨ Time to complete your weekly reflection (${roleTitle})`,
    quarterly: `🎯 ${daysRemaining} days left to finalize your quarterly review (${roleTitle})`,
  };

  const messages = {
    daily: `
      <h2>Hi ${name}!</h2>
      <p>You haven't logged your accomplishments for today in your <strong>${roleTitle}</strong> role.</p>
      <p>Taking a few minutes to capture what you did today will help you:</p>
      <ul>
        <li>Build a record of your achievements</li>
        <li>Spot patterns in your work</li>
        <li>Prepare for performance reviews</li>
      </ul>
      <p><a href="https://chrona.app/journal">Log today's entry →</a></p>
    `,
    weekly: `
      <h2>Hi ${name}!</h2>
      <p>It's time to reflect on your week as a <strong>${roleTitle}</strong>.</p>
      <p>Review your daily entries and flag the work that truly mattered:</p>
      <ul>
        <li>What showed delivery excellence?</li>
        <li>Where did you take ownership?</li>
        <li>How did you influence others?</li>
        <li>What did you learn?</li>
      </ul>
      <p><a href="https://chrona.app/weekly">Complete your weekly reflection →</a></p>
    `,
    quarterly: `
      <h2>Hi ${name}!</h2>
      <p>You have <strong>${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}</strong> left to finalize your quarterly distillation for your <strong>${roleTitle}</strong> role.</p>
      <p>This is your chance to:</p>
      <ul>
        <li>Confirm the patterns in your work</li>
        <li>Generate resume bullets and STAR stories</li>
        <li>Lock in your quarterly achievements</li>
      </ul>
      <p><strong>Once the window closes, this quarter becomes read-only.</strong></p>
      <p><a href="https://chrona.app/quarterly">Finalize your quarter →</a></p>
    `,
  };

  try {
    const result = await resend.emails.send({
      from: "Chrona <reminders@chrona.app>",
      to: [email],
      subject: subjects[type],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            h2 { color: #1a1a1a; }
            a { color: #6366f1; }
            ul { padding-left: 20px; }
            li { margin-bottom: 8px; }
          </style>
        </head>
        <body>
          ${messages[type]}
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #666; font-size: 12px;">
            You're receiving this because you have reminders enabled in your Chrona settings.
            <br />
            <a href="https://chrona.app/settings">Manage notification preferences</a>
          </p>
        </body>
        </html>
      `,
    });

    console.log(`Email sent to ${email} for ${type} reminder:`, result);
  } catch (error) {
    console.error(`Failed to send ${type} reminder to ${email}:`, error);
  }
}

serve(handler);
