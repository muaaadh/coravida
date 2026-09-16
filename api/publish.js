// POST /api/publish — a signed-in staff member asks Vercel to rebuild the site.
// The deploy hook stays here on the server; the browser only ever holds a login.
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_ANON_KEY, hook = process.env.DEPLOY_HOOK;
  if (!url || !key || !hook) return res.status(500).json({ ok: false, error: "The server is missing its settings (SUPABASE_URL, SUPABASE_ANON_KEY, DEPLOY_HOOK)." });
  const tok = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!tok) return res.status(401).json({ ok: false, error: "Sign in first." });
  const who = await fetch(url + "/auth/v1/user", { headers: { apikey: key, Authorization: "Bearer " + tok } });
  if (who.status !== 200) return res.status(401).json({ ok: false, error: "Your sign-in has expired — sign in again." });
  const user = await who.json();
  const r = await fetch(hook, { method: "POST" });
  if (!r.ok) return res.status(502).json({ ok: false, error: "Vercel did not accept the rebuild (" + r.status + ")." });
  const j = await r.json().catch(() => ({}));
  res.status(200).json({ ok: true, by: user.email, job: j.job && j.job.id || null });
};
