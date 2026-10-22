import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

  try {
    const { username, password } = await req.json();
    if (typeof username !== "string" || typeof password !== "string" ||
        username.trim().length < 3 || !password) {
      return new Response(JSON.stringify({ error: "Enter your username and password." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !serviceKey || !anonKey) throw new Error("Server configuration missing");

    const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
    const { data: profile, error } = await admin.from("profiles")
      .select("id,email,username")
      .ilike("username", username.trim())
      .maybeSingle();

    if (error) {
      console.error("username lookup failed", error.message);
      return new Response(JSON.stringify({ error: "Student login setup needs a database check. Contact the administrator." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!profile?.email) return new Response(JSON.stringify({ error: "Invalid username or password." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    const client = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data, error: signInError } = await client.auth.signInWithPassword({
      email: profile.email, password,
    });
    if (signInError || !data.session) return new Response(JSON.stringify({ error: "Invalid username or password." }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

    return new Response(JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: { id: data.user.id, email: data.user.email, username: profile.username },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("student-login function failed", e);
    return new Response(JSON.stringify({ error: "Unable to sign in right now. Try again later." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
