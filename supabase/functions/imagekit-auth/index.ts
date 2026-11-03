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
    const privateKey = Deno.env.get("IMAGEKIT_PRIVATE_KEY");
    const publicKey = Deno.env.get("IMAGEKIT_PUBLIC_KEY");
    if (!supabaseUrl || !anonKey || !serviceKey || !privateKey || !publicKey) {
      return json({ error: "ImageKit or Supabase server secrets are not configured." }, 503);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const token = authHeader.slice("Bearer ".length);
    const { data: userData, error: userError } = await userClient.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Your admin session is invalid or expired." }, 401);

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from("admin_profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (profileError || !profile || !["admin", "super_admin"].includes(profile.role)) {
      return json({ error: "Only KhepiLabs administrators can request upload credentials." }, 403);
    }

    const tokenId = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 10 * 60;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw", encoder.encode(privateKey), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(tokenId + expire));
    const signature = Array.from(new Uint8Array(signatureBytes))
      .map((byte) => byte.toString(16).padStart(2, "0")).join("");

    return json({ token: tokenId, expire, signature, publicKey });
  } catch (error) {
    console.error("imagekit-auth failed", error);
    return json({ error: "Could not create a secure ImageKit upload token." }, 500);
  }
});
