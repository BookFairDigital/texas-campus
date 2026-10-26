import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const packages: Record<string, { name: string; amount: number; slugs: string[] }> = {
  "digital-accounting": {
    name: "Digital Accounting Full Package",
    amount: 32000,
    slugs: ["quickbooks-desktop", "quickbooks-online", "tally", "sage", "xero", "zoho", "freshbooks", "myob"],
  },
  "ai-accounting": {
    name: "AI Accounting Full Package",
    amount: 32000,
    slugs: ["chatgpt", "gemini", "claude", "gamma"],
  },
  "complete-bundle": {
    name: "Complete Bundle",
    amount: 60000,
    slugs: ["quickbooks-desktop", "quickbooks-online", "tally", "sage", "xero", "zoho", "freshbooks", "myob", "chatgpt", "gemini", "claude", "gamma"],
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return reply({ error: "Method not allowed." }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return reply({ error: "Sign in to request a course package." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) {
    console.error("Missing package-order server configuration.");
    return reply({ error: "Server configuration is incomplete." }, 500);
  }

  const caller = createClient(url, anon, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const { data: authData, error: authError } = await caller.auth.getUser();
    if (authError || !authData.user) return reply({ error: "Session expired. Sign in again." }, 401);

    const body = await req.json().catch(() => null);
    const packageSlug = typeof body?.package_slug === "string" ? body.package_slug : "";
    const packageInfo = packages[packageSlug];
    const reference = typeof body?.payment_reference === "string" ? body.payment_reference.trim() : "";
    const depositor = typeof body?.depositor_name === "string" ? body.depositor_name.trim() : "";

    if (!packageInfo) return reply({ error: "Choose a valid course package." }, 400);
    if (reference.length < 2 || reference.length > 120) {
      return reply({ error: "Enter a valid bank deposit reference (2–120 characters)." }, 400);
    }
    if (!depositor || depositor.length > 120) {
      return reply({ error: "Enter the depositor name (maximum 120 characters)." }, 400);
    }

    const { data: profile, error: profileError } = await admin
      .from("profiles")
      .select("id,account_status,access_expires_at")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile || (profile.account_status && profile.account_status !== "active")) {
      return reply({ error: "An active student account is required. Contact Texas Campus administration." }, 403);
    }
    if (profile.access_expires_at && new Date(profile.access_expires_at).getTime() < Date.now()) {
      return reply({ error: "Your student account access has expired. Contact Texas Campus administration." }, 403);
    }

    const { data: courses, error: coursesError } = await admin
      .from("courses")
      .select("id,slug,title,is_published")
      .in("slug", packageInfo.slugs)
      .eq("is_published", true);
    if (coursesError) throw coursesError;
    const courseRows = courses || [];
    const courseIdsBySlug = new Map(courseRows.map((course) => [course.slug, course.id]));
    const missing = packageInfo.slugs.filter((slug) => !courseIdsBySlug.has(slug));
    if (missing.length) {
      return reply({ error: "Some package courses are not published yet. Please contact Texas Campus." }, 409);
    }

    const { data: existing, error: existingError } = await admin
      .from("course_package_orders")
      .select("id,payment_status,course_access")
      .eq("student_id", authData.user.id)
      .eq("package_slug", packageSlug)
      .in("payment_status", ["pending", "approved"])
      .limit(10);
    if (existingError) throw existingError;
    if (existing?.some((order) => order.payment_status === "approved" && order.course_access === true)) {
      return reply({ error: "You already have access to this package. Check your student dashboard." }, 409);
    }
    if (existing?.some((order) => order.payment_status === "pending")) {
      return reply({ error: "A package request is already awaiting admin review." }, 409);
    }

    const { data: order, error: insertError } = await admin
      .from("course_package_orders")
      .insert({
        student_id: authData.user.id,
        package_slug: packageSlug,
        package_name: packageInfo.name,
        course_ids: packageInfo.slugs.map((slug) => courseIdsBySlug.get(slug)),
        amount: packageInfo.amount,
        currency: "LKR",
        payment_reference: reference,
        payment_status: "pending",
        course_access: false,
        admin_note: `Depositor name: ${depositor}`,
      })
      .select("id,package_slug,package_name,amount,currency,payment_reference,payment_status,course_access,created_at")
      .single();
    if (insertError) throw insertError;

    return reply({
      order,
      message: "Package request submitted. Course access will unlock after admin payment approval.",
    }, 201);
  } catch (error) {
    console.error("Package order request failed:", error instanceof Error ? error.message : String(error));
    return reply({
      error: error instanceof Error ? error.message : "Could not submit the package request.",
    }, 500);
  }
});