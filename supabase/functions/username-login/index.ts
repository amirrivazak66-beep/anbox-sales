// Username-only login bridge for OnBox CRM.
// Required project secrets are Supabase's standard SUPABASE_URL and SUPABASE_ANON_KEY.
// Auth users must be provisioned with email username@auth.anbox.invalid and a unique temporary password.
// Do not use a service-role key in this function.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return json(503, { error: "auth_not_configured" });

  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_request" });
  }

  const username = typeof body.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!/^[a-z0-9._-]{2,40}$/.test(username) || password.length < 1 || password.length > 256) {
    return json(400, { error: "invalid_credentials" });
  }

  // Generic error avoids disclosing whether a username exists.
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: anonKey, "Content-Type": "application/json" },
      body: JSON.stringify({ email: `${username}@auth.anbox.invalid`, password }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return json(401, { error: "invalid_credentials" });
    return json(200, result);
  } catch {
    return json(503, { error: "auth_unavailable" });
  }
});
