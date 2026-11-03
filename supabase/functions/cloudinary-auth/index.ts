import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sign in as an admin first." }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const apiSecret = Deno.env.get("CLOUDINARY_API_SECRET");
    const apiKey = Deno.env.get("CLOUDINARY_API_KEY");
    const cloudName = Deno.env.get("CLOUDINARY_CLOUD_NAME");
    if (!supabaseUrl || !anonKey || !serviceKey || !apiSecret || !apiKey || !cloudName) {
      return json({ error: "Cloudinary server secrets are not configured." }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser(authHeader.slice(7));
    if (userError || !userData.user) return json({ error: "Your admin session is invalid or expired." }, 401);

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from("admin_profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (profileError || !profile || !["admin", "super_admin"].includes(profile.role)) {
      return json({ error: "Only KhepiLabs administrators can request upload credentials." }, 403);
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "khepilabs/screenshots";
    const toSign = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(toSign));
    const signature = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
    return json({ timestamp, folder, signature, apiKey, cloudName });
  } catch (error) {
    console.error("cloudinary-auth failed", error);
    return json({ error: "Could not create a secure Cloudinary upload signature." }, 500);
  }
});