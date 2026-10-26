
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return reply({ error: "Method not allowed." }, 405);
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return reply({ error: "Sign in as an administrator." }, 401);
  }

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !anon || !service) {
    console.error("Missing Supabase environment configuration.");
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

    if (authError || !authData.user) {
      return reply({ error: "Session expired. Sign in again." }, 401);
    }

    const { data: adminRow, error: adminError } = await admin
      .from("campus_admins")
      .select("user_id")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (adminError) {
      console.error("Admin verification query failed:", adminError.message);
      return reply({ error: "Could not verify administrator access." }, 500);
    }

    if (!adminRow) {
      return reply({ error: "Administrator access required." }, 403);
    }

    const body = await req.json().catch(() => null);

    if (!body || typeof body.action !== "string") {
      return reply({ error: "Action is required." }, 400);
    }

    // LIST COURSES
    if (body.action === "list_courses") {
      const { data, error } = await admin
        .from("courses")
        .select(
          "id,slug,title,category,summary,price,currency,is_published,drive_folder_url,created_at,updated_at",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return reply({ courses: data || [] });
    }

    // CREATE OR UPDATE COURSE
    if (body.action === "save_course") {
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const slug = typeof body.slug === "string"
        ? body.slug.trim().toLowerCase()
        : "";
      const category = body.category;
      const summary = typeof body.summary === "string"
        ? body.summary.trim()
        : "";
      const price = body.price === "" || body.price == null
        ? null
        : Number(body.price);
      const drive = typeof body.drive_folder_url === "string"
        ? body.drive_folder_url.trim()
        : "";

      if (!title || title.length > 160) {
        return reply({
          error: "Course title is required (max 160 characters).",
        }, 400);
      }

      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 180) {
        return reply({
          error: "Use a unique URL slug with lowercase letters, numbers and hyphens.",
        }, 400);
      }

      if (!["digital_accounting", "ai_accounting"].includes(category)) {
        return reply({ error: "Choose a valid course category." }, 400);
      }

      if (price !== null && (!Number.isFinite(price) || price < 0)) {
        return reply({ error: "Price must be zero or more." }, 400);
      }

      if (drive && !/^https:\/\/drive\.google\.com\//i.test(drive)) {
        return reply({ error: "Use a valid Google Drive URL." }, 400);
      }

      const record = {
        title,
        slug,
        category,
        summary,
        price,
        currency: "LKR",
        drive_folder_url: drive || null,
        updated_at: new Date().toISOString(),
      };

      let result;

      if (typeof body.id === "string" && body.id) {
        result = await admin
          .from("courses")
          .update(record)
          .eq("id", body.id)
          .select(
            "id,slug,title,category,summary,price,currency,is_published,drive_folder_url,created_at,updated_at",
          )
          .single();
      } else {
        result = await admin
          .from("courses")
          .insert({ ...record, is_published: false })
          .select(
            "id,slug,title,category,summary,price,currency,is_published,drive_folder_url,created_at,updated_at",
          )
          .single();
      }

      if (result.error) {
        if (result.error.code === "23505") {
          return reply({
            error: "That course slug already exists. Choose another.",
          }, 409);
        }
        throw result.error;
      }

      return reply({
        course: result.data,
        message: "Course saved. It remains unpublished until you publish it.",
      });
    }

    // PUBLISH OR UNPUBLISH COURSE
    if (body.action === "set_course_published") {
      if (
        typeof body.id !== "string" ||
        typeof body.is_published !== "boolean"
      ) {
        return reply({
          error: "Course ID and publish status are required.",
        }, 400);
      }

      const { data, error } = await admin
        .from("courses")
        .update({
          is_published: body.is_published,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .select("id,is_published")
        .single();

      if (error) throw error;

      return reply({
        course: data,
        message: body.is_published
          ? "Course published."
          : "Course unpublished.",
      });
    }

    // LIST PAYMENT ORDERS WITHOUT ASSUMING A PROFILES FOREIGN-KEY JOIN
    if (body.action === "list_orders") {
      const { data: orders, error: ordersError } = await admin
        .from("course_orders")
        .select(
          "id,student_id,course_id,amount,currency,payment_method,payment_reference,receipt_path,payment_status,course_access,admin_note,created_at,reviewed_at,reviewed_by",
        )
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      const orderRows = orders || [];
      const studentIds = [
        ...new Set(orderRows.map((order) => order.student_id).filter(Boolean)),
      ];
      const courseIds = [
        ...new Set(orderRows.map((order) => order.course_id).filter(Boolean)),
      ];

      const profilesById = new Map();
      const coursesById = new Map();

      if (studentIds.length > 0) {
        const { data: profiles, error: profilesError } = await admin
          .from("profiles")
          .select("id,full_name,username,email,mobile")
          .in("id", studentIds);

        if (profilesError) throw profilesError;

        for (const profile of profiles || []) {
          profilesById.set(profile.id, profile);
        }
      }

      if (courseIds.length > 0) {
        const { data: courses, error: coursesError } = await admin
          .from("courses")
          .select("id,title,slug")
          .in("id", courseIds);

        if (coursesError) throw coursesError;

        for (const course of courses || []) {
          coursesById.set(course.id, course);
        }
      }

      const { data: packageRows, error: packageOrdersError } = await admin
        .from("course_package_orders")
        .select("id,student_id,package_slug,package_name,course_ids,amount,currency,payment_reference,payment_status,course_access,admin_note,created_at,reviewed_at,reviewed_by")
        .order("created_at", { ascending: false });

      if (packageOrdersError) throw packageOrdersError;

      const enrichedOrders = orderRows.map((order) => ({
        ...order,
        order_type: "course",
        profiles: profilesById.get(order.student_id) || null,
        courses: coursesById.get(order.course_id) || null,
      }));

      const enrichedPackages = (packageRows || []).map((order) => ({
        ...order,
        order_type: "package",
        package_course_count: Array.isArray(order.course_ids) ? order.course_ids.length : 0,
        profiles: profilesById.get(order.student_id) || null,
        courses: { title: order.package_name },
      }));

      return reply({ orders: [...enrichedPackages, ...enrichedOrders] });
    }

    // APPROVE OR REJECT PAYMENT ORDER
    if (body.action === "review_order") {
      const id = typeof body.id === "string" ? body.id : "";
      const status = body.status;
      const note = typeof body.admin_note === "string"
        ? body.admin_note.trim().slice(0, 1000)
        : null;

      if (!id || !["approved", "rejected"].includes(status)) {
        return reply({
          error: "Order ID and valid decision are required.",
        }, 400);
      }

      const targetTable = body.order_type === "package"
        ? "course_package_orders"
        : "course_orders";

      const { data, error } = await admin
        .from(targetTable)
        .update({
          payment_status: status,
          course_access: status === "approved",
          admin_note: note,
          reviewed_at: new Date().toISOString(),
          reviewed_by: authData.user.id,
        })
        .eq("id", id)
        .select("id,payment_status,course_access,reviewed_at")
        .single();

      if (error) throw error;

      return reply({
        order: data,
        message: status === "approved"
          ? body.order_type === "package"
            ? "Package payment approved and all included courses unlocked."
            : "Payment approved and course access enabled."
          : body.order_type === "package"
            ? "Package payment rejected and access remains locked."
            : "Payment rejected and course access disabled.",
      });
    }

    return reply({ error: "Unsupported action." }, 400);
  } catch (error) {
    console.error(
      "Admin platform action failed:",
      error instanceof Error ? error.message : String(error),
    );

    return reply({
      error: error instanceof Error
        ? error.message
        : "Could not complete the request.",
    }, 500);
  }
});
